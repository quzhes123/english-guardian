Component({
  properties: {
    active: {
      type: String,
      value: 'index'
    }
  },

  methods: {
    switchTab(e) {
      const tab = e.currentTarget.dataset.tab;
      const app = getApp();
      
      // 更新全局活跃 tab
      app.globalData.activeTab = tab;
      
      // 触发全局事件
      this.triggerEvent('change', { tab });
      
      // 跳转到对应页面
      const pageMap = {
        'index': '/pages/index/index',
        'study': '/pages/study/study',
        'word-list': '/pages/word-list/word-list',
        'stats': '/pages/stats/stats',
        'mine': '/pages/mine/mine'
      };
      
      wx.switchTab({
        url: pageMap[tab]
      });
    }
  }
});
