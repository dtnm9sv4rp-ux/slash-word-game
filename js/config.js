/**
 * config.js — 所有可调常量
 * 修改这里的数值即可调整游戏手感，无需懂游戏逻辑
 */
var CONFIG = {
  /* ===== Canvas ===== */
  CANVAS_BG_COLOR: '#CFCCC5',

  /* ===== Bamboo 竹子 ===== */
  BAMBOO_SEGMENTS_MIN: 3,          // 每根竹子最少竹节数
  BAMBOO_SEGMENTS_MAX: 8,          // 每根竹子最多竹节数
  BAMBOO_SEGMENT_HEIGHT: 58,       // 每节高度 (像素)
  BAMBOO_WIDTH: 22,                // 竹身粗细
  BAMBOO_NODE_RADIUS: 5,           // 竹节凸起半径
  BAMBOO_MARGIN: 70,               // 最左/最右竹子距屏幕边缘距离
  BAMBOO_GROUND_OFFSET: 230,       // 竹子底部距屏幕底部距离 (给HUD留足空间)
  BAMBOO_MIN_HEIGHT: 220,          // 竹子最小总高度 (3节)
  BAMBOO_HITBOX_PAD_X: 14,         // 水平碰撞容差
  BAMBOO_HITBOX_PAD_Y: 4,          // 垂直碰撞容差
  BAMBOO_LETTER_SIZE: 28,          // 竹节字母字号

  // 竹子破坏物理
  BAMBOO_FALL_GRAVITY: 500,        // 上半截下落重力 (px/s²)
  BAMBOO_FALL_ROTATION: 2.5,       // 上半截旋转速度 (rad/s)
  BAMBOO_FALL_FADE_TIME: 1.2,      // 上半截消失时间 (秒)

  /* ===== Slash Trail 划动轨迹 ===== */
  TRAIL_MAX_POINTS: 100,           // 轨迹最大点数
  TRAIL_MIN_DISTANCE: 5,           // 记录轨迹的最小像素间隔 (节流)
  TRAIL_FADE_TIME: 0.15,           // 松手后轨迹残留时间 (秒)
  TRAIL_LINE_WIDTH_MIN: 2,         // 轨迹线条最小宽度
  TRAIL_LINE_WIDTH_MAX: 8,         // 轨迹线条最大宽度

  /* ===== Particles 粒子 ===== */
  MAX_PARTICLES: 100,              // 粒子总数上限
  SLASH_PARTICLE_COUNT: 10,        // 正确弹刀火花数
  BLOOD_PARTICLE_COUNT: 20,        // 错误溅血粒子数
  PARTICLE_GRAVITY: 200,           // 粒子重力 (像素/秒²)
  SLASH_PARTICLE_SPEED_MIN: 100,   // 火花最小速度
  SLASH_PARTICLE_SPEED_MAX: 300,   // 火花最大速度
  BLOOD_PARTICLE_SPEED_MIN: 50,    // 血粒子最小速度
  BLOOD_PARTICLE_SPEED_MAX: 200,   // 血粒子最大速度
  SLASH_PARTICLE_LIFE_MIN: 0.3,    // 火花最短寿命 (秒)
  SLASH_PARTICLE_LIFE_MAX: 0.5,    // 火花最长寿命 (秒)
  BLOOD_PARTICLE_LIFE_MIN: 0.5,    // 血粒子最短寿命 (秒)
  BLOOD_PARTICLE_LIFE_MAX: 1.0,    // 血粒子最长寿命 (秒)

  /* ===== Screen Shake 震屏 ===== */
  SHAKE_INTENSITY: 10,             // 最大偏移像素
  SHAKE_DURATION: 0.3,             // 持续时间 (秒)

  /* ===== Scoring 积分 ===== */
  POINTS_PER_LETTER: 10,           // 每字母基础分
  COMBO_MULTIPLIER_STEP: 0.1,      // 每连击增加的倍率
  COMBO_MILESTONE_1: 5,            // 连击里程碑1
  COMBO_MILESTONE_2: 10,           // 连击里程碑2
  COINS_PER_WORD: 10,              // 每完成一个单词获得金币
  COINS_COMBO_BONUS: 5,            // 达成连击里程碑额外金币

  /* ===== Round 轮次 ===== */
  WORDS_PER_ROUND: 10,             // 每轮单词数

  /* ===== Word Bank 词库 ===== */
  MAX_WORD_BANK_SIZE: 500,         // 词库上限

  /* ===== Difficulty Presets 难度预设 ===== */
  DIFFICULTY: {
    easy:   { speedMultiplier: 0.7, groupSize: 2 },
    medium: { speedMultiplier: 1.0, groupSize: 2 },
    hard:   { speedMultiplier: 1.4, groupSize: 3 }
  },

  /* ===== Shop 商店 ===== */
  SHOP: {
    skins: {
      tangdao: {
        name: '唐刀',
        nameEn: 'Tang Dao',
        cost: 200,
        desc: '唐代直刃刀，简洁凌厉',
        bladeLength: 120, guardWidth: 30, handleLength: 40,
        bladeColor: '#3a3a3a', edgeColor: '#666'
      },
      dachidao: {
        name: '打刀',
        nameEn: 'Uchigatana',
        cost: 350,
        desc: '经典太刀，略带弧度',
        bladeLength: 130, guardWidth: 35, handleLength: 45,
        bladeColor: '#2a2a2a', edgeColor: '#555'
      }
    },
    trails: {
      blackred: {
        name: '不死斩',
        nameEn: 'Mortal Blade',
        cost: 500,
        desc: '黑红水墨轨迹，源自只狼'
      }
    }
  },

  /* ===== Default Skin (太刀 - Tachi) ===== */
  DEFAULT_SKIN: {
    name: '太刀',
    nameEn: 'Tachi',
    bladeLength: 140, guardWidth: 40, handleLength: 50,
    bladeColor: '#2a2a2a', edgeColor: '#444'
  },

  /* ===== Colors (for canvas rendering) ===== */
  COLORS: {
    blood: '#8B0000',
    bloodBright: '#CC0000',
    bloodDark: '#4A0000',
    slashSpark: '#EEEEEE',
    slashBright: '#FFFFFF',
    inkBlack: '#1a1a1a',
    inkGray: '#4a4a4a',
    gold: '#8B7500',
    paperWhite: '#CFCCC5'
  }
};
