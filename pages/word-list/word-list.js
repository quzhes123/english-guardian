const vocabulary = require('../../data/vocabulary.js');

// 本地自定义词汇存储
let customWords = [];

Page({
  data: {
    letters: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split(''),
    currentLetter: '',
    searchKey: '',
    filteredWords: [],
    showModal: false,
    inputMode: 'text',  // 'text' or 'image'
    wordInput: '',
    uploadedImage: '',
    recognizedWords: [],
    tempFilePath: ''
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
    const grouped = {};
    words.forEach(w => {
      const letter = w.word[0].toUpperCase();
      if (!grouped[letter]) {
        grouped[letter] = [];
      }
      grouped[letter].push(w);
    });

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

  // 显示添加弹窗
  showAddModal() {
    this.setData({
      showModal: true,
      inputMode: 'text',
      wordInput: '',
      uploadedImage: '',
      recognizedWords: [],
      tempFilePath: ''
    });
  },

  // 隐藏弹窗
  hideModal() {
    this.setData({
      showModal: false
    });
  },

  // 阻止事件冒泡
  stopProp() {},

  // 切换到图片模式
  switchToImageMode() {
    this.setData({
      inputMode: 'image'
    });
  },

  // 切换到文本模式
  switchToTextMode() {
    this.setData({
      inputMode: 'text'
    });
  },

  // 文本输入
  onWordInput(e) {
    this.setData({
      wordInput: e.detail.value
    });
  },

  // 选择图片
  chooseImage() {
    wx.chooseImage({
      count: 1,
      sizeType: ['compressed'],
      sourceType: ['album', 'camera'],
      success: (res) => {
        const tempFilePath = res.tempFilePaths[0];
        this.setData({
          uploadedImage: tempFilePath,
          tempFilePath: tempFilePath
        });
        this.recognizeImage(tempFilePath);
      },
      fail: (err) => {
        console.error('Choose image failed:', err);
        wx.showToast({ title: '选择图片失败', icon: 'none' });
      }
    });
  },

  // 移除图片
  removeImage() {
    this.setData({
      uploadedImage: '',
      tempFilePath: '',
      recognizedWords: []
    });
  },

  // 识别图片中的文字
  recognizeImage(filePath) {
    wx.showLoading({ title: '识别中...' });

    // 将图片转为base64
    wx.getFileSystemManager().readFile({
      filePath: filePath,
      encoding: 'base64',
      success: (res) => {
        const base64Data = res.data;

        // 使用 OCR.space 免费 API
        wx.request({
          url: 'https://api.ocr.space/parse/image',
          method: 'POST',
          header: {
            'apikey': 'helloworld',
            'Content-Type': 'application/x-www-form-urlencoded'
          },
          data: {
            base64Image: 'data:image/png;base64,' + base64Data,
            language: 'eng',
            isOverlayRequired: false,
            detectOrientation: true,
            scale: true
          },
          success: (res) => {
            wx.hideLoading();
            console.log('OCR response:', res.data);
            if (res.data && res.data.ParsedResults && res.data.ParsedResults.length > 0) {
              const text = res.data.ParsedResults.map(r => r.ParsedText).join('\n');
              this.parseRecognizedText(text);
            } else if (res.data && res.data.ErrorMessage) {
              wx.showToast({
                title: res.data.ErrorMessage[0] || '识别失败',
                icon: 'none'
              });
            } else if (res.data && res.data.IsErroredOnProcessing) {
              wx.showToast({ title: '图片识别失败，请重试', icon: 'none' });
            } else {
              wx.showToast({ title: '未识别到文字', icon: 'none' });
            }
          },
          fail: (err) => {
            wx.hideLoading();
            console.error('OCR request failed:', err);
            wx.showToast({ title: '识别请求失败', icon: 'none' });
          }
        });
      },
      fail: (err) => {
        wx.hideLoading();
        wx.showToast({ title: '读取图片失败', icon: 'none' });
      }
    });
  },

  // 解析识别出的文字，提取单词
  parseRecognizedText(text) {
    if (!text) return;
    
    // 按行分割，清理非字母字符，提取单词
    const lines = text.split(/[\r\n]+/);
    const words = [];
    
    lines.forEach(line => {
      // 提取英文单词（去掉标点符号）
      const lineWords = line.match(/[a-zA-Z]+/g) || [];
      lineWords.forEach(w => {
        const word = w.toLowerCase();
        // 只保留长度>=2的单词
        if (word.length >= 2 && !this.wordExists(word)) {
          words.push({
            word: word,
            phonetic: `/${word}/`,
            meaning: '待补充',
            selected: true
          });
        }
      });
    });

    // 去重
    const uniqueWords = [];
    const seen = new Set();
    words.forEach(w => {
      if (!seen.has(w.word)) {
        seen.add(w.word);
        uniqueWords.push(w);
      }
    });

    this.setData({
      recognizedWords: uniqueWords
    });

    if (uniqueWords.length > 0) {
      wx.showToast({ 
        title: `识别到${uniqueWords.length}个单词`, 
        icon: 'success' 
      });
    } else {
      wx.showToast({ title: '未识别到单词', icon: 'none' });
    }
  },

  // 切换单词选中状态
  toggleWord(e) {
    const index = e.currentTarget.dataset.index;
    const recognizedWords = this.data.recognizedWords;
    recognizedWords[index].selected = !recognizedWords[index].selected;
    this.setData({
      recognizedWords: recognizedWords
    });
  },

  // 确认添加
  confirmAdd() {
    let wordsToAdd = [];

    if (this.data.inputMode === 'text') {
      // 文本模式：按逗号分割
      const input = this.data.wordInput.trim();
      if (!input) {
        wx.showToast({ title: '请输入单词', icon: 'none' });
        return;
      }
      
      const parts = input.split(/[,，、\n]+/);
      parts.forEach(part => {
        const word = part.trim().toLowerCase().replace(/[^a-zA-Z]/g, '');
        if (word && word.length >= 2) {
          wordsToAdd.push({
            word: word,
            phonetic: `/${word}/`,
            meaning: '待补充',
            selected: true
          });
        }
      });
    } else {
      // 图片模式：使用选中的单词
      wordsToAdd = this.data.recognizedWords.filter(w => w.selected);
      
      if (wordsToAdd.length === 0) {
        wx.showToast({ title: '请先上传图片识别', icon: 'none' });
        return;
      }
    }

    // 添加单词
    const maxId = vocabulary.length > 0 ? Math.max(...vocabulary.map(w => w.id)) : 0;
    const customMaxId = customWords.length > 0 ? Math.max(...customWords.map(w => w.id)) : 0;
    let nextId = Math.max(maxId, customMaxId);

    wordsToAdd.forEach(w => {
      if (!this.wordExists(w.word)) {
        nextId++;
        customWords.push({
          id: nextId,
          word: w.word,
          phonetic: w.phonetic,
          meaning: w.meaning,
          level: 1,
          isCustom: true
        });
      }
    });

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

    this.hideModal();
    
    wx.showToast({
      title: `添加成功`,
      icon: 'success'
    });
  },

  wordExists(word) {
    const allWords = [...vocabulary, ...customWords];
    return allWords.some(w => w.word.toLowerCase() === word.toLowerCase());
  }
});
