/**
 * renderer.js — Canvas 绘制 (水墨竹林版)
 *
 * 竹子竖直站立，水墨笔触风格。
 * 竹节处有字母，被斩断后上半截下落消失。
 */
var Renderer = (function() {
  'use strict';

  /* ================================================================
   * 背景
   * ================================================================ */

  function drawStaticBackground(ctx, w, h) {
    ctx.fillStyle = CONFIG.COLORS.paperWhite;
    ctx.fillRect(0, 0, w, h);
    // 淡墨晕染
    ctx.save();
    ctx.globalAlpha = 0.025;
    var spots = [
      {x: w*0.15, y: h*0.3, r: w*0.35},
      {x: w*0.8, y: h*0.6, r: w*0.3},
      {x: w*0.5, y: h*0.15, r: w*0.25}
    ];
    spots.forEach(function(s) {
      var g = ctx.createRadialGradient(s.x, s.y, 0, s.x, s.y, s.r);
      g.addColorStop(0, CONFIG.COLORS.inkBlack);
      g.addColorStop(1, 'transparent');
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, w, h);
    });
    ctx.restore();
    // 地面淡线
    ctx.strokeStyle = 'rgba(0,0,0,0.08)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(0, h - CONFIG.BAMBOO_GROUND_OFFSET);
    ctx.lineTo(w, h - CONFIG.BAMBOO_GROUND_OFFSET);
    ctx.stroke();
  }

  function drawGameBackground(ctx, w, h) {
    ctx.fillStyle = CONFIG.COLORS.paperWhite;
    ctx.fillRect(0, 0, w, h);
    // 地面淡线
    var gy = h - CONFIG.BAMBOO_GROUND_OFFSET;
    ctx.strokeStyle = 'rgba(0,0,0,0.06)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(0, gy);
    ctx.lineTo(w, gy);
    ctx.stroke();
    // 淡墨雾
    ctx.save();
    ctx.globalAlpha = 0.02;
    var g = ctx.createRadialGradient(w*0.5, h*0.4, 0, w*0.5, h*0.4, Math.max(w,h)*0.5);
    g.addColorStop(0, CONFIG.COLORS.inkBlack);
    g.addColorStop(1, 'transparent');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, w, h);
    ctx.restore();
  }

  /* ================================================================
   * 竹子绘制
   * ================================================================ */

  function drawBamboo(ctx, bamboo) {
    if (!bamboo.alive && !bamboo.fallPiece) return;

    // 先画下半截 (残留部分)
    if (bamboo.segments.length > 0) {
      drawBambooStalk(ctx, bamboo.x, bamboo.topY, bamboo.groundY,
                       bamboo.width, bamboo.segments, bamboo.segHeight,
                       bamboo.isCurrentTarget);
    }

    // 再画下落碎片
    if (bamboo.fallPiece) {
      drawFallingPiece(ctx, bamboo.fallPiece, bamboo.isCurrentTarget);
    }
  }

  /**
   * 绘制竹身 (从 topY 到 groundY)
   */
  function drawBambooStalk(ctx, x, topY, groundY, width, segments, segH, isTarget) {
    if (groundY - topY < 10) return;
    var halfW = width / 2;

    ctx.save();

    // 竹身底色 (中空浅色)
    var bodyGrad = ctx.createLinearGradient(x - halfW, 0, x + halfW, 0);
    bodyGrad.addColorStop(0, 'rgba(60,60,60,0.6)');
    bodyGrad.addColorStop(0.3, 'rgba(140,140,140,0.4)');
    bodyGrad.addColorStop(0.5, 'rgba(180,180,180,0.3)');
    bodyGrad.addColorStop(0.7, 'rgba(140,140,140,0.4)');
    bodyGrad.addColorStop(1, 'rgba(60,60,60,0.6)');

    ctx.fillStyle = bodyGrad;
    ctx.fillRect(x - halfW, topY, width, groundY - topY);

    // 竹身轮廓 (水墨双线)
    ctx.strokeStyle = 'rgba(30,30,30,0.7)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(x - halfW, topY);
    ctx.lineTo(x - halfW, groundY);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(x + halfW, topY);
    ctx.lineTo(x + halfW, groundY);
    ctx.stroke();

    // 竹节
    for (var i = 0; i < segments.length; i++) {
      var seg = segments[i];
      var nodeY = seg.y + segH / 2; // 竹节环在每段底部

      // 竹节凸起
      var bulgeW = halfW + CONFIG.BAMBOO_NODE_RADIUS;
      ctx.fillStyle = 'rgba(30,30,30,0.5)';
      ctx.fillRect(x - bulgeW, nodeY - 3, bulgeW * 2, 6);

      // 竹节上线
      ctx.strokeStyle = 'rgba(20,20,20,0.6)';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(x - bulgeW, nodeY);
      ctx.lineTo(x + bulgeW, nodeY);
      ctx.stroke();

      // 竹节下线 (淡)
      ctx.strokeStyle = 'rgba(20,20,20,0.3)';
      ctx.lineWidth = 0.8;
      ctx.beginPath();
      ctx.moveTo(x - bulgeW, nodeY + 2);
      ctx.lineTo(x + bulgeW, nodeY + 2);
      ctx.stroke();

      // 字母
      drawBambooLetter(ctx, seg.letter, x, seg.y, halfW, seg.isTarget);
    }

    // 顶部竹节 (如果segments为空，竹顶在topY)
    if (segments.length > 0) {
      var topSeg = segments[0];
      var topNodeY = topSeg.y - segH / 2;
      var bulgeW = halfW + CONFIG.BAMBOO_NODE_RADIUS;
      ctx.fillStyle = 'rgba(30,30,30,0.5)';
      ctx.fillRect(x - bulgeW, topNodeY - 2, bulgeW * 2, 5);
      ctx.strokeStyle = 'rgba(20,20,20,0.6)';
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.moveTo(x - bulgeW, topNodeY);
      ctx.lineTo(x + bulgeW, topNodeY);
      ctx.stroke();
    }

    ctx.restore();
  }

  /**
   * 绘制竹节上的字母
   */
  function drawBambooLetter(ctx, letter, x, y, halfW, isTarget) {
    // 字母背景 (浅色牌)
    var bgW = halfW + 6;
    ctx.fillStyle = 'rgba(255,255,255,0.6)';
    ctx.fillRect(x - bgW, y - CONFIG.BAMBOO_LETTER_SIZE/2 - 2, bgW * 2, CONFIG.BAMBOO_LETTER_SIZE + 4);
    ctx.strokeStyle = 'rgba(0,0,0,0.12)';
    ctx.lineWidth = 0.5;
    ctx.strokeRect(x - bgW, y - CONFIG.BAMBOO_LETTER_SIZE/2 - 2, bgW * 2, CONFIG.BAMBOO_LETTER_SIZE + 4);

    // 字母 — 普通黑体，清晰可见
    ctx.fillStyle = '#1a1a1a';
    ctx.font = 'bold ' + CONFIG.BAMBOO_LETTER_SIZE + 'px "Microsoft YaHei", "PingFang SC", "Helvetica Neue", Arial, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(letter, x, y);
  }

  /**
   * 绘制下落碎片
   */
  function drawFallingPiece(ctx, fp, isTarget) {
    if (fp.opacity <= 0) return;
    ctx.save();
    ctx.globalAlpha = fp.opacity;
    ctx.translate(fp.x, fp.y + fp.height / 2);
    ctx.rotate(fp.rotation);
    ctx.translate(-fp.x, -(fp.y + fp.height / 2));

    var halfW = fp.width / 2;

    // 碎片竹身
    var grad = ctx.createLinearGradient(fp.x - halfW, 0, fp.x + halfW, 0);
    grad.addColorStop(0, 'rgba(60,60,60,0.6)');
    grad.addColorStop(0.5, 'rgba(150,150,150,0.3)');
    grad.addColorStop(1, 'rgba(60,60,60,0.6)');
    ctx.fillStyle = grad;
    ctx.fillRect(fp.x - halfW, fp.y, fp.width, fp.height);

    // 轮廓
    ctx.strokeStyle = 'rgba(30,30,30,0.5)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(fp.x - halfW, fp.y);
    ctx.lineTo(fp.x - halfW, fp.y + fp.height);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(fp.x + halfW, fp.y);
    ctx.lineTo(fp.x + halfW, fp.y + fp.height);
    ctx.stroke();

    // 断面 (锯齿状断裂线)
    ctx.strokeStyle = 'rgba(60,60,60,0.7)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(fp.x - halfW - 2, fp.y + fp.height);
    for (var i = 0; i < halfW * 2 + 4; i += 4) {
      ctx.lineTo(fp.x - halfW - 2 + i, fp.y + fp.height + (i % 8 < 4 ? 2 : -2));
    }
    ctx.stroke();

    ctx.restore();
  }

  /* ================================================================
   * 轨迹 + 粒子
   * ================================================================ */

  function drawTrail(ctx, trail) {
    if (trail.length < 2) return;
    ctx.save();
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    for (var i = 1; i < trail.length; i++) {
      var t = i / trail.length;
      var x1 = trail[i-1].x, y1 = trail[i-1].y;
      var x2 = trail[i].x,   y2 = trail[i].y;

      // 第1层: 浅蓝冷光边缘 — 锐利轮廓
      ctx.shadowBlur = 3;
      ctx.shadowColor = 'rgba(180,210,255,0.5)';
      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.lineTo(x2, y2);
      ctx.strokeStyle = 'rgba(180,210,255,' + (t * 0.25) + ')';
      ctx.lineWidth = Utils.lerp(4, 9, t);
      ctx.stroke();

      // 第2层: 暖白刀光 — 主体
      ctx.shadowBlur = 0;
      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.lineTo(x2, y2);
      ctx.strokeStyle = 'rgba(255,250,240,' + (t * 0.5) + ')';
      ctx.lineWidth = Utils.lerp(2, 5, t);
      ctx.stroke();

      // 第3层: 纯白核心 — 最细最亮
      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.lineTo(x2, y2);
      ctx.strokeStyle = 'rgba(255,255,255,' + (t * 0.85) + ')';
      ctx.lineWidth = Utils.lerp(0.5, 1.8, t);
      ctx.stroke();
    }

    // 刀尖微光
    if (trail.length > 0) {
      var tip = trail[trail.length - 1];
      var g = ctx.createRadialGradient(tip.x, tip.y, 0, tip.x, tip.y, 8);
      g.addColorStop(0, 'rgba(255,255,255,0.9)');
      g.addColorStop(0.4, 'rgba(200,220,255,0.3)');
      g.addColorStop(1, 'rgba(180,210,255,0)');
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(tip.x, tip.y, 8, 0, Math.PI*2);
      ctx.fill();
    }

    ctx.restore();
  }

  function drawParticles(ctx, particles) {
    for (var i = 0; i < particles.length; i++) {
      var p = particles[i];
      if (p.life <= 0) continue;
      var alpha = p.life / p.maxLife;
      ctx.save();
      ctx.globalAlpha = alpha;

      if (p.type === 'slash') {
        // 竹屑碎片 — 细长菱形
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rotation || 0);
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.moveTo(0, -p.size);
        ctx.lineTo(p.size*0.5, 0);
        ctx.lineTo(0, p.size);
        ctx.lineTo(-p.size*0.5, 0);
        ctx.closePath();
        ctx.fill();
      } else if (p.type === 'spark') {
        // 金属碰撞火花
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI*2);
        ctx.fill();
      } else if (p.type === 'trail') {
        // 刀光拖尾 — 带光晕微光点
        var glow = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.size*2);
        glow.addColorStop(0, 'rgba(255,255,255,' + alpha + ')');
        glow.addColorStop(0.5, 'rgba(200,200,220,' + (alpha*0.4) + ')');
        glow.addColorStop(1, 'rgba(255,255,255,0)');
        ctx.fillStyle = glow;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size*2, 0, Math.PI*2);
        ctx.fill();
      } else {
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI*2);
        ctx.fill();
      }
      ctx.restore();
    }
  }

  return {
    drawStaticBackground: drawStaticBackground,
    drawGameBackground: drawGameBackground,
    drawBamboo: drawBamboo,
    drawTrail: drawTrail,
    drawParticles: drawParticles
  };
})();
