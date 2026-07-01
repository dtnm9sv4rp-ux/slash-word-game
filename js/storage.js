/**
 * storage.js — localStorage 持久化封装
 *
 * 所有游戏数据通过这里读写 localStorage。
 * 键名统一使用 'slashgame_' 前缀避免冲突。
 */
var Storage = (function() {
  'use strict';

  var PREFIX = 'slashgame_';
  var KEYS = {
    settings: PREFIX + 'settings',
    wordbank: PREFIX + 'wordbank',
    scores: PREFIX + 'scores',
    unlocks: PREFIX + 'unlocks',
    errorWords: PREFIX + 'error_words',
    progress: PREFIX + 'progress',
    daily: PREFIX + 'daily'
  };

  /** 默认设置 */
  var DEFAULT_SETTINGS = {
    knifeSpeed: 1.0,
    groupSize: 2,
    sfxVolume: 0.8,
    difficulty: 'medium',
    activeSkin: 'default',
    activeTrail: 'default',
    firstTime: true
  };

  /** 默认积分数据 */
  var DEFAULT_SCORES = {
    totalPoints: 0,
    totalWordsCleared: 0,
    totalHits: 0,
    totalMisses: 0,
    bestCombo: 0,
    bestHitRate: 0,
    gamesPlayed: 0,
    lastGame: null
  };

  /** 默认解锁数据 */
  var DEFAULT_UNLOCKS = {
    coins: 0,
    unlockedSkins: ['default'],
    unlockedTrails: ['default'],
    activeSkin: 'default',
    activeTrail: 'default'
  };

  /**
   * 安全读写 localStorage
   */
  function readJSON(key, defaultValue) {
    try {
      var raw = localStorage.getItem(key);
      if (raw === null) return defaultValue;
      return JSON.parse(raw);
    } catch (e) {
      console.warn('Storage read error for ' + key + ': ' + e.message);
      return defaultValue;
    }
  }

  function writeJSON(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
      return true;
    } catch (e) {
      console.warn('Storage write error for ' + key + ': ' + e.message);
      return false;
    }
  }

  // ===== Settings =====

  function loadSettings() {
    return readJSON(KEYS.settings, DEFAULT_SETTINGS);
  }

  function saveSettings(settings) {
    return writeJSON(KEYS.settings, settings);
  }

  // ===== Word Bank =====

  function loadWordBank() {
    return readJSON(KEYS.wordbank, null);
  }

  function saveWordBank(wordbank) {
    return writeJSON(KEYS.wordbank, wordbank);
  }

  // ===== Scores =====

  function loadScores() {
    return readJSON(KEYS.scores, DEFAULT_SCORES);
  }

  function saveScores(scores) {
    return writeJSON(KEYS.scores, scores);
  }

  // ===== Unlocks =====

  function loadUnlocks() {
    return readJSON(KEYS.unlocks, DEFAULT_UNLOCKS);
  }

  function saveUnlocks(unlocks) {
    return writeJSON(KEYS.unlocks, unlocks);
  }

  // ===== Error Words =====

  function loadErrorWords() {
    return readJSON(KEYS.errorWords, []);
  }

  function saveErrorWords(words) {
    return writeJSON(KEYS.errorWords, words);
  }

  // ===== Progress (词库学习进度) =====

  function loadProgress() {
    return readJSON(KEYS.progress, {});
  }

  function saveProgress(progress) {
    return writeJSON(KEYS.progress, progress);
  }

  /**
   * 更新单个单词的学习进度
   * @param {string} bank - 'cet4' | 'cet6' | 'custom'
   * @param {string} wordId - 单词ID
   * @param {boolean} correct - 是否答对
   */
  function updateWordProgress(bank, wordId, correct) {
    var progress = loadProgress();
    if (!progress[bank]) progress[bank] = {};

    var wp = progress[bank][wordId] || {
      status: 'new',
      correctCount: 0,
      wrongCount: 0,
      lastSeen: null,
      nextReview: null
    };

    if (correct) {
      wp.correctCount++;
      if (wp.status === 'new') wp.status = 'learning';
      if (wp.correctCount >= 3) wp.status = 'mastered';
    } else {
      wp.wrongCount++;
      if (wp.status === 'mastered') wp.status = 'learning';
    }

    wp.lastSeen = Date.now();
    // 简单间隔复习: 1天/3天/7天
    var intervals = [86400000, 259200000, 604800000];
    var idx = Math.min(wp.correctCount, intervals.length - 1);
    wp.nextReview = Date.now() + intervals[idx];

    progress[bank][wordId] = wp;
    saveProgress(progress);
  }

  /**
   * 获取词库中还需学习的单词ID列表
   */
  function getDueWords(bank, wordBank) {
    var progress = loadProgress();
    var bankProgress = progress[bank] || {};
    var now = Date.now();
    var due = [];
    var newWords = [];

    for (var i = 0; i < wordBank.length; i++) {
      var wid = wordBank[i].id;
      var wp = bankProgress[wid];
      if (!wp || wp.status === 'new') {
        newWords.push(wid);
      } else if (wp.nextReview && wp.nextReview <= now) {
        due.push(wid);
      }
    }

    // 优先复习到期词汇，然后新词
    return due.concat(newWords);
  }

  /**
   * 获取今日学习统计
   */
  function getDailyStats(bank) {
    var daily = readJSON(KEYS.daily, {});
    var today = new Date().toDateString();
    if (!daily.date || daily.date !== today || daily.bank !== bank) {
      return { date: today, bank: bank, learned: 0, target: 20 };
    }
    return daily;
  }

  function saveDailyStats(stats) {
    return writeJSON(KEYS.daily, stats);
  }

  // ===== Word Bank =====

  function loadWordBank() {
    return readJSON(KEYS.wordbank, null);
  }

  function saveWordBank(wordbank) {
    return writeJSON(KEYS.wordbank, wordbank);
  }

  // ===== Scores =====

  function loadScores() {
    return readJSON(KEYS.scores, DEFAULT_SCORES);
  }

  function saveScores(scores) {
    return writeJSON(KEYS.scores, scores);
  }

  // ===== Unlocks =====

  function loadUnlocks() {
    return readJSON(KEYS.unlocks, DEFAULT_UNLOCKS);
  }

  function saveUnlocks(unlocks) {
    return writeJSON(KEYS.unlocks, unlocks);
  }

  // ===== Error Words =====

  function loadErrorWords() {
    return readJSON(KEYS.errorWords, []);
  }

  function saveErrorWords(words) {
    return writeJSON(KEYS.errorWords, words);
  }

  /**
   * 清除所有游戏数据
   */
  function clearAll() {
    Object.keys(KEYS).forEach(function(k) {
      localStorage.removeItem(KEYS[k]);
    });
  }

  // 公开 API
  return {
    loadSettings: loadSettings,
    saveSettings: saveSettings,
    loadWordBank: loadWordBank,
    saveWordBank: saveWordBank,
    loadScores: loadScores,
    saveScores: saveScores,
    loadUnlocks: loadUnlocks,
    saveUnlocks: saveUnlocks,
    loadErrorWords: loadErrorWords,
    saveErrorWords: saveErrorWords,
    loadProgress: loadProgress,
    saveProgress: saveProgress,
    updateWordProgress: updateWordProgress,
    getDueWords: getDueWords,
    getDailyStats: getDailyStats,
    saveDailyStats: saveDailyStats,
    clearAll: clearAll
  };
})();
