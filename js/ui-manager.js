/**
 * ui-manager.js — 界面切换管理
 *
 * 用法: UIManager.showScreen('menu')  切换到指定界面
 *       UIManager.hideAllScreens()     隐藏所有界面
 *       UIManager.getCurrentScreen()   获取当前显示的界面名
 */
var UIManager = (function() {
  'use strict';

  var screenNames = [
    'menu', 'game', 'results', 'shop', 'words', 'settings', 'tutorial'
  ];

  var currentScreen = null;

  /**
   * 隐藏所有界面
   */
  function hideAllScreens() {
    screenNames.forEach(function(name) {
      var el = document.getElementById('screen-' + name);
      if (el) {
        el.classList.remove('active');
      }
    });
  }

  /**
   * 显示指定界面
   * @param {string} name - 界面名 (不含 'screen-' 前缀)
   */
  function showScreen(name) {
    hideAllScreens();
    var el = document.getElementById('screen-' + name);
    if (el) {
      el.classList.add('active');
      currentScreen = name;
      // 触发自定义事件，让其他模块感知界面切换
      document.dispatchEvent(new CustomEvent('screenChanged', {
        detail: { screen: name }
      }));
    } else {
      console.warn('Screen not found: ' + name);
    }
  }

  /**
   * 获取当前显示的界面名
   * @returns {string|null}
   */
  function getCurrentScreen() {
    return currentScreen;
  }

  /**
   * 初始化 - 绑定所有 data-screen 按钮的点击事件
   */
  function init() {
    // 委托: 所有带 data-screen 属性的按钮自动导航
    document.addEventListener('click', function(e) {
      var target = e.target.closest('[data-screen]');
      if (target) {
        var screenName = target.getAttribute('data-screen');
        if (screenName) {
          e.preventDefault();
          showScreen(screenName);
        }
      }
    });

    // 绑定返回按钮 (data-action="back")
    document.addEventListener('click', function(e) {
      var target = e.target.closest('[data-action]');
      if (target) {
        var action = target.getAttribute('data-action');
        if (action === 'back') {
          e.preventDefault();
          showScreen('menu');
        }
      }
    });

    // Pause 按钮
    var btnPause = document.getElementById('btn-pause');
    if (btnPause) {
      btnPause.addEventListener('click', function() {
        if (typeof GameLoop !== 'undefined' && GameLoop.togglePause) {
          GameLoop.togglePause();
        }
      });
    }
  }

  // 公开 API
  return {
    showScreen: showScreen,
    hideAllScreens: hideAllScreens,
    getCurrentScreen: getCurrentScreen,
    init: init
  };
})();
