const app = getApp();
const vocabulary = require('../../data/vocabulary.js');

Page({
  data: {
    currentIndex: 0,
    totalWords: 0,
    currentWord: null,
    isFlipped: false,
    isComplete: false,
    progressPercent: 0
  },

  onLoad() {
    this.initStudy();
  },

  initStudy() {
    const app = getApp();
    const tasks = app.getTodayTasks(vocabulary);
    const todayNewWords = tasks.newWords;
    
    if (todayNewWords.length === 0) {
      this.setData({
        isComplete: true
      });
      return;
    }
    
    this.setData({
      todayNewWords,
      currentIndex: 0,
      totalWords: todayNewWords.length,
      currentWord: todayNewWords[0],
      progressPercent: 0
    });
  },

  flipCard() {
    this.setData({
      isFlipped: !this.data.isFlipped
    });
  },

  onFail() {
    // 没记住，继续显示，可以标记为需要更多复习
    wx.showToast({
      title: '多复习几遍哦',
      icon: 'none',
      duration: 1000
    });
    this.moveToNext();
  },

  onPass() {
    // 记住了，更新学习数据
    const word = this.data.currentWord;
    app.updateProgress(word.id);
    this.moveToNext();
  },

  onNext() {
    this.moveToNext();
  },

  moveToNext() {
    const nextIndex = this.data.currentIndex + 1;
    
    if (nextIndex >= this.data.totalWords) {
      // 学习完成
      app.finishDailyNewWords(this.data.totalWords);
      this.setData({
        isComplete: true
      });
    } else {
      this.setData({
        currentIndex: nextIndex,
        currentWord: this.data.todayNewWords[nextIndex],
        isFlipped: false,
        progressPercent: Math.round((nextIndex / this.data.totalWords) * 100)
      });
    }
  },

  goBack() {
    wx.navigateBack();
  },

  playAudio() {
    const word = this.data.currentWord.word;
    const audioUrl = `https://dict.youdao.com/dictvoice?audio=${encodeURIComponent(word)}&type=1`;
    
    const audioContext = wx.createInnerAudioContext();
    audioContext.src = audioUrl;
    audioContext.play();
    
    audioContext.onPlay(() => {
      console.log('正在播放:', word);
    });
    
    audioContext.onError((err) => {
      console.error('播放失败:', err);
      wx.showToast({
        title: '播放失败',
        icon: 'none'
      });
    });
  }
});
