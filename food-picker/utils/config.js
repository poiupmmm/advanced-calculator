// 应用配置和动画参数
const config = {
  // 转盘动画参数
  wheel: {
    initialAcceleration: 0.3, // 初始加速度：0.3度/ms²
    frictionCoefficient: 0.97, // 摩擦系数：0.97（每帧减速）
    stopThreshold: 0.1, // 停止条件：速度<0.1度/ms
    minSpinTime: 3000, // 最少旋转时间(ms)
    maxSpinTime: 5000, // 最多旋转时间(ms)
    diameter: 400, // 转盘直径(px)
    minRotations: 3, // 最小旋转圈数
    maxRotations: 5, // 最大旋转圈数
  },
  
  // 历史记录配置
  history: {
    maxRecords: 5 // 最多保存5条历史记录
  },
  
  // 存储相关配置
  storage: {
    optionsKey: 'foodPickerOptions', // 存储选项的键名
    historyKey: 'foodPickerHistory' // 存储历史记录的键名
  },
  
  // 默认选项
  defaultOptions: ['火锅', '寿司', '汉堡', '炒饭', '披萨', '拉面']
};

module.exports = config; 