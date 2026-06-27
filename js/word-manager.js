/**
 * word-manager.js — 词库管理系统
 *
 * 管理内置词库和用户词库，提供单词选取、进度追踪等功能。
 * 内置 40 个常用英文单词作为试玩词库。
 */
var WordManager = (function() {
  'use strict';

  /** 内置默认词库 */
  var DEFAULT_WORDS = [
    { word: 'apple', definition: '苹果', difficulty: 1 },
    { word: 'brave', definition: '勇敢的', difficulty: 1 },
    { word: 'cloud', definition: '云', difficulty: 1 },
    { word: 'dance', definition: '跳舞', difficulty: 1 },
    { word: 'eagle', definition: '鹰', difficulty: 1 },
    { word: 'flame', definition: '火焰', difficulty: 1 },
    { word: 'grape', definition: '葡萄', difficulty: 1 },
    { word: 'horse', definition: '马', difficulty: 2 },
    { word: 'island', definition: '岛屿', difficulty: 2 },
    { word: 'jungle', definition: '丛林', difficulty: 2 },
    { word: 'knife', definition: '刀', difficulty: 2 },
    { word: 'lemon', definition: '柠檬', difficulty: 2 },
    { word: 'magic', definition: '魔法', difficulty: 1 },
    { word: 'noble', definition: '高贵的', difficulty: 2 },
    { word: 'ocean', definition: '海洋', difficulty: 1 },
    { word: 'peace', definition: '和平', difficulty: 2 },
    { word: 'queen', definition: '女王', difficulty: 1 },
    { word: 'river', definition: '河流', difficulty: 1 },
    { word: 'storm', definition: '暴风雨', difficulty: 2 },
    { word: 'tiger', definition: '老虎', difficulty: 1 },
    { word: 'uncle', definition: '叔叔', difficulty: 1 },
    { word: 'voice', definition: '声音', difficulty: 2 },
    { word: 'whale', definition: '鲸鱼', difficulty: 2 },
    { word: 'youth', definition: '青春', difficulty: 2 },
    { word: 'zebra', definition: '斑马', difficulty: 2 },
    { word: 'bridge', definition: '桥', difficulty: 2 },
    { word: 'castle', definition: '城堡', difficulty: 2 },
    { word: 'desert', definition: '沙漠', difficulty: 2 },
    { word: 'engine', definition: '引擎', difficulty: 3 },
    { word: 'forest', definition: '森林', difficulty: 2 },
    { word: 'garden', definition: '花园', difficulty: 2 },
    { word: 'honest', definition: '诚实的', difficulty: 2 },
    { word: 'insect', definition: '昆虫', difficulty: 3 },
    { word: 'jacket', definition: '夹克', difficulty: 2 },
    { word: 'knight', definition: '骑士', difficulty: 3 },
    { word: 'market', definition: '市场', difficulty: 2 },
    { word: 'needle', definition: '针', difficulty: 3 },
    { word: 'orange', definition: '橙子', difficulty: 1 },
    { word: 'planet', definition: '行星', difficulty: 2 },
    { word: 'shadow', definition: '影子', difficulty: 3 }
  ];

  var wordBank = [];
  var currentWord = null;
  var currentLetterIndex = 0;
  var sessionWords = [];       // 本轮要背诵的单词 (打乱后的)
  var sessionWordIndex = 0;    // 当前在第几个单词
  var errorWords = [];         // 本轮出错的单词

  /**
   * 初始化词库 (从 localStorage 加载或使用默认)
   */
  function init() {
    // 尝试从 Storage 加载
    if (typeof Storage !== 'undefined' && Storage.loadWordBank) {
      var saved = Storage.loadWordBank();
      if (saved && saved.length > 0) {
        wordBank = saved;
      } else {
        wordBank = DEFAULT_WORDS.slice();
        saveWordBank();
      }
    } else {
      wordBank = DEFAULT_WORDS.slice();
    }
  }

  /**
   * 获取当前词库
   */
  function getWordBank() {
    return wordBank;
  }

  /**
   * 获取词库单词数量
   */
  function getWordCount() {
    return wordBank.length;
  }

  /**
   * 添加单词
   */
  function addWord(word, definition, difficulty) {
    difficulty = difficulty || 2;
    // 检查重复
    for (var i = 0; i < wordBank.length; i++) {
      if (wordBank[i].word.toLowerCase() === word.toLowerCase()) {
        return false; // 已存在
      }
    }

    if (wordBank.length >= CONFIG.MAX_WORD_BANK_SIZE) {
      return false; // 已达上限
    }

    wordBank.push({
      word: word.toLowerCase(),
      definition: definition,
      difficulty: difficulty
    });
    saveWordBank();
    return true;
  }

  /**
   * 删除单词
   */
  function removeWord(index) {
    if (index >= 0 && index < wordBank.length) {
      wordBank.splice(index, 1);
      saveWordBank();
      return true;
    }
    return false;
  }

  /**
   * 导入单词 (数组格式)
   */
  function importWords(words) {
    var added = 0;
    for (var i = 0; i < words.length; i++) {
      var w = words[i];
      if (w.word && w.definition && wordBank.length < CONFIG.MAX_WORD_BANK_SIZE) {
        if (addWord(w.word, w.definition, w.difficulty || 2)) {
          added++;
        }
      }
    }
    saveWordBank();
    return added;
  }

  /**
   * 重置为默认词库
   */
  function resetToDefault() {
    wordBank = DEFAULT_WORDS.slice();
    saveWordBank();
  }

  /**
   * 保存词库到 localStorage
   */
  function saveWordBank() {
    if (typeof Storage !== 'undefined' && Storage.saveWordBank) {
      Storage.saveWordBank(wordBank);
    }
  }

  /**
   * 开始一轮游戏 — 准备单词列表
   * @param {number} count - 本轮单词数
   */
  function prepareSession(count) {
    count = count || CONFIG.WORDS_PER_ROUND;
    // 从词库中随机选取
    var shuffled = Utils.shuffle(wordBank);
    sessionWords = shuffled.slice(0, Math.min(count, wordBank.length));
    sessionWordIndex = 0;
    errorWords = [];
  }

  /**
   * 获取下一个单词
   * @returns {object|null} 单词对象，或 null (本轮结束)
   */
  function getNextWord() {
    if (sessionWordIndex >= sessionWords.length) {
      return null; // 本轮结束
    }
    currentWord = sessionWords[sessionWordIndex];
    currentLetterIndex = 0;
    sessionWordIndex++;
    return currentWord;
  }

  /**
   * 获取当前单词
   */
  function getCurrentWord() {
    return currentWord;
  }

  /**
   * 获取当前需要的字母 (按顺序)
   * @returns {string|null}
   */
  function getTargetLetter() {
    if (!currentWord) return null;
    if (currentLetterIndex >= currentWord.word.length) return null;
    return currentWord.word[currentLetterIndex].toUpperCase();
  }

  /**
   * 获取当前单词还需拼写的字母
   */
  function getRemainingLetters() {
    if (!currentWord) return [];
    var word = currentWord.word.toUpperCase();
    return word.slice(currentLetterIndex).split('');
  }

  /**
   * 获取当前单词已正确的字母
   */
  function getCompletedLetters() {
    if (!currentWord) return [];
    var word = currentWord.word.toUpperCase();
    return word.slice(0, currentLetterIndex).split('');
  }

  /**
   * 检查字母是否匹配当前需要的字母
   * @param {string} letter
   * @returns {boolean}
   */
  function checkLetter(letter) {
    var target = getTargetLetter();
    return target && letter.toUpperCase() === target;
  }

  /**
   * 前进到下一个字母
   * @returns {boolean} true=单词完成
   */
  function advanceLetter() {
    currentLetterIndex++;
    if (currentLetterIndex >= currentWord.word.length) {
      return true; // 单词完成
    }
    return false;
  }

  /**
   * 记录错词
   */
  function recordError() {
    if (currentWord && errorWords.indexOf(currentWord) === -1) {
      errorWords.push(currentWord);
    }
  }

  /**
   * 获取本轮错词
   */
  function getErrorWords() {
    return errorWords;
  }

  /**
   * 获取本轮还剩多少单词
   */
  function getRemainingWordCount() {
    return sessionWords.length - sessionWordIndex;
  }

  /**
   * 获取本轮总单词数
   */
  function getTotalSessionWords() {
    return sessionWords.length;
  }

  /**
   * 获取当前字母索引 (用于 UI)
   */
  function getCurrentLetterIndex() {
    return currentLetterIndex;
  }

  /**
   * 导出词库为数组
   */
  function exportWords() {
    return wordBank;
  }

  // 公开 API
  return {
    init: init,
    getWordBank: getWordBank,
    getWordCount: getWordCount,
    addWord: addWord,
    removeWord: removeWord,
    importWords: importWords,
    resetToDefault: resetToDefault,
    prepareSession: prepareSession,
    getNextWord: getNextWord,
    getCurrentWord: getCurrentWord,
    getTargetLetter: getTargetLetter,
    getRemainingLetters: getRemainingLetters,
    getCompletedLetters: getCompletedLetters,
    checkLetter: checkLetter,
    advanceLetter: advanceLetter,
    recordError: recordError,
    getErrorWords: getErrorWords,
    getRemainingWordCount: getRemainingWordCount,
    getTotalSessionWords: getTotalSessionWords,
    getCurrentLetterIndex: getCurrentLetterIndex,
    exportWords: exportWords
  };
})();
