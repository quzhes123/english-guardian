const app = getApp();

Page({
  data: {
    goalText: '掌握初中三年全部英语词汇，备战中考',
    goalProgress: 35,
    dailyTarget: 20,
    reminderEnabled: false,
    soundEnabled: true
  },

  onLoad() {
    // 加载设置
    const settings = wx.getStorageSync('userSettings') || {};
    this.setData({
      dailyTarget: settings.dailyTarget || 20,
      reminderEnabled: settings.reminderEnabled || false,
      soundEnabled: settings.soundEnabled !== false
    });
  },

  editGoal() {
    wx.showModal({
      title: '设置目标',
      editable: true,
      placeholderText: '请输入学习目标',
      success: (res) => {
        if (res.confirm && res.content) {
          this.setData({ goalText: res.content });
        }
      }
    });
  },

  showSetting(e) {
    const key = e.currentTarget.dataset.key;
    
    if (key === 'daily') {
      wx.showModal({
        title: '每日学习目标',
        editable: true,
        placeholderText: '输入每日新词数量',
        content: String(this.data.dailyTarget),
        success: (res) => {
          if (res.confirm && res.content) {
            const target = parseInt(res.content) || 20;
            this.setData({ dailyTarget: target });
            app.globalData.dailyNewWords = target;
            this.saveSettings();
          }
        }
      });
    } else if (key === 'reminder') {
      wx.showModal({
        title: '学习提醒',
        content: this.data.reminderEnabled ? '关闭学习提醒？' : '开启学习提醒？',
        success: (res) => {
          if (res.confirm) {
            this.setData({ reminderEnabled: !this.data.reminderEnabled });
            this.saveSettings();
          }
        }
      });
    } else if (key === 'sound') {
      wx.showModal({
        title: '发音朗读',
        content: this.data.soundEnabled ? '关闭发音朗读？' : '开启发音朗读？',
        success: (res) => {
          if (res.confirm) {
            this.setData({ soundEnabled: !this.data.soundEnabled });
            this.saveSettings();
          }
        }
      });
    }
  },

  saveSettings() {
    wx.setStorageSync('userSettings', {
      dailyTarget: this.data.dailyTarget,
      reminderEnabled: this.data.reminderEnabled,
      soundEnabled: this.data.soundEnabled
    });
  },

  exportData() {
    const studyData = app.globalData.studyData;
    const dataStr = JSON.stringify(studyData, null, 2);
    
    wx.showModal({
      title: '学习记录',
      content: `共记录 ${Object.keys(studyData).length} 个单词的学习数据`,
      showCancel: true,
      confirmText: '复制数据',
      success: (res) => {
        if (res.confirm) {
          wx.setClipboardData({
            data: dataStr,
            success: () => {
              wx.showToast({ title: '已复制', icon: 'success' });
            }
          });
        }
      }
    });
  },

  showAbout() {
    wx.showModal({
      title: '英语守护者',
      content: '专为初中生打造的中考英语词汇学习小程序\n\n版本: 1.0.0\n\n祝你中考取得好成绩！',
      showCancel: false,
      confirmText: '知道了'
    });
  }
});
