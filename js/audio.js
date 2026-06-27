/**
 * audio.js — 音效系统
 *
 * 使用 Web Audio API 程序化生成音效 (无需下载音频文件)。
 * 后续可替换为真实音频文件。
 */
var AudioSystem = (function() {
  'use strict';

  var ctx = null;
  var masterGain = null;
  var volume = 0.8;
  var initialized = false;

  /**
   * 初始化 (必须在用户交互后调用 — 浏览器自动播放策略)
   */
  function init() {
    if (initialized) return;

    try {
      var AudioContext = window.AudioContext || window.webkitAudioContext;
      if (!AudioContext) {
        console.warn('Web Audio API not supported');
        return;
      }
      ctx = new AudioContext();
      masterGain = ctx.createGain();
      masterGain.connect(ctx.destination);
      masterGain.gain.value = volume;
      initialized = true;
    } catch (e) {
      console.warn('Audio init failed: ' + e.message);
    }
  }

  /**
   * 设置主音量
   */
  function setVolume(vol) {
    volume = Utils.clamp(vol, 0, 1);
    if (masterGain) {
      masterGain.gain.value = volume;
    }
  }

  /**
   * 确保 AudioContext 处于活跃状态
   */
  function ensureResumed() {
    if (ctx && ctx.state === 'suspended') {
      ctx.resume();
    }
  }

  /**
   * 弹刀命中音效 — 金属碰撞声
   */
  function playSlashHit() {
    if (!ctx) return;
    ensureResumed();

    var now = ctx.currentTime;

    // 主音 — 高频金属撞击
    var osc1 = ctx.createOscillator();
    var gain1 = ctx.createGain();
    osc1.type = 'square';
    osc1.frequency.setValueAtTime(800, now);
    osc1.frequency.exponentialRampToValueAtTime(200, now + 0.15);
    gain1.gain.setValueAtTime(0.3, now);
    gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.2);
    osc1.connect(gain1);
    gain1.connect(masterGain);
    osc1.start(now);
    osc1.stop(now + 0.2);

    // 谐波 — 增加锐利感
    var osc2 = ctx.createOscillator();
    var gain2 = ctx.createGain();
    osc2.type = 'sawtooth';
    osc2.frequency.setValueAtTime(1200, now);
    osc2.frequency.exponentialRampToValueAtTime(100, now + 0.1);
    gain2.gain.setValueAtTime(0.15, now);
    gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.15);
    osc2.connect(gain2);
    gain2.connect(masterGain);
    osc2.start(now);
    osc2.stop(now + 0.15);

    // 噪声 — 金属质感
    playNoise(0.08, 0.12, now);
  }

  /**
   * 弹刀失误音效 — 挥空声
   */
  function playSlashMiss() {
    if (!ctx) return;
    ensureResumed();

    var now = ctx.currentTime;

    // 低频"嗖"声
    var osc = ctx.createOscillator();
    var gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(300, now);
    osc.frequency.exponentialRampToValueAtTime(80, now + 0.3);
    gain.gain.setValueAtTime(0.2, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
    osc.connect(gain);
    gain.connect(masterGain);
    osc.start(now);
    osc.stop(now + 0.35);

    // 噪音 — 布料/风声
    playNoise(0.06, 0.25, now);
  }

  /**
   * 连击里程碑音效
   */
  function playComboMilestone() {
    if (!ctx) return;
    ensureResumed();

    var now = ctx.currentTime;

    // 上升音阶
    var notes = [523, 659, 784, 1047]; // C5 E5 G5 C6
    notes.forEach(function(freq, i) {
      var osc = ctx.createOscillator();
      var gain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.value = freq;
      var t = now + i * 0.08;
      gain.gain.setValueAtTime(0.2, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.2);
      osc.connect(gain);
      gain.connect(masterGain);
      osc.start(t);
      osc.stop(t + 0.2);
    });
  }

  /**
   * 单词完成音效
   */
  function playWordComplete() {
    if (!ctx) return;
    ensureResumed();

    var now = ctx.currentTime;

    // 胜利音阶
    var notes = [392, 523, 659, 784]; // G4 C5 E5 G5
    notes.forEach(function(freq, i) {
      var osc = ctx.createOscillator();
      var gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.value = freq;
      var t = now + i * 0.12;
      gain.gain.setValueAtTime(0.25, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.35);
      osc.connect(gain);
      gain.connect(masterGain);
      osc.start(t);
      osc.stop(t + 0.35);
    });
  }

  /**
   * 按钮点击音效
   */
  function playButtonClick() {
    if (!ctx) return;
    ensureResumed();

    var now = ctx.currentTime;

    var osc = ctx.createOscillator();
    var gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.value = 600;
    gain.gain.setValueAtTime(0.1, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);
    osc.connect(gain);
    gain.connect(masterGain);
    osc.start(now);
    osc.stop(now + 0.05);
  }

  /**
   * 生成短噪声脉冲 (用于增加打击感)
   */
  function playNoise(gainLevel, duration, startTime) {
    var bufferSize = ctx.sampleRate * duration;
    var buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    var data = buffer.getChannelData(0);
    for (var i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * (1 - i / bufferSize);
    }
    var source = ctx.createBufferSource();
    source.buffer = buffer;

    var bandpass = ctx.createBiquadFilter();
    bandpass.type = 'bandpass';
    bandpass.frequency.value = 2000;
    bandpass.Q.value = 0.5;

    var gain = ctx.createGain();
    gain.gain.setValueAtTime(gainLevel, startTime);
    gain.gain.exponentialRampToValueAtTime(0.001, startTime + duration);

    source.connect(bandpass);
    bandpass.connect(gain);
    gain.connect(masterGain);
    source.start(startTime);
    source.stop(startTime + duration);
  }

  // 初始化 — 首次用户交互时
  function setupAutoInit() {
    var events = ['click', 'touchstart', 'keydown'];
    function handler() {
      init();
      events.forEach(function(e) {
        document.removeEventListener(e, handler);
      });
    }
    events.forEach(function(e) {
      document.addEventListener(e, handler, { once: true });
    });
  }

  // 公开 API
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
