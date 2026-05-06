App({
  globalData: {
    userInfo: null,
    // 学习进度数据
    studyData: {
      // 格式: { wordId: { nextReview: timestamp, interval: days,熟练度: 0-5 } }
    },
    // 今日打卡记录
    todayCheckIn: false,
    // 连续打卡天数
    consecutiveDays: 0,
    // 总学习天数
    totalDays: 0,
    // 当前学习进度（第几个词）
    currentIndex: 0,
    // 每日新词数
    dailyNewWords: 20
  },
  
  onLaunch() {
    // 加载本地存储的学习数据
    const savedData = wx.getStorageSync('studyData');
    if (savedData) {
      this.globalData.studyData = savedData;
    }
    
    const today = this.getTodayStr();
    const lastCheckIn = wx.getStorageSync('lastCheckIn');
    const consecutiveDays = wx.getStorageSync('consecutiveDays') || 0;
    const totalDays = wx.getStorageSync('totalDays') || 0;
    
    // 检查是否今天已经打卡
    if (lastCheckIn === today) {
      this.globalData.todayCheckIn = true;
    } else if (lastCheckIn === this.getYesterdayStr()) {
      // 昨天打卡了，连续天数继续
      this.globalData.consecutiveDays = consecutiveDays;
    } else {
      // 中间断了一天，重置连续天数
      this.globalData.consecutiveDays = 0;
    }
    
    this.globalData.currentIndex = wx.getStorageSync('currentIndex') || 0;
    this.globalData.consecutiveDays = consecutiveDays;
    this.globalData.totalDays = totalDays;
  },
  
  getTodayStr() {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
  },
  
  getYesterdayStr() {
    const now = new Date();
    now.setDate(now.getDate() - 1);
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
  },
  
  // 保存学习数据
  saveStudyData() {
    wx.setStorageSync('studyData', this.globalData.studyData);
    wx.setStorageSync('currentIndex', this.globalData.currentIndex);
    wx.setStorageSync('consecutiveDays', this.globalData.consecutiveDays);
    wx.setStorageSync('totalDays', this.globalData.totalDays);
  },
  
  // 打卡
  checkIn() {
    const today = this.getTodayStr();
    const lastCheckIn = wx.getStorageSync('lastCheckIn');
    
    if (lastCheckIn === today) {
      return { success: false, message: '今天已经打卡过了' };
    }
    
    let consecutiveDays = this.globalData.consecutiveDays;
    if (lastCheckIn === this.getYesterdayStr()) {
      consecutiveDays++;
    } else {
      consecutiveDays = 1;
    }
    
    const totalDays = (this.globalData.totalDays || 0) + 1;
    
    this.globalData.todayCheckIn = true;
    this.globalData.consecutiveDays = consecutiveDays;
    this.globalData.totalDays = totalDays;
    
    wx.setStorageSync('lastCheckIn', today);
    wx.setStorageSync('consecutiveDays', consecutiveDays);
    wx.setStorageSync('totalDays', totalDays);
    
    return { success: true, consecutiveDays, totalDays };
  },
  
  // 获取今日任务
  getTodayTasks(words) {
    const today = Date.now();
    const todayStr = this.getTodayStr();
    const currentIndex = this.globalData.currentIndex;
    const dailyNewWords = this.globalData.dailyNewWords;
    const studyData = this.globalData.studyData;
    
    // 1. 需要复习的词（艾宾浩斯复习点到了）
    const reviewWords = words.filter(w => {
      const wordStudy = studyData[w.id];
      if (!wordStudy) return false;
      return wordStudy.nextReview <= today && w.id < currentIndex;
    });
    
    // 2. 今日新词
    const newWords = [];
    if (currentIndex < words.length) {
      for (let i = currentIndex; i < Math.min(currentIndex + dailyNewWords, words.length); i++) {
        newWords.push(words[i]);
      }
    }
    
    return {
      reviewWords,
      newWords,
      totalReview: reviewWords.length,
      totalNew: newWords.length,
      progress: `${currentIndex}/${words.length}`
    };
  },
  
  // 更新学习进度
  updateProgress(wordId) {
    const today = Date.now();
    const studyData = this.globalData.studyData;
    
    if (!studyData[wordId]) {
      // 新词第一次学习
      studyData[wordId] = {
        nextReview: today + 1 * 24 * 60 * 60 * 1000, // 1天后复习
        interval: 1,
        level: 1
      };
    } else {
      // 已学过的词，增加间隔
      const wordStudy = studyData[wordId];
      wordStudy.interval = Math.min(wordStudy.interval * 2, 30); // 最大30天
      wordStudy.nextReview = today + wordStudy.interval * 24 * 60 * 60 * 1000;
      wordStudy.level = Math.min((wordStudy.level || 0) + 1, 5);
    }
    
    this.globalData.studyData = studyData;
    this.saveStudyData();
  },
  
  // 学完今日新词后更新索引
  finishDailyNewWords(count) {
    this.globalData.currentIndex += count;
    this.saveStudyData();
  }
})
