/**
 * renderer.js — Canvas 绘制 (水墨卷轴背景 + 竹林)
 */

var Renderer = (function() {
  'use strict';

  var bgImage = null;
  var bgLoaded = false;

  function loadBgImage() {
    if (bgImage) return;
    bgImage = new Image();
    bgImage.onload = function() { bgLoaded = true; };
    bgImage.src = 'assets/textures/scroll-bg.png';
  }

  /** 获取竹子安全区 (画卷中间区域，上下深色边缘之外) */
  function getSafeArea() {
    var h = window.innerHeight;
  

  /* ================================================================
   * 竹叶飘落系统
   * ================================================================ */

  var leaves = [];
  var leafTimer = 0;

  function updateLeaves(dt, w, h) {
    // 定时生成竹叶
    leafTimer += dt;
    if (leafTimer > 1.2 && leaves.length < 20) {
      leafTimer = 0;
      spawnLeaf(w, h);
    }

    // 更新每片叶
    for (var i = leaves.length - 1; i >= 0; i--) {
      var l = leaves[i];
      l.x += l.vx * dt + Math.sin(l.swayPhase) * 18 * dt;
      l.y += l.vy * dt;
      l.swayPhase += l.swaySpeed * dt;
      l.rotation += l.rotSpeed * dt;
      l.opacity -= 0.08 * dt;
      if (l.opacity <= 0 || l.y > h + 60) {
        leaves.splice(i, 1);
      }
    }
  }

  function spawnLeaf(w, h) {
    leaves.push({
      x: Math.random() * w,
      y: -20,
      vx: (Math.random() - 0.5) * 25,
      vy: 15 + Math.random() * 35,
      rotation: Math.random() * Math.PI * 2,
      rotSpeed: (Math.random() - 0.5) * 3,
      swayPhase: Math.random() * Math.PI * 2,
      swaySpeed: 2 + Math.random() * 3,
      size: 5 + Math.random() * 10,
      opacity: 0.3 + Math.random() * 0.4,
      color: Math.random() < 0.5 ? 'rgba(60,80,50,ALPHA)' : 'rgba(80,100,60,ALPHA)'
    });
  }

  function drawLeaves(ctx) {
    for (var i = 0; i < leaves.length; i++) {
      var l = leaves[i];
      ctx.save();
      ctx.globalAlpha = l.opacity;
      ctx.translate(l.x, l.y);
      ctx.rotate(l.rotation);
      // 竹叶 — 细长椭圆
      ctx.fillStyle = l.color.replace('ALPHA', l.opacity.toFixed(2));
      ctx.beginPath();
      ctx.ellipse(0, 0, l.size * 0.7, l.size * 0.2, 0, 0, Math.PI * 2);
      ctx.fill();
      // 叶脉
      ctx.strokeStyle = l.color.replace('ALPHA', (l.opacity * 0.5).toFixed(2));
      ctx.lineWidth = 0.3;
      ctx.beginPath();
      ctx.moveTo(-l.size * 0.6, 0);
      ctx.lineTo(l.size * 0.6, 0);
      ctx.stroke();
      ctx.restore();
    }
  }

  return {
      top: h * CONFIG.SCROLL_TOP_EDGE,
      bottom: h * (1 - CONFIG.SCROLL_BOTTOM_EDGE)
    };
  }

  /** 获取下方深色边缘区域 (放 HUD) */
  function getBottomEdgeArea() {
    var h = window.innerHeight;
  

  /* ================================================================
   * 竹叶飘落系统
   * ================================================================ */

  var leaves = [];
  var leafTimer = 0;

  function updateLeaves(dt, w, h) {
    // 定时生成竹叶
    leafTimer += dt;
    if (leafTimer > 1.2 && leaves.length < 20) {
      leafTimer = 0;
      spawnLeaf(w, h);
    }

    // 更新每片叶
    for (var i = leaves.length - 1; i >= 0; i--) {
      var l = leaves[i];
      l.x += l.vx * dt + Math.sin(l.swayPhase) * 18 * dt;
      l.y += l.vy * dt;
      l.swayPhase += l.swaySpeed * dt;
      l.rotation += l.rotSpeed * dt;
      l.opacity -= 0.08 * dt;
      if (l.opacity <= 0 || l.y > h + 60) {
        leaves.splice(i, 1);
      }
    }
  }

  function spawnLeaf(w, h) {
    leaves.push({
      x: Math.random() * w,
      y: -20,
      vx: (Math.random() - 0.5) * 25,
      vy: 15 + Math.random() * 35,
      rotation: Math.random() * Math.PI * 2,
      rotSpeed: (Math.random() - 0.5) * 3,
      swayPhase: Math.random() * Math.PI * 2,
      swaySpeed: 2 + Math.random() * 3,
      size: 5 + Math.random() * 10,
      opacity: 0.3 + Math.random() * 0.4,
      color: Math.random() < 0.5 ? 'rgba(60,80,50,ALPHA)' : 'rgba(80,100,60,ALPHA)'
    });
  }

  function drawLeaves(ctx) {
    for (var i = 0; i < leaves.length; i++) {
      var l = leaves[i];
      ctx.save();
      ctx.globalAlpha = l.opacity;
      ctx.translate(l.x, l.y);
      ctx.rotate(l.rotation);
      // 竹叶 — 细长椭圆
      ctx.fillStyle = l.color.replace('ALPHA', l.opacity.toFixed(2));
      ctx.beginPath();
      ctx.ellipse(0, 0, l.size * 0.7, l.size * 0.2, 0, 0, Math.PI * 2);
      ctx.fill();
      // 叶脉
      ctx.strokeStyle = l.color.replace('ALPHA', (l.opacity * 0.5).toFixed(2));
      ctx.lineWidth = 0.3;
      ctx.beginPath();
      ctx.moveTo(-l.size * 0.6, 0);
      ctx.lineTo(l.size * 0.6, 0);
      ctx.stroke();
      ctx.restore();
    }
  }

  return {
      top: h * (1 - CONFIG.SCROLL_BOTTOM_EDGE),
      bottom: h
    };
  }

  function drawBgImage(ctx, w, h) {
    if (!bgLoaded) {
      // 图片未加载完 → 用纯色过渡
      loadBgImage();
      ctx.fillStyle = CONFIG.COLORS.paperWhite;
      ctx.fillRect(0, 0, w, h);
      return;
    }
    // 等比缩放填满宽度，垂直居中
    var scale = w / bgImage.width;
    var drawH = bgImage.height * scale;
    var offsetY = (h - drawH) / 2;
    ctx.drawImage(bgImage, 0, offsetY, w, drawH);
  }

  function drawStaticBackground(ctx, w, h) {
    drawBgImage(ctx, w, h);
  }

  function drawGameBackground(ctx, w, h) {
    drawBgImage(ctx, w, h);
  }

  /* ================================================================
   * 竹子绘制
   * ================================================================ */

  function drawBamboo(ctx, bamboo) {
    if (!bamboo.alive && !bamboo.fallPiece) return;

    // 先画下半截 (残留部分) — 应用微风摇晃
    var swayX = bamboo._swayOffset || 0;
    if (bamboo.segments.length > 0) {
      drawBambooStalk(ctx, bamboo.x + swayX, bamboo.topY, bamboo.groundY,
                       bamboo.width, bamboo.segments, bamboo.segHeight);
    }

    // 再画下落碎片
    if (bamboo.fallPiece) {
      drawFallingPiece(ctx, bamboo.fallPiece);
    }
  }

  /**
   * 绘制竹身 (从 topY 到 groundY)
   */
  function drawBambooStalk(ctx, x, topY, groundY, width, segments, segH) {
    if (groundY - topY < 10) return;
    var halfW = width / 2;
    var h = groundY - topY;

    ctx.save();

    // 竹身底色 — 墨竹渐变 (中间淡、边缘深，模拟圆柱体)
    var bodyGrad = ctx.createLinearGradient(x - halfW, 0, x + halfW, 0);
    bodyGrad.addColorStop(0, 'rgba(40,45,35,0.75)');
    bodyGrad.addColorStop(0.2, 'rgba(80,85,70,0.5)');
    bodyGrad.addColorStop(0.45, 'rgba(140,145,120,0.3)');
    bodyGrad.addColorStop(0.55, 'rgba(150,155,130,0.25)');
    bodyGrad.addColorStop(0.8, 'rgba(80,85,70,0.5)');
    bodyGrad.addColorStop(1, 'rgba(40,45,35,0.75)');

    ctx.fillStyle = bodyGrad;
    ctx.fillRect(x - halfW, topY, width, h);

    // 竹身纹理 — 细微纵纹 (手绘感)
    ctx.globalAlpha = 0.08;
    for (var tx = x - halfW + 3; tx <= x + halfW - 3; tx += 4) {
      ctx.strokeStyle = 'rgba(0,0,0,0.6)';
      ctx.lineWidth = 0.5 + Math.random() * 0.3;
      ctx.beginPath();
      ctx.moveTo(tx, topY);
      ctx.lineTo(tx + (Math.random()-0.5)*1.5, groundY);
      ctx.stroke();
    }
    ctx.globalAlpha = 1;

    // 竹身轮廓 — 不规则水墨双线
    ctx.strokeStyle = 'rgba(20,25,18,0.6)';
    ctx.lineWidth = 1.8;
    // 左线 (略带不规则)
    ctx.beginPath();
    ctx.moveTo(x - halfW, topY);
    for (var ly = topY + 15; ly < groundY; ly += 20) {
      ctx.lineTo(x - halfW + (Math.random()-0.5)*0.8, ly);
    }
    ctx.lineTo(x - halfW, groundY);
    ctx.stroke();

    // 右线
    ctx.beginPath();
    ctx.moveTo(x + halfW, topY);
    for (var ry = topY + 15; ry < groundY; ry += 20) {
      ctx.lineTo(x + halfW + (Math.random()-0.5)*0.8, ry);
    }
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

    // ★ 构建整条路径 (一次 stroke 避免关节重叠)
    function buildPath() {
      ctx.beginPath();
      ctx.moveTo(trail[0].x, trail[0].y);
      for (var i = 1; i < trail.length; i++) {
        ctx.lineTo(trail[i].x, trail[i].y);
      }
    }

    // 第1层: 浅蓝冷光边缘 — 固定线宽，整条路径一次画完
    ctx.shadowBlur = 3;
    ctx.shadowColor = 'rgba(180,210,255,0.5)';
    ctx.strokeStyle = 'rgba(180,210,255,0.25)';
    ctx.lineWidth = 12;
    buildPath();
    ctx.stroke();

    // 第2层: 暖白刀光
    ctx.shadowBlur = 0;
    ctx.strokeStyle = 'rgba(255,250,240,0.5)';
    ctx.lineWidth = 5;
    buildPath();
    ctx.stroke();

    // 第3层: 纯白核心
    ctx.strokeStyle = 'rgba(255,255,255,0.85)';
    ctx.lineWidth = 2;
    buildPath();
    ctx.stroke();

    // 刀尖微光
    if (trail.length > 0) {
      var tip = trail[trail.length - 1];
      var g = ctx.createRadialGradient(tip.x, tip.y, 0, tip.x, tip.y, 10);
      g.addColorStop(0, 'rgba(255,255,255,0.9)');
      g.addColorStop(0.4, 'rgba(200,220,255,0.3)');
      g.addColorStop(1, 'rgba(180,210,255,0)');
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(tip.x, tip.y, 10, 0, Math.PI*2);
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



  /* ================================================================
   * 竹叶飘落系统
   * ================================================================ */

  var leaves = [];
  var leafTimer = 0;

  function updateLeaves(dt, w, h) {
    // 定时生成竹叶
    leafTimer += dt;
    if (leafTimer > 1.2 && leaves.length < 20) {
      leafTimer = 0;
      spawnLeaf(w, h);
    }

    // 更新每片叶
    for (var i = leaves.length - 1; i >= 0; i--) {
      var l = leaves[i];
      l.x += l.vx * dt + Math.sin(l.swayPhase) * 18 * dt;
      l.y += l.vy * dt;
      l.swayPhase += l.swaySpeed * dt;
      l.rotation += l.rotSpeed * dt;
      l.opacity -= 0.08 * dt;
      if (l.opacity <= 0 || l.y > h + 60) {
        leaves.splice(i, 1);
      }
    }
  }

  function spawnLeaf(w, h) {
    leaves.push({
      x: Math.random() * w,
      y: -20,
      vx: (Math.random() - 0.5) * 25,
      vy: 15 + Math.random() * 35,
      rotation: Math.random() * Math.PI * 2,
      rotSpeed: (Math.random() - 0.5) * 3,
      swayPhase: Math.random() * Math.PI * 2,
      swaySpeed: 2 + Math.random() * 3,
      size: 5 + Math.random() * 10,
      opacity: 0.3 + Math.random() * 0.4,
      color: Math.random() < 0.5 ? 'rgba(60,80,50,ALPHA)' : 'rgba(80,100,60,ALPHA)'
    });
  }

  function drawLeaves(ctx) {
    for (var i = 0; i < leaves.length; i++) {
      var l = leaves[i];
      ctx.save();
      ctx.globalAlpha = l.opacity;
      ctx.translate(l.x, l.y);
      ctx.rotate(l.rotation);
      // 竹叶 — 细长椭圆
      ctx.fillStyle = l.color.replace('ALPHA', l.opacity.toFixed(2));
      ctx.beginPath();
      ctx.ellipse(0, 0, l.size * 0.7, l.size * 0.2, 0, 0, Math.PI * 2);
      ctx.fill();
      // 叶脉
      ctx.strokeStyle = l.color.replace('ALPHA', (l.opacity * 0.5).toFixed(2));
      ctx.lineWidth = 0.3;
      ctx.beginPath();
      ctx.moveTo(-l.size * 0.6, 0);
      ctx.lineTo(l.size * 0.6, 0);
      ctx.stroke();
      ctx.restore();
    }
  }

  return {
    drawStaticBackground: drawStaticBackground,
    drawGameBackground: drawGameBackground,
    drawBamboo: drawBamboo,
    drawTrail: drawTrail,
    drawParticles: drawParticles,
    getSafeArea: getSafeArea,
    getBottomEdgeArea: getBottomEdgeArea,
    loadBgImage: loadBgImage,
    updateLeaves: updateLeaves,
    drawLeaves: drawLeaves
  };
})();
