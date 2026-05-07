const vocabulary = require('../../data/vocabulary.js');

// 本地自定义词汇存储
let customWords = [];

Page({
  data: {
    letters: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split(''),
    currentLetter: '',
    searchKey: '',
    filteredWords: []
  },

  onLoad() {
    getApp().globalData.activeTab = 'word-list';
    this.loadCustomWords();
  },

  loadCustomWords() {
    try {
      const saved = wx.getStorageSync('customWords');
      if (saved) {
        customWords = saved;
      }
    } catch (e) {
      console.log('Failed to load custom words:', e);
    }
    this.processWords([...vocabulary, ...customWords]);
  },

  processWords(words) {
    // 按字母分组
    const grouped = {};
    words.forEach(w => {
      const letter = w.word[0].toUpperCase();
      if (!grouped[letter]) {
        grouped[letter] = [];
      }
      grouped[letter].push(w);
    });

    // 转换为数组
    const result = Object.keys(grouped).sort().map(letter => ({
      letter,
      words: grouped[letter]
    }));

    this.setData({
      filteredWords: result
    });
  },

  onSearch(e) {
    const key = e.detail.value.toLowerCase();
    this.setData({
      searchKey: key
    });

    const allWords = [...vocabulary, ...customWords];
    if (key) {
      const filtered = allWords.filter(w => 
        w.word.toLowerCase().includes(key) || 
        w.meaning.includes(key)
      );
      this.processWords(filtered);
    } else {
      this.processWords(allWords);
    }
  },

  jumpToLetter(e) {
    const letter = e.currentTarget.dataset.letter;
    this.setData({
      currentLetter: letter
    });
    wx.pageScrollTo({
      selector: `#letter-${letter}`,
      duration: 300
    });
  },

  showWordDetail(e) {
    const word = e.currentTarget.dataset.word;
    wx.showModal({
      title: word.word,
      content: `${word.phonetic}\n\n${word.meaning}`,
      showCancel: false,
      confirmText: '知道了'
    });
  },

  playAudio(e) {
    const word = e.currentTarget.dataset.word;
    const audioUrl = `https://dict.youdao.com/dictvoice?audio=${encodeURIComponent(word)}&type=1`;
    
    const audioContext = wx.createInnerAudioContext();
    audioContext.src = audioUrl;
    audioContext.play();
    
    audioContext.onError((err) => {
      wx.showToast({ title: '播放失败', icon: 'none' });
    });
  },

  addWord() {
    wx.showModal({
      title: '添加单词',
      editable: true,
      placeholderText: '输入单词',
      success: (res) => {
        if (res.confirm && res.content) {
          const newWord = res.content.trim().toLowerCase();
          if (newWord && !this.wordExists(newWord)) {
            const maxId = vocabulary.length > 0 ? Math.max(...vocabulary.map(w => w.id)) : 0;
            const customMaxId = customWords.length > 0 ? Math.max(...customWords.map(w => w.id)) : 0;
            const newEntry = {
              id: Math.max(maxId, customMaxId) + 1,
              word: newWord,
              phonetic: `/${newWord}/`,
              meaning: '自定义单词',
              level: 1,
              isCustom: true
            };
            
            customWords.push(newEntry);
            wx.setStorageSync('customWords', customWords);
            
            // 刷新列表
            const allWords = [...vocabulary, ...customWords];
            if (this.data.searchKey) {
              const filtered = allWords.filter(w => 
                w.word.toLowerCase().includes(this.data.searchKey) || 
                w.meaning.includes(this.data.searchKey)
              );
              this.processWords(filtered);
            } else {
              this.processWords(allWords);
            }
            
            wx.showToast({
              title: '添加成功',
              icon: 'success'
            });
          } else if (this.wordExists(newWord)) {
            wx.showToast({
              title: '单词已存在',
              icon: 'none'
            });
          }
        }
      }
    });
  },

  wordExists(word) {
    const allWords = [...vocabulary, ...customWords];
    return allWords.some(w => w.word.toLowerCase() === word.toLowerCase());
  }
});
