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
  }
});
