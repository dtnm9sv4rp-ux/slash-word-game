/**
 * renderer.js — Canvas 绘制 (水墨卷轴背景 + 水墨竹林 + 竹叶)
 */
var Renderer = (function() {
  'use strict';

  var bgImage = null;
  var bgLoaded = false;
  var segImages = [null, null, null, null];  // 4张竹节纹理
  var segLoaded = [false, false, false, false];
  var leaves = [];
  var leafTimer = 0;

  // 预加载竹节纹理
  for (var si = 0; si < 4; si++) {
    (function(idx) {
      var img = new Image();
      img.onload = function() { segLoaded[idx] = true; };
      img.src = 'assets/textures/bamboo-seg-' + idx + '.png';
      segImages[idx] = img;
    })(si);
  }

  /* ================================================================
   * 背景
   * ================================================================ */

  function loadBgImage() {
    if (bgImage) return;
    bgImage = new Image();
    bgImage.onload = function() { bgLoaded = true; };
    bgImage.src = 'assets/textures/scroll-bg.png';
  }

  function getSafeArea() {
    var h = window.innerHeight;
    return {
      top: h * CONFIG.SCROLL_TOP_EDGE,
      bottom: h * (1 - CONFIG.SCROLL_BOTTOM_EDGE)
    };
  }

  function getBottomEdgeArea() {
    var h = window.innerHeight;
    return {
      top: h * (1 - CONFIG.SCROLL_BOTTOM_EDGE),
      bottom: h
    };
  }

  function drawBgImage(ctx, w, h) {
    if (!bgLoaded) {
      loadBgImage();
      ctx.fillStyle = CONFIG.COLORS.paperWhite;
      ctx.fillRect(0, 0, w, h);
      return;
    }
    var scale = w / bgImage.width;
    var drawH = bgImage.height * scale;
    var offsetY = (h - drawH) / 2;
    ctx.drawImage(bgImage, 0, offsetY, w, drawH);
  }

  function drawStaticBackground(ctx, w, h) { drawBgImage(ctx, w, h); }
  function drawGameBackground(ctx, w, h)  { drawBgImage(ctx, w, h); }

  /* ================================================================
   * 竹子绘制 — 水墨风格
   * ================================================================ */

  function drawBamboo(ctx, bamboo) {
    if (!bamboo.alive && !bamboo.fallPiece) return;

    if (bamboo.segments.length > 0) {
      // 渐进摇晃: 根部固定，越往上越大
      var swayAmp = bamboo._swayOffset || 0;
      var totalH = bamboo.groundY - bamboo.topY;
      drawBambooStalk(ctx, bamboo.x, bamboo.topY, bamboo.groundY,
                       bamboo.width, bamboo.segments, bamboo.segHeight,
                       bamboo.texIndex, swayAmp, totalH);
    }
    if (bamboo.fallPiece) {
      drawFallingPiece(ctx, bamboo.fallPiece);
    }
  }

  function drawBambooStalk(ctx, baseX, topY, groundY, width, segments, segH, texIdx, swayAmp, totalH) {
    if (groundY - topY < 10) return;
    var halfW = width / 2;

    ctx.save();

    // 逐段绘制 (每段独立计算摇晃偏移: 离根部越远摇摆越大)
    var segImg = segImages[texIdx || 0];
    var imgReady = segImg && segLoaded[texIdx || 0];

    for (var s = 0; s < segments.length; s++) {
      var segTop = segments[s].y - segH / 2;
      // 渐进摇晃: 从段顶到根部，摇晃线性递减
      var distFromGround = groundY - segments[s].y;
      var swayRatio = distFromGround / (totalH || 1); // 0(根部) ~ 1(顶端)
      var segSway = swayAmp * swayRatio;
      var sx = baseX + segSway;

      if (imgReady) {
        ctx.drawImage(segImg, sx - halfW, segTop, width, segH);
      } else {
        var grad = ctx.createLinearGradient(sx - halfW, 0, sx + halfW, 0);
        grad.addColorStop(0, 'rgba(45,50,40,0.7)');
        grad.addColorStop(0.5, 'rgba(130,135,120,0.3)');
        grad.addColorStop(1, 'rgba(45,50,40,0.7)');
        ctx.fillStyle = grad;
        ctx.fillRect(sx - halfW, segTop, width, segH);
      }

      // 竹节环
      var seg = segments[s];
      var nodeY = seg.y + segH / 2;
      var bulgeW = halfW + CONFIG.BAMBOO_NODE_RADIUS;

      ctx.fillStyle = 'rgba(18,22,14,0.3)';
      ctx.fillRect(sx - bulgeW, nodeY - 2, bulgeW * 2, 4);
      ctx.strokeStyle = 'rgba(12,16,9,0.45)';
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.moveTo(sx - bulgeW, nodeY);
      ctx.lineTo(sx + bulgeW, nodeY);
      ctx.stroke();

      // 字母 — 半透明暗底 + 白字
      drawBambooLetter(ctx, seg.letter, sx, seg.y, halfW);
    }

    // 顶节线
    if (segments.length > 0) {
      var topSeg = segments[0];
      var topNodeY = topSeg.y - segH / 2;
      var topSway = swayAmp * (groundY - topSeg.y) / (totalH || 1);
      var tx = baseX + topSway;
      var bulgeW = halfW + CONFIG.BAMBOO_NODE_RADIUS;
      ctx.fillStyle = 'rgba(18,22,14,0.3)';
      ctx.fillRect(tx - bulgeW, topNodeY - 1.5, bulgeW * 2, 3);
      ctx.strokeStyle = 'rgba(12,16,9,0.45)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(tx - bulgeW, topNodeY);
      ctx.lineTo(tx + bulgeW, topNodeY);
      ctx.stroke();
    }

    ctx.restore();
  }

  function drawBambooLetter(ctx, letter, x, y, halfW) {
    // 文字阴影 (增加在纹理上的可读性)
    ctx.fillStyle = 'rgba(0,0,0,0.45)';
    ctx.font = 'bold ' + CONFIG.BAMBOO_LETTER_SIZE + 'px "Microsoft YaHei","PingFang SC",Arial,sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(letter, x + 1, y + 1);
    // 白色字本体
    ctx.fillStyle = '#f5f0e8';
    ctx.fillText(letter, x, y);
  }

  function drawFallingPiece(ctx, fp) {
    if (fp.opacity <= 0) return;
    ctx.save();
    ctx.globalAlpha = fp.opacity;
    ctx.translate(fp.x, fp.y + fp.height / 2);
    ctx.rotate(fp.rotation);
    ctx.translate(-fp.x, -(fp.y + fp.height / 2));

    var halfW = fp.width / 2;
    var grad = ctx.createLinearGradient(fp.x - halfW, 0, fp.x + halfW, 0);
    grad.addColorStop(0, 'rgba(55,60,50,0.6)');
    grad.addColorStop(0.5, 'rgba(130,135,120,0.3)');
    grad.addColorStop(1, 'rgba(55,60,50,0.6)');
    ctx.fillStyle = grad;
    ctx.fillRect(fp.x - halfW, fp.y, fp.width, fp.height);

    ctx.strokeStyle = 'rgba(25,30,22,0.5)';
    ctx.lineWidth = 1;
    ctx.strokeRect(fp.x - halfW, fp.y, fp.width, fp.height);

    ctx.strokeStyle = 'rgba(50,55,45,0.6)';
    ctx.lineWidth = 1.3;
    ctx.beginPath();
    ctx.moveTo(fp.x - halfW - 2, fp.y + fp.height);
    for (var i = 0; i < halfW * 2 + 4; i += 4) {
      ctx.lineTo(fp.x - halfW - 2 + i, fp.y + fp.height + (i % 8 < 4 ? 2 : -2));
    }
    ctx.stroke();

    ctx.restore();
  }

  /* ================================================================
   * 竹叶飘落
   * ================================================================ */

  function updateLeaves(dt, w, h) {
    leafTimer += dt;
    if (leafTimer > 0.8 && leaves.length < 25) {
      leafTimer = 0;
      spawnLeaf(w, h);
    }
    for (var i = leaves.length - 1; i >= 0; i--) {
      var l = leaves[i];
      l.x += l.vx * dt + Math.sin(l.swayPhase) * 20 * dt;
      l.y += l.vy * dt;
      l.swayPhase += l.swaySpeed * dt;
      l.rotation += l.rotSpeed * dt;
      l.opacity -= 0.06 * dt;
      if (l.opacity <= 0 || l.y > h + 80) leaves.splice(i, 1);
    }
  }

  function spawnLeaf(w, h) {
    leaves.push({
      x: Math.random() * w,
      y: -30,
      vx: (Math.random() - 0.5) * 30,
      vy: 18 + Math.random() * 40,
      rotation: Math.random() * Math.PI * 2,
      rotSpeed: (Math.random() - 0.5) * 3.5,
      swayPhase: Math.random() * Math.PI * 2,
      swaySpeed: 2.5 + Math.random() * 4,
      size: 6 + Math.random() * 12,
      opacity: 0.35 + Math.random() * 0.4
    });
  }

  function drawLeaves(ctx) {
    for (var i = 0; i < leaves.length; i++) {
      var l = leaves[i];
      ctx.save();
      ctx.globalAlpha = l.opacity;
      ctx.translate(l.x, l.y);
      ctx.rotate(l.rotation);

      // 竹叶 — 墨绿色细长椭圆
      ctx.fillStyle = '#6b7a5c';
      ctx.beginPath();
      ctx.ellipse(0, 0, l.size * 0.7, l.size * 0.2, 0, 0, Math.PI * 2);
      ctx.fill();

      // 叶脉
      ctx.strokeStyle = 'rgba(40,50,35,0.35)';
      ctx.lineWidth = 0.4;
      ctx.beginPath();
      ctx.moveTo(-l.size * 0.55, 0);
      ctx.lineTo(l.size * 0.55, 0);
      ctx.stroke();

      ctx.restore();
    }
  }

  /* ================================================================
   * 刀光轨迹 + 粒子
   * ================================================================ */

  function drawTrail(ctx, trail) {
    if (trail.length < 2) return;
    ctx.save();
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    function buildPath() {
      ctx.beginPath();
      ctx.moveTo(trail[0].x, trail[0].y);
      for (var i = 1; i < trail.length; i++) ctx.lineTo(trail[i].x, trail[i].y);
    }

    ctx.shadowBlur = 3;
    ctx.shadowColor = 'rgba(180,210,255,0.5)';
    ctx.strokeStyle = 'rgba(180,210,255,0.25)';
    ctx.lineWidth = 12;
    buildPath();
    ctx.stroke();

    ctx.shadowBlur = 0;
    ctx.strokeStyle = 'rgba(255,250,240,0.5)';
    ctx.lineWidth = 5;
    buildPath();
    ctx.stroke();

    ctx.strokeStyle = 'rgba(255,255,255,0.85)';
    ctx.lineWidth = 2;
    buildPath();
    ctx.stroke();

    if (trail.length > 0) {
      var tip = trail[trail.length - 1];
      var g = ctx.createRadialGradient(tip.x, tip.y, 0, tip.x, tip.y, 10);
      g.addColorStop(0, 'rgba(255,255,255,0.9)');
      g.addColorStop(0.4, 'rgba(200,220,255,0.3)');
      g.addColorStop(1, 'rgba(180,210,255,0)');
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(tip.x, tip.y, 10, 0, Math.PI * 2);
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
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rotation || 0);
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.moveTo(0, -p.size);
        ctx.lineTo(p.size * 0.5, 0);
        ctx.lineTo(0, p.size);
        ctx.lineTo(-p.size * 0.5, 0);
        ctx.closePath();
        ctx.fill();
      } else if (p.type === 'spark') {
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
      } else if (p.type === 'trail') {
        var glow = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.size * 2);
        glow.addColorStop(0, 'rgba(255,255,255,' + alpha + ')');
        glow.addColorStop(0.5, 'rgba(200,200,220,' + (alpha * 0.4) + ')');
        glow.addColorStop(1, 'rgba(255,255,255,0)');
        ctx.fillStyle = glow;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size * 2, 0, Math.PI * 2);
        ctx.fill();
      } else {
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();
    }
  }

  /* ================================================================
   * API
   * ================================================================ */

  return {
    loadBgImage: loadBgImage,
    getSafeArea: getSafeArea,
    getBottomEdgeArea: getBottomEdgeArea,
    drawStaticBackground: drawStaticBackground,
    drawGameBackground: drawGameBackground,
    drawBamboo: drawBamboo,
    drawTrail: drawTrail,
    drawParticles: drawParticles,
    updateLeaves: updateLeaves,
    drawLeaves: drawLeaves
  };
})();
