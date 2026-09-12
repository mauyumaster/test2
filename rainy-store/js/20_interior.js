/* 20_interior.js — 便利店内部：货架 / 冷柜 / 便当岛 / 收银台 / 吊挂灯箱 / 导视 */
(function () {
  const SB = window.SB, THREE = SB.THREE;
  const T = SB.toon, F = SB.flat, box = SB.box, cyl = SB.cyl, plane = SB.plane;
  const cache = {};
  // 店内构件统一带一层微弱自发光，保证「室内明亮」不依赖泛光点光源
  const Tc = function (c) { return cache[c] || (cache[c] = T(c, { emissive: c, emissiveIntensity: 0.17 })); };

  const G = SB.g('interior');
  const FY = 0.16;              // 店内地面高度
  const CY = 2.86;              // 吊顶高度
  const FAR = -6.8;             // 内墙面 z

  const PKG = [0xffffff, 0xf2f2f2, 0xe0453b, 0xf08a2c, 0xf5c93b, 0x3f9e5a, 0x2f77c4, 0x7a4bc4, 0x8a5a34, 0xf0a0b8, 0x1f9e94];

  /* ---- 地面 ---- */
  const tile = SB.tex(128, 128, function (g) {
    g.fillStyle = '#efe9dd'; g.fillRect(0, 0, 128, 128);
    g.strokeStyle = '#ded6c6'; g.lineWidth = 3; g.strokeRect(1, 1, 126, 126);
    g.fillStyle = 'rgba(200,190,172,0.35)'; g.fillRect(0, 62, 128, 4); g.fillRect(62, 0, 4, 128);
  });
  tile.wrapS = tile.wrapT = THREE.RepeatWrapping; tile.repeat.set(6, 4);
  box(9.86, 0.05, 5.7, T(0xffffff, { map: tile, emissive: 0xc4bba8, emissiveIntensity: 0.24 }), -0.9, FY + 0.03, -3.98, { parent: G, cast: false });

  /* ---- 吊顶与灯带 ---- */
  box(9.9, 0.08, 5.72, T(0xf4f1ea, { emissive: 0xf4f1ea, emissiveIntensity: 0.3 }), -0.9, CY + 0.04, -3.98, { parent: G, cast: false });
  // 店内明亮内衬（后墙 / 左右墙 / 顶棚），让室内成为画面最亮处
  (function () {
    const lipMat = T(0xf8f4e9, { emissive: 0xffe8c6, emissiveIntensity: 0.3 });
    plane(9.7, 2.72, lipMat, -0.9, FY + 1.36, -6.8, { parent: G, recv: false });                 // 后墙
    plane(5.56, 2.72, lipMat, -5.74, FY + 1.36, -3.98, { parent: G, ry: Math.PI / 2, recv: false });
    plane(5.56, 2.72, lipMat, 3.96, FY + 1.36, -3.98, { parent: G, ry: -Math.PI / 2, recv: false });
    plane(9.7, 5.56, T(0xf4f1ea, { emissive: 0xffeccd, emissiveIntensity: 0.3 }), -0.9, 2.86, -3.98, { parent: G, rx: Math.PI / 2, recv: false });
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
    const l = new THREE.PointLight(0xffe9c8, 2.2, 9, 2); l.position.set(p[0], 2.5, p[1]); G.add(l);
  });

  /* ---- 小工具 ---- */
  function row(parent, x0, x1, y, z, depth, hMin, hMax, ok) {
    let x = x0;
    while (x < x1 - 0.06) {
      const w = Math.min(SB.rnd(0.13, 0.21), x1 - x);
      const h = SB.rnd(hMin, hMax);
      box(w, h, depth, Tc(SB.pick(PKG)), x + w / 2, y + h / 2, z, { parent: parent, outline: !!ok, cast: false, recv: false, ok: 0.006 });
      x += w + 0.018;
    }
  }
  function priceTag(parent, x, y, z) {
    box(0.3, 0.07, 0.015, F(0xfffdf5), x, y, z, { parent: parent, outline: false, cast: false, recv: false });
  }
  function frame(parent, w, h, d, x, y, z, m) {
    box(w, 0.06, d, m, x, y + h / 2, z, { parent: parent, cast: false, recv: false });
    box(w, 0.06, d, m, x, y - h / 2, z, { parent: parent, cast: false, recv: false });
  }
  const whiteMat = Tc(0xf5f3ee), metalMat = Tc(0xc9ced4);

  /* ---- 后墙：零食货架（左） ---- */
  (function () {
    const A = SB.g('shelfA', G), cz = -6.2, scx = -2.95, sw = 3.9;
    box(sw, 0.9, 0.95, Tc(0xe3ded2), scx, FY + 0.45, cz, { parent: A });
    box(sw + 0.02, 1.9, 0.08, Tc(0xcfc8ba), scx, FY + 1.0, FAR + 0.06, { parent: A, cast: false });
    [1.14, 1.48, 1.82].forEach(function (y) {
      box(sw, 0.055, 0.92, whiteMat, scx, y, cz, { parent: A });
      row(A, scx - sw / 2 + 0.1, scx + sw / 2 - 0.1, y + 0.03, cz, 0.6, 0.17, 0.28, false);
      for (let k = 0; k < 4; k++) priceTag(A, scx - sw / 2 + 0.2 + k * 0.95, y + 0.15, cz + 0.33);
    });
    row(A, scx - sw / 2 + 0.05, scx + sw / 2 - 0.05, FY + 0.03, cz, 0.62, 0.22, 0.3, false);
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

  /* ---- 后墙右侧：饮料冷柜（最亮的视觉核心） ---- */
  (function () {
    const B = SB.g('cooler', G), cx = 2.06, cz = -6.34;
    box(3.72, 2.2, 0.9, Tc(0xdfe3e6), cx, FY + 1.1, cz, { parent: B });
    box(3.6, 2.0, 0.06, F(0xeaf6ff, { fog: false }), cx, FY + 1.12, FAR + 0.05, { parent: B, outline: false, cast: false });   // 发光背板
    for (let r = 0; r < 3; r++) {
      const y = FY + 0.42 + r * 0.62;
      box(3.5, 0.05, 0.72, whiteMat, cx, y, cz + 0.06, { parent: B, cast: false });
      const cols = [0x9fd8ff, 0x3f8f4f, 0x6b3a1e, 0xd8342a, 0xffffff, 0xf3d64a, 0x2f77c4];
      for (let i = 0; i < 11; i++) {
        const bx = cx - 1.6 + i * 0.32;
        cyl(0.072, 0.072, SB.rnd(0.2, 0.28), 10, Tc(SB.pick(cols)), bx, y + 0.16, cz + 0.06, { parent: B, cast: false, outline: true, ok: 0.008 });
        cyl(0.055, 0.055, 0.03, 10, Tc(0xdddddd), bx, y + 0.3, cz + 0.06, { parent: B, cast: false, outline: false });
      }
      priceTag(B, cx - 1.9, y + 0.14, cz + 0.42);
    }
    const gl = F(0xcfeaf6, { transparent: true, opacity: 0.16, side: THREE.DoubleSide, depthWrite: false });
    const pane = box(3.66, 2.0, 0.05, gl, cx, FY + 1.12, cz + 0.44, { parent: B, outline: false, cast: false }); pane.renderOrder = 6;
    [-1.84, -0.92, 0, 0.92, 1.84].forEach(function (dx) { box(0.08, 2.02, 0.07, metalMat, cx + dx, FY + 1.12, cz + 0.45, { parent: B, cast: false, recv: false }); });
    const coolTex = SB.signTex([{ t: 'ドリンク ・ ビール', size: 0.5, y: 0.5 }], { w: 1024, h: 128, bg: '#1b6fb8' });
    SB.lightbox(3.7, 0.34, 0.08, coolTex, cx, 2.52, cz + 0.24, { parent: B, ok: 0.02, fog: false });
    SB.glow(0x8fd8ff, 4.6, 0.3, cx, 1.4, cz + 0.5, B);
    const cl = new THREE.PointLight(0xcfeaff, 0.8, 5.5, 2); cl.position.set(cx, 1.5, cz + 0.6); B.add(cl);
  })();

  /* ---- 后墙左侧：后场门 / 时钟 / 储物柜 ---- */
  (function () {
    const D = SB.g('backdoor', G);
    box(0.9, 2.0, 0.08, Tc(0xa9b0b6), -5.28, FY + 1.0, FAR + 0.1, { parent: D });
    box(0.5, 0.42, 0.03, F(0xdfe9f0), -5.28, FY + 1.5, FAR + 0.16, { parent: D, outline: false, cast: false });
    const stTex = SB.signTex([{ t: 'STAFF ONLY', size: 0.34, y: 0.32, color: '#e0453b' }, { t: '関係者以外 立入禁止', size: 0.2, y: 0.66 }], { w: 512, h: 256, bg: '#fbf8f2' });
    plane(0.56, 0.28, F(0xffffff, { map: stTex, fog: false }), -5.28, FY + 1.0, FAR + 0.15, { parent: D, recv: false });
    // 时钟
    const clockTex = SB.tex(256, 256, function (g) {
      g.fillStyle = '#fdfbf6'; g.beginPath(); g.arc(128, 128, 120, 0, 6.3); g.fill();
      g.strokeStyle = '#3a4048'; g.lineWidth = 7; g.beginPath(); g.arc(128, 128, 118, 0, 6.3); g.stroke();
      g.strokeStyle = '#2a2f36'; g.lineWidth = 9; g.beginPath(); g.moveTo(128, 128); g.lineTo(128, 52); g.stroke();
      g.lineWidth = 7; g.beginPath(); g.moveTo(128, 128); g.lineTo(186, 146); g.stroke();
    });
    cyl(0.16, 0.16, 0.05, 20, Tc(0xe6e2d8), -1.4, FY + 2.35, FAR + 0.12, { parent: D, rx: Math.PI / 2, cast: false, outline: true, ok: 0.01 });
    plane(0.28, 0.28, F(0xffffff, { map: clockTex, fog: false }), -1.4, FY + 2.35, FAR + 0.17, { parent: D, recv: false });
  })();

  /* ---- 中央便当 / 饭团 岛台 ---- */
  function island(name, cx, w, z) {
    const I = SB.g(name, G);
    box(w, 0.78, 1.1, Tc(0xeae5da), cx, FY + 0.39, z, { parent: I });
    box(w + 0.04, 0.06, 1.14, Tc(0xd6d0c3), cx, FY + 0.8, z, { parent: I, cast: false });
    [1.06, 1.32].forEach(function (y) {
      box(w - 0.08, 0.05, 1.0, whiteMat, cx, FY + y, z, { parent: I, cast: false });
      row(I, cx - w / 2 + 0.08, cx + w / 2 - 0.08, FY + y + 0.03, z, 0.4, 0.14, 0.22, false);
      row(I, cx - w / 2 + 0.08, cx + w / 2 - 0.08, FY + y + 0.03, z - 0.44, 0.36, 0.14, 0.2, false);
    });
    row(I, cx - w / 2 + 0.06, cx + w / 2 - 0.06, FY + 0.03, z + 0.28, 0.42, 0.2, 0.28, false);
    row(I, cx - w / 2 + 0.06, cx + w / 2 - 0.06, FY + 0.03, z - 0.3, 0.42, 0.2, 0.28, false);
    // 岛台上的价格吊牌
    box(0.5, 0.28, 0.03, F(0xfffdf5), cx - w / 4, FY + 1.5, z, { parent: I, outline: false, cast: false });
    box(0.02, 0.2, 0.02, metalMat, cx - w / 4, FY + 1.72, z, { parent: I, cast: false, recv: false });
    return I;
  }
  island('islandA', -1.05, 2.7, -3.95);
  island('islandB', 2.2, 2.2, -4.15);

  /* ---- 左侧墙面：关东煮 / 热食 / 咖啡机 / 杂志架 ---- */
  (function () {
    const Lw = SB.g('leftwall', G);
    const x = -5.5;
    // 关东煮柜台
    box(0.95, 0.9, 1.5, Tc(0xe8e3d8), x, FY + 0.45, -4.7, { parent: Lw });
    box(0.8, 0.22, 1.35, Tc(0xcfd4d8), x - 0.05, FY + 1.01, -4.7, { parent: Lw, cast: false });
    for (let i = 0; i < 5; i++) box(0.2, 0.06, 0.24, Tc(0xb9c0c4), x - 0.24 + i * 0.02, FY + 1.14, -4.7 - 0.55 + i * 0.28, { parent: Lw, cast: false });
    box(0.1, 0.34, 1.4, F(0xdff0f4, { transparent: true, opacity: 0.25, depthWrite: false }), x - 0.35, FY + 1.3, -4.7, { parent: Lw, outline: false, cast: false });
    // 热食柜
    box(0.85, 0.62, 1.2, Tc(0xdedacf), x - 0.02, FY + 1.31, -6.0, { parent: Lw });
    box(0.72, 0.4, 1.0, F(0xffe6b0, { fog: false }), x + 0.02, FY + 1.3, -6.0, { parent: Lw, outline: false, cast: false });
    for (let i = 0; i < 4; i++) cyl(0.09, 0.09, 0.09, 10, Tc(0xc98a3c), x + 0.1, FY + 1.16, -6.25 + i * 0.22, { parent: Lw, cast: false, outline: false });
    SB.glow(0xffcf87, 1.5, 0.22, x + 0.3, FY + 1.3, -6.0, Lw);
    // 咖啡机
    box(0.62, 0.72, 0.5, Tc(0x3f464e), x, FY + 1.26, -2.35, { parent: Lw });
    box(0.5, 0.2, 0.04, F(0xffd0a0, { fog: false }), x + 0.29, FY + 1.4, -2.35, { parent: Lw, outline: false, cast: false, ry: Math.PI / 2 });
    const cmTex = SB.signTex([{ t: 'COFFEE', size: 0.3, y: 0.34, color: '#ffd9a8' }, { t: 'S 100 / M 150 / L 180', size: 0.16, y: 0.7, color: '#ffffff' }], { w: 512, h: 256, bg: '#2c3238' });
    box(0.5, 0.34, 0.04, F(0xffffff, { map: cmTex, fog: false }), x + 0.3, FY + 1.85, -2.35, { parent: Lw, outline: false, cast: false, ry: Math.PI / 2 });
    // 杂志架
    const mgTex = SB.tex(256, 256, function (g, w, h) {
      g.fillStyle = '#e9e5dc'; g.fillRect(0, 0, w, h);
      for (let r = 0; r < 2; r++) for (let i = 0; i < 3; i++) {
        g.fillStyle = ['#e0453b', '#2f77c4', '#f5c93b', '#3f9e5a', '#f08a2c', '#7a4bc4'][r * 3 + i];
        g.fillRect(10 + i * 82, 12 + r * 122, 66, 108);
      }
    });
    box(0.5, 1.45, 1.4, Tc(0xdcd7cc), x - 0.1, FY + 0.72, -3.25, { parent: Lw });
    plane(1.3, 1.35, F(0xffffff, { map: mgTex, fog: false }), x + 0.16, FY + 0.75, -3.25, { parent: Lw, ry: Math.PI / 2, recv: false });
  })();

  /* ---- 收银台 ---- */
  (function () {
    const R = SB.g('counter', G), cx = 2.75, cz = -2.45;
    box(2.5, 0.86, 0.8, Tc(0xe8e3d8), cx, FY + 0.43, cz, { parent: R });
    box(0.06, 0.86, 0.82, Tc(0x0c6b59), cx - 1.22, FY + 0.43, cz, { parent: R, cast: false });
    box(2.62, 0.07, 0.9, Tc(0xf2efe8), cx, FY + 0.9, cz, { parent: R, cast: false });
    // 收银机
    box(0.44, 0.26, 0.34, Tc(0x353b42), cx - 0.7, FY + 1.06, cz, { parent: R });
    plane(0.3, 0.19, F(0x9fe8d0, { fog: false }), cx - 0.7, FY + 1.16, cz + 0.18, { parent: R, recv: false });
    box(0.44, 0.28, 0.06, Tc(0x353b42), cx - 0.7, FY + 1.28, cz - 0.06, { parent: R, rz: 0.1, cast: false });
    plane(0.36, 0.22, F(0xbdf0dc, { fog: false }), cx - 0.7, FY + 1.29, cz - 0.02, { parent: R, recv: false });
    box(0.18, 0.1, 0.16, Tc(0x4a5158), cx - 0.2, FY + 1.02, cz + 0.08, { parent: R, cast: false });
    box(0.3, 0.2, 0.05, Tc(0x4a5158), cx + 0.3, FY + 1.06, cz + 0.15, { parent: R, cast: false });
    plane(0.26, 0.16, F(0xffd8a8, { fog: false }), cx + 0.3, FY + 1.06, cz + 0.18, { parent: R, recv: false });
    // 台面小物
    box(0.22, 0.3, 0.16, Tc(0xd8d2c6), cx + 0.85, FY + 1.06, cz, { parent: R, cast: false });
    box(0.4, 0.04, 0.3, Tc(0xc9c3b6), cx + 0.05, FY + 0.94, cz + 0.2, { parent: R, cast: false });
    // 后柜 + 香烟柜
    box(2.4, 1.0, 0.5, Tc(0xe3ded3), cx, FY + 0.5, cz - 0.7, { parent: R });
    const cigTex = SB.tex(256, 384, function (g, w, h) {
      g.fillStyle = '#faf7f0'; g.fillRect(0, 0, w, h);
      for (let r = 0; r < 8; r++) for (let i = 0; i < 5; i++) {
        g.fillStyle = ['#e0453b', '#2f77c4', '#f5c93b', '#3f9e5a', '#f08a2c'][(r + i) % 5];
        g.fillRect(12 + i * 48, 14 + r * 46, 40, 36);
      }
    });
    box(0.5, 1.4, 0.9, Tc(0xdfdad0), 3.75, FY + 1.35, -3.0, { parent: R });
    plane(0.85, 1.32, F(0xffffff, { map: cigTex, fog: false }), 3.48, FY + 1.35, -3.0, { parent: R, ry: -Math.PI / 2, recv: false });
    // 台上广告灯箱
    const regTex = SB.signTex([{ t: 'レジ', size: 0.52, y: 0.42, color: '#0c6b59' }, { t: 'お会計はこちら', size: 0.2, y: 0.76, color: '#4a5158' }], { w: 768, h: 256, bg: '#fdfbf5' });
    SB.lightbox(1.5, 0.5, 0.09, regTex, cx - 0.2, 2.42, cz + 0.4, { parent: R, ok: 0.02, fog: false });
  })();

  /* ---- 前场：冰淇淋柜 / 杂志 / 落地货架 ---- */
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
    box(1.3, 1.05, 0.95, Tc(0xdcd8ce), -4.3, FY + 0.52, -2.0, { parent: Fr });
    box(1.34, 0.1, 0.99, F(0xdff0ff, { fog: false }), -4.3, FY + 1.09, -2.0, { parent: Fr, outline: false, cast: false });
    box(0.06, 1.06, 1.0, F(0xffffff, { map: iceTex, fog: false }), -4.3, FY + 0.52, -1.5, { parent: Fr, outline: false, cast: false });
    SB.glow(0xbfe6ff, 2.4, 0.18, -4.3, FY + 1.1, -2.0, Fr);
    // 低矮促销台（靠玻璃但不遮挡视线）
    [-2.75, -1.55].forEach(function (x) {
      box(0.9, 1.15, 0.62, Tc(0xd9d4c9), x, FY + 0.58, -1.85, { parent: Fr });
      row(Fr, x - 0.4, x + 0.4, FY + 0.03, -1.85, 0.5, 0.22, 0.34, false);
      row(Fr, x - 0.4, x + 0.4, FY + 1.2, -1.85, 0.5, 0.16, 0.24, false);
    });
  })();

  /* ---- 吊挂宣传灯箱（透过玻璃最显眼） ---- */
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

  /* ---- 地面导视 ---- */
  const arrowTex = SB.tex(256, 256, function (g, w, h) {
    g.fillStyle = '#2f77c4'; g.beginPath(); g.arc(128, 128, 116, 0, 6.3); g.fill();
    g.fillStyle = '#ffffff';
    g.beginPath(); g.moveTo(128, 46); g.lineTo(196, 132); g.lineTo(152, 132); g.lineTo(152, 208);
    g.lineTo(104, 208); g.lineTo(104, 132); g.lineTo(60, 132); g.closePath(); g.fill();
  });
  [[1.1, -2.2, -0.5], [-3.2, -2.6, 0.4], [-1.0, -5.0, 0.2]].forEach(function (p) {
    plane(0.62, 0.62, F(0xffffff, { map: arrowTex, transparent: true, fog: false }), p[0], FY + 0.062, p[1], { rx: -Math.PI / 2, rz: p[2], parent: G, recv: false });
  });
  plane(0.9, 0.32, F(0xffffff, { map: SB.signTex([{ t: 'レジ →', size: 0.5, y: 0.5, color: '#2f77c4' }], { w: 512, h: 192, bg: 'rgba(255,255,255,0)' }), transparent: true, fog: false }), 1.4, FY + 0.063, -1.8, { rx: -Math.PI / 2, parent: G, recv: false });

  /* ---- 门内迎宾地垫 ---- */
  box(1.30, 0.04, 0.9, Tc(0x4a5b45), 3.0, FY + 0.06, -1.6, { parent: G, ry: 0, cast: false });
  plane(1.05, 0.5, F(0xffffff, { map: SB.signTex([{ t: 'いらっしゃいませ', size: 0.42, y: 0.5, color: '#ffe9b0' }], { w: 768, h: 256, bg: '#4a5b45' }), fog: false }), 3.0, FY + 0.083, -1.6, { rx: -Math.PI / 2, parent: G, recv: false });
})();
