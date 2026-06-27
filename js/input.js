/**
 * input.js — 输入系统
 *
 * 处理鼠标和触摸事件。在 document 级别监听 move/up，
 * 确保即使光标离开 canvas 也不会丢失轨迹。
 */
var InputSystem = (function() {
  'use strict';

  var canvas = null;
  var trail = [];
  var trailCheckedIndex = 0;
  var isMouseDown = false;

  function init() {
    canvas = document.getElementById('game-canvas');
    if (!canvas) { console.error('InputSystem: Canvas not found'); return; }

    // mousedown 只在 canvas 上触发 (防止干扰 UI 按钮)
    canvas.addEventListener('mousedown', onMouseDown);
    // mousemove/mouseup 在 document 上监听 (防止光标离开 canvas 丢轨迹)
    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', onMouseUp);

    canvas.addEventListener('touchstart', onTouchStart, { passive: false });
    canvas.addEventListener('touchmove', onTouchMove, { passive: false });
    canvas.addEventListener('touchend', onTouchEnd);
  }

  function resetTrail(startX, startY) {
    trail = [{ x: startX, y: startY, time: performance.now() }];
    trailCheckedIndex = 0;
  }

  function addTrailPoint(x, y) {
    if (trail.length === 0) {
      trail.push({ x: x, y: y, time: performance.now() });
      return;
    }
    var last = trail[trail.length - 1];
    var dist = Utils.distance(last.x, last.y, x, y);
    if (dist < CONFIG.TRAIL_MIN_DISTANCE) return;
    if (trail.length >= CONFIG.TRAIL_MAX_POINTS) trail.shift();
    trail.push({ x: x, y: y, time: performance.now() });
  }

  function getCanvasPos(e) {
    var rect = canvas.getBoundingClientRect();
    return { x: e.clientX - rect.left, y: e.clientY - rect.top };
  }

  function getTouchPos(touch) {
    var rect = canvas.getBoundingClientRect();
    return { x: touch.clientX - rect.left, y: touch.clientY - rect.top };
  }

  // --- Mouse ---
  function onMouseDown(e) {
    e.preventDefault();
    var pos = getCanvasPos(e);
    isMouseDown = true;
    resetTrail(pos.x, pos.y);
  }

  function onMouseMove(e) {
    if (!isMouseDown) return;
    var pos = getCanvasPos(e);
    addTrailPoint(pos.x, pos.y);
  }

  function onMouseUp(e) {
    if (!isMouseDown) return;
    isMouseDown = false;
  }

  // --- Touch ---
  function onTouchStart(e) {
    e.preventDefault();
    if (e.touches.length > 0) {
      var pos = getTouchPos(e.touches[0]);
      isMouseDown = true;
      resetTrail(pos.x, pos.y);
    }
  }

  function onTouchMove(e) {
    e.preventDefault();
    if (!isMouseDown || e.touches.length === 0) return;
    var pos = getTouchPos(e.touches[0]);
    addTrailPoint(pos.x, pos.y);
  }

  function onTouchEnd(e) {
    e.preventDefault();
    isMouseDown = false;
  }

  // --- Public ---
  function getTrail() { return trail; }
  function getIsMouseDown() { return isMouseDown; }
  function getCheckedIndex() { return trailCheckedIndex; }
  function setCheckedIndex(idx) { trailCheckedIndex = idx; }

  function fadeTrail(dt) {
    if (!isMouseDown && trail.length > 0) {
      var now = performance.now();
      var fadeTime = CONFIG.TRAIL_FADE_TIME * 1000;
      for (var i = trail.length - 1; i >= 0; i--) {
        if (now - trail[i].time > fadeTime) trail.splice(i, 1);
      }
    }
  }

  function clearTrail() {
    trail = [];
    trailCheckedIndex = 0;
  }

  return {
    init: init,
    getTrail: getTrail,
    getIsMouseDown: getIsMouseDown,
    getCheckedIndex: getCheckedIndex,
    setCheckedIndex: setCheckedIndex,
    fadeTrail: fadeTrail,
    clearTrail: clearTrail
  };
})();
