const app = getApp();
const vocabulary = require('../../data/vocabulary.js');

Page({
  data: {
    greeting: '你好',
    currentDate: '',
    consecutiveDays: 0,
    todayCheckIn: false,
    reviewCount: 0,
    newWordCount: 0,
    taskProgress: ''
  },

  onLoad() {
    this.updateGreeting();
    this.updateDate();
  },

  onShow() {
    // 更新全局活跃 tab
    app.globalData.activeTab = 'index';
    // 更新打卡状态
    this.setData({
      consecutiveDays: app.globalData.consecutiveDays,
      todayCheckIn: app.globalData.todayCheckIn
    });
    
    // 计算今日任务
    this.calculateTodayTasks();
  },

  updateGreeting() {
    const hour = new Date().getHours();
    let greeting = '你好';
    if (hour >= 6 && hour < 12) {
      greeting = '早上好';
    } else if (hour >= 12 && hour < 14) {
      greeting = '中午好';
    } else if (hour >= 14 && hour < 18) {
      greeting = '下午好';
    } else if (hour >= 18 && hour < 22) {
      greeting = '晚上好';
    } else {
      greeting = '夜深了';
    }
    this.setData({ greeting });
  },

  updateDate() {
    const now = new Date();
    const dateStr = `${now.getFullYear()}年${now.getMonth() + 1}月${now.getDate()}日`;
    const weekDays = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
    const weekDay = weekDays[now.getDay()];
    this.setData({
      currentDate: `${dateStr} ${weekDay}`
    });
  },

  calculateTodayTasks() {
    const tasks = app.getTodayTasks(vocabulary);
    this.setData({
      reviewCount: tasks.totalReview,
      newWordCount: tasks.totalNew,
      taskProgress: tasks.progress
    });
  },

  onCheckIn() {
    const result = app.checkIn();
    if (result.success) {
      this.setData({
        todayCheckIn: true,
        consecutiveDays: result.consecutiveDays
      });
      wx.showToast({
        title: '打卡成功！',
        icon: 'success',
        duration: 2000
      });
    } else {
      wx.showToast({
        title: result.message,
        icon: 'none'
      });
    }
  },

  goToReview() {
    wx.navigateTo({
      url: '/pages/review/review'
    });
  },

  goToStudy() {
    wx.navigateTo({
      url: '/pages/study/study'
    });
  },

  goToWordList() {
    wx.switchTab({
      url: '/pages/word-list/word-list'
    });
  },

  goToTest() {
    wx.navigateTo({
      url: '/pages/test/test'
    });
  },

  goToStats() {
    wx.switchTab({
      url: '/pages/stats/stats'
    });
  },

  goToMine() {
    wx.switchTab({
      url: '/pages/mine/mine'
    });
  }
});
