/**
 * audio.js — 音效系统
 *
 * 使用真实音频文件。命中/失误音效预加载为 AudioBuffer 实现低延迟播放。
 * 连击、单词完成、按钮音效保留程序合成。
 */
var AudioSystem = (function() {
  'use strict';

  var ctx = null;
  var masterGain = null;
  var volume = 0.8;
  var buffers = {};        // 预加载的音频缓存
  var initialized = false;

  // 音频文件配置
  var SOUND_FILES = {
    slashHit:  'assets/sounds/slash-hit.mp4',     // 正确命中 — 刀剑斜劈
    slashMiss: 'assets/sounds/sword-clash.mp3'     // 错误命中 — 刀剑碰撞
  };

  /**
   * 初始化 Web Audio API
   */
  function init() {
    if (initialized) return;
    try {
      var AudioContext = window.AudioContext || window.webkitAudioContext;
      if (!AudioContext) { console.warn('Web Audio API not supported'); return; }
      ctx = new AudioContext();
      masterGain = ctx.createGain();
      masterGain.connect(ctx.destination);
      masterGain.gain.value = volume;
      initialized = true;
      // 预加载所有音效
      loadAllSounds();
    } catch (e) {
      console.warn('Audio init failed: ' + e.message);
    }
  }

  /**
   * 预加载所有音效文件到 AudioBuffer
   */
  function loadAllSounds() {
    Object.keys(SOUND_FILES).forEach(function(key) {
      loadSound(key, SOUND_FILES[key]);
    });
  }

  function loadSound(key, url) {
    fetch(url)
      .then(function(response) {
        if (!response.ok) throw new Error('HTTP ' + response.status);
        return response.arrayBuffer();
      })
      .then(function(arrayBuffer) {
        return ctx.decodeAudioData(arrayBuffer);
      })
      .then(function(audioBuffer) {
        buffers[key] = audioBuffer;
        console.log('Sound loaded: ' + key + ' (' + audioBuffer.duration.toFixed(2) + 's)');
      })
      .catch(function(err) {
        console.warn('Failed to load sound ' + key + ': ' + err.message);
      });
  }

  /**
   * 播放预加载的音效
   */
  function playBuffer(key) {
    if (!ctx || !buffers[key]) return false;
    ensureResumed();

    var source = ctx.createBufferSource();
    source.buffer = buffers[key];

    var gainNode = ctx.createGain();
    gainNode.gain.value = volume;

    source.connect(gainNode);
    gainNode.connect(masterGain);
    source.start(0);
    return true;
  }

  /**
   * 使用 HTML5 Audio 回退播放 (用于未预载的文件)
   */
  function playFile(url) {
    var audio = new Audio(url);
    audio.volume = volume;
    audio.play().catch(function(e) {
      console.warn('Audio play failed: ' + e.message);
    });
  }

  function setVolume(vol) {
    volume = Utils.clamp(vol, 0, 1);
    if (masterGain) masterGain.gain.value = volume;
  }

  function ensureResumed() {
    if (ctx && ctx.state === 'suspended') ctx.resume();
  }

  /* ================================================================
   * 游戏音效
   * ================================================================ */

  /** 正确命中 — 刀剑斜劈命中声 */
  function playSlashHit() {
    if (!playBuffer('slashHit')) {
      // 回退：直接播放文件
      playFile(SOUND_FILES.slashHit);
    }
  }

  /** 错误命中 — 刀剑碰撞声 */
  function playSlashMiss() {
    if (!playBuffer('slashMiss')) {
      playFile(SOUND_FILES.slashMiss);
    }
  }

  /** 连击里程碑 — 程序合成 (保留) */
  function playComboMilestone() {
    if (!ctx) return;
    ensureResumed();
    var now = ctx.currentTime;
    var notes = [523, 659, 784, 1047];
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

  /** 单词完成 — 程序合成 (保留) */
  function playWordComplete() {
    if (!ctx) return;
    ensureResumed();
    var now = ctx.currentTime;
    var notes = [392, 523, 659, 784];
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

  /** 按钮点击 — 程序合成 (保留) */
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

  /** 初始化触发器 */
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
