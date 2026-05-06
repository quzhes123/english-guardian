const app = getApp();
const vocabulary = require('../../data/vocabulary.js');

Page({
  data: {
    reviewWords: []
  },

  onLoad() {
    this.loadReviewWords();
  },

  onShow() {
    this.loadReviewWords();
  },

  loadReviewWords() {
    const tasks = app.getTodayTasks(vocabulary);
    // 给每个复习词添加flipped状态
    const reviewWords = tasks.reviewWords.map(w => ({...w, flipped: false}));
    this.setData({
      reviewWords
    });
  },

  flipCard(e) {
    const index = e.currentTarget.dataset.index;
    const reviewWords = this.data.reviewWords;
    reviewWords[index].flipped = !reviewWords[index].flipped;
    this.setData({ reviewWords });
  },

  goToStudy() {
    wx.navigateTo({
      url: '/pages/study/study'
    });
  }
});
