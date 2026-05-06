const vocabulary = require('../../data/vocabulary.js');

Page({
  data: {
    letters: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split(''),
    currentLetter: '',
    searchKey: '',
    filteredWords: []
  },

  onLoad() {
    this.processWords(vocabulary);
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

    if (key) {
      const filtered = vocabulary.filter(w => 
        w.word.toLowerCase().includes(key) || 
        w.meaning.includes(key)
      );
      this.processWords(filtered);
    } else {
      this.processWords(vocabulary);
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
      title: '追加单词',
      editable: true,
      placeholderText: '输入单词',
      success: (res) => {
        if (res.confirm && res.content) {
          const newWord = res.content.trim().toLowerCase();
          if (newWord) {
            // 获取现有单词数作为新ID
            const maxId = vocabulary.length > 0 ? Math.max(...vocabulary.map(w => w.id)) : 0;
            const newEntry = {
              id: maxId + 1,
              word: newWord,
              phonetic: `/${newWord}/`,
              meaning: '自定义单词',
              level: 1,
              isCustom: true
            };
            wx.showToast({
              title: '单词已添加',
              icon: 'success'
            });
          }
        }
      }
    });
  }
});
