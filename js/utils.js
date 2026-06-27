/**
 * utils.js — 通用数学工具函数
 */
var Utils = (function() {
  'use strict';

  /**
   * 生成 [min, max] 范围内的随机数
   */
  function randomRange(min, max) {
    return min + Math.random() * (max - min);
  }

  /**
   * 生成 [min, max] 范围内的随机整数
   */
  function randomInt(min, max) {
    return Math.floor(randomRange(min, max + 1));
  }

  /**
   * 线性插值 (lerp)
   */
  function lerp(a, b, t) {
    return a + (b - a) * t;
  }

  /**
   * 将值限制在 [min, max] 范围内
   */
  function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
  }

  /**
   * 随机打乱数组 (Fisher-Yates)
   */
  function shuffle(arr) {
    var result = arr.slice();
    for (var i = result.length - 1; i > 0; i--) {
      var j = Math.floor(Math.random() * (i + 1));
      var temp = result[i];
      result[i] = result[j];
      result[j] = temp;
    }
    return result;
  }

  /**
   * 从数组中随机取一个元素
   */
  function randomPick(arr) {
    return arr[Math.floor(Math.random() * arr.length)];
  }

  /**
   * 两点之间的距离
   */
  function distance(x1, y1, x2, y2) {
    var dx = x2 - x1;
    var dy = y2 - y1;
    return Math.sqrt(dx * dx + dy * dy);
  }

  /**
   * 角度转弧度
   */
  function degToRad(deg) {
    return deg * Math.PI / 180;
  }

  /**
   * 弧度转角度
   */
  function radToDeg(rad) {
    return rad * 180 / Math.PI;
  }

  /**
   * 生成 UUID (简化版)
   */
  function generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2, 9);
  }

  // 公开 API
  return {
    randomRange: randomRange,
    randomInt: randomInt,
    lerp: lerp,
    clamp: clamp,
    shuffle: shuffle,
    randomPick: randomPick,
    distance: distance,
    degToRad: degToRad,
    radToDeg: radToDeg,
    generateId: generateId
  };
})();
