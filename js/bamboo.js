/**
 * bamboo.js — 竹子系统
 *
 * 竹子竖直站立，从屏幕底部向上生长。每根竹子有 3-8 个竹节，
 * 每个竹节有一个字母。只有一根竹子包含当前目标字母。
 */
var BambooSystem = (function() {
  'use strict';

  /**
   * 创建一根竹子
   * @param {number} index - 该竹子在单词中的序号 (0-based)
   * @param {number} x - 竹子X坐标 (中心)
   * @param {number} groundY - 地面Y坐标
   * @param {string} targetLetter - 正确字母
   * @param {string[]} distractorPool - 干扰字母候选池
   */
  function create(index, x, groundY, targetLetter, distractorPool) {
    var segCount = Utils.randomInt(CONFIG.BAMBOO_SEGMENTS_MIN, CONFIG.BAMBOO_SEGMENTS_MAX);
    var segH = CONFIG.BAMBOO_SEGMENT_HEIGHT;
    var totalH = segCount * segH;

    // 正确字母藏在随机竹节中
    var targetSeg = Utils.randomInt(0, segCount - 1);

    // 生成竹节字母
    var segments = [];
    for (var i = 0; i < segCount; i++) {
      var letter;
      if (i === targetSeg) {
        letter = targetLetter;
      } else {
        letter = pickDistractor(targetLetter, distractorPool, segments);
      }
      // 竹节Y坐标: 从顶部(最小Y)到底部(groundY)
      var segTop = groundY - totalH + i * segH;
      segments.push({
        letter: letter,
        isTarget: (i === targetSeg),
        y: segTop + segH / 2  // 竹节中心Y
      });
    }

    return {
      id: Utils.generateId(),
      index: index,
      x: x,
      groundY: groundY,
      segments: segments,
      segHeight: segH,
      totalHeight: totalH,
      width: CONFIG.BAMBOO_WIDTH,
      topY: groundY - totalH,

      // 状态
      alive: true,
      isCurrentTarget: (index === 0),  // 初始时第一根是目标
      broken: false,
      brokenAtSegIdx: -1,
      letterFilled: false,

      // 下落碎片 (上半截)
      fallPiece: null,

      /**
       * 获取某个竹节的碰撞盒 (世界坐标)
       */
      getSegmentHitbox: function(segIdx) {
        if (segIdx < 0 || segIdx >= this.segments.length) return null;
        var seg = this.segments[segIdx];
        var halfW = this.width / 2 + CONFIG.BAMBOO_HITBOX_PAD_X;
        return {
          left: this.x - halfW,
          right: this.x + halfW,
          top: seg.y - this.segHeight / 2 - CONFIG.BAMBOO_HITBOX_PAD_Y,
          bottom: seg.y + this.segHeight / 2 + CONFIG.BAMBOO_HITBOX_PAD_Y,
          centerX: this.x,
          centerY: seg.y,
          segIdx: segIdx,
          letter: seg.letter,
          isTarget: seg.isTarget
        };
      },

      /**
       * 获取整根竹子的 AABB (用于粗检测)
       */
      getHitbox: function() {
        var halfW = this.width / 2 + CONFIG.BAMBOO_HITBOX_PAD_X;
        return {
          left: this.x - halfW,
          right: this.x + halfW,
          top: this.topY - 10,
          bottom: this.groundY + 10,
          centerX: this.x,
          centerY: this.groundY - this.totalHeight / 2
        };
      },

      /**
       * 在指定竹节处破坏竹子
       */
      breakAt: function(segIdx) {
        this.broken = true;
        this.brokenAtSegIdx = segIdx;

        // 创建上半截碎片
        var seg = this.segments[segIdx];
        var pieceTop = this.topY;
        var pieceHeight = seg.y - this.segHeight / 2 - this.topY;

        if (pieceHeight > 20) {
          this.fallPiece = {
            x: this.x,
            y: pieceTop,
            width: this.width,
            height: pieceHeight,
            vy: Utils.randomRange(-80, -40),  // 初始向上弹起
            vx: Utils.randomRange(-30, 30),
            rotation: 0,
            rotSpeed: Utils.randomRange(-CONFIG.BAMBOO_FALL_ROTATION, CONFIG.BAMBOO_FALL_ROTATION),
            opacity: 1.0,
            groundY: this.groundY
          };
        }

        // 下半截保留，缩短
        var newTop = seg.y + this.segHeight / 2;
        var remainingSegs = [];
        for (var i = segIdx + 1; i < this.segments.length; i++) {
          remainingSegs.push(this.segments[i]);
        }
        this.segments = remainingSegs;
        if (remainingSegs.length > 0) {
          this.totalHeight = remainingSegs.length * this.segHeight;
          this.topY = newTop;
        } else {
          // 整根竹都被斩断了
          this.alive = false;
        }
      }
    };
  }

  function pickDistractor(excludeLetter, pool, existing) {
    // 优先从单词的干扰字母池中选
    var candidates = [];
    for (var i = 0; i < pool.length; i++) {
      if (pool[i] !== excludeLetter && !hasLetter(existing, pool[i])) {
        candidates.push(pool[i]);
      }
    }
    // 不够则随机字母
    while (candidates.length < 3) {
      var l = String.fromCharCode(65 + Math.floor(Math.random() * 26));
      if (l !== excludeLetter && !hasLetter(existing, l) && candidates.indexOf(l) === -1) {
        candidates.push(l);
      }
    }
    return Utils.randomPick(candidates);
  }

  function hasLetter(segments, letter) {
    for (var i = 0; i < segments.length; i++) {
      if (segments[i].letter === letter) return true;
    }
    return false;
  }

  /**
   * 更新竹子 (下落碎片动画)
   */
  function update(bamboo, dt) {
    if (!bamboo.fallPiece) return;

    var fp = bamboo.fallPiece;

    // 下落
    fp.vy += CONFIG.BAMBOO_FALL_GRAVITY * dt;
    fp.y += fp.vy * dt;
    fp.x += fp.vx * dt;
    fp.rotation += fp.rotSpeed * dt;

    // 淡出
    fp.opacity -= dt / CONFIG.BAMBOO_FALL_FADE_TIME;
    if (fp.opacity <= 0) {
      fp.opacity = 0;
      bamboo.fallPiece = null;
      if (bamboo.segments.length === 0) {
        bamboo.alive = false;
      }
    }
  }

  return {
    create: create,
    update: update
  };
})();
