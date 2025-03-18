const OptionManager = require('../../utils/optionManager');
const { WheelController, debounce, generateSectorStyle } = require('../../utils/wheelUtils');
const IconMatcher = require('../../utils/iconMatcher');
const config = require('../../utils/config');

Page({
  data: {
    // 选项相关
    newOption: '',
    options: [],
    
    // 转盘相关
    wheelAngle: 0,
    sectors: [],
    isSpinning: false,
    wheelAnimation: {}, // 动画数据
    
    // 历史记录
    history: [],
    
    // 动画相关
    showParticles: false,
    
    // 视窗宽度，用于响应式布局
    windowWidth: 375,
    
    // 是否为移动设备
    isMobile: false,
    
    // 最新结果
    latestResult: '',
    
    // 单色转盘背景色
    wheelBgColor: '#80e8ff',
    
    // 调试模式
    debugMode: false
  },

  // 选项管理器实例
  optionManager: null,
  
  // 转盘控制器实例
  wheelController: null,

  onLoad: function() {
    // 创建选项管理器实例
    this.optionManager = new OptionManager();
    
    // 创建转盘控制器实例
    this.wheelController = new WheelController();
    // 初始化动画
    this.wheelController.init(this);
    
    // 更新页面数据
    this.updatePageData();
    
    // 获取屏幕宽度以适配布局
    const systemInfo = wx.getSystemInfoSync();
    this.setData({
      windowWidth: systemInfo.windowWidth,
      isMobile: systemInfo.windowWidth < 768
    });
    
    // 监听窗口大小变化
    wx.onWindowResize((res) => {
      this.setData({
        windowWidth: res.size.windowWidth,
        isMobile: res.size.windowWidth < 768
      });
    });
  },

  onShow: function() {
    // 每次页面显示时更新数据
    this.updatePageData();
  },

  // 更新页面数据
  updatePageData: function() {
    const options = this.optionManager.getOptions();
    const history = this.optionManager.getHistory();
    
    // 优化1: 避免不必要的更新
    if (options.length === this.data.options.length && 
        JSON.stringify(options) === JSON.stringify(this.data.options) &&
        history.length === this.data.history.length) {
      return; // 数据未变化，不进行更新
    }
    
    // 优化2: 先更新基本数据
    this.setData({
      options,
      history,
      latestResult: history.length > 0 ? history[0] : ''
    });
    
    // 优化3: 异步生成扇形，避免UI卡顿
    if (options.length > 0) {
      setTimeout(() => {
        this.generateSectorsWithIcons(options).then(sectors => {
          this.setData({ sectors });
        });
      }, 0);
    } else {
      this.setData({ sectors: [] });
    }
  },

  // 生成带图标的扇形数据 - 性能优化版本
  generateSectorsWithIcons: async function(options) {
    if (!options || options.length === 0) {
      return [];
    }
    
    const anglePerSector = 360 / options.length;
    
    // 优化1: 批量生成扇形基础数据
    const basicSectors = options.map((option, i) => {
      const style = generateSectorStyle(i, options.length);
      return {
        name: option,
        angle: anglePerSector,
        color: style.backgroundColor,
        clipPath: style.clipPath,
        startAngle: i * anglePerSector,
        endAngle: (i + 1) * anglePerSector,
        iconUrl: '',
        textStyle: '',
        iconType: 'text' // 默认为文本
      };
    });
    
    // 优化2: 并行处理图标加载
    const iconPromises = basicSectors.map(async (sector) => {
      try {
        // 匹配食物图标
        const iconMatch = IconMatcher.matchFoodIcon(sector.name);
        
        if (iconMatch.type === 'icon') {
          // 异步加载图标
          sector.iconUrl = await IconMatcher.fetchIconAsBase64(iconMatch.value, iconMatch.source);
          sector.iconType = 'icon';
        } else {
          // 生成艺术字样式
          const textStyleObj = IconMatcher.generateArtText(iconMatch.value, sector.name);
          sector.textStyle = Object.entries(textStyleObj)
            .map(([key, value]) => `${key}:${value}`)
            .join(';');
        }
      } catch (error) {
        console.error('处理图标时出错:', error);
        // 错误处理，创建默认文本样式
        sector.iconType = 'text';
        sector.textStyle = 'color:#fff;font-weight:bold;';
      }
      
      return sector;
    });
    
    try {
      // 等待所有图标加载完成
      return await Promise.all(iconPromises);
    } catch (error) {
      console.error('扇形生成出错:', error);
      // 出错时返回基本扇形数据
      return basicSectors;
    }
  },
  
  // 输入框变化事件
  onInputChange: function(e) {
    this.setData({
      newOption: e.detail.value
    });
  },

  // 添加选项
  addOption: function() {
    const { newOption } = this.data;
    
    if (!newOption.trim()) {
      wx.showToast({
        title: '选项不能为空',
        icon: 'none'
      });
      return;
    }
    
    if (this.optionManager.addOption(newOption)) {
      this.updatePageData();
      this.setData({
        newOption: ''
      });
    } else {
      wx.showToast({
        title: '该选项已存在',
        icon: 'none'
      });
    }
  },

  // 删除选项
  removeOption: function(e) {
    const index = e.currentTarget.dataset.index;
    if (this.optionManager.removeOption(index)) {
      this.updatePageData();
    }
  },

  // 重置选项
  resetOptions: function() {
    wx.showModal({
      title: '确认重置',
      content: '确定要重置所有选项吗？',
      success: (res) => {
        if (res.confirm) {
          this.optionManager.resetOptions();
          this.updatePageData();
        }
      }
    });
  },

  // 开始旋转
  startSpin: debounce(function() {
    if (this.data.isSpinning) {
      return;
    }
    
    if (this.data.options.length === 0) {
      wx.showToast({
        title: '请先添加选项',
        icon: 'none'
      });
      return;
    }
    
    // 设置旋转状态
    this.setData({
      isSpinning: true,
      showParticles: false
    });
    
    // 开始旋转前检查结果是否一致
    if (this.data.latestResult && this.wheelController.selectedOption === this.data.latestResult) {
      console.log('检测到连续相同结果，重新触发抽奖...');
      
      // 重置wheelController
      this.wheelController.reset();
      this.wheelController.init(this);
    }
    
    // 开始旋转
    this.wheelController.startSpin(this.data.options, (selectedOption, selectedIndex) => {
      console.log('抽奖结束:', selectedOption, selectedIndex);
      
      // 震动反馈
      wx.vibrateShort({
        type: 'medium',
        success: () => console.log('震动成功'),
        fail: (err) => console.error('震动失败', err)
      });
      
      // 记录结果
      this.optionManager.addHistory(selectedOption);
      
      // 优化1: 批量更新数据，减少重绘
      const newData = {
        showParticles: true,
        latestResult: selectedOption
      };
      
      this.setData(newData);
      
      // 确保显示的结果和转盘指向的结果一致
      // 添加检验
      const controllerSelectedOption = this.wheelController.selectedOption;
      if (controllerSelectedOption !== selectedOption) {
        console.error('结果不一致:', 
          '\n- 指针指向:', controllerSelectedOption, 
          '\n- 回调返回:', selectedOption,
          '\n- 选中索引:', selectedIndex,
          '\n- 当前选项列表:', this.data.options
        );
        
        // 使用controller中选择的选项，确保一致性
        this.optionManager.addHistory(controllerSelectedOption, true); // 覆盖之前的记录
        
        // 更新最新结果
        this.setData({
          latestResult: controllerSelectedOption
        });
        
        // 修正显示的结果提示
        wx.showToast({
          title: `今天吃：${controllerSelectedOption}`,
          icon: 'success',
          duration: 2000
        });
        
        return; // 提前退出
      }
      
      // 3秒后隐藏粒子效果
      setTimeout(() => {
        // 优化2: 预先计算sectors，减少generateSectorsWithIcons的调用
        const history = this.optionManager.getHistory();
        
        // 使用setTimeout进行异步更新，避免卡顿
        setTimeout(() => {
          this.setData({
            showParticles: false,
            isSpinning: false,
            history: history
          });
        }, 0);
      }, 3000);
      
      // 显示结果提示
      wx.showToast({
        title: `今天吃：${selectedOption}`,
        icon: 'success',
        duration: 2000
      });
    });
  }, 500),
  
  // 页面卸载
  onUnload() {
    // 清理资源
    if (this.wheelController) {
      this.wheelController.reset();
    }
  },

  // 开启/关闭调试模式
  toggleDebugMode: function() {
    const newDebugMode = !this.data.debugMode;
    this.setData({
      debugMode: newDebugMode
    });
    
    console.log('调试模式:', newDebugMode ? '已开启' : '已关闭');
    
    if (newDebugMode) {
      // 输出当前状态信息
      console.log('当前数据状态:', {
        options: this.data.options,
        sectors: this.data.sectors,
        history: this.data.history,
        wheelAngle: this.wheelController ? this.wheelController.getAngle() : 0
      });
    }
    
    wx.showToast({
      title: newDebugMode ? '调试模式已开启' : '调试模式已关闭',
      icon: 'none',
      duration: 1500
    });
  },
}); 