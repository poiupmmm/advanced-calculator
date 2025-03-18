// app.js
const config = require('./utils/config');

App({
  onLaunch() {
    // 初始化应用
    console.log('应用启动');
    
    // 获取系统信息
    const systemInfo = wx.getSystemInfoSync();
    this.globalData.systemInfo = systemInfo;
    
    // 检查是否有存储的选项
    try {
      const storedOptions = wx.getStorageSync(config.storage.optionsKey);
      if (storedOptions && Array.isArray(storedOptions)) {
        this.globalData.options = storedOptions;
      } else {
        // 如果没有存储的选项，使用默认选项
        this.globalData.options = [...config.defaultOptions];
        wx.setStorageSync(config.storage.optionsKey, this.globalData.options);
      }
      
      // 检查是否有存储的历史记录
      const storedHistory = wx.getStorageSync(config.storage.historyKey);
      if (storedHistory && Array.isArray(storedHistory)) {
        this.globalData.history = storedHistory;
      } else {
        this.globalData.history = [];
        wx.setStorageSync(config.storage.historyKey, this.globalData.history);
      }
    } catch (error) {
      console.error('初始化存储失败', error);
      this.globalData.options = [...config.defaultOptions];
      this.globalData.history = [];
    }
  },
  
  globalData: {
    options: [],
    history: [],
    systemInfo: null
  }
}) 