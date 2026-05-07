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

  // 识别图片中的文字 - 使用阿里云OCR
  recognizeImage(filePath) {
    wx.showLoading({ title: '识别中...' });

    // 将图片转为base64
    wx.getFileSystemManager().readFile({
      filePath: filePath,
      encoding: 'base64',
      success: (res) => {
        const base64Data = res.data;
        this.callAliyunOCR(base64Data);
      },
      fail: (err) => {
        wx.hideLoading();
        wx.showToast({ title: '读取图片失败', icon: 'none' });
      }
    });
  },

  // 调用阿里云OCR API
  callAliyunOCR(base64Data) {
    const app = getApp();
    const accessKeyId = '${ALIYUN_ACCESS_KEY_ID}';
    const accessKeySecret = '${ALIYUN_ACCESS_KEY_SECRET}';
    const region = 'cn-shanghai';
    const endpoint = 'ocrapi-document.cn-shanghai.aliyuncs.com';
    const action = 'RecognizeText';
    const version = '2019-12-30';

    // 生成时间戳 (UTC格式)
    const now = new Date();
    const timestamp = now.toISOString().replace(/\.\d{3}Z$/, 'Z');

    // 构造待签名字符串
    const params = [
      'POST',
      '/',
      `AccessKeyId=${accessKeyId}&Action=${action}&Format=JSON&Region=${region}&SignatureMethod=HMAC-SHA1&SignatureNonce=${Date.now()}&SignatureVersion=1.0&Timestamp=${encodeURIComponent(timestamp)}&Version=${version}`
    ].join('\n');

    // 计算签名
    const signature = this.calculateSignature('POST', '/', params, accessKeySecret);

    // 构造最终请求参数
    const queryString = `AccessKeyId=${accessKeyId}&Action=${action}&Format=JSON&Region=${region}&SignatureMethod=HMAC-SHA1&SignatureNonce=${Date.now()}&SignatureVersion=1.0&Timestamp=${encodeURIComponent(timestamp)}&Version=${version}&Signature=${encodeURIComponent(signature)}`;

    wx.request({
      url: `https://${endpoint}/?${queryString}`,
      method: 'POST',
      header: {
        'Content-Type': 'application/json'
      },
      data: {
        Image: base64Data,
        Probability: 'true',
        UpperBound: 0.8,
        LowerBound: 0.2
      },
      success: (res) => {
        wx.hideLoading();
        console.log('Aliyun OCR response:', res.data);
        if (res.data && res.data.Data && res.data.Data.Regions) {
          const regions = res.data.Data.Regions;
          let text = '';
          regions.forEach(region => {
            region.Lines.forEach(line => {
              text += line.Text + '\n';
            });
          });
          this.parseRecognizedText(text);
        } else if (res.data && res.data.Message) {
          wx.showToast({
            title: res.data.Message || '识别失败',
            icon: 'none'
          });
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

  // 计算阿里云签名
  calculateSignature(method, path, params, secret) {
    const stringToSign = [method.toUpperCase(), path, params].join('\n');
    return this.hmacSHA1Base64(stringToSign, secret);
  },

  // HMAC-SHA1 加密 (正确实现)
  hmacSHA1Base64(stringToSign, secret) {
    const key = this.strToUTF8(secret);
    const data = this.strToUTF8(stringToSign);
    const keyLen = 64;
    const oKeyPad = new Array(keyLen + 1).join(String.fromCharCode(0x5c));
    const iKeyPad = new Array(keyLen + 1).join(String.fromCharCode(0x36));

    // 如果key超过64字节，用SHA1 hash
    let realKey = key;
    if (key.length > keyLen) {
      realKey = this.sha1Hash(key);
    }
    while (realKey.length < keyLen) {
      realKey.push(0);
    }

    for (let i = 0; i < keyLen; i++) {
      oKeyPad[i] = String.fromCharCode(realKey[i] ^ oKeyPad.charCodeAt(i));
      iKeyPad[i] = String.fromCharCode(realKey[i] ^ iKeyPad.charCodeAt(i));
    }

    const innerData = iKeyPad + stringToSign;
    const innerHash = this.sha1Hash(this.strToUTF8(innerData));
    const outerData = oKeyPad + this.utf8ToStr(innerHash);
    const outerHash = this.sha1Hash(this.strToUTF8(outerData));

    return this.base64Encode(this.utf8ToStr(outerHash));
  },

  strToUTF8(str) {
    const result = [];
    for (let i = 0; i < str.length; i++) {
      const code = str.charCodeAt(i);
      if (code < 0x80) {
        result.push(code);
      } else if (code < 0x800) {
        result.push(0xc0 | (code >> 6));
        result.push(0x80 | (code & 0x3f));
      } else if (code < 0x10000) {
        result.push(0xe0 | (code >> 12));
        result.push(0x80 | ((code >> 6) & 0x3f));
        result.push(0x80 | (code & 0x3f));
      }
    }
    return result;
  },

  utf8ToStr(arr) {
    let result = '';
    for (let i = 0; i < arr.length; i++) {
      result += String.fromCharCode(arr[i]);
    }
    return result;
  },

  sha1Hash(data) {
    // SHA1 正确实现
    const bytes = data instanceof Array ? data : this.strToUTF8(data);
    const h = [0x67452301, 0xEFCDAB89, 0x98BADCFE, 0x10325476, 0xC3D2E1F0];

    // 填充
    const bitLen = bytes.length * 8;
    bytes.push(0x80);
    while ((bytes.length % 64) !== 56) {
      bytes.push(0);
    }
    bytes.push((bitLen >>> 24) & 0xff);
    bytes.push((bitLen >> 16) & 0xff);
    bytes.push((bitLen >> 8) & 0xff);
    bytes.push(bitLen & 0xff);

    // 处理每个512位块
    for (let chunk = 0; chunk < bytes.length; chunk += 64) {
      const w = [];
      for (let i = 0; i < 16; i++) {
        w[i] = (bytes[chunk + i * 4] << 24) | (bytes[chunk + i * 4 + 1] << 16) |
               (bytes[chunk + i * 4 + 2] << 8) | bytes[chunk + i * 4 + 3];
      }
      for (let i = 16; i < 80; i++) {
        w[i] = this.rotl(w[i-3] ^ w[i-8] ^ w[i-14] ^ w[i-16], 1);
      }

      let [a, b, c, d, e] = h;

      for (let i = 0; i < 80; i++) {
        let f, k;
        if (i < 20) {
          f = (b & c) | ((~b) & d);
          k = 0x5A827999;
        } else if (i < 40) {
          f = b ^ c ^ d;
          k = 0x6ED9EBA1;
        } else if (i < 60) {
          f = (b & c) | (b & d) | (c & d);
          k = 0x8F1BBCDC;
        } else {
          f = b ^ c ^ d;
          k = 0xCA62C1D6;
        }

        const temp = (this.rotl(a, 5) + f + e + k + w[i]) >>> 0;
        e = d;
        d = c;
        c = this.rotl(b, 30);
        b = a;
        a = temp;
      }

      h[0] = (h[0] + a) >>> 0;
      h[1] = (h[1] + b) >>> 0;
      h[2] = (h[2] + c) >>> 0;
      h[3] = (h[3] + d) >>> 0;
      h[4] = (h[4] + e) >>> 0;
    }

    return [
      (h[0] >> 24) & 0xff, (h[0] >> 16) & 0xff, (h[0] >> 8) & 0xff, h[0] & 0xff,
      (h[1] >> 24) & 0xff, (h[1] >> 16) & 0xff, (h[1] >> 8) & 0xff, h[1] & 0xff,
      (h[2] >> 24) & 0xff, (h[2] >> 16) & 0xff, (h[2] >> 8) & 0xff, h[2] & 0xff,
      (h[3] >> 24) & 0xff, (h[3] >> 16) & 0xff, (h[3] >> 8) & 0xff, h[3] & 0xff,
      (h[4] >> 24) & 0xff, (h[4] >> 16) & 0xff, (h[4] >> 8) & 0xff, h[4] & 0xff
    ];
  },

  rotl(n, s) {
    return ((n << s) | (n >>> (32 - s))) >>> 0;
  },

  base64Encode(str) {
    const base64Chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
    const bytes = this.strToUTF8(str);
    let result = '';
    for (let i = 0; i < bytes.length; i += 3) {
      const b1 = bytes[i];
      const b2 = i + 1 < bytes.length ? bytes[i + 1] : 0;
      const b3 = i + 2 < bytes.length ? bytes[i + 2] : 0;
      result += base64Chars.charAt(b1 >> 2);
      result += base64Chars.charAt(((b1 & 0x3) << 4) | (b2 >> 4));
      result += i + 1 < bytes.length ? base64Chars.charAt(((b2 & 0xf) << 2) | (b3 >> 6)) : '=';
      result += i + 2 < bytes.length ? base64Chars.charAt(b3 & 0x3f) : '=';
    }
    return result;
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
