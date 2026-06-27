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
    errorWords: PREFIX + 'error_words'
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
    clearAll: clearAll
  };
})();
