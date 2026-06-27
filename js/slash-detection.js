/**
 * slash-detection.js — 竹节碰撞检测
 *
 * 检测划动轨迹与竹子竹节的碰撞。
 */
var SlashDetection = (function() {
  'use strict';

  function checkSlash(trail, bamboos, lastCheckedIdx) {
    if (trail.length < 2 || bamboos.length === 0) return null;

    var startIdx = Math.max(0, lastCheckedIdx);

    for (var i = startIdx; i < trail.length - 1; i++) {
      var segStart = trail[i];
      var segEnd = trail[i + 1];

      for (var j = 0; j < bamboos.length; j++) {
        var b = bamboos[j];
        if (!b.alive || b.broken) continue;

        // 粗检测: 线段 vs 竹子 AABB
        var hitbox = b.getHitbox();
        if (!segmentHitsAABB(segStart, segEnd, hitbox)) continue;

        // 精检测: 每个竹节
        for (var k = 0; k < b.segments.length; k++) {
          var sh = b.getSegmentHitbox(k);
          if (!sh) continue;
          if (segmentHitsAABB(segStart, segEnd, sh)) {
            return {
              bamboo: b,
              bambooIndex: j,
              segIndex: k,
              letter: sh.letter,
              isTarget: sh.isTarget,
              trailIndex: i
            };
          }
        }
      }
    }
    return null;
  }

  function segmentHitsAABB(p1, p2, rect) {
    if (pointInRect(p1, rect) || pointInRect(p2, rect)) return true;
    var edges = [
      {x1:rect.left,y1:rect.top,x2:rect.right,y2:rect.top},
      {x1:rect.right,y1:rect.top,x2:rect.right,y2:rect.bottom},
      {x1:rect.right,y1:rect.bottom,x2:rect.left,y2:rect.bottom},
      {x1:rect.left,y1:rect.bottom,x2:rect.left,y2:rect.top}
    ];
    for (var i=0;i<4;i++) {
      if (segsCross(p1,p2,{x:edges[i].x1,y:edges[i].y1},{x:edges[i].x2,y:edges[i].y2})) return true;
    }
    return false;
  }

  function pointInRect(p, r) {
    return p.x>=r.left && p.x<=r.right && p.y>=r.top && p.y<=r.bottom;
  }

  function segsCross(a1,a2,b1,b2) {
    var d1=cross(b1,b2,a1), d2=cross(b1,b2,a2), d3=cross(a1,a2,b1), d4=cross(a1,a2,b2);
    if (((d1>0&&d2<0)||(d1<0&&d2>0)) && ((d3>0&&d4<0)||(d3<0&&d4>0))) return true;
    if (d1===0&&onSeg(b1,b2,a1)) return true;
    if (d2===0&&onSeg(b1,b2,a2)) return true;
    if (d3===0&&onSeg(a1,a2,b1)) return true;
    if (d4===0&&onSeg(a1,a2,b2)) return true;
    return false;
  }

  function cross(a,b,c) { return (b.x-a.x)*(c.y-a.y)-(b.y-a.y)*(c.x-a.x); }
  function onSeg(a,b,c) { return Math.min(a.x,b.x)<=c.x&&c.x<=Math.max(a.x,b.x) && Math.min(a.y,b.y)<=c.y&&c.y<=Math.max(a.y,b.y); }

  return { checkSlash: checkSlash };
})();
