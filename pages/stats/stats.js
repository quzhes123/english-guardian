const app = getApp();
const vocabulary = require('../../data/vocabulary.js');

Page({
  data: {
    consecutiveDays: 0,
    totalWordsLearned: 0,
    totalDays: 0,
    progressPercent: 0,
    currentMonth: '',
    weekdays: ['日', '一', '二', '三', '四', '五', '六'],
    calendarDays: [],
    unfamiliarCount: 0,
    familiarCount: 0,
    masteredCount: 0,
    unfamiliarPercent: 0,
    familiarPercent: 0,
    masteredPercent: 0
  },

  onLoad() {
    getApp().globalData.activeTab = 'stats';
    const now = new Date();
    const monthStr = `${now.getFullYear()}年${now.getMonth() + 1}月`;
    this.setData({ currentMonth: monthStr });
    this.generateCalendar();
  },

  onShow() {
    getApp().globalData.activeTab = 'stats';
    this.loadStats();
  },

  loadStats() {
    const appInstance = getApp();
    const studyData = appInstance.globalData.studyData;
    const currentIndex = appInstance.globalData.currentIndex;
    
    // 计算各种状态的词数
    let unfamiliar = 0;
    let familiar = 0;
    let mastered = 0;
    
    Object.values(studyData).forEach(record => {
      if (!record || record.level < 2) {
        unfamiliar++;
      } else if (record.level < 4) {
        familiar++;
      } else {
        mastered++;
      }
    });
    
    const total = vocabulary.length;
    const learned = Object.keys(studyData).length;
    const progress = total > 0 ? Math.round((learned / total) * 100) : 0;

    // 计算熟练度百分比（基于已学单词数）
    const learnedTotal = unfamiliar + familiar + mastered;
    this.setData({
      consecutiveDays: appInstance.globalData.consecutiveDays,
      totalWordsLearned: learned,
      totalDays: appInstance.globalData.totalDays || 0,
      progressPercent: progress,
      unfamiliarCount: unfamiliar,
      familiarCount: familiar,
      masteredCount: mastered,
      unfamiliarPercent: learnedTotal > 0 ? Math.round((unfamiliar / learnedTotal) * 100) : 0,
      familiarPercent: learnedTotal > 0 ? Math.round((familiar / learnedTotal) * 100) : 0,
      masteredPercent: learnedTotal > 0 ? Math.round((mastered / learnedTotal) * 100) : 0
    });
  },

  generateCalendar() {
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth();
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    
    const days = [];
    // 填充空白
    for (let i = 0; i < firstDay; i++) {
      days.push({ day: '', status: '' });
    }
    // 填充日期
    for (let d = 1; d <= daysInMonth; d++) {
      const status = this.isCheckedDay(d) ? 'checked' : '';
      const isToday = d === now.getDate() ? 'today' : '';
      days.push({ day: d, status: `${status} ${isToday}`.trim() });
    }
    
    this.setData({ calendarDays: days });
  },

  isCheckedDay(day) {
    // 这里简化处理，实际应该读取打卡记录
    const lastCheckIn = wx.getStorageSync('lastCheckIn');
    if (!lastCheckIn) return false;
    
    const now = new Date();
    const checkDate = new Date(lastCheckIn);
    return checkDate.getDate() === day && 
           checkDate.getMonth() === now.getMonth() &&
           checkDate.getFullYear() === now.getFullYear();
  }
});
