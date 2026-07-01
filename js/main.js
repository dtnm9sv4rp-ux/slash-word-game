/**
 * main.js — 游戏启动入口
 * 初始化所有模块，连接 UI 与游戏逻辑
 */
(function() {
  'use strict';

  var settings = {};

  function init() {
    console.log('弹刀 Slash Word Game — 初始化中...');

    // 加载设置
    settings = Storage.loadSettings();

    // 初始化各模块
    initCanvas();
    GameLoop.init();
    UIManager.init();
    Renderer.loadBgImage();  // 预加载卷轴背景

    // 连接 UI 事件
    wireSettingsScreen();
    wireWordManagement();
    wireShopScreen();
    wireResultsScreen();
    wirePauseOverlay();

    // 点击音效
    document.addEventListener('click', function(e) {
      if (e.target.closest('.btn')) {
        AudioSystem.playButtonClick();
      }
    });

    // 监听界面切换
    document.addEventListener('screenChanged', function(e) {
      var screen = e.detail.screen;
      var video = document.getElementById('bg-video');

      if (screen === 'game') {
        if (video) video.style.display = 'none';
        GameLoop.startGame();
      } else {
        if (video) video.style.display = '';
        if (GameLoop.getState() !== 'idle') {
          GameLoop.stopGame();
        }
      }
      // 刷新各界面数据
      if (screen === 'menu') refreshMenuProgress();
      if (screen === 'shop') refreshShopScreen();
      if (screen === 'words') refreshWordList();
      if (screen === 'settings') refreshSettingsScreen();
    });

    // 词库切换
    var bankSelect = document.getElementById('menu-bank-select');
    if (bankSelect) {
      bankSelect.addEventListener('change', function() {
        WordManager.setActiveBank(this.value);
        refreshMenuProgress();
      });
    }

    // 每日目标切换
    var targetSelect = document.getElementById('menu-daily-target');
    if (targetSelect) {
      targetSelect.addEventListener('change', function() {
        var bank = WordManager.getActiveBank();
        var stats = Storage.getDailyStats(bank);
        stats.target = parseInt(this.value);
        Storage.saveDailyStats(stats);
        refreshMenuProgress();
      });
    }

    // 显示菜单
    UIManager.showScreen('menu');
    drawStaticBackground();

    console.log('弹刀 Slash Word Game — 初始化完成');
  }

  /* ================================================================
   * Settings Screen
   * ================================================================ */

  function wireSettingsScreen() {
    // Knife speed slider
    var speedSlider = document.getElementById('setting-knife-speed');
    var speedLabel = document.getElementById('setting-speed-label');
    if (speedSlider) {
      speedSlider.addEventListener('input', function() {
        speedLabel.textContent = parseFloat(this.value).toFixed(1) + 'x';
      });
    }

    // Apply settings when any control changes
    var controls = ['setting-knife-speed', 'setting-group-size',
                    'setting-difficulty', 'setting-sfx-volume'];
    controls.forEach(function(id) {
      var el = document.getElementById(id);
      if (el) {
        el.addEventListener('change', saveSettingsFromUI);
        el.addEventListener('input', function() {
          if (id === 'setting-knife-speed') {
            document.getElementById('setting-speed-label').textContent =
              parseFloat(this.value).toFixed(1) + 'x';
          }
          if (id === 'setting-sfx-volume') {
            document.getElementById('setting-volume-label').textContent =
              Math.round(this.value * 100) + '%';
          }
          saveSettingsFromUI();
        });
      }
    });
  }

  function refreshSettingsScreen() {
    var s = settings;
    var speedSlider = document.getElementById('setting-knife-speed');
    var groupSelect = document.getElementById('setting-group-size');
    var diffSelect = document.getElementById('setting-difficulty');
    var volSlider = document.getElementById('setting-sfx-volume');

    if (speedSlider) speedSlider.value = s.knifeSpeed || 1.0;
    if (groupSelect) groupSelect.value = s.groupSize || 2;
    if (diffSelect) diffSelect.value = s.difficulty || 'medium';
    if (volSlider) volSlider.value = s.sfxVolume || 0.8;

    document.getElementById('setting-speed-label').textContent =
      (s.knifeSpeed || 1.0).toFixed(1) + 'x';
    document.getElementById('setting-volume-label').textContent =
      Math.round((s.sfxVolume || 0.8) * 100) + '%';
  }

  function saveSettingsFromUI() {
    settings.knifeSpeed = parseFloat(document.getElementById('setting-knife-speed').value);
    settings.groupSize = parseInt(document.getElementById('setting-group-size').value);
    settings.difficulty = document.getElementById('setting-difficulty').value;
    settings.sfxVolume = parseFloat(document.getElementById('setting-sfx-volume').value);

    Storage.saveSettings(settings);
    AudioSystem.setVolume(settings.sfxVolume);

    // 更新 CONFIG 中的难度
    var diff = CONFIG.DIFFICULTY[settings.difficulty];
    if (diff) {
      diff.groupSize = settings.groupSize;
      diff.speedMultiplier = settings.knifeSpeed * (settings.difficulty === 'easy' ? 0.7 :
                              settings.difficulty === 'hard' ? 1.4 : 1.0);
    }
  }

  /* ================================================================
   * Word Management Screen
   * ================================================================ */

  function wireWordManagement() {
    // Add word button
    var btnAdd = document.getElementById('btn-add-word');
    if (btnAdd) {
      btnAdd.addEventListener('click', function() {
        var word = document.getElementById('input-new-word').value.trim();
        var def = document.getElementById('input-new-def').value.trim();
        var diff = parseInt(document.getElementById('select-new-difficulty').value);

        if (!word || !def) {
          alert('请输入单词和释义');
          return;
        }

        if (WordManager.addWord(word, def, diff)) {
          document.getElementById('input-new-word').value = '';
          document.getElementById('input-new-def').value = '';
          refreshWordList();
        } else {
          alert('添加失败（单词可能已存在或词库已满）');
        }
      });
    }

    // Import text
    var btnImport = document.getElementById('btn-import');
    if (btnImport) {
      btnImport.addEventListener('click', function() {
        var text = document.getElementById('word-import-textarea').value.trim();
        if (!text) { alert('请粘贴单词数据'); return; }

        var words = parseWordInput(text);
        if (words.length === 0) {
          alert('未能识别有效单词。请使用格式: apple 苹果 或 apple,苹果,1');
          return;
        }

        var added = WordManager.importWords(words);
        alert('成功导入 ' + added + ' 个单词');
        document.getElementById('word-import-textarea').value = '';
        refreshWordList();
      });
    }

    // Import file
    var btnImportFile = document.getElementById('btn-import-file');
    var fileInput = document.getElementById('input-file-upload');
    if (btnImportFile && fileInput) {
      btnImportFile.addEventListener('click', function() { fileInput.click(); });
      fileInput.addEventListener('change', function(e) {
        var file = e.target.files[0];
        if (!file) return;
        var reader = new FileReader();
        reader.onload = function(ev) {
          document.getElementById('word-import-textarea').value = ev.target.result;
        };
        reader.readAsText(file);
      });
    }

    // Export
    var btnExport = document.getElementById('btn-export');
    if (btnExport) {
      btnExport.addEventListener('click', function() {
        var words = WordManager.exportWords();
        var json = JSON.stringify(words, null, 2);
        var blob = new Blob([json], { type: 'application/json' });
        var url = URL.createObjectURL(blob);
        var a = document.createElement('a');
        a.href = url;
        a.download = 'slash-word-bank.json';
        a.click();
        URL.revokeObjectURL(url);
      });
    }

    // Reset
    var btnReset = document.getElementById('btn-reset-words');
    if (btnReset) {
      btnReset.addEventListener('click', function() {
        if (confirm('确定要重置词库为默认词库吗？所有自定义单词将被删除。')) {
          WordManager.resetToDefault();
          refreshWordList();
        }
      });
    }
  }

  /**
   * 解析用户输入的单词文本
   * 支持格式:
   *   - apple 苹果
   *   - apple,苹果
   *   - apple,苹果,1
   *   - JSON array
   */
  function parseWordInput(text) {
    // Try JSON first
    try {
      var json = JSON.parse(text);
      if (Array.isArray(json)) return json;
    } catch(e) {}

    // Line by line
    var lines = text.split(/[\n\r]+/);
    var words = [];
    lines.forEach(function(line) {
      line = line.trim();
      if (!line) return;

      var parts;
      if (line.indexOf(',') !== -1) {
        parts = line.split(',');
      } else {
        parts = line.split(/\s+/);
      }

      if (parts.length >= 2) {
        words.push({
          word: parts[0].trim(),
          definition: parts[1].trim(),
          difficulty: parseInt(parts[2]) || 2
        });
      }
    });
    return words;
  }

  function refreshWordList() {
    var tbody = document.getElementById('word-list-body');
    var countEl = document.getElementById('word-count');
    if (!tbody || !countEl) return;

    var words = WordManager.getWordBank();
    countEl.textContent = '共 ' + words.length + ' 个单词';

    var html = '';
    words.forEach(function(w, i) {
      var diffLabel = w.difficulty === 1 ? '简单' : w.difficulty === 3 ? '困难' : '中等';
      html += '<tr>';
      html += '<td style="font-weight:bold;">' + w.word + '</td>';
      html += '<td>' + w.definition + '</td>';
      html += '<td>' + diffLabel + '</td>';
      html += '<td><button class="btn btn-small btn-danger" data-delete-word="' + i + '">删除</button></td>';
      html += '</tr>';
    });

    tbody.innerHTML = html;

    // Bind delete buttons
    tbody.querySelectorAll('[data-delete-word]').forEach(function(btn) {
      btn.addEventListener('click', function() {
        var idx = parseInt(this.getAttribute('data-delete-word'));
        if (WordManager.removeWord(idx)) {
          refreshWordList();
        }
      });
    });
  }

  /* ================================================================
   * Shop Screen
   * ================================================================ */

  function wireShopScreen() {
    // Shop items are rendered in refreshShopScreen
  }

  function refreshShopScreen() {
    var unlocks = Storage.loadUnlocks();

    // Update coin display
    var coinsEl = document.getElementById('shop-coins');
    if (coinsEl) coinsEl.textContent = '金币: ' + (unlocks.coins || 0);

    // Render knife skins
    var skinsGrid = document.getElementById('shop-skins-grid');
    if (skinsGrid) {
      var skins = [
        { id: 'default', name: '太刀', nameEn: 'Tachi', cost: 0, desc: '初始武士刀' }
      ];
      // Add purchasable skins
      Object.keys(CONFIG.SHOP.skins).forEach(function(key) {
        skins.push({
          id: key,
          name: CONFIG.SHOP.skins[key].name,
          nameEn: CONFIG.SHOP.skins[key].nameEn,
          cost: CONFIG.SHOP.skins[key].cost,
          desc: CONFIG.SHOP.skins[key].desc
        });
      });

      skinsGrid.innerHTML = skins.map(function(s) {
        var owned = unlocks.unlockedSkins.indexOf(s.id) !== -1;
        var equipped = unlocks.activeSkin === s.id;
        var actionBtn = '';

        if (equipped) {
          actionBtn = '<span class="shop-item-owned-label">已装备</span>';
        } else if (owned) {
          actionBtn = '<button class="btn btn-small" data-equip-skin="' + s.id + '">装备</button>';
        } else {
          actionBtn = '<button class="btn btn-small btn-gold" data-buy-skin="' + s.id + '">' + s.cost + ' 💰</button>';
        }

        return '<div class="shop-item-card' + (owned ? ' owned' : '') + (equipped ? ' equipped' : '') + '">' +
          '<div class="shop-item-preview">🗡️</div>' +
          '<div class="shop-item-name">' + s.name + '</div>' +
          '<div style="font-size:12px;color:var(--color-ink-faded);">' + s.desc + '</div>' +
          actionBtn +
        '</div>';
      }).join('');

      // Bind buttons
      bindShopButtons(skinsGrid);
    }

    // Render trail skins
    var trailsGrid = document.getElementById('shop-trails-grid');
    if (trailsGrid) {
      var trails = [
        { id: 'default', name: '墨迹', nameEn: 'Ink', cost: 0, desc: '纯黑水墨轨迹' }
      ];
      Object.keys(CONFIG.SHOP.trails).forEach(function(key) {
        trails.push({
          id: key,
          name: CONFIG.SHOP.trails[key].name,
          nameEn: CONFIG.SHOP.trails[key].nameEn,
          cost: CONFIG.SHOP.trails[key].cost,
          desc: CONFIG.SHOP.trails[key].desc
        });
      });

      trailsGrid.innerHTML = trails.map(function(t) {
        var owned = unlocks.unlockedTrails.indexOf(t.id) !== -1;
        var equipped = unlocks.activeTrail === t.id;
        var actionBtn = '';

        if (equipped) {
          actionBtn = '<span class="shop-item-owned-label">已装备</span>';
        } else if (owned) {
          actionBtn = '<button class="btn btn-small" data-equip-trail="' + t.id + '">装备</button>';
        } else {
          actionBtn = '<button class="btn btn-small btn-gold" data-buy-trail="' + t.id + '">' + t.cost + ' 💰</button>';
        }

        return '<div class="shop-item-card' + (owned ? ' owned' : '') + (equipped ? ' equipped' : '') + '">' +
          '<div class="shop-item-preview">✨</div>' +
          '<div class="shop-item-name">' + t.name + '</div>' +
          '<div style="font-size:12px;color:var(--color-ink-faded);">' + t.desc + '</div>' +
          actionBtn +
        '</div>';
      }).join('');

      bindShopButtons(trailsGrid);
    }
  }

  function bindShopButtons(container) {
    // Buy skin
    container.querySelectorAll('[data-buy-skin]').forEach(function(btn) {
      btn.addEventListener('click', function(e) {
        e.stopPropagation();
        var skinId = this.getAttribute('data-buy-skin');
        buySkin(skinId);
      });
    });

    // Equip skin
    container.querySelectorAll('[data-equip-skin]').forEach(function(btn) {
      btn.addEventListener('click', function(e) {
        e.stopPropagation();
        equipSkin(this.getAttribute('data-equip-skin'));
      });
    });

    // Buy trail
    container.querySelectorAll('[data-buy-trail]').forEach(function(btn) {
      btn.addEventListener('click', function(e) {
        e.stopPropagation();
        buyTrail(this.getAttribute('data-buy-trail'));
      });
    });

    // Equip trail
    container.querySelectorAll('[data-equip-trail]').forEach(function(btn) {
      btn.addEventListener('click', function(e) {
        e.stopPropagation();
        equipTrail(this.getAttribute('data-equip-trail'));
      });
    });
  }

  function buySkin(skinId) {
    var unlocks = Storage.loadUnlocks();
    var skin = CONFIG.SHOP.skins[skinId];
    if (!skin) return;

    if (unlocks.coins < skin.cost) {
      alert('金币不足！');
      return;
    }

    unlocks.coins -= skin.cost;
    unlocks.unlockedSkins.push(skinId);
    Storage.saveUnlocks(unlocks);
    refreshShopScreen();
  }

  function equipSkin(skinId) {
    var unlocks = Storage.loadUnlocks();
    unlocks.activeSkin = skinId;
    Storage.saveUnlocks(unlocks);
    refreshShopScreen();
  }

  function buyTrail(trailId) {
    var unlocks = Storage.loadUnlocks();
    var trail = CONFIG.SHOP.trails[trailId];
    if (!trail) return;

    if (unlocks.coins < trail.cost) {
      alert('金币不足！');
      return;
    }

    unlocks.coins -= trail.cost;
    unlocks.unlockedTrails.push(trailId);
    Storage.saveUnlocks(unlocks);
    refreshShopScreen();
  }

  function equipTrail(trailId) {
    var unlocks = Storage.loadUnlocks();
    unlocks.activeTrail = trailId;
    Storage.saveUnlocks(unlocks);
    refreshShopScreen();
  }

  /* ================================================================
   * Results Screen
   * ================================================================ */

  function wireResultsScreen() {
    var reviewBtn = document.getElementById('btn-review-errors');
    if (reviewBtn) {
      reviewBtn.addEventListener('click', function() {
        UIManager.showScreen('game');  // 切到游戏界面，触发screenChanged→startGame
      });
    }
  }

  function refreshMenuProgress() {
    var bank = WordManager.getActiveBank();
    var stats = Storage.getDailyStats(bank);
    var target = stats.target || 20;
    var learned = stats.learned || 0;
    var pct = target > 0 ? Math.min(100, Math.round(learned / target * 100)) : 0;

    var textEl = document.getElementById('menu-progress-text');
    var barEl = document.getElementById('menu-progress-bar');
    if (textEl) textEl.textContent = learned + '/' + target;
    if (barEl) barEl.style.width = pct + '%';

    // 更新下拉框
    var bankSel = document.getElementById('menu-bank-select');
    var targetSel = document.getElementById('menu-daily-target');
    if (bankSel) bankSel.value = bank;
    if (targetSel) targetSel.value = String(target);
  }

  function wirePauseOverlay() {
    var btnResume = document.getElementById('btn-resume');
    var btnQuit = document.getElementById('btn-quit');
    if (btnResume) {
      btnResume.addEventListener('click', function() {
        GameLoop.resumeGame();
      });
    }
    if (btnQuit) {
      btnQuit.addEventListener('click', function() {
        GameLoop.quitToMenu();
      });
    }
  }

  /* ================================================================
   * Canvas
   * ================================================================ */

  function initCanvas() {
    var canvas = document.getElementById('game-canvas');
    if (!canvas) return;
    var ctx = canvas.getContext('2d');
    var dpr = window.devicePixelRatio || 1;

    function resize() {
      var w = window.innerWidth;
      var h = window.innerHeight;
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      canvas.style.width = w + 'px';
      canvas.style.height = h + 'px';
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }
    resize();
    window.addEventListener('resize', resize);
  }

  function drawStaticBackground() {
    var canvas = document.getElementById('game-canvas');
    if (!canvas) return;
    var ctx = canvas.getContext('2d');
    var dpr = window.devicePixelRatio || 1;
    var w = window.innerWidth;
    var h = window.innerHeight;

    ctx.save();
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    ctx.fillStyle = CONFIG.COLORS.paperWhite;
    ctx.fillRect(0, 0, w, h);

    ctx.save();
    ctx.globalAlpha = 0.03;
    var grad1 = ctx.createRadialGradient(w * 0.75, h * 0.2, 0, w * 0.75, h * 0.2, w * 0.5);
    grad1.addColorStop(0, CONFIG.COLORS.inkBlack);
    grad1.addColorStop(1, 'transparent');
    ctx.fillStyle = grad1;
    ctx.fillRect(0, 0, w, h);

    var grad2 = ctx.createRadialGradient(w * 0.2, h * 0.7, 0, w * 0.2, h * 0.7, w * 0.4);
    grad2.addColorStop(0, CONFIG.COLORS.inkBlack);
    grad2.addColorStop(1, 'transparent');
    ctx.fillStyle = grad2;
    ctx.fillRect(0, 0, w, h);
    ctx.restore();

    ctx.save();
    ctx.globalAlpha = 0.015;
    ctx.strokeStyle = CONFIG.COLORS.inkBlack;
    ctx.lineWidth = 0.5;
    for (var y = 0; y < h; y += 4) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(w, y + (Math.sin(y * 0.1) * 2));
      ctx.stroke();
    }
    ctx.restore();

    ctx.restore();
  }

  // Boot
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
