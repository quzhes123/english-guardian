const app = getApp();
const vocabulary = require('../../data/vocabulary.js');

Page({
  data: {
    testStarted: false,
    testFinished: false,
    testMode: '',
    currentIndex: 0,
    totalCount: 10,
    currentQuestion: {},
    options: [],
    selectedOption: -1,
    userAnswer: '',
    answered: false,
    isCorrect: false,
    correctCount: 0,
    questions: []
  },

  startTest(e) {
    const mode = e.currentTarget.dataset.mode;
    const questions = this.generateQuestions(mode, 10);
    
    this.setData({
      testStarted: true,
      testFinished: false,
      testMode: mode,
      currentIndex: 0,
      totalCount: questions.length,
      questions,
      correctCount: 0,
      currentQuestion: questions[0],
      answered: false,
      selectedOption: -1,
      userAnswer: ''
    });
  },

  generateQuestions(mode, count) {
    const questions = [];
    const words = [...vocabulary].sort(() => Math.random() - 0.5).slice(0, count);
    
    words.forEach(word => {
      if (mode === 'word2meaning') {
        // 生成干扰选项
        const otherWords = vocabulary.filter(w => w.id !== word.id);
        const shuffled = otherWords.sort(() => Math.random() - 0.5).slice(0, 3);
        const options = [word.meaning, ...shuffled.map(w => w.meaning)].sort(() => Math.random() - 0.5);
        
        questions.push({
          word: word.word,
          meaning: word.meaning,
          correctAnswer: word.meaning,
          options
        });
      } else if (mode === 'meaning2word') {
        questions.push({
          word: word.word,
          meaning: word.meaning,
          correctAnswer: word.word
        });
      } else {
        // mixed mode
        if (Math.random() > 0.5) {
          const otherWords = vocabulary.filter(w => w.id !== word.id);
          const shuffled = otherWords.sort(() => Math.random() - 0.5).slice(0, 3);
          const options = [word.meaning, ...shuffled.map(w => w.meaning)].sort(() => Math.random() - 0.5);
          questions.push({
            word: word.word,
            meaning: word.meaning,
            correctAnswer: word.meaning,
            options,
            type: 'choice'
          });
        } else {
          questions.push({
            word: word.word,
            meaning: word.meaning,
            correctAnswer: word.word,
            type: 'input'
          });
        }
      }
    });
    
    return questions;
  },

  selectOption(e) {
    if (this.data.answered) return;
    
    const index = e.currentTarget.dataset.index;
    const question = this.data.currentQuestion;
    const selected = question.options[index];
    const isCorrect = selected === question.correctAnswer;
    
    this.setData({
      selectedOption: index,
      answered: true,
      isCorrect,
      correctCount: this.data.correctCount + (isCorrect ? 1 : 0)
    });
  },

  onAnswerInput(e) {
    this.setData({
      userAnswer: e.detail.value
    });
  },

  submitAnswer() {
    const answer = this.data.userAnswer.trim().toLowerCase();
    const correct = this.data.currentQuestion.correctAnswer.toLowerCase();
    const isCorrect = answer === correct;
    
    this.setData({
      answered: true,
      isCorrect,
      correctCount: this.data.correctCount + (isCorrect ? 1 : 0)
    });
  },

  nextQuestion() {
    const nextIndex = this.data.currentIndex + 1;
    
    if (nextIndex >= this.data.totalCount) {
      this.setData({
        testFinished: true
      });
    } else {
      this.setData({
        currentIndex: nextIndex,
        currentQuestion: this.data.questions[nextIndex],
        answered: false,
        selectedOption: -1,
        userAnswer: ''
      });
    }
  },

  retryTest() {
    this.setData({
      testStarted: false,
      testFinished: false
    });
  },

  goBackHome() {
    wx.reLaunch({
      url: '/pages/index/index'
    });
  }
});
