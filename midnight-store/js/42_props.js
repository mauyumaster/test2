/* ===========================================================
   42_props.js  ——  可玩版补建的物件
   ------------------------------------------------------------
   原模型是给「看」做的，不是给「走」做的，所以缺了几样东西：
   卷一要有一台电话亭，卷一要有公交站牌和一只猫，卷二墙角要有那摞旧书，
   卷四要有店员，卷五要有窗边那个人。

   全部沿用原模型的建构方式：SB.toon 材质 + SB.outline 描边 + 纯几何体，
   不用任何外部模型。这样它看起来还是同一个世界，而不是贴上去的。

   内地面高度 0.215（地板盒子顶面），人行道 0.16 —— 两者差 5.5cm，
   直接按 0.16 摆店内物件会陷进地板里。
   =========================================================== */

(function () {
  var SB = window.SB, THREE = SB.THREE;
  var T = SB.toon, F = SB.flat, box = SB.box, cyl = SB.cyl, plane = SB.plane;
  var FY = 0.16;        /* 人行道 */
  var FI = 0.215;       /* 店内地面 */
  var JP = SB.JP;

  /* ============================================================
     人物：简易三渲二剪影
     默认面朝 +Z。坐着时把 legSeat 打开，髋部抬到 0.45。
     ============================================================ */
  function figure(o) {
    o = o || {};
    var G = SB.g(o.name || 'figure');
    var coat = T(o.coat === undefined ? 0x232a33 : o.coat, { emissive: o.coat === undefined ? 0x232a33 : o.coat, emissiveIntensity: 0.1 });
    var pants = T(o.pants === undefined ? 0x1b2027 : o.pants);
    var skin = T(o.skin === undefined ? 0xd8b494 : o.skin);
    var hair = T(o.hair === undefined ? 0x2b2c30 : o.hair);
    var base = o.y === undefined ? FY : o.y;

    function part(w, h, d, m, x, y, z, ok) {
      return box(w, h, d, m, x, y, z, { parent: G, ok: ok === undefined ? 0.012 : ok });
    }

    if (o.seated) {
      /* 坐姿：大腿水平、小腿垂直、躯干略前倾 */
      part(0.44, 0.13, 0.17, pants, 0, base + 0.44, 0.05);          // 大腿
      part(0.36, 0.14, 0.16, pants, 0, base + 0.44, 0.05);
      part(0.13, 0.42, 0.16, pants, -0.10, base + 0.23, -0.16);     // 小腿
      part(0.13, 0.42, 0.16, pants, 0.10, base + 0.23, -0.16);
      part(0.13, 0.06, 0.22, T(0x14161a), -0.10, base + 0.03, -0.20, 0.008);  // 鞋
      part(0.13, 0.06, 0.22, T(0x14161a), 0.10, base + 0.03, -0.20, 0.008);
      part(0.40, 0.58, 0.24, coat, 0, base + 0.79, -0.03);          // 躯干
      part(0.09, 0.44, 0.12, coat, -0.245, base + 0.80, -0.01);     // 上臂
      part(0.09, 0.44, 0.12, coat, 0.245, base + 0.80, -0.01);
      part(0.075, 0.20, 0.10, skin, -0.245, base + 0.50, 0.06);     // 小臂
      part(0.075, 0.20, 0.10, skin, 0.245, base + 0.50, 0.06);
      cyl(0.05, 0.055, 0.09, 10, skin, 0, base + 1.12, -0.03, { parent: G, cast: false, outline: false });
      part(0.21, 0.24, 0.22, skin, 0, base + 1.28, -0.03);          // 头
      part(0.235, 0.10, 0.245, hair, 0, base + 1.37, -0.03);        // 头发
      part(0.235, 0.13, 0.10, hair, 0, base + 1.29, -0.13);
    } else {
      part(0.14, 0.76, 0.17, pants, -0.095, base + 0.38, 0);        // 腿
      part(0.14, 0.76, 0.17, pants, 0.095, base + 0.38, 0);
      part(0.14, 0.06, 0.23, T(0x14161a), -0.095, base + 0.03, 0.03, 0.008);
      part(0.14, 0.06, 0.23, T(0x14161a), 0.095, base + 0.03, 0.03, 0.008);
      part(0.40, 0.60, 0.25, coat, 0, base + 1.06, 0);              // 躯干
      part(0.10, 0.52, 0.13, coat, -0.25, base + 1.06, 0);          // 臂
      part(0.10, 0.52, 0.13, coat, 0.25, base + 1.06, 0);
      part(0.08, 0.14, 0.11, skin, -0.25, base + 0.73, 0.01);       // 手
      part(0.08, 0.14, 0.11, skin, 0.25, base + 0.73, 0.01);
      cyl(0.05, 0.055, 0.10, 10, skin, 0, base + 1.40, 0, { parent: G, cast: false, outline: false });
      part(0.21, 0.24, 0.22, skin, 0, base + 1.57, 0);              // 头
      part(0.235, 0.11, 0.245, hair, 0, base + 1.66, 0);            // 头发
      part(0.235, 0.14, 0.10, hair, 0, base + 1.58, -0.13);
    }

    /* 制服背心（店员） */
    if (o.vest !== undefined) {
      var vm = T(o.vest, { emissive: o.vest, emissiveIntensity: 0.16 });
      box(0.415, 0.46, 0.26, vm, 0, base + (o.seated ? 0.87 : 1.14), -0.01,
        { parent: G, cast: false, ok: 0.012 });
    }
    G.position.set(o.x || 0, 0, o.z || 0);
    G.rotation.y = o.ry || 0;
    return G;
  }

  /* ============================================================
     电话亭 —— 卷一 phone 的落点
     ============================================================ */
  (function () {
    var G = SB.g('booth');
    var x = -4.15, z = 0.05, W_ = 1.02, H = 2.30;
    var frame = T(0x3b444d), glass = F(0xbfd8e6, {
      transparent: true, opacity: 0.14, side: THREE.DoubleSide, depthWrite: false
    });

    box(W_ + 0.12, 0.10, W_ + 0.12, T(0x2a3138), x, FY + 0.05, z, { parent: G });        // 底座
    /* 四角立柱 */
    [[-1, -1], [1, -1], [-1, 1], [1, 1]].forEach(function (c) {
      box(0.09, H, 0.09, frame, x + c[0] * W_ / 2, FY + 0.10 + H / 2, z + c[1] * W_ / 2, { parent: G });
    });
    /* 三面玻璃 + 背面留门缝 */
    box(W_ - 0.10, H - 0.30, 0.035, glass, x, FY + 0.10 + H / 2, z + W_ / 2, { parent: G, outline: false, cast: false }).renderOrder = 6;
    box(0.035, H - 0.30, W_ - 0.10, glass, x - W_ / 2, FY + 0.10 + H / 2, z, { parent: G, outline: false, cast: false }).renderOrder = 6;
    box(0.035, H - 0.30, W_ - 0.10, glass, x + W_ / 2, FY + 0.10 + H / 2, z, { parent: G, outline: false, cast: false }).renderOrder = 6;
    /* 顶灯箱 */
    var top = SB.signTex([{ t: 'TELEPHONE', size: 0.30, y: 0.34, color: '#ffd9a0' }, { t: '公衆電話', size: 0.26, y: 0.72, color: '#e8f4ff' }],
      { w: 768, h: 256, bg: '#1d3a4e' });
    SB.lightbox(W_ + 0.16, 0.34, W_ + 0.16, top, x, FY + 0.10 + H + 0.17, z, { parent: G, sideColor: 0x172c3c, ok: 0.02, fog: false });
    box(W_ + 0.22, 0.09, W_ + 0.22, T(0x353d45), x, FY + 0.10 + H + 0.02, z, { parent: G });   // 顶盖
    /* 内部：话机 + 卷线 + 台板 */
    box(0.42, 0.05, 0.30, T(0x6f767d), x, FY + 1.02, z - W_ / 2 + 0.17, { parent: G, cast: false });
    box(0.24, 0.30, 0.16, T(0x2f363d), x, FY + 1.20, z - W_ / 2 + 0.12, { parent: G });
    box(0.10, 0.05, 0.13, T(0x151a1f), x - 0.13, FY + 1.30, z - W_ / 2 + 0.20, { parent: G, rz: 0.12, cast: false });
    for (var i = 0; i < 7; i++) {
      cyl(0.006, 0.006, 0.09, 5, T(0x1d2228), x + 0.13, FY + 1.06 - i * 0.075, z - W_ / 2 + 0.18,
        { parent: G, cast: false, outline: false });
    }
    /* 亭内暖光：这一带唯一暖的东西 */
    var l = new THREE.PointLight(0xffd9a0, 1.05, 5.2, 2);
    l.position.set(x, FY + 1.55, z); G.add(l);
    SB.glow(0xffcf8a, 3.4, 0.20, x, FY + 1.45, z, G);
    SB.glow(0x9fd0ff, 2.6, 0.14, x, FY + 2.55, z, G);
  })();

  /* ============================================================
     公交站 —— 卷一 busstop 的落点（站牌 + 长椅 + 小雨棚）
     ============================================================ */
  (function () {
    var G = SB.g('busstop');
    /* 位置：街角小巷口（东侧），不是店门口正中。
       原来放在 x=-1.35 —— 正好在店面正前方，从马路上看它把整间店拦腰截断，
       而这里最该看清的就是那间店。移到东侧后它变成右前景的一层遮挡，
       反而给了画面纵深。 */
    var x = 5.75, z = 0.55;
    /* 站牌杆 */
    cyl(0.045, 0.055, 2.55, 10, T(0x5e6469), x, FY + 1.27, z + 0.30, { parent: G, outline: true, ok: 0.012 });
    /* 牌面：路线与站名 */
    var busTex = SB.signTex([
      { t: '都 01', size: 0.20, y: 0.14, color: '#ffffff' },
      { t: 'あかり坂 通り', size: 0.20, y: 0.36, color: '#1b4f8a' },
      { t: '深夜便 · 最終 01:52', size: 0.13, y: 0.60, color: '#5a626b' },
      { t: '次発 05:11', size: 0.13, y: 0.78, color: '#5a626b' }
    ], { w: 512, h: 512, bg: '#f4f6f8', border: '#1b4f8a' });
    box(0.62, 0.72, 0.05, F(0xffffff, { map: busTex, fog: false }), x, FY + 1.92, z + 0.30,
      { parent: G, outline: false, cast: false });
    box(0.66, 0.05, 0.09, T(0x5e6469), x, FY + 2.29, z + 0.30, { parent: G, cast: false });
    /* 小雨棚 */
    box(1.90, 0.07, 0.86, T(0x8b877f), x, FY + 2.52, z + 0.16, { parent: G });
    box(1.96, 0.14, 0.10, T(0x6f6b63), x, FY + 2.44, z + 0.55, { parent: G, cast: false });
    cyl(0.042, 0.048, 2.48, 10, T(0x8d9298), x - 0.86, FY + 1.24, z + 0.52, { parent: G, outline: true, ok: 0.011 });
    cyl(0.042, 0.048, 2.48, 10, T(0x8d9298), x + 0.86, FY + 1.24, z + 0.52, { parent: G, outline: true, ok: 0.011 });
    /* 长椅 */
    box(1.62, 0.06, 0.42, T(0x6a6257), x, FY + 0.44, z - 0.02, { parent: G });
    box(1.62, 0.06, 0.36, T(0x6a6257), x, FY + 0.75, z - 0.20, { parent: G, rx: -0.22 });
    [-0.68, 0.68].forEach(function (dx) {
      box(0.07, 0.42, 0.07, T(0x4c5259), x + dx, FY + 0.22, z - 0.02, { parent: G, cast: false });
    });
    /* 棚下冷白灯 */
    var l = new THREE.PointLight(0xdce8f5, 0.55, 4.4, 2);
    l.position.set(x, FY + 2.30, z + 0.10); G.add(l);
    SB.glow(0xdce8f5, 2.2, 0.10, x, FY + 2.36, z + 0.10, G);

    /* 站牌下的人 —— 卷一有十二个节点写他（末班 23:40 已经走了，
       他在等一个不会来的东西），但场景里原本没有这个人。
       背对车道站（面朝 -Z），没有伞，头发贴在额头上。 */
    figure({
      name: 'waitingman', x: x - 0.66, z: z + 0.06, ry: Math.PI,
      coat: 0x1e242c, pants: 0x181d23, hair: 0x24252a
    });
  })();

  /* ============================================================
     猫 —— 卷一 cat 的落点。窝在雨棚下、贴玻璃的一角。
     ============================================================ */
  (function () {
    var G = SB.g('cat');
    var x = 0.75, z = -0.88, y = FY;
    var fur = T(0xc98a3c, { emissive: 0x8a5a20, emissiveIntensity: 0.12 });
    var fur2 = T(0xe0d6c4);
    var dark = T(0x1b1f24);
    /* 坐姿：后臀 + 前胸 + 头 */
    box(0.235, 0.215, 0.26, fur, x, y + 0.11, z - 0.02, { parent: G, ok: 0.010 });
    cyl(0.105, 0.115, 0.24, 12, fur, x, y + 0.26, z + 0.02, { parent: G, outline: true, ok: 0.010 });
    box(0.155, 0.140, 0.145, fur, x, y + 0.42, z + 0.03, { parent: G, ok: 0.010 });
    box(0.075, 0.055, 0.055, fur, x, y + 0.40, z + 0.12, { parent: G, cast: false, ok: 0.008 });   // 口鼻
    /* 耳 */
    box(0.055, 0.070, 0.030, fur, x - 0.055, y + 0.50, z + 0.02, { parent: G, rz: 0.22, cast: false, ok: 0.008 });
    box(0.055, 0.070, 0.030, fur, x + 0.055, y + 0.50, z + 0.02, { parent: G, rz: -0.22, cast: false, ok: 0.008 });
    /* 胸口的白 */
    box(0.10, 0.13, 0.03, fur2, x, y + 0.32, z + 0.13, { parent: G, cast: false, ok: 0.007 });
    /* 前爪 */
    box(0.055, 0.05, 0.13, fur2, x - 0.06, y + 0.03, z + 0.14, { parent: G, cast: false, ok: 0.007 });
    box(0.055, 0.05, 0.13, fur2, x + 0.06, y + 0.03, z + 0.14, { parent: G, cast: false, ok: 0.007 });
    /* 尾巴绕到身前 */
    [[0.14, 0.035, 0.0], [0.20, 0.030, -0.10], [0.22, 0.028, -0.20]].forEach(function (t, i) {
      box(t[1] * 2, t[1] * 2, 0.16, fur, x + t[0], y + 0.045, z + t[2], { parent: G, rz: -0.5 + i * 0.25, cast: false, ok: 0.007 });
    });
    /* 眼睛：两点极暗的绿 —— 夜里只能看见这个 */
    box(0.030, 0.022, 0.020, F(0x8fe6a8, { fog: false }), x - 0.048, y + 0.435, z + 0.105, { parent: G, outline: false, cast: false });
    box(0.030, 0.022, 0.020, F(0x8fe6a8, { fog: false }), x + 0.048, y + 0.435, z + 0.105, { parent: G, outline: false, cast: false });
  })();

  /* ============================================================
     墙角那摞旧书 —— 卷二 shelf 的落点
     ============================================================ */
  (function () {
    var G = SB.g('bookpile');
    var x = -4.55, z = -5.72, y = FI;
    var COLS = [0x8a3b32, 0x2f4f6b, 0x4a5240, 0x6b5636, 0x3c3548, 0x7a6a52, 0xa8543f, 0x35424d];
    function stack(ox, oz, n) {
      for (var i = 0; i < n; i++) {
        var h = 0.045 + (i % 3) * 0.008;
        box(0.30 - (i % 2) * 0.02, h, 0.225, T(COLS[(i + n) % COLS.length]),
          x + ox + SB.rnd(-0.012, 0.012), y + 0.023 + i * 0.05, z + oz + SB.rnd(-0.012, 0.012),
          { parent: G, ry: SB.rnd(-0.16, 0.16), ok: 0.008 });
      }
    }
    stack(-0.16, 0.05, 6);
    stack(0.17, -0.04, 4);
    /* 压在顶上的一本摊开的 */
    var a = box(0.30, 0.035, 0.22, T(0x9c8f78), x - 0.16, y + 0.34, z + 0.05, { parent: G, ry: 0.1, ok: 0.008 });
    var b1 = box(0.145, 0.018, 0.21, T(0xe6dfd0), x - 0.245, y + 0.355, z + 0.05, { parent: G, ry: 0.1, rz: 0.07, cast: false, ok: 0.006 });
    var b2 = box(0.145, 0.018, 0.21, T(0xe6dfd0), x - 0.075, y + 0.355, z + 0.05, { parent: G, ry: 0.1, rz: -0.07, cast: false, ok: 0.006 });
    /* 书脊上的白标 */
    for (var k = 0; k < 3; k++) {
      box(0.025, 0.020, 0.06, F(0xe8e2d4, { fog: false }),
        x + 0.02 + k * 0.004, y + 0.03 + (k + 2) * 0.05, z - 0.15, { parent: G, outline: false, cast: false });
    }
    SB.glow(0xffe8c0, 0.9, 0.10, x, y + 0.30, z, G);
  })();

  /* ============================================================
     窗边的台面、凳子与人 —— 卷五 window_seat 的落点
     ============================================================ */
  (function () {
    var G = SB.g('seat');
    /* x 原本是 0.45、台面宽 1.86 —— 右端到 1.38，而收银台的左端在 1.47，
       两者之间只剩 9cm。加上玩家半径各让 34cm 之后，窗边窄台和收银台
       连成一道横向的墙：从门进来只能走到柜台前，店内深处一格都到不了。
       （自检的网格泛洪报的就是这件事：「从出生点能走进店内 0 格」。）
       往西挪并缩到 1.20 之后，中间让出约 0.9m 的过道。 */
    var x = -0.70, z = -1.62, y = FI;
    var CW = 1.20;                       /* 台面宽 */
    /* 沿玻璃的窄台 */
    box(CW, 0.055, 0.40, T(0xd8d2c6), x, y + 0.98, z, { parent: G });
    box(0.06, 0.94, 0.34, T(0xc4beb2), x - CW / 2 + 0.03, y + 0.49, z, { parent: G, cast: false });
    box(0.06, 0.94, 0.34, T(0xc4beb2), x + CW / 2 - 0.03, y + 0.49, z, { parent: G, cast: false });
    box(CW, 0.05, 0.07, T(0xb8b2a6), x, y + 0.72, z - 0.17, { parent: G, cast: false });
    /* 台面上的东西：一只纸杯、一本摊开的册子、一支笔 */
    cyl(0.038, 0.030, 0.115, 12, T(0xf2ede2), x - 0.34, y + 1.065, z + 0.02, { parent: G, outline: true, ok: 0.006 });
    cyl(0.040, 0.040, 0.012, 12, T(0x8b6b4a), x - 0.34, y + 1.128, z + 0.02, { parent: G, cast: false, outline: false });
    box(0.19, 0.014, 0.26, T(0xe8e1d2), x + 0.22, y + 1.017, z + 0.01, { parent: G, ry: 0.16, cast: false, ok: 0.006 });
    box(0.19, 0.014, 0.26, T(0xf2ece0), x + 0.22, y + 1.031, z + 0.01, { parent: G, ry: 0.05, cast: false, ok: 0.006 });
    box(0.135, 0.011, 0.011, T(0x2f3a44), x + 0.44, y + 1.02, z + 0.05, { parent: G, ry: -0.4, cast: false, ok: 0.005 });

    /* 两张凳子 */
    [-0.42, 0.30].forEach(function (dx) {
      cyl(0.155, 0.155, 0.045, 14, T(0xb9a893), x + dx, y + 0.63, z + 0.22, { parent: G, outline: true, ok: 0.010 });
      cyl(0.035, 0.045, 0.60, 10, T(0x6f6a62), x + dx, y + 0.31, z + 0.22, { parent: G, cast: false, outline: true, ok: 0.008 });
      cyl(0.115, 0.115, 0.025, 12, T(0x6f6a62), x + dx, y + 0.02, z + 0.22, { parent: G, cast: false, outline: false });
    });

    /* 那个人：坐着，面朝玻璃（-Z） */
    figure({
      name: 'oldman', x: x + 0.30, z: z + 0.30, ry: Math.PI, y: y,
      coat: 0x2b3038, pants: 0x22262c, hair: 0x9aa0a8, skin: 0xcdb096, seated: true
    });
    /* 台面上一盏小灯，把这一小块照亮 */
    var l = new THREE.PointLight(0xffe0b0, 0.75, 3.0, 2);
    l.position.set(x + 0.2, y + 1.55, z + 0.15); G.add(l);
    SB.glow(0xffdca8, 1.6, 0.14, x + 0.2, y + 1.45, z + 0.15, G);
    /* 灯罩 */
    cyl(0.075, 0.11, 0.13, 12, T(0xe8dcc4), x + 0.62, y + 1.34, z - 0.10,
      { parent: G, outline: true, ok: 0.008 });
    cyl(0.014, 0.014, 0.30, 8, T(0x4a5158), x + 0.62, y + 1.14, z - 0.10, { parent: G, cast: false, outline: false });
    cyl(0.055, 0.062, 0.02, 12, T(0x4a5158), x + 0.62, y + 1.00, z - 0.10, { parent: G, cast: false, outline: false });
  })();

  /* ============================================================
     店员 —— 卷四 counter 的落点。站在收银台左端、面朝门口。
     ============================================================ */
  figure({
    name: 'clerk', x: 1.24, z: -2.62, ry: 0.34, y: FI,
    coat: 0xe4e7ea, pants: 0x2e3a44, hair: 0x22262b, skin: 0xd9bb9c,
    vest: 0x1f6b5c
  });

  /* ============================================================
     名札与台面小物，让店员不只是一个剪影
     ============================================================ */
  (function () {
    var G = SB.g('lamp');
    var tag = SB.signTex([{ t: 'あかり', size: 0.34, y: 0.5, color: '#ffffff' }],
      { w: 256, h: 128, bg: '#0c6b59', border: 'rgba(255,255,255,0.4)' });
    box(0.17, 0.08, 0.02, F(0xffffff, { map: tag, fog: false }), 1.30, FI + 1.20, -2.44,
      { parent: G, cast: false, outline: false });
    /* 收银台边上多放一个暖色小灯箱，夜里从街上望进来能看到这一点绿 */
    SB.glow(0x8ff0d0, 2.0, 0.12, 1.24, FI + 1.25, -2.50, G);
  })();

  /* ============================================================
     玩家自己 —— 俯视第三人称的可见角色
     ------------------------------------------------------------
     第一人称时「我」不必被画出来；换成吊臂视角之后，画面中央必须有
     个东西，否则玩家不知道自己是谁、面朝哪边、走的是不是自己想走的
     那个方向。位置与朝向由 45_walk.js 每帧同步（p.x / p.z / p.face /
     地面高度 / 走路起伏），这里只负责把它造出来并挂到 SB.avatar。

     分组名 'player' 故意不写进 40_world.js 的 SOLID_GROUPS：
     自己不挡自己，也不该成为看热点时的遮挡物。
     ============================================================ */
  (function () {
    var G = figure({
      name: 'player',
      x: SB.player.x, z: SB.player.z, y: 0,
      coat: 0x2c333d, pants: 0x1a1f26, hair: 0x1e2126, skin: 0xd6b193
    });
    G.rotation.y = SB.player.face;
    /* 立领兜帽：从正上方看下去人只剩一坨深色，这个向后凸出的领子
       是俯视图里少数能把「面朝哪边」讲清楚的东西之一。 */
    box(0.30, 0.15, 0.16, T(0x232932, { emissive: 0x232932, emissiveIntensity: 0.1 }),
      0, 1.50, -0.14, { parent: G, ok: 0.01 });
    /* 斜挎包挂在左胯 —— 第二处不对称，也是头顶视角下最醒目的方向线索 */
    box(0.25, 0.21, 0.14, T(0x3c3427), -0.25, 0.86, -0.02, { parent: G, ok: 0.01 });
    /* 脚下的接触阴影：俯视图里没有它，角色会像贴纸一样浮在地砖上 */
    plane(0.78, 0.78, F(0x000000, {
      map: SB.glowTex, transparent: true, opacity: 0.42, depthWrite: false, fog: false
    }), 0, 0.022, 0, { rx: -Math.PI / 2, parent: G, recv: false }).renderOrder = 1;
    SB.avatar = G;
  })();
})();
