/**
 * audio.js — 音效系统
 *
 * 使用 HTML5 Audio 播放真实音效文件，兼容 MP3/MP4。
 * 每个音效预创建 Audio 实例实现低延迟播放。
 */
var AudioSystem = (function() {
  'use strict';

  var volume = 0.8;
  var sounds = {};

  // 音效文件配置
  var SOUND_FILES = {
    slashHit:  'assets/sounds/slash-hit.mp3',
    slashMiss: 'assets/sounds/sword-clash.mp3'
  };

  /**
   * 预创建 Audio 实例
   */
  function init() {
    Object.keys(SOUND_FILES).forEach(function(key) {
      var audio = new Audio(SOUND_FILES[key]);
      audio.preload = 'auto';
      audio.volume = volume;
      sounds[key] = audio;
      console.log('Sound ready: ' + key);
    });
  }

  function setVolume(vol) {
    volume = Utils.clamp(vol, 0, 1);
    Object.keys(sounds).forEach(function(key) {
      sounds[key].volume = volume;
    });
  }

  /**
   * 播放音效 (克隆 Audio 实现重叠播放)
   */
  function playSound(key) {
    var src = sounds[key];
    if (!src) return;

    // 克隆节点实现快速重播
    var clone = src.cloneNode();
    clone.volume = volume;
    clone.play().catch(function(e) {
      console.warn('Sound ' + key + ' play failed: ' + e.message);
    });
  }

  /* ================================================================
   * 游戏音效
   * ================================================================ */

  function playSlashHit()  { playSound('slashHit'); }
  function playSlashMiss() { playSound('slashMiss'); }

  /** 连击里程碑 — Web Audio 合成 */
  function playComboMilestone() {
    try {
      var AudioContext = window.AudioContext || window.webkitAudioContext;
      if (!AudioContext) return;
      var ctx = new AudioContext();
      var gain = ctx.createGain();
      gain.gain.value = volume * 0.3;
      gain.connect(ctx.destination);
      var now = ctx.currentTime;
      var notes = [523, 659, 784, 1047];
      notes.forEach(function(freq, i) {
        var osc = ctx.createOscillator();
        var g = ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.value = freq;
        var t = now + i * 0.08;
        g.gain.setValueAtTime(0.15, t);
        g.gain.exponentialRampToValueAtTime(0.001, t + 0.2);
        osc.connect(g);
        g.connect(gain);
        osc.start(t);
        osc.stop(t + 0.2);
      });
    } catch(e) {}
  }

  /** 单词完成 */
  function playWordComplete() {
    try {
      var AudioContext = window.AudioContext || window.webkitAudioContext;
      if (!AudioContext) return;
      var ctx = new AudioContext();
      var gain = ctx.createGain();
      gain.gain.value = volume * 0.3;
      gain.connect(ctx.destination);
      var now = ctx.currentTime;
      var notes = [392, 523, 659, 784];
      notes.forEach(function(freq, i) {
        var osc = ctx.createOscillator();
        var g = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.value = freq;
        var t = now + i * 0.12;
        g.gain.setValueAtTime(0.2, t);
        g.gain.exponentialRampToValueAtTime(0.001, t + 0.35);
        osc.connect(g);
        g.connect(gain);
        osc.start(t);
        osc.stop(t + 0.35);
      });
    } catch(e) {}
  }

  /** 按钮点击 */
  function playButtonClick() {
    try {
      var AudioContext = window.AudioContext || window.webkitAudioContext;
      if (!AudioContext) return;
      var ctx = new AudioContext();
      var osc = ctx.createOscillator();
      var gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.value = 600;
      gain.gain.setValueAtTime(0.1 * volume, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.05);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.05);
    } catch(e) {}
  }

  function setupAutoInit() {
    // HTML5 Audio 不需要用户交互即可预加载
    init();
    // 但如果浏览器限制了自动播放，在首次交互时 warm up
    var events = ['click', 'touchstart', 'keydown'];
    function warmup() {
      Object.keys(sounds).forEach(function(key) {
        var a = sounds[key];
        // 静默播放一下解除限制
        a.volume = 0;
        a.play().then(function() {
          a.pause();
          a.currentTime = 0;
          a.volume = volume;
        }).catch(function() {});
      });
      events.forEach(function(e) { document.removeEventListener(e, warmup); });
    }
    events.forEach(function(e) { document.addEventListener(e, warmup, { once: true }); });
  }

  return {
    init: init,
    setupAutoInit: setupAutoInit,
    setVolume: setVolume,
    playSlashHit: playSlashHit,
    playSlashMiss: playSlashMiss,
    playComboMilestone: playComboMilestone,
    playWordComplete: playWordComplete,
    playButtonClick: playButtonClick
  };
})();
