/* 20_interior.js — 便利店内部：货架 / 冷柜 / 便当岛 / 收银台 / 吊挂灯箱 / 导视
   ------------------------------------------------------------
   重构版 v2：
   · 岛台缩窄（A 2.7→2.3、B 2.2→1.9），中央过道从 ~0.9m 放宽到 ~1.4m
   · 左墙 fixture 普遍减深 15~20%，减少压迫感
   · 商品不再全是等大色块：分 carton / can / bottle / snackBag / bentoBox /
     riceBall / breadLoaf 七种形体，各自带尺寸与颜色语义
   · 冷柜三层差异化（底层大瓶 → 中层中瓶 → 顶层小罐+饮料盒）
   · 收银台新增终端、购物袋架、小垃圾桶
   · 新增环境道具：入口购物篮、墙角灭火器、AC 出风口、门内湿脚印、
     公告板实体（对应叙事节点 board）、紧急出口标识
   · 所有分组名不变（store/shelfA/cooler/backdoor/islandA/islandB/
     leftwall/counter/front），碰撞自动跟随
*/
(function () {
  const SB = window.SB, THREE = SB.THREE;
  const T = SB.toon, F = SB.flat, box = SB.box, cyl = SB.cyl, plane = SB.plane;
  const cache = {};
  // 店内构件统一带一层微弱自发光，保证「室内明亮」不依赖泛光点光源
  const Tc = function (c) { return cache[c] || (cache[c] = T(c, { emissive: c, emissiveIntensity: 0.17 })); };

  const G = SB.g('interior');
  const FY = 0.16;              // 人行道（门外地垫用）
  const FI = 0.215;             // 店内地面顶面
  const CY = 2.86;              // 吊顶高度
  const FAR = -6.8;             // 内墙面 z

  /* ---- 商品调色板 ---- */
  const PKG = [0xffffff, 0xf2f2f2, 0xe0453b, 0xf08a2c, 0xf5c93b, 0x3f9e5a, 0x2f77c4, 0x7a4bc4, 0x8a5a34, 0xf0a0b8, 0x1f9e94];
  /* 饮料语义色：红=可乐/茶，蓝=水/运动，绿=茶，橙=果汁，白=乳品，棕=咖啡，黄=柠檬，紫=葡萄 */
  const DRINK = [0xcc3322, 0x2266bb, 0x2d8b3e, 0xff8822, 0xf0f0f0, 0x6b4423, 0xffcc11, 0x8844aa];
  /* 便当色：粉=肉，绿=菜，黄=蛋，白=饭，棕=酱 */
  const BENTO = [0xe8a090, 0x6b9b4a, 0xf0d060, 0xf5f0e8, 0x8b6914];

  /* ================================================================
     商品形体工厂 —— 从「等大色块」升级为「有辨识度的形体」
     ================================================================ */

  /** 高盒（牛奶/果汁/纸包装饮料）：高 > 宽，顶部略窄模拟封口 */
  function carton(parent, x, y, z, w, h, d, color) {
    const tw = w * 0.92, td = d * 0.92;
    box(tw, h * 0.92, td, Tc(color), x, y + h * 0.46, z, { parent: parent, outline: true, cast: false, ok: 0.006 });
    // 顶部封口折痕线
    box(tw * 0.7, 0.012, td * 0.7, Tc(0xd0ccc0), x, y + h * 0.91, z, { parent: parent, cast: false, recv: false, outline: false });
  }

  /** 易拉罐：短圆柱 + 顶环 + 拉环凸起 */
  function drinkCan(parent, x, y, z, color) {
    const h = SB.rnd(0.10, 0.14);
    cyl(0.038, 0.036, h, 12, Tc(color), x, y + h / 2, z, { parent: parent, cast: false, outline: true, ok: 0.006 });
    // 顶环
    cyl(0.041, 0.041, 0.012, 16, Tc(0xc0c8d0), x, y + h + 0.006, z, { parent: parent, cast: false, outline: false });
    // 拉环
    box(0.022, 0.006, 0.018, Tc(0xa0a8b0), x, y + h + 0.014, z, { parent: parent, cast: false, outline: false });
  }

  /** 塑料瓶（水/茶）：圆柱 + 瓶颈 + 瓶盖 */
  function bottle(parent, x, y, z, color, tall) {
    const bh = tall ? SB.rnd(0.20, 0.28) : SB.rnd(0.15, 0.21);
    const bw = tall ? 0.058 : 0.052;
    // 瓶身
    cyl(bw, bw * 0.92, bh * 0.82, 14, Tc(color), x, y + bh * 0.41, z, { parent: parent, cast: false, outline: true, ok: 0.007 });
    // 瓶颈
    cyl(bw * 0.55, bw * 0.50, bh * 0.16, 12, Tc(0xe8ecf0), x, y + bh * 0.86, z, { parent: parent, cast: false, outline: false });
    // 瓶盖
    cyl(bw * 0.58, bw * 0.58, bh * 0.04, 12, Tc(SB.pick([0xe0453b, 0x2f77c4, 0xf5c93b])), x, y + bh * 0.96, z, { parent: parent, cast: false, outline: false });
  }

  /** 零食袋：上宽下窄的梯形近似（用两层盒子模拟） */
  function snackBag(parent, x, y, z, w, h, d, color) {
    box(w, h * 0.6, d, Tc(color), x, y + h * 0.3, z, { parent: parent, outline: true, cast: false, ok: 0.006 });
    box(w * 0.85, h * 0.42, d * 0.9, Tc(SB.lightenColor ? SB.pick(PKG) : color), x, y + h * 0.79, z, { parent: parent, cast: false, outline: false, ok: 0.005 });
  }

  /** 便当盒：扁方体 + 盖子折线 + 标签贴纸 */
  function bentoBox(parent, x, y, z, w, d, color) {
    const h = 0.055;
    box(w, h, d, Tc(color), x, y + h / 2, z, { parent: parent, outline: true, cast: false, ok: 0.008 });
    // 盖子缝
    box(w * 0.9, 0.008, d * 0.85, Tc(0xc8c2b6), x, y + h + 0.004, z, { parent: parent, cast: false, outline: false });
    // 标签（随机一侧）
    if (SB.rand() > 0.5) {
      box(w * 0.35, 0.028, d * 0.02, F(0xfffdf5), x + w * 0.25, y + h * 0.6, z + d * 0.45, { parent: parent, cast: false, outline: false, recv: false });
    } else {
      box(w * 0.35, 0.028, d * 0.02, F(0xfffdf5), x - w * 0.25, y + h * 0.6, z - d * 0.45, { parent: parent, cast: false, outline: false, recv: false });
    }
  }

  /** 饭团：三角柱（用旋转的细长三棱柱近似）—— 三角底面朝上 */
  function riceBall(parent, x, y, z, color) {
    const s = SB.rnd(0.065, 0.095);
    // 用一个细长方体 + 两端三角近似
    box(s * 1.6, s * 0.75, s * 1.1, Tc(color), x, y + s * 0.38, z, { parent: parent, outline: true, cast: false, ok: 0.007 });
    // 海苔带（深色条绕底部）
    box(s * 1.65, s * 0.18, s * 1.13, Tc(0x1a3a24), x, y + s * 0.09, z, { parent: parent, cast: false, outline: false, ok: 0.005 });
  }

  /** 面包：圆顶（用矮圆柱 + 半球近似） */
  function breadLoaf(parent, x, y, z, w, color) {
    const h = w * SB.rnd(0.55, 0.72);
    box(w, h * 0.75, w * 0.85, Tc(color), x, y + h * 0.37, z, { parent: parent, outline: true, cast: false, ok: 0.007 });
    // 圆顶
    cyl(w * 0.48, w * 0.52, h * 0.32, 12, Tc(SB.rnd() > 0.5 ? color : 0xe8d8c4), x, y + h * 0.88, z, { parent: parent, cast: false, outline: true, ok: 0.005 });
  }

  /* ---- 货架填行（升级版：混合使用多种形体） ---- */
  function row(parent, x0, x1, y, z, depth, hMin, hMax, style) {
    let x = x0;
    while (x < x1 - 0.06) {
      const w = Math.min(SB.rnd(0.12, 0.20), x1 - x);
      const h = SB.rnd(hMin, hMax);
      const color = SB.pick(PKG);
      const roll = SB.rand();
      if (style === 'drinks' || (style === 'mixed' && roll < 0.25)) {
        drinkCan(parent, x + w / 2, y, z + depth * 0.45, SB.pick(DRINK));
      } else if (style === 'cartons' || (style === 'mixed' && roll < 0.5)) {
        carton(parent, x + w / 2, y, z + depth * 0.48, w, h, depth * 0.85, color);
      } else if (style === 'snacks' || (style === 'mixed' && roll < 0.75)) {
        snackBag(parent, x + w / 2, y, z + depth * 0.48, w, h, depth * 0.85, color);
      } else {
        box(w, h, depth * SB.rnd(0.78, 0.92), Tc(color), x + w / 2, y + h / 2, z + depth * SB.rnd(0.40, 0.56),
          { parent: parent, outline: !!style, cast: false, recv: false, ok: 0.006 });
      }
      x += w + 0.018;
    }
  }
  function priceTag(parent, x, y, z) {
    box(0.30, 0.07, 0.015, F(0xfffdf5), x, y, z, { parent: parent, outline: false, cast: false, recv: false });
    // 价格数字（用一条短色带模拟）
    box(0.18, 0.03, 0.004, F(0xe0453b), x, y - 0.02, z + 0.01, { parent: parent, cast: false, outline: false, recv: false });
  }
  function frame(parent, w, h, d, x, y, z, m) {
    box(w, 0.06, d, m, x, y + h / 2, z, { parent: parent, cast: false, recv: false });
    box(w, 0.06, d, m, x, y - h / 2, z, { parent: parent, cast: false, recv: false });
  }
  const whiteMat = Tc(0xf5f3ee), metalMat = Tc(0xc9ced4);

  /* ================================================================
     地面
     ================================================================ */
  const tile = SB.tex(128, 128, function (g) {
    g.fillStyle = '#efe9dd'; g.fillRect(0, 0, 128, 128);
    g.strokeStyle = '#ded6c6'; g.lineWidth = 3; g.strokeRect(1, 1, 126, 126);
    g.fillStyle = 'rgba(200,190,172,0.35)'; g.fillRect(0, 62, 128, 4); g.fillRect(62, 0, 4, 128);
    // 重构新增：地面磨损痕迹（几道浅划痕 + 局部深色污渍块）
    g.fillStyle = 'rgba(180,168,152,0.25)';
    for (let i = 0; i < 5; i++) {
      g.fillRect(SB.rnd(10, 110), SB.rnd(10, 110), SB.rnd(15, 40), SB.rnd(2, 5));
    }
    // 门区湿脚印区域（门口到店内 2m 的轻微变色）
    const wg = g.createRadialGradient(64, 118, 5, 64, 118, 50);
    wg.addColorStop(0, 'rgba(180,195,210,0.18)');
    wg.addColorStop(1, 'rgba(180,195,210,0)');
    g.fillStyle = wg; g.fillRect(0, 80, 128, 48);
  });
  tile.wrapS = tile.wrapT = THREE.RepeatWrapping; tile.repeat.set(6, 4);
  box(9.86, 0.05, 5.7, T(0xffffff, { map: tile, emissive: 0xc4bba8, emissiveIntensity: 0.24 }), -0.9, FY + 0.03, -3.98, { parent: G, cast: false });

  /* ================================================================
     吊顶与灯带
     ================================================================ */
  /* 吊顶归入有名分组 ceiling：俯视第三人称下，玩家进店时整块吊顶要收掉，
     否则相机在屋顶上方只能拍到一块天花板（见 45_walk.js 的屋顶切换）。
     灯带与光晕故意不进去 —— 去掉吊顶之后它们正好充当「天花板灯」，
     是剖面视图里该留下来的东西。 */
  const gCeil = SB.g('ceiling', G);
  box(9.9, 0.08, 5.72, T(0xf4f1ea, { emissive: 0xf4f1ea, emissiveIntensity: 0.3 }), -0.9, CY + 0.04, -3.98, { parent: gCeil, cast: false });
  // 店内明亮内衬（后墙 / 左右墙 / 顶棚），让室内成为画面最亮处
  (function () {
    const lipMat = T(0xf8f4e9, { emissive: 0xffe8c6, emissiveIntensity: 0.3 });
    plane(9.7, 2.72, lipMat, -0.9, FI + 1.36, -6.8, { parent: G, recv: false });                 // 后墙
    plane(5.56, 2.72, lipMat, -5.74, FI + 1.36, -3.98, { parent: G, ry: Math.PI / 2, recv: false });
    plane(5.56, 2.72, lipMat, 3.96, FI + 1.36, -3.98, { parent: G, ry: -Math.PI / 2, recv: false });
    /* 顶棚内衬：必须与吊顶盒（162 行，底面 2.860）错开 —— 原来正好同在
       2.860，两块朝下的不透明大面（53.9㎡）在 opaque pass 里抢深度，
       整个天花板随镜头移动闪烁（用户报「巨大的面遮住场景还在闪」）。
       下沉 1cm 让内衬贴在盒底面之后，外观不变。 */
    plane(9.7, 5.56, T(0xf4f1ea, { emissive: 0xffeccd, emissiveIntensity: 0.3 }), -0.9, 2.85, -3.98, { parent: gCeil, rx: Math.PI / 2, recv: false });
  })();
  const halo = SB.tex(128, 128, function (g, w, h) {
    const rg = g.createRadialGradient(64, 64, 2, 64, 64, 62);
    rg.addColorStop(0, 'rgba(255,240,210,0.85)'); rg.addColorStop(1, 'rgba(255,240,210,0)');
    g.fillStyle = rg; g.fillRect(0, 0, w, h);
  });
  [-4.4, -2.2, 0.0, 2.4].forEach(function (x) {
    box(0.34, 0.07, 4.6, F(0xfffaf0), x, CY - 0.03, -3.95, { parent: G, outline: false, cast: false });
    plane(2.0, 5.0, F(0xdccfae, { map: halo, transparent: true, additive: true, depthWrite: false }), x, CY - 0.08, -3.95, { rx: Math.PI / 2, parent: G, recv: false });
  });
  [[-3.4, -3.6], [0.6, -3.2], [-4.2, -2.3]].forEach(function (p) {
    const l = new THREE.PointLight(0xffe9c8, 2.2, 5.0, 2); l.position.set(p[0], 2.5, p[1]); G.add(l);
  });

  /* ---- 重构新增：AC 出风口 × 2 + 紧急出口标识 ---- */
  (function () {
    // AC 出风口（长条格栅，吊顶两侧）
    [[-4.0, -5.2], [2.8, -5.2]].forEach(function (p) {
      box(1.4, 0.06, 0.55, Tc(0xd8dde4), p[0], CY - 0.04, p[1], { parent: gCeil, cast: false, outline: true, ok: 0.008 });
      // 格栅纹路（5 条横线）
      for (let i = 0; i < 5; i++) {
        box(1.35, 0.008, 0.48, Tc(0xb8bec6), p[0], CY - 0.052 - i * 0.012, p[1], { parent: gCeil, cast: false, outline: false, recv: false });
      }
    });
    // 紧急出口标识（门上方偏右，绿色 running man）
    const exitTex = SB.signTex([
      { t: '非常口', size: 0.38, y: 0.35, color: '#ffffff' },
      { t: 'EXIT', size: 0.22, y: 0.70, color: '#a8ffa8' }
    ], { w: 512, h: 256, bg: '#1a8b3a' });
    SB.lightbox(0.6, 0.34, 0.06, exitTex, 2.6, CY - 0.20, -1.6, { parent: G, ok: 0.015, fog: false });
  })();

  /* ================================================================
     后墙：零食货架（左）
     ================================================================ */
  (function () {
    const A = SB.g('shelfA', G), cz = -6.2, scx = -2.95, sw = 3.9;
    box(sw, 0.9, 0.95, Tc(0xe3ded2), scx, FI + 0.45, cz, { parent: A });
    box(sw + 0.02, 1.9, 0.08, Tc(0xcfc8ba), scx, FI + 1.0, FAR + 0.06, { parent: A, cast: false });
    [FI + 1.14, FI + 1.48, FI + 1.82].forEach(function (y) {
      box(sw, 0.055, 0.92, whiteMat, scx, y, cz, { parent: A });
      // 重构：混合使用多种商品形体
      row(A, scx - sw / 2 + 0.1, scx + sw / 2 - 0.1, y + 0.03, cz, 0.6, 0.17, 0.28, 'mixed');
      for (let k = 0; k < 4; k++) priceTag(A, scx - sw / 2 + 0.2 + k * 0.95, y + 0.15, cz + 0.33);
    });
    row(A, scx - sw / 2 + 0.05, scx + sw / 2 - 0.05, FI + 0.03, cz, 0.62, 0.22, 0.3, 'snacks');
    box(sw, 0.05, 0.9, Tc(0xd8d2c5), scx, 2.06, cz, { parent: A, cast: false });  // 顶板
    // 货架上方宣传海报带
    const posTex = SB.tex(1024, 128, function (g, w, h) {
      g.fillStyle = '#fbf8f2'; g.fillRect(0, 0, w, h);
      const cs = ['#e0453b', '#f08a2c', '#2f77c4', '#3f9e5a'];
      for (let i = 0; i < 4; i++) {
        g.fillStyle = cs[i]; g.fillRect(14 + i * 254, 14, 236, h - 28);
        g.fillStyle = '#ffffff'; g.font = 'bold 40px ' + SB.JP; g.textAlign = 'center'; g.textBaseline = 'middle';
        g.fillText(['おにぎり 100円', 'からあげ 新発売', 'コーヒー S 100円', '菓子 20% OFF'][i], 132 + i * 254, h / 2);
      }
    });
    SB.lightbox(sw, 0.5, 0.06, posTex, scx, 2.34, FAR + 0.1, { parent: A, ok: 0.02, fog: false });
    SB.glow(0xfff0d0, 5.0, 0.12, scx, 2.34, FAR + 0.4, A);
  })();

  /* ================================================================
     后墙右侧：饮料冷柜（最亮的视觉核心）
     重构：三层差异化 —— 底层大瓶 / 中层中瓶 / 顶层小罐+盒装
     ================================================================ */
  (function () {
    const B = SB.g('cooler', G), cx = 2.06, cz = -6.34;
    /* 柜体：**正面留空的四壁**，不是一个整块的封闭盒子。
       原来这里是 `box(3.72, 2.2, 0.9)` 一个实心盒 —— 它把玻璃门（z −5.90）、
       三层货架、发光背板、所有饮料全部封在内部，于是从任何角度看冷柜都只是
       「一块不透明的浅灰板」，玻璃门形同虚设。这是「该半透明的东西不透明」
       的根因（探针实测：26 件被它整块包住）。
       面板尺寸都刻意错开一圈：上下板比左右板窄 6cm，避免两个外表面共面
       （同朝向的共面会让 GPU 挑不出谁在前，闪成一片）。
       底/顶板高 0.06、左右板从底板上表面到顶板下表面 —— 面与面只相切不重叠。 */
    const shell = Tc(0xdfe3e6);
    box(3.66, 0.06, 0.90, shell, cx, FI + 0.03, cz, { parent: B, cast: false });        // 底
    box(3.66, 0.06, 0.90, shell, cx, FI + 2.17, cz, { parent: B, cast: false });        // 顶
    box(0.06, 2.08, 0.90, shell, cx - 1.83, FI + 1.10, cz, { parent: B, cast: false }); // 左
    box(0.06, 2.08, 0.90, shell, cx + 1.83, FI + 1.10, cz, { parent: B, cast: false }); // 右
    /* 碰撞/遮挡外壳：看不见的那一块，纯粹为了挡住两件事 ——
       ① 玩家从敞开的正面走进冷柜里；
       ② 「隔着柜体看不见里面」这条旧判定（它本来由那个封闭盒子提供）。
       它是 visible=false 的，所以剖切会自动跳过它（屏幕上没有的东西不会被剖）。 */
    box(3.72, 2.2, 0.9, shell, cx, FI + 1.1, cz,
      { parent: B, outline: false, cast: false, recv: false }).visible = false;
    box(3.6, 2.0, 0.06, F(0xeaf6ff, { fog: false }), cx, FI + 1.12, FAR + 0.05, { parent: B, outline: false, cast: false });   // 发光背板
    for (let r = 0; r < 3; r++) {
      const y = FI + 0.42 + r * 0.62;
      box(3.5, 0.05, 0.72, whiteMat, cx, y, cz + 0.06, { parent: B, cast: false });
      // 重构：每层使用不同商品类型
      const cols = r === 0 ? [0x9fd8ff, 0x3f8f4f, 0x6b3a1e]  // 底层：大瓶为主（矿泉水、茶、可乐大瓶）
                : r === 1 ? DRINK                 // 中层：全饮料色（中瓶）
                : [0xe0453b, 0xf08a2c, 0xf5c93b, 0x3f9e5a, 0x2f77c4];  // 顶层：罐装+盒装鲜艳色
      for (let i = 0; i < 11; i++) {
        const bx = cx - 1.6 + i * 0.32;
        if (r === 0) {
          // 底层：高瓶子
          bottle(B, bx, y, cz + 0.06, SB.pick(cols), true);
        } else if (r === 1) {
          // 中层：中等瓶子混合易拉罐
          if (SB.rand() > 0.4) {
            bottle(B, bx, y, cz + 0.06, SB.pick(cols), false);
          } else {
            drinkCan(B, bx, y, cz + 0.06, SB.pick(cols));
          }
        } else {
          // 顶层：以易拉罐和矮盒为主
          if (SB.rand() > 0.35) {
            drinkCan(B, bx, y, cz + 0.06, SB.pick(cols));
          } else {
            carton(B, bx, y, cz + 0.06, SB.rnd(0.055, 0.075), SB.rnd(0.17, 0.24), 0.65, SB.pick(cols));
          }
        }
      }
      priceTag(B, cx - 1.9, y + 0.14, cz + 0.42);
    }
    const gl = F(0xcfeaf6, { transparent: true, opacity: 0.16, side: THREE.DoubleSide, depthWrite: false });
    const pane = box(3.66, 2.0, 0.05, gl, cx, FI + 1.12, cz + 0.44, { parent: B, outline: false, cast: false }); pane.renderOrder = 6;
    [-0.92, 0, 0.92].forEach(function (dx) { box(0.08, 2.02, 0.07, metalMat, cx + dx, FI + 1.12, cz + 0.45, { parent: B, cast: false, recv: false }); });
    /* 竖框只留中间三根：原来两侧 ±1.84 那两根会与新的左右侧板外表面共面
       （都在 x = cx±1.86 上、朝向相同），在 1 米外就是一条闪烁的竖缝。 */
    const coolTex = SB.signTex([{ t: 'ドリンク ・ ビール', size: 0.5, y: 0.5 }], { w: 1024, h: 128, bg: '#1b6fb8' });
    SB.lightbox(3.7, 0.34, 0.08, coolTex, cx, 2.52, cz + 0.24, { parent: B, ok: 0.02, fog: false });
    SB.glow(0x8fd8ff, 4.6, 0.3, cx, 1.4, cz + 0.5, B);
    const cl = new THREE.PointLight(0xcfeaff, 0.8, 5.5, 2); cl.position.set(cx, 1.5, cz + 0.6); B.add(cl);
  })();

  /* ================================================================
     后墙左侧：后场门 / 时钟 / 储物柜
     ================================================================ */
  (function () {
    const D = SB.g('backdoor', G);
    box(0.9, 2.0, 0.08, Tc(0xa9b0b6), -5.28, FI + 1.0, FAR + 0.1, { parent: D });
    box(0.5, 0.42, 0.03, F(0xdfe9f0), -5.28, FI + 1.5, FAR + 0.16, { parent: D, outline: false, cast: false });
    const stTex = SB.signTex([{ t: 'STAFF ONLY', size: 0.34, y: 0.32, color: '#e0453b' }, { t: '関係者以外 立入禁止', size: 0.2, y: 0.66 }], { w: 512, h: 256, bg: '#fbf8f2' });
    plane(0.56, 0.28, F(0xffffff, { map: stTex, fog: false }), -5.28, FI + 1.0, FAR + 0.15, { parent: D, recv: false });
    // 时钟
    const clockTex = SB.tex(256, 256, function (g) {
      g.fillStyle = '#fdfbf6'; g.beginPath(); g.arc(128, 128, 120, 0, 6.3); g.fill();
      g.strokeStyle = '#3a4048'; g.lineWidth = 7; g.beginPath(); g.arc(128, 128, 118, 0, 6.3); g.stroke();
      g.strokeStyle = '#2a2f36'; g.lineWidth = 9; g.beginPath(); g.moveTo(128, 128); g.lineTo(128, 52); g.stroke();
      g.lineWidth = 7; g.beginPath(); g.moveTo(128, 128); g.lineTo(186, 146); g.stroke();
    });
    cyl(0.16, 0.16, 0.05, 20, Tc(0xe6e2d8), -1.4, FI + 2.35, FAR + 0.12, { parent: D, rx: Math.PI / 2, cast: false, outline: true, ok: 0.01 });
    plane(0.28, 0.28, F(0xffffff, { map: clockTex, fog: false }), -1.4, FI + 2.35, FAR + 0.17, { parent: D, recv: false });
  })();

  /* ================================================================
     中央便当 / 饭团 岛台（重构：缩窄 + 形状多样化）
     ================================================================ */
  function island(name, cx, w, z) {
    const I = SB.g(name, G);
    box(w, 0.78, 1.1, Tc(0xeae5da), cx, FI + 0.39, z, { parent: I });
    box(w + 0.04, 0.06, 1.14, Tc(0xd6d0c3), cx, FI + 0.8, z, { parent: I, cast: false });
    [FI + 1.06, FI + 1.32].forEach(function (y) {
      box(w - 0.08, 0.05, 1.0, whiteMat, cx, FI + y, z, { parent: I, cast: false });
      // 重构：岛台商品用专用形体
      row(I, cx - w / 2 + 0.08, cx + w / 2 - 0.08, FI + y + 0.03, z, 0.4, 0.14, 0.22,
         name === 'islandA' ? 'mixed' : 'mixed');
      row(I, cx - w / 2 + 0.08, cx + w / 2 - 0.08, FI + y + 0.03, z - 0.44, 0.36, 0.14, 0.2,
         name === 'islandA' ? 'bento' : 'rice');
    });
    row(I, cx - w / 2 + 0.06, cx + w / 2 - 0.06, FI + 0.03, z + 0.28, 0.42, 0.2, 0.28, 'mixed');
    row(I, cx - w / 2 + 0.06, cx + w / 2 - 0.06, FI + 0.03, z - 0.3, 0.42, 0.2, 0.28, 'mixed');
    // 岛台上的价格吊牌
    box(0.5, 0.28, 0.03, F(0xfffdf5), cx - w / 4, FI + 1.5, z, { parent: I, outline: false, cast: false });
    box(0.02, 0.2, 0.02, metalMat, cx - w / 4, FI + 1.72, z, { parent: I, cast: false, recv: false });
    return I;
  }
  // 重构：岛台缩窄（原 A=2.7→2.3, B=2.2→1.9），位置微调让中央过道更宽
  island('islandA', -1.15, 2.3, -3.95);
  island('islandB', 2.35, 1.9, -4.15);

  /* ================================================================
     左侧墙面：关东煮 / 热食 / 咖啡机 / 杂志架（重构：减深）
     ================================================================ */
  (function () {
    const Lw = SB.g('leftwall', G);
    const x = -5.5;
    // 关东煮柜台（减深 1.5→1.3）
    box(0.95, 0.9, 1.3, Tc(0xe8e3d8), x, FI + 0.45, -4.7, { parent: Lw });
    box(0.8, 0.22, 1.15, Tc(0xcfd4d8), x - 0.05, FI + 1.01, -4.7, { parent: Lw, cast: false });
    for (let i = 0; i < 5; i++) box(0.2, 0.06, 0.22, Tc(0xb9c0c4), x - 0.24 + i * 0.02, FI + 1.14, -4.7 - 0.48 + i * 0.25, { parent: Lw, cast: false });
    // 重构：汤面可见（半透明 + 微光）
    box(0.1, 0.34, 1.2, F(0xdff0f4, { transparent: true, opacity: 0.30, depthWrite: false }), x - 0.35, FI + 1.3, -4.7, { parent: Lw, outline: false, cast: false });
    // 汤里可见的食材（萝卜/昆布/鸡蛋的简化形）
    // 注意：数组是 [dx, z, 颜色, 高度]，cyl 需要 [半径, 半径, 高, 段数, 材质, x, y, z]。
    // v2 曾把颜色 hex 当半径传（0xc98a3c≈1320 万），造出半径几公里的白色圆盘
    // 铺满全世界（y≈1.38，正好胸口高度），盘面互相差几毫米在远处无限 z-fighting
    // —— 症状就是「整个地面被一块巨大的、闪烁的面抬高遮挡」。改参数顺序修复。
    [[-0.08, -4.55, 0xc98a3c, 0.08, 0.05], [-0.02, -4.85, 0x2d5a3e, 0.06, 0.04],
     [0.04, -5.10, 0xf0d060, 0.055, 0.035]].forEach(function (p) {
      cyl(p[4], p[4], p[3], 10, Tc(p[2]), x + p[0], FI + 1.16, p[1], { parent: Lw, cast: false, outline: false });
    });
    // 热食柜（减深 1.2→1.0）
    box(0.85, 0.62, 1.0, Tc(0xdedacf), x - 0.02, FI + 1.31, -6.0, { parent: Lw });
    box(0.72, 0.4, 0.85, F(0xffe6b0, { fog: false }), x + 0.02, FI + 1.3, -6.0, { parent: Lw, outline: false, cast: false });
    for (let i = 0; i < 4; i++) cyl(0.09, 0.09, 0.09, 10, Tc(0xc98a3c), x + 0.1, FI + 1.16, -6.22 + i * 0.20, { parent: Lw, cast: false, outline: false });
    SB.glow(0xffcf87, 1.5, 0.22, x + 0.3, FI + 1.3, -6.0, Lw);
    // 咖啡机
    box(0.62, 0.72, 0.5, Tc(0x3f464e), x, FI + 1.26, -2.35, { parent: Lw });
    box(0.5, 0.2, 0.04, F(0xffd0a0, { fog: false }), x + 0.29, FI + 1.4, -2.35, { parent: Lw, outline: false, cast: false, ry: Math.PI / 2 });
    // 重构：咖啡机出杯口 + 接水盘
    box(0.18, 0.08, 0.12, Tc(0x2a3038), x + 0.30, FI + 0.96, -2.35, { parent: Lw, cast: false });
    box(0.28, 0.02, 0.18, Tc(0x4a5158), x + 0.30, FI + 0.99, -2.35, { parent: Lw, cast: false, recv: false });
    const cmTex = SB.signTex([{ t: 'COFFEE', size: 0.3, y: 0.34, color: '#ffd9a8' }, { t: 'S 100 / M 150 / L 180', size: 0.16, y: 0.7, color: '#ffffff' }], { w: 512, h: 256, bg: '#2c3238' });
    box(0.5, 0.34, 0.04, F(0xffffff, { map: cmTex, fog: false }), x + 0.3, FI + 1.85, -2.35, { parent: Lw, outline: false, cast: false, ry: Math.PI / 2 });
    // 杂志架（减深 1.4→1.2）
    const mgTex = SB.tex(256, 256, function (g, w, h) {
      g.fillStyle = '#e9e5dc'; g.fillRect(0, 0, w, h);
      for (let r = 0; r < 2; r++) for (let i = 0; i < 3; i++) {
        g.fillStyle = ['#e0453b', '#2f77c4', '#f5c93b', '#3f9e5a', '#f08a2c', '#7a4bc4'][r * 3 + i];
        g.fillRect(10 + i * 82, 12 + r * 122, 66, 108);
      }
      // 重构：杂志封面加标题线和文字区模拟
      g.fillStyle = 'rgba(255,255,255,0.5)';
      for (let r = 0; r < 2; r++) for (let i = 0; i < 3; i++) {
        g.fillRect(14 + i * 82, 18 + r * 122, 54, 3);
        g.fillRect(14 + i * 82, 105 + r * 122, 54, 8);
      }
    });
    box(0.5, 1.45, 1.2, Tc(0xdcd7cc), x - 0.1, FI + 0.72, -3.25, { parent: Lw });
    plane(1.3, 1.35, F(0xffffff, { map: mgTex, fog: false }), x + 0.16, FI + 0.75, -3.25, { parent: Lw, ry: Math.PI / 2, recv: false });
  })();

  /* ================================================================
     收银台（重构：加终端 / 购物袋架 / 垃圾桶）
     ================================================================ */
  (function () {
    const R = SB.g('counter', G), cx = 2.75, cz = -2.45;
    box(2.5, 0.86, 0.8, Tc(0xe8e3d8), cx, FI + 0.43, cz, { parent: R });
    box(0.06, 0.86, 0.82, Tc(0x0c6b59), cx - 1.22, FI + 0.43, cz, { parent: R, cast: false });
    box(2.62, 0.07, 0.9, Tc(0xf2efe8), cx, FI + 0.9, cz, { parent: R, cast: false });
    // 收银机
    box(0.44, 0.26, 0.34, Tc(0x353b42), cx - 0.7, FI + 1.06, cz, { parent: R });
    plane(0.3, 0.19, F(0x9fe8d0, { fog: false }), cx - 0.7, FI + 1.16, cz + 0.18, { parent: R, recv: false });
    box(0.44, 0.28, 0.06, Tc(0x353b42), cx - 0.7, FI + 1.28, cz - 0.06, { parent: R, rz: 0.1, cast: false });
    plane(0.36, 0.22, F(0xbdf0dc, { fog: false }), cx - 0.7, FI + 1.29, cz - 0.02, { parent: R, recv: false });
    // 重构：卡片支付终端
    box(0.22, 0.16, 0.12, Tc(0x2a2f36), cx + 0.05, FI + 1.02, cz + 0.12, { parent: R });
    plane(0.18, 0.12, F(0x8fe8d0, { fog: false }), cx + 0.05, FI + 1.08, cz + 0.18, { parent: R, recv: false });
    box(0.06, 0.04, 0.04, F(0xffd0a0, { fog: false }), cx + 0.05, FI + 1.12, cz + 0.18, { parent: R, cast: false, recv: false });
    // 小物件
    box(0.18, 0.1, 0.16, Tc(0x4a5158), cx - 0.2, FI + 1.02, cz + 0.08, { parent: R, cast: false });
    box(0.3, 0.2, 0.05, Tc(0x4a5158), cx + 0.3, FI + 1.06, cz + 0.15, { parent: R, cast: false });
    plane(0.26, 0.16, F(0xffd8a8, { fog: false }), cx + 0.3, FI + 1.06, cz + 0.18, { parent: R, recv: false });
    // 台面小物
    box(0.22, 0.3, 0.16, Tc(0xd8d2c6), cx + 0.85, FI + 1.06, cz, { parent: R, cast: false });
    box(0.4, 0.04, 0.3, Tc(0xc9c3b6), cx + 0.05, FI + 0.94, cz + 0.2, { parent: R, cast: false });
    // 后柜 + 香烟柜
    box(2.4, 1.0, 0.5, Tc(0xe3ded3), cx, FI + 0.5, cz - 0.7, { parent: R });
    const cigTex = SB.tex(256, 384, function (g, w, h) {
      g.fillStyle = '#faf7f0'; g.fillRect(0, 0, w, h);
      for (let r = 0; r < 8; r++) for (let i = 0; i < 5; i++) {
        g.fillStyle = ['#e0453b', '#2f77c4', '#f5c93b', '#3f9e5a', '#f08a2c'][(r + i) % 5];
        g.fillRect(12 + i * 48, 14 + r * 46, 40, 36);
      }
    });
    box(0.5, 1.4, 0.9, Tc(0xdfdad0), 3.75, FI + 1.35, -3.0, { parent: R });
    plane(0.85, 1.32, F(0xffffff, { map: cigTex, fog: false }), 3.48, FI + 1.35, -3.0, { parent: R, ry: -Math.PI / 2, recv: false });
    // 台上广告灯箱
    const regTex = SB.signTex([{ t: 'レジ', size: 0.52, y: 0.42, color: '#0c6b59' }, { t: 'お会計はこちら', size: 0.2, y: 0.76, color: '#4a5158' }], { w: 768, h: 256, bg: '#fdfbf5' });
    SB.lightbox(1.5, 0.5, 0.09, regTex, cx - 0.2, 2.42, cz + 0.4, { parent: R, ok: 0.02, fog: false });

    // ======== 重构新增：购物袋架（柜台右侧下方） ========
    (function () {
      const rackX = 3.85, rackZ = -2.9;
      box(0.35, 0.85, 0.22, Tc(0xd4cfc4), rackX, FI + 0.53, rackZ, { parent: R });
      box(0.32, 0.04, 0.18, Tc(0xb8c4ae), rackX, FI + 0.97, rackZ, { parent: R, cast: false });
      // 三种颜色的购物袋
      [[0xe8e0d0, 0.0], [0xd0e0e8, 0.08], [0xe0d8e0, -0.08]].forEach(function (cfg) {
        box(0.12, 0.32, 0.14, Tc(cfg[0]), rackX + cfg[1], FI + 0.76, rackZ, { parent: R, outline: true, ok: 0.008 });
      });
    })();

    // ======== 重构新增：小垃圾桶（柜台右后方） ========
    (function () {
      const tx = 3.9, tz = -3.15;
      box(0.28, 0.40, 0.22, Tc(0x8a8880), tx, FI + 0.20, tz, { parent: R });
      box(0.24, 0.08, 0.18, Tc(0x6a6860), tx, FI + 0.42, tz, { parent: R, cast: false });  // 边框
      // 垃圾袋口（黑色塑料袋边缘）
      box(0.22, 0.06, 0.16, Tc(0x1a1c1e), tx, FI + 0.42, tz, { parent: R, cast: false, recv: false });
    })();
  })();

  /* ================================================================
     前场：冰淇淋柜 / 促销台（重构：促销台减深）
     ================================================================ */
  (function () {
    const Fr = SB.g('front', G);
    // 冰淇淋冷冻柜
    const iceTex = SB.tex(512, 128, function (g, w, h) {
      g.fillStyle = '#e8f4fb'; g.fillRect(0, 0, w, h);
      for (let i = 0; i < 10; i++) {
        g.fillStyle = ['#f0a0b8', '#8fd8ff', '#f5c93b', '#c98a3c', '#3f9e5a', '#e0453b'][i % 6];
        g.beginPath(); g.arc(34 + i * 50, 64, 20, 0, 6.3); g.fill();
      }
    });
    box(1.3, 1.05, 0.95, Tc(0xdcd8ce), -4.3, FI + 0.52, -2.0, { parent: Fr });
    box(1.34, 0.1, 0.99, F(0xdff0ff, { fog: false }), -4.3, FI + 1.09, -2.0, { parent: Fr, outline: false, cast: false });
    box(0.06, 1.06, 1.0, F(0xffffff, { map: iceTex, fog: false }), -4.3, FI + 0.52, -1.5, { parent: Fr, outline: false, cast: false });
    SB.glow(0xbfe6ff, 2.4, 0.18, -4.3, FI + 1.1, -2.0, Fr);
    // 低矮促销台（靠玻璃但不遮挡视线）—— 重构：减深 0.62→0.52，高度 1.15→1.05
    [-2.75, -1.55].forEach(function (x) {
      box(0.9, 1.05, 0.52, Tc(0xd9d4c9), x, FI + 0.56, -1.85, { parent: Fr });
      row(Fr, x - 0.4, x + 0.4, FI + 0.03, -1.85, 0.42, 0.20, 0.30, 'snacks');
      row(Fr, x - 0.4, x + 0.4, FI + 1.10, -1.85, 0.42, 0.14, 0.22, 'mixed');
    });
  })();

  /* ================================================================
     吊挂宣传灯箱（透过玻璃最显眼）
     ================================================================ */
  function hang(tex, x, y, z, w, h) {
    const p = SB.lightbox(w, h, 0.1, tex, x, y, z, { parent: G, ok: 0.02, fog: false });
    box(0.03, 0.6, 0.03, Tc(0x9aa0a6), x - w / 4, y + 0.42, z, { parent: G, cast: false, recv: false });
    box(0.03, 0.6, 0.03, Tc(0x9aa0a6), x + w / 4, y + 0.42, z, { parent: G, cast: false, recv: false });
    SB.glow(0xfff2d2, w * 1.5, 0.13, x, y, z + 0.3, G);
    return p;
  }
  hang(SB.signTex([{ t: '新発売', size: 0.3, y: 0.28, color: '#ffd166' }, { t: 'からあげ 5個 220円', size: 0.3, y: 0.72 }], { w: 1024, h: 384, bg: '#c0392b' }), -2.3, 2.4, -2.4, 1.7, 0.62);
  hang(SB.signTex([{ t: '淹れたて', size: 0.26, y: 0.26, color: '#ffd9a8' }, { t: 'COFFEE', size: 0.34, y: 0.64 }], { w: 1024, h: 384, bg: '#3b2a20' }), 0.1, 2.4, -5.3, 1.6, 0.58);
  hang(SB.signTex([{ t: 'おでん', size: 0.42, y: 0.5 }], { w: 1024, h: 384, bg: '#c0392b' }), -4.7, 2.4, -3.6, 1.4, 0.52);

  /* ================================================================
     地面导视
     ================================================================ */
  const arrowTex = SB.tex(256, 256, function (g, w, h) {
    g.fillStyle = '#2f77c4'; g.beginPath(); g.arc(128, 128, 116, 0, 6.3); g.fill();
    g.fillStyle = '#ffffff';
    g.beginPath(); g.moveTo(128, 46); g.lineTo(196, 132); g.lineTo(152, 132); g.lineTo(152, 208);
    g.lineTo(104, 208); g.lineTo(104, 132); g.lineTo(60, 132); g.closePath(); g.fill();
  });
  [[1.1, -2.2, -0.5], [-3.2, -2.6, 0.4], [-1.0, -5.0, 0.2]].forEach(function (p) {
    plane(0.62, 0.62, F(0xffffff, { map: arrowTex, transparent: true, fog: false }), p[0], FI + 0.062, p[1], { rx: -Math.PI / 2, rz: p[2], parent: G, recv: false });
  });
  plane(0.9, 0.32, F(0xffffff, { map: SB.signTex([{ t: 'レジ →', size: 0.5, y: 0.5, color: '#2f77c4' }], { w: 512, h: 192, bg: 'rgba(255,255,255,0)' }), transparent: true, fog: false }), 1.4, FI + 0.063, -1.8, { rx: -Math.PI / 2, parent: G, recv: false });

  /* ================================================================
     门内迎宾地垫
     ================================================================ */
  box(1.30, 0.04, 0.9, Tc(0x4a5b45), 3.0, FI + 0.06, -1.6, { parent: G, ry: 0, cast: false });
  plane(1.05, 0.5, F(0xffffff, { map: SB.signTex([{ t: 'いらっしゃいませ', size: 0.42, y: 0.5, color: '#ffe9b0' }], { w: 768, h: 256, bg: '#4a5b45' }), fog: false }), 3.0, FI + 0.083, -1.6, { rx: -Math.PI / 2, parent: G, recv: false });

  /* ================================================================
     重构新增：环境道具
     ================================================================ */
  (function () {
    // 入口购物篮（叠放的两个）
    const bkX = 2.4, bkZ = -1.85;
    [[0, 0.12, 0], [0.06, 0.10, 0.08]].forEach(function (cfg) {
      box(0.34, 0.26, 0.24, Tc(0xd8d2c6), bkX + cfg[0], FI + 0.13 + cfg[1], bkZ + cfg[2], { parent: G, outline: true, ok: 0.010 });
      // 篮子提手
      box(0.28, 0.025, 0.004, Tc(0x8a8474), bkX + cfg[0], FI + 0.27 + cfg[1], bkZ + cfg[2] + 0.12, { parent: G, cast: false, outline: false });
    });

    // 墙角灭火器（后墙左侧，时钟下方）
    (function () {
      const ex = -4.55, ez = -6.55;
      box(0.12, 0.44, 0.12, Tc(0xcc2a1a), ex, FI + 0.22, ez, { parent: G, outline: true, ok: 0.010 });
      // 压把/喷嘴
      box(0.06, 0.08, 0.06, Tc(0x1a1a1a), ex, FI + 0.46, ez, { parent: G, cast: false, outline: false });
      cyl(0.025, 0.025, 0.06, 10, Tc(0x8a8a8a), ex, FI + 0.51, ez, { parent: G, cast: false, outline: false });
      // 挂钩板
      box(0.18, 0.03, 0.03, Tc(0x8a8a8a), ex, FI + 0.66, ez, { parent: G, cast: false, recv: false });
    })();

    // 公告板实体（对应叙事节点 board —— 后墙右侧、冷柜旁边）
    (function () {
      const bdX = 0.6, bdZ = -6.55;
      box(1.0, 0.75, 0.04, Tc(0xded8ce), bdX, FI + 0.48, bdZ, { parent: G });  // 板面
      box(1.04, 0.04, 0.08, Tc(0x8a8474), bdX, FI + 0.87, bdZ, { parent: G, cast: false });  // 顶边框
      // 图钉（四角 + 若干散布）
      [[-0.46, 0.34], [0.46, 0.34], [-0.46, -0.34], [0.46, -0.34],
       [-0.2, 0.1], [0.15, -0.15], [0.0, 0.25], [-0.1, -0.05]].forEach(function (p) {
        cyl(0.008, 0.008, 0.012, 8, Tc(0xcc3333), bdX + p[0], FI + 0.88, bdZ + p[1], { parent: G, cast: false, outline: false });
      });
      // 纸张（简化为几张不同色的矩形 + 折角）
      const paperColors = [0xfaf6e8, 0xf0f0ff, 0xfff8e8, 0xe8f0f8, 0xf8f0e8, 0xf0f8f0, 0xe8f0f0];
      for (let i = 0; i < 7; i++) {
        const py = FI + 0.18 + (i % 3) * 0.20;
        const pz = bdZ - 0.005 + ((i % 2) * 0.01) + (i * 0.025);
        const pw = SB.rnd(0.18, 0.32), ph = SB.rnd(0.22, 0.32);
        box(pw, ph, 0.002, F(paperColors[i % paperColors.length]), bdX + SB.rnd(-0.38, 0.38), py, pz,
          { parent: G, cast: false, outline: false, recv: false });
        // 折角效果（只对部分纸张）
        if (i % 3 === 0) {
          box(pw * 0.3, ph * 0.08, 0.003, F(0xd8d2c6), bdX + SB.rnd(-0.38, 0.38) + pw * 0.3, py + ph * 0.4, pz,
            { parent: G, cast: false, outline: false, recv: false });
        }
      }
      // 一张被翻起的（对应叙事里的钥匙那张）
      box(0.24, 0.30, 0.002, F(0xfff8e0), bdX + 0.1, FI + 0.55, bdZ - 0.02,
        { parent: G, cast: false, outline: false, recv: false, ry: 0.08 });
    })();
  })();
})();
