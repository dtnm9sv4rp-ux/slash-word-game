/**
 * game-loop.js — 竹林弹刀游戏主循环
 *
 * 竹子竖直排列，玩家按单词字母顺序斩击正确竹节。
 * 正确 → 竹子断裂，上半截下落；错误 → 金属碰撞 + 刀刃弹回。
 */
var GameLoop = (function() {
  'use strict';

  var canvas = null, ctx = null, animFrameId = null, lastTime = 0;
  var state = 'idle';
  var gs = null;

  /* ================================================================
   * Init / Start / Stop
   * ================================================================ */

  function init() {
    canvas = document.getElementById('game-canvas');
    if (!canvas) { console.error('Canvas not found!'); return; }
    ctx = canvas.getContext('2d');
    InputSystem.init();
    WordManager.init();
    AudioSystem.setupAutoInit();
    lastTime = performance.now();
  }

  function startGame() {
    if (state === 'playing') return;
    resetGameState();
    WordManager.prepareSession(CONFIG.WORDS_PER_ROUND);
    state = 'playing';
    lastTime = performance.now();
    gs.roundStartTime = performance.now();
    if (!animFrameId) animFrameId = requestAnimationFrame(loop);
    startNextWord();
  }

  function stopGame() {
    state = 'idle';
    if (animFrameId) { cancelAnimationFrame(animFrameId); animFrameId = null; }
    InputSystem.clearTrail();
    drawStaticBg();
  }

  function togglePause() {
    if (state === 'playing') {
      state = 'paused';
      document.getElementById('btn-pause').textContent = '继续';
    } else if (state === 'paused') {
      state = 'playing';
      lastTime = performance.now();
      document.getElementById('btn-pause').textContent = '暂停';
    }
  }

  /* ================================================================
   * Main Loop
   * ================================================================ */

  function loop(timestamp) {
    if (state === 'idle') { animFrameId = null; return; }
    animFrameId = requestAnimationFrame(loop);
    var dt = (timestamp - lastTime) / 1000;
    if (dt > 0.1) dt = 0.1;
    lastTime = timestamp;
    if (state === 'playing') update(dt);
    render();
  }

  function update(dt) {
    updateShake(dt);
    updateBamboos(dt);
    updateRecoil(dt);
    // 命中冷却
    if (gs.hitCooldown > 0) gs.hitCooldown -= dt;
    InputSystem.fadeTrail(dt);
    // 刀光拖尾粒子
    spawnTrailSparks(dt);
    checkSlashCollisions();
    updateParticles(dt);
    updateHUD();
  }

  /* ================================================================
   * Bamboo Creation
   * ================================================================ */

  function createAllBamboos() {
    var word = WordManager.getCurrentWord();
    if (!word) return;

    var w = window.innerWidth || 1024;
    var h = window.innerHeight || 768;
    var safe = Renderer.getSafeArea();
    var groundY = safe.bottom;  // 竹子根部在画卷底部
    var maxTop = safe.top;      // 竹子不能长出画卷顶部
    var wordUpper = word.word.toUpperCase();
    var count = wordUpper.length;

    // 干扰字母池: 从单词其他字母中构建
    var pool = [];
    for (var i = 0; i < wordUpper.length; i++) {
      if (pool.indexOf(wordUpper[i]) === -1) pool.push(wordUpper[i]);
    }
    // 额外补充一些随机字母
    var extras = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    for (var j = 0; j < 10; j++) {
      var el = extras[Math.floor(Math.random() * 26)];
      if (pool.indexOf(el) === -1) pool.push(el);
    }

    // 计算竹子X位置
    var usableW = w - CONFIG.BAMBOO_MARGIN * 2;
    var spacing = usableW / (count + 1);

    gs.bamboos = [];
    for (var k = 0; k < count; k++) {
      var x = CONFIG.BAMBOO_MARGIN + spacing * (k + 1);
      var targetLetter = wordUpper[k];
      var bamboo = BambooSystem.create(k, x, groundY, targetLetter, pool, maxTop);
      bamboo.isCurrentTarget = (k === 0);
      gs.bamboos.push(bamboo);
    }

    gs.currentBambooIdx = 0;
  }

  /* ================================================================
   * Bamboo Update
   * ================================================================ */

  function updateBamboos(dt) {
    for (var i = 0; i < gs.bamboos.length; i++) {
      BambooSystem.update(gs.bamboos[i], dt);
    }
  }

  /* ================================================================
   * Recoil (刀刃弹回效果)
   * ================================================================ */

  function updateRecoil(dt) {
    if (gs.recoilDuration > 0) {
      gs.recoilDuration -= dt;
      if (gs.recoilDuration <= 0) {
        gs.recoilOffset = 0;
      } else {
        var t = gs.recoilDuration / gs.recoilMaxDuration;
        gs.recoilOffset = gs.recoilAmount * t * t; // 弹性衰减
      }
    }
  }

  /* ================================================================
   * Collision
   * ================================================================ */

  function checkSlashCollisions() {
    // 冷却中不检测 (防止长按连续判定)
    if (gs.hitCooldown > 0) return;

    var trail = InputSystem.getTrail();
    if (trail.length < 2 || gs.bamboos.length === 0) return;

    var result = SlashDetection.checkSlash(trail, gs.bamboos, InputSystem.getCheckedIndex());
    if (!result) return;

    // 防止 null 和已破坏的竹子
    if (!result.bamboo || result.bamboo.broken || !result.bamboo.alive) return;
    if (result.letter === null || result.letter === undefined) return;

    InputSystem.setCheckedIndex(result.trailIndex);

    var bamboo = result.bamboo;
    var targetLetter = WordManager.getTargetLetter();
    if (!targetLetter) return;

    // 必须命中当前目标竹子，且是正确竹节
    if (bamboo.index === gs.currentBambooIdx &&
        result.isTarget && result.letter === targetLetter) {
      handleCorrectSlash(bamboo, result);
    } else {
      // 斩错 (错误竹子 or 错误竹节) → 反馈但不推进
      handleWrongSlash(bamboo, result);
    }
  }

  /* ================================================================
   * Hit Handlers
   * ================================================================ */

  function handleCorrectSlash(bamboo, result) {
    // ★ 先记录位置 (breakAt 之后 segment 会变化)
    var particleY = bamboo.topY + bamboo.totalHeight / 2;
    if (result.segIndex < bamboo.segments.length) {
      var seg = bamboo.segments[result.segIndex];
      particleY = seg.y;
    }

    // 破坏竹子
    bamboo.breakAt(result.segIndex);

    // 音效
    AudioSystem.playSlashHit();

    // 竹屑粒子
    spawnParticles('slash', bamboo.x, particleY,
      CONFIG.SLASH_PARTICLE_COUNT, CONFIG.COLORS.slashSpark);

    // 计分
    Scoring.recordHit();
    var milestone = Scoring.checkComboMilestone();
    if (milestone > 0) { AudioSystem.playComboMilestone(); flashComboMilestone(); }
    animateComboPop();

    // 记录字母
    gs.wordProgress.push({ letter: result.letter, correct: true });
    WordManager.advanceLetter();
    updateWordHUD();

    // ★ 命中冷却 + 清空轨迹 (防止同一次划动多次判定)
    gs.hitCooldown = 0.35;
    InputSystem.clearTrail();

    var wordDone = (gs.currentBambooIdx >= gs.bamboos.length - 1);
    if (wordDone || WordManager.getTargetLetter() === null) {
      handleWordComplete();
    } else {
      gs.currentBambooIdx++;
      if (gs.bamboos[gs.currentBambooIdx]) {
        gs.bamboos[gs.currentBambooIdx].isCurrentTarget = true;
      }
    }
  }

  function handleWrongSlash(bamboo, result) {
    // ★ 先记录位置
    var particleY = bamboo.topY + bamboo.totalHeight / 2;
    if (result.segIndex < bamboo.segments.length) {
      var seg = bamboo.segments[result.segIndex];
      particleY = seg.y;
    }

    // 金属碰撞音效
    AudioSystem.playSlashMiss();

    // 碰撞火花
    spawnParticles('spark', bamboo.x, particleY, 10, CONFIG.COLORS.bloodBright);

    // 刀刃弹回效果
    gs.recoilAmount = 15;
    gs.recoilMaxDuration = 0.2;
    gs.recoilDuration = 0.2;

    // 轻震
    triggerShake(4, 0.15);

    // 计分
    Scoring.recordMiss();
    WordManager.recordError();

    // ★ 不推进单词进度 — 卡在当前字母直到斩对为止
    // 闪现正确字母提示
    var correctLetter = WordManager.getTargetLetter();
    if (correctLetter) {
      showCorrectLetterHint(correctLetter);
    }

    // ★ 命中冷却 + 清空轨迹
    gs.hitCooldown = 0.4;
    InputSystem.clearTrail();
  }

  function showCorrectLetterHint(letter) {
    var hint = document.getElementById('hud-word-definition');
    if (!hint) return;
    var orig = hint.textContent;
    hint.textContent = '★ 正确字母: ' + letter + ' ★';
    hint.style.setProperty('color', '#ff6666', 'important');
    setTimeout(function() { hint.textContent = orig; hint.style.color = ''; }, 900);
  }

  /* ================================================================
   * Word Flow
   * ================================================================ */

  function startNextWord() {
    var word = WordManager.getCurrentWord();
    if (!word) {
      word = WordManager.getNextWord();
      if (!word) { endRound(); return; }
    }

    gs.bamboos = [];
    gs.particles = [];
    InputSystem.clearTrail();
    gs.wordProgress = [];
    gs.errorsThisWord = 0;
    gs.currentBambooIdx = 0;
    gs.wordCompleteTimer = false;

    createAllBamboos();
    updateWordHUD();
  }

  function handleWordComplete() {
    AudioSystem.playWordComplete();
    var word = WordManager.getCurrentWord();
    var points = Scoring.awardWordComplete(word.word.length);
    var coins = Scoring.awardCoins();
    gs.sessionPoints = Scoring.getLiveStats().points;
    gs.sessionWordsCleared++;
    gs.coinsEarned += coins;
    gs.wordCompleteTimer = true;

    var nextWord = WordManager.getNextWord();
    if (nextWord) {
      setTimeout(function() {
        if (state === 'playing') startNextWord();
      }, 1500);
    } else {
      setTimeout(function() { endRound(); }, 1800);
    }
  }

  function endRound() {
    state = 'over';
    if (animFrameId) { cancelAnimationFrame(animFrameId); animFrameId = null; }
    gs.roundEndTime = performance.now();
    var summary = Scoring.getSessionSummary();
    var elapsed = Math.round((gs.roundEndTime - gs.roundStartTime) / 1000);
    summary.elapsed = elapsed;
    showResults(summary);
  }

  /* ================================================================
   * Particles
   * ================================================================ */

  /**
   * 刀光拖尾火花 — 沿轨迹持续生成
   */
  function spawnTrailSparks(dt) {
    if (!InputSystem.getIsMouseDown()) return;
    var trail = InputSystem.getTrail();
    if (trail.length < 2) return;

    // 在轨迹末端生成火花
    var tip = trail[trail.length - 1];
    var prev = trail[trail.length - 2];
    var angle = Math.atan2(tip.y - prev.y, tip.x - prev.x);

    // 每次 spawn 1-2 个火花
    var count = Utils.randomInt(1, 2);
    for (var i = 0; i < count; i++) {
      if (gs.particles.length >= CONFIG.MAX_PARTICLES) break;

      var spreadAngle = angle + Utils.randomRange(-0.8, 0.8);
      var speed = Utils.randomRange(40, 120);
      var life = Utils.randomRange(0.15, 0.35);

      gs.particles.push({
        x: tip.x + Utils.randomRange(-6, 6),
        y: tip.y + Utils.randomRange(-6, 6),
        vx: Math.cos(spreadAngle) * speed,
        vy: Math.sin(spreadAngle) * speed,
        life: life, maxLife: life,
        size: Utils.randomRange(1, 2.5),
        color: Utils.randomPick(['#ffffff', '#eeeeee', '#cccccc', '#dddddd']),
        type: 'trail',
        rotation: Utils.randomRange(0, Math.PI * 2)
      });
    }
  }

  function spawnParticles(type, x, y, count, color) {
    var lifeMin = 0.3, lifeMax = 0.6, speedMin = 80, speedMax = 250;
    if (type === 'spark') {
      lifeMin = 0.15; lifeMax = 0.35; speedMin = 100; speedMax = 350;
    }
    for (var i = 0; i < count; i++) {
      if (gs.particles.length >= CONFIG.MAX_PARTICLES) break;
      var angle = Utils.randomRange(0, Math.PI * 2);
      var speed = Utils.randomRange(speedMin, speedMax);
      var life = Utils.randomRange(lifeMin, lifeMax);
      gs.particles.push({
        x: x, y: y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: life, maxLife: life,
        size: Utils.randomRange(2, type === 'spark' ? 3 : 5),
        color: color, type: type,
        rotation: Utils.randomRange(0, Math.PI*2)
      });
    }
  }

  function updateParticles(dt) {
    for (var i = gs.particles.length - 1; i >= 0; i--) {
      var p = gs.particles[i];
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.vy += CONFIG.PARTICLE_GRAVITY * dt;
      p.life -= dt;
      if (p.life <= 0) gs.particles.splice(i, 1);
    }
  }

  /* ================================================================
   * Effects
   * ================================================================ */

  function updateShake(dt) {
    if (gs.shakeDuration > 0) {
      gs.shakeDuration -= dt;
      if (gs.shakeDuration <= 0) {
        gs.shakeIntensity = 0; gs.shakeOffset.x = 0; gs.shakeOffset.y = 0;
      } else {
        var d = gs.shakeDuration / CONFIG.SHAKE_DURATION;
        gs.shakeOffset.x = (Math.random() - 0.5) * gs.shakeIntensity * d * 2;
        gs.shakeOffset.y = (Math.random() - 0.5) * gs.shakeIntensity * d * 2;
      }
    }
  }

  function triggerShake(i, d) { gs.shakeIntensity = i; gs.shakeDuration = d; }

  function animateComboPop() {
    var el = document.getElementById('hud-combo');
    if (!el) return;
    el.classList.add('combo-active');
    setTimeout(function() { el.classList.remove('combo-active'); }, 300);
  }

  function flashComboMilestone() {
    var el = document.getElementById('hud-combo');
    if (el) { el.classList.add('combo-pop'); setTimeout(function() { el.classList.remove('combo-pop'); }, 300); }
  }

  /* ================================================================
   * HUD
   * ================================================================ */

  function updateHUD() {
    var stats = Scoring.getLiveStats();
    var comboEl = document.getElementById('hud-combo');
    var scoreEl = document.getElementById('hud-score');
    var rateEl = document.getElementById('hud-hitrate');
    var defEl = document.getElementById('hud-word-definition');

    if (comboEl) comboEl.textContent = '连击 ' + stats.combo;
    if (scoreEl) scoreEl.textContent = '分数 ' + (stats.points + gs.sessionPoints);
    if (rateEl) rateEl.textContent = '命中率 ' + stats.hitRate + '%';
    var word = WordManager.getCurrentWord();
    if (defEl && word && !gs.wordCompleteTimer) defEl.textContent = word.definition;

    // 用时显示
    var timeEl = document.getElementById('hud-time');
    if (timeEl && gs.roundStartTime) {
      var elapsed = Math.round((performance.now() - gs.roundStartTime) / 1000);
      var mins = Math.floor(elapsed / 60);
      var secs = elapsed % 60;
      timeEl.textContent = '用时 ' + mins + ':' + (secs < 10 ? '0' : '') + secs;
    }
  }

  function updateWordHUD() {
    var word = WordManager.getCurrentWord();
    if (!word) return;
    var container = document.getElementById('hud-word-progress');
    if (!container) return;

    var html = '';
    var wordLen = word.word.length;
    var progress = gs.wordProgress || [];

    for (var i = 0; i < wordLen; i++) {
      if (i < progress.length) {
        var cls = progress[i].correct ? 'filled' : 'filled-error';
        html += '<div class="hud-letter-box ' + cls + '">' + progress[i].letter + '</div>';
      } else {
        html += '<div class="hud-letter-box">_</div>';
      }
    }
    container.innerHTML = html;
  }

  /* ================================================================
   * Results
   * ================================================================ */

  function showResults(summary) {
    document.getElementById('stat-words-cleared').textContent = summary.wordsCleared;
    document.getElementById('stat-hitrate').textContent = summary.hitRate + '%';
    document.getElementById('stat-max-combo').textContent = summary.maxCombo;
    document.getElementById('stat-points').textContent = '+' + summary.points;

    // 总用时
    var statTime = document.getElementById('stat-elapsed');
    if (!statTime) {
      // 动态添加到结果面板
      var resultsDiv = document.getElementById('results-stats');
      if (resultsDiv) {
        var row = document.createElement('div');
        row.className = 'stat-row';
        row.innerHTML = '<span class="stat-label">总用时</span><span class="stat-value" id="stat-elapsed">--</span>';
        resultsDiv.appendChild(row);
        statTime = document.getElementById('stat-elapsed');
      }
    }
    if (statTime && summary.elapsed !== undefined) {
      var m = Math.floor(summary.elapsed / 60);
      var s = summary.elapsed % 60;
      statTime.textContent = m + '分' + s + '秒';
    }

    var errorWords = WordManager.getErrorWords();
    var btn = document.getElementById('btn-review-errors');
    if (btn) {
      btn.style.display = errorWords.length > 0 ? '' : 'none';
      if (errorWords.length > 0) btn.textContent = '复习错词 (' + errorWords.length + '个)';
    }

    UIManager.showScreen('results');
    drawStaticBg();
    state = 'idle';
  }

  /* ================================================================
   * Render
   * ================================================================ */

  function render() {
    var dpr = window.devicePixelRatio || 1;
    var w = window.innerWidth;
    var h = window.innerHeight;
    ctx.save();
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    // 震屏 + 弹回
    var sx = gs.shakeOffset.x + (gs.recoilOffset || 0);
    var sy = gs.shakeOffset.y;
    ctx.translate(sx, sy);

    Renderer.drawGameBackground(ctx, w, h);

    // 竹子
    for (var i = 0; i < gs.bamboos.length; i++) {
      Renderer.drawBamboo(ctx, gs.bamboos[i]);
    }

    // 粒子
    Renderer.drawParticles(ctx, gs.particles);

    // 轨迹
    var trail = InputSystem.getTrail();
    if (trail.length > 1) Renderer.drawTrail(ctx, trail);

    ctx.restore();
  }

  function drawStaticBg() {
    var dpr = window.devicePixelRatio || 1;
    var w = window.innerWidth;
    var h = window.innerHeight;
    ctx.save();
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    Renderer.drawStaticBackground(ctx, w, h);
    ctx.restore();
  }

  /* ================================================================
   * State
   * ================================================================ */

  function resetGameState() {
    Scoring.resetSession();
    gs = {
      bamboos: [],
      particles: [],
      shakeOffset: {x:0,y:0}, shakeIntensity:0, shakeDuration:0,
      hitCooldown: 0, recoilOffset: 0, recoilAmount: 0, recoilDuration: 0, recoilMaxDuration: 0,
      wordProgress: [], errorsThisWord: 0, currentBambooIdx: 0,
      sessionPoints: 0, sessionWordsCleared: 0, coinsEarned: 0,
      wordCompleteTimer: false,
      roundStartTime: 0, roundEndTime: 0
    };
    InputSystem.clearTrail();
  }

  return {
    init: init, startGame: startGame, stopGame: stopGame, togglePause: togglePause,
    getState: function() { return state; }
  };
})();
