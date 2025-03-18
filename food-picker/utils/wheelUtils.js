// 转盘工具函数
const config = require('./config');

// 预定义鲜明的颜色数组，与参考图片相似
const PRESET_COLORS = [
  '#80deff', // 浅蓝色
  '#ff6b6b', // 红色
  '#a56bff', // 紫色
  '#ffb340', // 橙色
  '#80deff', // 浅蓝色
  '#ff6b6b', // 红色
  '#a56bff', // 紫色
  '#ffb340', // 橙色
];

// 生成颜色 - 优化版本，避免相邻颜色相同
function generateHslColor(index, total) {
  // 如果总数小于等于PRESET_COLORS数组长度，可以直接使用不同颜色
  if (total <= PRESET_COLORS.length) {
    return PRESET_COLORS[index % PRESET_COLORS.length];
  }
  
  // 对于数量超过预设颜色的情况，使用错位取模确保相邻颜色不同
  // 先计算直接映射的颜色索引
  const directIndex = index % PRESET_COLORS.length;
  
  // 如果当前颜色与前一个颜色相同，则选用下一个颜色
  if (index > 0 && directIndex === ((index - 1) % PRESET_COLORS.length)) {
    return PRESET_COLORS[(directIndex + 1) % PRESET_COLORS.length];
  }
  
  // 如果当前颜色与后一个颜色相同（环形考虑），也选用不同颜色
  if (index < total - 1 && directIndex === ((index + 1) % PRESET_COLORS.length)) {
    return PRESET_COLORS[(directIndex + 2) % PRESET_COLORS.length];
  }
  
  return PRESET_COLORS[directIndex];
}

// 计算每个扇形的clip-path - 优化版本
function calculateSectorClipPath(startAngle, endAngle) {
  const center = { x: 50, y: 50 };
  const angleSpan = endAngle - startAngle;
  
  // 优化1: 对特殊角度进行快速处理
  if (angleSpan >= 360) {
    return 'circle(50% at 50% 50%)'; // 全圆使用circle()而非复杂polygon
  }
  
  if (angleSpan === 180) {
    // 半圆形特殊处理
    const startPoint = getPointOnCircle(center, 50, startAngle);
    return `polygon(50% 50%, ${startPoint.x}% ${startPoint.y}%, ${startPoint.x + 100}% ${startPoint.y}%, ${startPoint.x + 100}% ${startPoint.y + 100}%, ${startPoint.x}% ${startPoint.y + 100}%)`;
  }
  
  // 优化2: 扇形对接点优化
  const startPoint = getPointOnCircle(center, 50, startAngle);
  const endPoint = getPointOnCircle(center, 50, startAngle + angleSpan);
  
  // 优化3: 根据角度大小增加中间点数量
  let clipPath = `polygon(50% 50%, ${startPoint.x}% ${startPoint.y}%`;
  
  // 大于90度添加中间点，避免扇形形状失真
  if (angleSpan > 90) {
    const midPoints = Math.ceil(angleSpan / 90); // 根据角度决定中间点数量
    for (let i = 1; i < midPoints; i++) {
      const midAngle = startAngle + (angleSpan * i / midPoints);
      const midPoint = getPointOnCircle(center, 50, midAngle);
      clipPath += `, ${midPoint.x}% ${midPoint.y}%`;
    }
  }
  
  clipPath += `, ${endPoint.x}% ${endPoint.y}%)`;
  return clipPath;
}

// 获取圆周上的点坐标
function getPointOnCircle(center, radius, angleDegrees) {
  const angleRadians = (angleDegrees - 90) * Math.PI / 180; // 从上方开始
  return {
    x: center.x + radius * Math.cos(angleRadians),
    y: center.y + radius * Math.sin(angleRadians)
  };
}

// 生成扇形的CSS样式
function generateSectorStyle(index, total) {
  const angle = 360 / total;
  const startAngle = index * angle;
  const endAngle = startAngle + angle;
  const color = generateHslColor(index, total);
  
  return {
    transform: `rotate(${startAngle}deg)`,
    backgroundColor: color,
    angle: angle, // 添加角度信息
    startAngle: startAngle,
    endAngle: endAngle,
    clipPath: calculateSectorClipPath(0, angle)
  };
}

// 防抖函数
function debounce(func, wait) {
  let timeout;
  return function() {
    const context = this;
    const args = arguments;
    clearTimeout(timeout);
    timeout = setTimeout(() => {
      func.apply(context, args);
    }, wait || 200);
  };
}

// 缓动函数 - 三次曲线减速
function easeOutCubic(t) {
  return 1 - Math.pow(1 - t, 3);
}

// 检测低性能设备
function isLowPerformanceDevice() {
  try {
    const systemInfo = wx.getSystemInfoSync();
    // 检测低性能iOS设备
    if (systemInfo.platform === 'ios' && parseFloat(systemInfo.system) < 12) {
      return true;
    }
    // 检测低性能Android设备
    if (systemInfo.platform === 'android' && parseFloat(systemInfo.system) < 8) {
      return true;
    }
    // 低内存设备
    if (systemInfo.memory < 2048) { // 小于2GB内存
      return true;
    }
    return false;
  } catch (error) {
    console.error('检测设备性能失败:', error);
    return false; // 默认为非低性能设备
  }
}

// 旋转控制
class WheelController {
  constructor() {
    this.angle = 0; // 当前角度
    this.targetAngle = 0; // 目标角度
    this.isSpinning = false; // 是否在旋转中
    this.onSpinEnd = null; // 旋转结束回调
    this.options = []; // 选项数组
    this.animation = null; // 微信动画实例
    this.isLowPerformance = isLowPerformanceDevice(); // 检测设备性能
  }

