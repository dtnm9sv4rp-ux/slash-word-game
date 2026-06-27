/**
 * scoring.js — 积分与统计系统
 *
 * 管理连击、命中率、积分计算、本局统计。
 */
var Scoring = (function() {
  'use strict';

  var combo = 0;
  var maxCombo = 0;
  var totalHits = 0;
  var totalMisses = 0;
  var sessionPoints = 0;
  var sessionWordsCleared = 0;

  /**
   * 重置本局数据
   */
  function resetSession() {
    combo = 0;
    maxCombo = 0;
    totalHits = 0;
    totalMisses = 0;
    sessionPoints = 0;
    sessionWordsCleared = 0;
  }

  /**
   * 记录一次命中
   */
  function recordHit() {
    totalHits++;
    combo++;
    if (combo > maxCombo) {
      maxCombo = combo;
    }
    return combo;
  }

  /**
   * 记录一次失误
   */
  function recordMiss() {
    totalMisses++;
    combo = 0;
  }

  /**
   * 单词完成时结算积分
   * @param {number} wordLength - 单词长度
   * @returns {number} 获得的积分
   */
  function awardWordComplete(wordLength) {
    sessionWordsCleared++;

    var basePoints = wordLength * CONFIG.POINTS_PER_LETTER;
    var comboBonus = Math.floor(basePoints * combo * CONFIG.COMBO_MULTIPLIER_STEP);
    var points = basePoints + comboBonus;

    sessionPoints += points;
    return points;
  }

  /**
   * 单词完成时获得金币
   * @returns {number}
   */
  function awardCoins() {
    var coins = CONFIG.COINS_PER_WORD;
    if (combo >= CONFIG.COMBO_MILESTONE_2) {
      coins += CONFIG.COINS_COMBO_BONUS * 2;
    } else if (combo >= CONFIG.COMBO_MILESTONE_1) {
      coins += CONFIG.COINS_COMBO_BONUS;
    }
    return coins;
  }

  /**
   * 获取命中率 (0-100)
   */
  function getHitRate() {
    var total = totalHits + totalMisses;
    if (total === 0) return 100;
    return Math.round((totalHits / total) * 100);
  }

  /**
   * 获取命中率浮点数 (0-1)
   */
  function getHitRateDecimal() {
    var total = totalHits + totalMisses;
    if (total === 0) return 1;
    return totalHits / total;
  }

  /**
   * 是否达到连击里程碑
   */
  function checkComboMilestone() {
    if (combo === CONFIG.COMBO_MILESTONE_1) return 1;
    if (combo === CONFIG.COMBO_MILESTONE_2) return 2;
    return 0;
  }

  /**
   * 获取本局统计摘要
   */
  function getSessionSummary() {
    return {
      wordsCleared: sessionWordsCleared,
      points: sessionPoints,
      hits: totalHits,
      misses: totalMisses,
      hitRate: getHitRate(),
      maxCombo: maxCombo
    };
  }

  /**
   * 获取实时组合数据
   */
  function getLiveStats() {
    return {
      combo: combo,
      hitRate: getHitRate(),
      points: sessionPoints
    };
  }

  // 公开 API
  return {
    resetSession: resetSession,
    recordHit: recordHit,
    recordMiss: recordMiss,
    awardWordComplete: awardWordComplete,
    awardCoins: awardCoins,
    getHitRate: getHitRate,
    getHitRateDecimal: getHitRateDecimal,
    checkComboMilestone: checkComboMilestone,
    getSessionSummary: getSessionSummary,
    getLiveStats: getLiveStats
  };
})();
