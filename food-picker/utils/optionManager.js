// 选项管理类
const config = require('./config');

class OptionManager {
  constructor() {
    this.options = [];
    this.history = [];
    this.loadFromStorage();
  }

  // 从本地存储加载数据
  loadFromStorage() {
    try {
      const savedOptions = wx.getStorageSync(config.storage.optionsKey);
      const savedHistory = wx.getStorageSync(config.storage.historyKey);
      
      if (savedOptions && Array.isArray(savedOptions)) {
        this.options = savedOptions;
      } else {
        // 使用默认选项
        this.options = [...config.defaultOptions];
        this.saveOptions();
      }
      
      if (savedHistory && Array.isArray(savedHistory)) {
        this.history = savedHistory;
      } else {
        this.history = [];
        this.saveHistory();
      }
    } catch (error) {
      console.error('加载存储数据失败', error);
      this.options = [...config.defaultOptions];
      this.history = [];
      this.saveOptions();
      this.saveHistory();
    }
  }

  // 保存选项到本地存储
  saveOptions() {
    try {
      wx.setStorageSync(config.storage.optionsKey, this.options);
    } catch (error) {
      console.error('保存选项失败', error);
    }
  }

  // 保存历史记录到本地存储
  saveHistory() {
    try {
      wx.setStorageSync(config.storage.historyKey, this.history);
    } catch (error) {
      console.error('保存历史记录失败', error);
    }
  }

  // 添加选项
  addOption(option) {
    if (!option || typeof option !== 'string' || option.trim() === '') {
      return false;
    }
    
    // 去除首尾空格
    const trimmedOption = option.trim();
    
    // 检查是否已存在
    if (this.options.includes(trimmedOption)) {
      return false;
    }
    
    this.options.push(trimmedOption);
    this.saveOptions();
    return true;
  }

  // 删除选项
  removeOption(index) {
    if (index < 0 || index >= this.options.length) {
      return false;
    }
    
    this.options.splice(index, 1);
    this.saveOptions();
    return true;
  }

  // 重置所有选项
  resetOptions() {
    this.options = [...config.defaultOptions];
    this.saveOptions();
    return true;
  }

  // 添加历史记录 - 增加覆盖选项
  addHistory(option, overwrite = false) {
    if (!option || typeof option !== 'string') {
      return false;
    }
    
    // 如果需要覆盖最新记录
    if (overwrite && this.history.length > 0) {
      this.history[0] = option;
    } else {
      // 将新记录添加到数组开头
      this.history.unshift(option);
    }
    
    // 限制历史记录数量
    if (this.history.length > config.history.maxRecords) {
      this.history = this.history.slice(0, config.history.maxRecords);
    }
    
    this.saveHistory();
    return true;
  }

  // 获取所有选项
  getOptions() {
    return [...this.options];
  }

  // 获取历史记录
  getHistory() {
    return [...this.history];
  }

  // 获取选项数量
  getOptionsCount() {
    return this.options.length;
  }

  // 检查选项是否为空
  isEmpty() {
    return this.options.length === 0;
  }

  // 获取选项名称
  getOptionAt(index) {
    if (index < 0 || index >= this.options.length) {
      return null;
    }
    return this.options[index];
  }
}

module.exports = OptionManager; 