  // 初始化动画实例
  init(page) {
    if (!this.animation) {
      this.animation = wx.createAnimation({
        duration: 0,
        timingFunction: 'linear',
        delay: 0,
        transformOrigin: '50% 50%'
      });
      this.page = page; // 保存页面实例以便更新数据
    }
  }

  // 开始旋转
  startSpin(options, onEnd) {
    if (this.isSpinning || !options || options.length === 0 || !this.animation) {
      return false;
    }
    
    this.options = [...options];
    this.onSpinEnd = onEnd;
    this.isSpinning = true;
    
    // 随机选择一个选项 - 防止连续抽到相同结果
    let randomIndex, targetOption;
    
    // 如果存在上次选中的选项，尝试避免再次选中
    if (this.selectedOption && this.options.length > 1) {
      // 先尝试5次获取不同的结果
      let attempts = 0;
      const maxAttempts = 5;
      
      do {
        randomIndex = Math.floor(Math.random() * this.options.length);
        targetOption = this.options[randomIndex];
        attempts++;
      } while (targetOption === this.selectedOption && attempts < maxAttempts);
      
      // 如果5次后仍未获得不同结果，强制选择不同的索引
      if (targetOption === this.selectedOption && this.selectedIndex !== undefined) {
        randomIndex = (this.selectedIndex + 1) % this.options.length;
        targetOption = this.options[randomIndex];
      }
    } else {
      // 首次抽取或只有一个选项时，直接随机
      randomIndex = Math.floor(Math.random() * this.options.length);
      targetOption = this.options[randomIndex];
    }
    
    // 计算需要额外旋转的角度，确保指定的选项会被选中
    const optionAngle = 360 / this.options.length;
    const sectorAngle = randomIndex * optionAngle;
    
    // 针对低性能设备优化
    const performanceFactor = this.isLowPerformance ? 0.7 : 1;
    
    // 旋转圈数 - 添加随机性，避免可预测的模式
    const minRotations = config.wheel.minRotations * performanceFactor;
    const maxRotations = config.wheel.maxRotations * performanceFactor;
    // 添加小数部分的随机性
    const rotations = minRotations + Math.random() * (maxRotations - minRotations) + (Math.random() * 0.5);
    
    // 首先计算选中扇区的中心角度（从顶部开始，顺时针）
    // 注意：我们的扇形是从上方开始逆时针布局的
    const selectedSectorCenterAngle = randomIndex * optionAngle + (optionAngle / 2);
    
    // 调试：输出角度计算信息
    console.log('角度计算详情:');
    console.log(`选中索引: ${randomIndex}, 名称: ${targetOption}`);
    console.log(`每个扇形角度: ${optionAngle}度`);
    console.log(`选中扇形的中心角度: ${selectedSectorCenterAngle}度`);
    
    // 添加随机性来避免每次结束在完全相同的位置
    const angleJitter = (Math.random() - 0.5) * (optionAngle * 0.2); // 添加小范围随机偏移
    
    // 因为转盘旋转是顺时针，为了让指针指向选中扇区，转盘需要旋转的角度
    const targetAngle = this.angle + (rotations * 360) + selectedSectorCenterAngle + angleJitter;
    
    console.log(`最终目标角度: ${targetAngle}度 (当前角度:${this.angle} + 旋转圈数:${rotations * 360} + 扇区中心角度:${selectedSectorCenterAngle} + 随机偏移:${angleJitter})`);
    
    // 减少动画时间
    const duration = (config.wheel.minSpinTime + 
                     Math.random() * (config.wheel.maxSpinTime - config.wheel.minSpinTime)) * performanceFactor;
    
    // 根据设备性能选择不同的动画策略
    if (this.isLowPerformance) {
      // 低性能设备使用简单的单步动画
      this.animation.rotate(targetAngle).step({
        duration: duration,
        timingFunction: 'ease-out'
      });
    } else {
      // 高性能设备使用多步动画，体验更好
      this.animation.rotate(targetAngle * 0.7).step({
        duration: duration * 0.6,
        timingFunction: 'linear'
      });
      
      this.animation.rotate(targetAngle).step({
        duration: duration * 0.4,
        timingFunction: 'ease-out'
      });
    }
    
    // 异步应用动画，避免阻塞主线程
    setTimeout(() => {
      this.page.setData({
        wheelAnimation: this.animation.export()
      });
    }, 0);
    
    // 保存最终角度
    this.angle = targetAngle % 360;
    
    // 保存选中信息以便验证
    this.selectedIndex = randomIndex;
    this.selectedOption = targetOption;
    
    // 设置计时器，动画结束后调用回调
    setTimeout(() => {
      this._stopSpin(targetOption, randomIndex);
    }, duration);
    
    return true;
  }

  // 停止旋转
  _stopSpin(selectedOption, selectedIndex) {
    this.isSpinning = false;
    
    if (this.onSpinEnd && typeof this.onSpinEnd === 'function') {
      // 调用回调函数，返回选中的选项
      this.onSpinEnd(selectedOption, selectedIndex);
    }
  }

  // 获取当前角度
  getAngle() {
    return this.angle;
  }

  // 判断是否在旋转中
  getSpinningStatus() {
    return this.isSpinning;
  }

  // 重置控制器状态
  reset() {
    this.angle = 0;
    this.targetAngle = 0;
    this.isSpinning = false;
    if (this.animation) {
      this.animation.rotate(0).step({duration: 0});
      if (this.page) {
        this.page.setData({
          wheelAnimation: this.animation.export()
        });
      }
    }
  }
}

module.exports = {
  generateHslColor,
  generateSectorStyle,
  calculateSectorClipPath,
  getPointOnCircle,
  debounce,
  easeOutCubic,
  WheelController,
  isLowPerformanceDevice
}; 