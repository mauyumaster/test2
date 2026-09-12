/* 10_store.js — 微缩底座 / 地坪 / 便利店建筑本体（外壳、玻璃、雨棚、招牌） */
(function () {
  const SB = window.SB, THREE = SB.THREE, C = THREE.Color;
  const T = SB.toon, F = SB.flat, box = SB.box, cyl = SB.cyl, plane = SB.plane;

  /* ================= 全局布局常量 ================= */
  SB.LAY = {
    BASE: 8.0,            // 底座半边长（16 x 16）
    SIDE_Y: 0.16,         // 人行道高度
    ROAD_Z: 0.9,          // 人行道 / 车行道交界（z）
    ALLEY_X: 4.6,         // 人行道 / 小巷交界（x）
    STORE: { x0: -6.2, x1: 4.2, z0: -7.0, z1: -1.1, top: 3.5 },
    GLASS: { x0: -5.6, x1: 2.4, y0: 0.66, y1: 2.9 },
    DOOR: { x0: 2.4, x1: 3.6 },
    SIGN: { y: 3.2 }
  };
  const L = SB.LAY;

  /* ================= 底座与地坪 ================= */
  const gGround = SB.g('ground');

  // 底座裙边（微缩模型的厚实基座）
  box(16.2, 1.1, 16.2, T(0x14181f), 0, -0.62, 0, { parent: gGround, ok: 0.02, recv: true });
  box(16.3, 0.09, 16.3, T(0x1e242c), 0, -1.19, 0, { parent: gGround, ok: 0.02 });

  // 车行道 / 小巷沥青面
  const roadMat = T(0x14171d);
  box(16, 0.16, 16, roadMat, 0, -0.08, 0, { parent: gGround, ok: 0.02, cast: false });
  // 小巷水泥地（比沥青略浅、略脏）
  box(3.42, 0.035, 8.9, T(0x1d2126), 6.29, 0.018, -3.55, { parent: gGround, ok: 0.015, cast: false });

  // 人行道台面
  const sideMat = T(0x282c33);
  box(12.6, 0.16, 8.9, sideMat, -1.7, 0.08, -3.55, { parent: gGround, ok: 0.02, cast: false });
  // 路缘石
  const curbMat = T(0x3b4046);
  box(12.6, 0.23, 0.18, curbMat, -1.7, 0.115, 0.99, { parent: gGround, ok: 0.02 });
  box(0.18, 0.23, 8.9, curbMat, 4.69, 0.115, -3.55, { parent: gGround, ok: 0.02 });
  // 街角转角石
  box(0.62, 0.23, 0.62, curbMat, 4.69, 0.115, 0.99, { parent: gGround, ok: 0.02 });

  // 侧沟（沿路缘的排水沟 + 格栅）
  const grateMat = T(0x0f1217);
  for (let i = 0; i < 7; i++) {
    const x = -7.4 + i * 1.72;
    box(1.1, 0.045, 0.46, grateMat, x, 0.012, 1.36, { parent: gGround, ok: 0.01, cast: false });
    for (let k = 0; k < 5; k++) box(0.06, 0.02, 0.4, T(0x1e242b), x - 0.45 + k * 0.22, 0.04, 1.36, { parent: gGround, ok: 0, cast: false });
  }
  for (let i = 0; i < 5; i++) box(0.46, 0.045, 1.1, grateMat, 5.0, 0.012, -0.6 - i * 1.7, { parent: gGround, ok: 0.01, cast: false });

  // 集水井盖
  cyl(0.34, 0.34, 0.03, 18, T(0x171b21), -4.2, 0.175, 0.35, { parent: gGround, cast: false });

  // 底座下方的柔和接触阴影（模型悬浮感）
  const contactTex = SB.tex(256, 256, function (g) {
    const rg = g.createRadialGradient(128, 128, 10, 128, 128, 126);
    rg.addColorStop(0, 'rgba(255,255,255,0.55)');
    rg.addColorStop(0.55, 'rgba(255,255,255,0.18)');
    rg.addColorStop(1, 'rgba(255,255,255,0)');
    g.fillStyle = rg; g.fillRect(0, 0, 256, 256);
  });
  plane(21, 21, F(0x0a1424, { map: contactTex, transparent: true, opacity: 0.85, depthWrite: false, fog: false }), 0, -1.42, 0, { rx: -Math.PI / 2, recv: false });

  /* ================= 便利店：墙体 ================= */
  const S = L.STORE, G = L.GLASS;
  const gStore = SB.g('store');
  const wallMat = T(0x9c968c);
  const innerMat = T(0x8b867c);

  box(10.4, S.top - 0.16, 0.18, wallMat, -1.0, (S.top + 0.16) / 2, -6.91, { parent: gStore });         // 后墙
  box(0.18, S.top - 0.16, 5.9, wallMat, -6.11, (S.top + 0.16) / 2, -4.05, { parent: gStore });          // 左墙
  box(0.18, S.top - 0.16, 5.9, wallMat, 4.11, (S.top + 0.16) / 2, -4.05, { parent: gStore });           // 右墙
  box(0.18, S.top - 0.16, 5.9, innerMat, -5.85, (S.top + 0.16) / 2, -4.05, { parent: gStore, cast: false });
  box(10.7, 0.16, 6.2, T(0x6f6b63), -1.0, S.top + 0.08, -4.05, { parent: gStore });                     // 屋顶板（略出檐）

  // 正立面：左右墙垛 + 玻璃下矮墙 + 玻璃上方招牌带
  box(0.6, S.top - 0.16, 0.22, wallMat, -5.9, (S.top + 0.16) / 2, -1.19, { parent: gStore });
  box(0.6, S.top - 0.16, 0.22, wallMat, 3.9, (S.top + 0.16) / 2, -1.19, { parent: gStore });
  box(8.0, 0.5, 0.2, wallMat, -1.6, 0.41, -1.19, { parent: gStore });
  box(0.1, 2.3, 0.2, wallMat, 2.4, 1.8, -1.19, { parent: gStore });
  box(10.4, 0.6, 0.22, wallMat, -1.0, 3.21, -1.19, { parent: gStore });

  /* ---- 玻璃幕墙 ---- */
  const glassMat = F(0xbfe4ef, { transparent: true, opacity: 0.08, side: THREE.DoubleSide, depthWrite: false });
  const glass = box(G.x1 - G.x0, G.y1 - G.y0, 0.05, glassMat, (G.x0 + G.x1) / 2, (G.y0 + G.y1) / 2, -1.18, { parent: gStore, outline: false, cast: false });
  glass.renderOrder = 6;
  // 玻璃反射条纹（静态一层，动态的一层在 weather 里做滑动水痕）
  plane(G.x1 - G.x0, G.y1 - G.y0, F(0xffffff, {
    map: SB.tex(256, 128, function (g, w, h) {
      g.clearRect(0, 0, w, h);
      for (let i = 0; i < 9; i++) {
        g.save(); g.globalAlpha = 0.05 + Math.random() * 0.06; g.fillStyle = '#dff4ff';
        g.translate(Math.random() * w, 0); g.rotate(-0.22);
        g.fillRect(0, -h, 5 + Math.random() * 12, h * 3); g.restore();
      }
    }), transparent: true, additive: true, depthWrite: false, blend: 1
  }), (G.x0 + G.x1) / 2, (G.y0 + G.y1) / 2, -1.14, { parent: gStore, recv: false }).renderOrder = 7;

  // 竖框与横框
  const mullMat = T(0x8b8681);
  [-5.6, -3.6, -1.6, 0.4, 2.4].forEach(function (x) {
    box(0.09, G.y1 - G.y0 + 0.06, 0.14, mullMat, x, (G.y0 + G.y1) / 2, -1.17, { parent: gStore });
  });
  box(8.1, 0.1, 0.16, mullMat, -1.6, G.y1 + 0.03, -1.17, { parent: gStore });
  box(8.1, 0.1, 0.16, mullMat, -1.6, G.y0 - 0.03, -1.17, { parent: gStore });

  /* ---- 自动门 ---- */
  const D = L.DOOR;
  const doorMat = F(0xcfe9f2, { transparent: true, opacity: 0.2, side: THREE.DoubleSide, depthWrite: false });
  const doorFrame = T(0x81878f);
  SB.doors = [];
  [0, 1].forEach(function (i) {
    const pg = SB.g('door' + i, gStore);
    const w = 0.62;
    const cx = (D.x0 + D.x1) / 2 + (i === 0 ? -w / 2 : w / 2);
    const panel = new THREE.Mesh(new THREE.BoxGeometry(w, 2.72, 0.06), doorMat);
    panel.position.set(cx, 0.16 + 2.72 / 2, -1.18);
    panel.renderOrder = 6; pg.add(panel);
    SB.outline(panel, 0.02);
    // 门框
    const f1 = new THREE.Mesh(new THREE.BoxGeometry(0.06, 2.72, 0.08), doorFrame); f1.position.set(cx - (i ? -w / 2 : w / 2), 0.16 + 2.72 / 2, -1.17); pg.add(f1);
    const f2 = new THREE.Mesh(new THREE.BoxGeometry(0.06, 2.72, 0.08), doorFrame); f2.position.set(cx + (i ? -w / 2 : w / 2), 0.16 + 2.72 / 2, -1.17); pg.add(f2);
    const f3 = new THREE.Mesh(new THREE.BoxGeometry(w, 0.06, 0.08), doorFrame); f3.position.set(cx, 0.19, -1.17); pg.add(f3);
    const f4 = new THREE.Mesh(new THREE.BoxGeometry(w, 0.06, 0.08), doorFrame); f4.position.set(cx, 2.85, -1.17); pg.add(f4);
    const f5 = new THREE.Mesh(new THREE.BoxGeometry(w, 0.05, 0.08), doorFrame); f5.position.set(cx, 1.35, -1.17); pg.add(f5);
    pg.userData.baseX = cx;
    SB.doors.push(pg);
  });
  box(1.24, 0.06, 0.16, T(0xb9c0c8), (D.x0 + D.x1) / 2, 0.19, -1.16, { parent: gStore });      // 门槛
  box(1.26, 0.05, 0.9, T(0x3f4a3f), (D.x0 + D.x1) / 2, 0.19, -0.62, { parent: gStore });        // 门外地垫
  box(1.26, 0.035, 0.9, T(0x46543f), (D.x0 + D.x1) / 2, 0.18, 0.16, { parent: gStore, cast: false });

  /* ================= 雨棚 / 招牌 ================= */
  const brandTex = SB.tex(1024, 176, function (g, w, h) {
    const lg = g.createLinearGradient(0, 0, 0, h);
    lg.addColorStop(0, '#12806b'); lg.addColorStop(0.5, '#0c6b59'); lg.addColorStop(1, '#075448');
    g.fillStyle = lg; g.fillRect(0, 0, w, h);
    g.strokeStyle = 'rgba(255,255,255,0.22)'; g.lineWidth = 4; g.strokeRect(6, 6, w - 12, h - 12);
    // 24 徽标
    g.fillStyle = '#ffffff'; g.beginPath();
    g.moveTo(38, 40); g.arcTo(38, 22, 56, 22, 18); g.lineTo(150, 22); g.arcTo(168, 22, 168, 40, 18);
    g.lineTo(168, h - 40); g.arcTo(168, h - 22, 150, h - 22, 18); g.lineTo(56, h - 22);
    g.arcTo(38, h - 22, 38, h - 40, 18); g.closePath(); g.fill();
    g.fillStyle = '#0c6b59'; g.font = 'bold 92px ' + SB.JP; g.textAlign = 'center'; g.textBaseline = 'middle';
    g.fillText('24', 103, h / 2 + 4);
    g.fillStyle = '#0d3b34'; g.font = 'bold 10px ' + SB.JP;
    // 主文字
    g.fillStyle = '#ffffff'; g.textAlign = 'left';
    g.font = 'bold 76px ' + SB.JP; g.fillText('あかりマート', 200, h / 2 - 6);
    g.fillStyle = 'rgba(220,245,238,0.9)'; g.font = 'bold 34px Arial';
    g.fillText('A K A R I   M A R T', 206, h / 2 + 52);
  });
  SB.signMain = SB.lightbox(8.7, 0.52, 0.12, brandTex, -1.6, 3.21, -1.05, { parent: gStore, sideColor: 0x0b5a4c, ok: 0.02 });
  SB.signGlow = SB.glow(0x63e8c0, 7.6, 0.16, -1.6, 3.21, -0.85, gStore);

  // 雨棚
  const aw = SB.g('awning', gStore);
  box(9.2, 0.1, 1.04, T(0x8b877f), -1.6, 2.79, -0.71, { parent: aw });
  box(9.2, 0.3, 0.14, T(0x0c6b59), -1.6, 2.64, -0.24, { parent: aw });
  box(9.24, 0.34, 0.16, T(0x9a968e), -1.6, 2.64, -0.33, { parent: aw, cast: false });
  // 雨棚底面灯带
  for (let i = 0; i < 5; i++) {
    box(1.4, 0.035, 0.66, F(0xfff3d8), -5.1 + i * 1.76, 2.72, -0.72, { parent: aw, outline: false, cast: false });
  }
  // 雨棚支柱
  cyl(0.05, 0.05, 2.64, 10, T(0x8d9298), -5.95, 1.48, -0.2, { parent: aw, outline: true, ok: 0.012 });
  cyl(0.05, 0.05, 2.64, 10, T(0x8d9298), 2.18, 1.48, -0.2, { parent: aw, outline: true, ok: 0.012 });

  // 侧面竖式灯箱（垂直于立面，正反两面）
  const vTex = SB.signTex([{ t: 'あかり', size: 0.34, y: 0.34 }, { t: 'マート', size: 0.34, y: 0.68 }, { t: '24H', size: 0.2, y: 0.88, color: '#bff7e4' }], { w: 256, h: 640, bg: '#0c6b59', border: 'rgba(255,255,255,0.3)' });
  SB.signVert = SB.lightbox(0.14, 1.5, 0.72, vTex, -5.68, 2.35, -0.52, { parent: gStore, ry: Math.PI / 2, sideColor: 0x0a5a4c, ok: 0.02 });
  SB.lightbox(0.14, 1.5, 0.72, vTex, -5.68, 2.35, -0.52, { parent: gStore, ry: -Math.PI / 2, sideColor: 0x0a5a4c, ok: 0.02 });
  SB.glow(0x5fe0bb, 2.6, 0.2, -5.5, 2.35, -0.52, gStore);

  // 门口 OPEN 灯箱
  const openTex = SB.signTex([{ t: 'OPEN', size: 0.42, y: 0.36, color: '#ff5a4d' }, { t: '24 時間 営業', size: 0.19, y: 0.72 }], { w: 512, h: 256, bg: '#f7f4ee' });
  SB.lightbox(1.06, 0.5, 0.1, openTex, 3.9, 2.2, -1.02, { parent: gStore, sideColor: 0xefece5, ok: 0.02 });
  SB.glow(0xff8a6a, 2.0, 0.16, 3.9, 2.2, -0.9, gStore);

  // 檐下小灯 & 招牌照明
  const L1 = new THREE.PointLight(0xffd6a0, 1.15, 8, 2); L1.position.set(-1.6, 2.5, 0.0); gStore.add(L1);
  const L2 = new THREE.PointLight(0xffddb0, 0.8, 5.5, 2); L2.position.set(3.9, 2.0, -0.35); gStore.add(L2);
  const L3 = new THREE.PointLight(0x9ff0d8, 0.6, 5, 2); L3.position.set(-1.6, 3.1, -0.6); gStore.add(L3);
  /* ================= 屋顶设备（俯视时的层次） ================= */
  (function () {
    const R = SB.g('roof', gStore), ry = S.top + 0.16, mc = T(0x5f5b54);
    // 女儿墙
    box(10.7, 0.26, 0.14, mc, -1.0, ry + 0.13, -7.09, { parent: R, cast: false });
    box(10.7, 0.26, 0.14, mc, -1.0, ry + 0.13, -1.01, { parent: R, cast: false });
    box(0.14, 0.26, 6.2, mc, -6.28, ry + 0.13, -4.05, { parent: R, cast: false });
    box(0.14, 0.26, 6.2, mc, 4.28, ry + 0.13, -4.05, { parent: R, cast: false });
    // 屋顶冷却机组
    box(1.5, 0.8, 0.95, T(0x6b6f75), -4.3, ry + 0.4, -5.9, { parent: R });
    cyl(0.28, 0.28, 0.06, 16, T(0x3d4147), -4.65, ry + 0.84, -5.9, { parent: R, cast: false, outline: true, ok: 0.01 });
    cyl(0.1, 0.1, 0.1, 10, T(0x3d4147), 3.0, ry + 0.2, -6.4, { parent: R, cast: false, outline: false });
    [-0.3, 0.3].forEach(function (dz) { box(0.08, 0.62, 0.08, T(0x2f3237), 2.75, ry + 0.31, -6.4 + dz, { parent: R, cast: false }); });
    cyl(0.5, 0.5, 0.85, 16, T(0x7c7f82), 2.75, ry + 1.05, -6.4, { parent: R, outline: true, ok: 0.014 });   // 水箱
    cyl(0.52, 0.52, 0.08, 16, T(0x60646a), 2.75, ry + 1.5, -6.4, { parent: R, cast: false });
    // 通风管 + 采光罩
    cyl(0.13, 0.13, 1.15, 10, T(0x6f7378), -5.7, ry + 0.58, -3.0, { parent: R, outline: true, ok: 0.012 });
    cyl(0.2, 0.2, 0.14, 12, T(0x52565b), -5.7, ry + 1.22, -3.0, { parent: R, outline: true, ok: 0.012 });
    cyl(0.42, 0.5, 0.26, 14, F(0xdff0f5, { transparent: true, opacity: 0.28, depthWrite: false }), 1.4, ry + 0.13, -4.6, { parent: R, cast: false });
    cyl(0.46, 0.46, 0.1, 14, T(0x5a5e63), 1.4, ry + 0.05, -4.6, { parent: R, cast: false });
    // 天线
    cyl(0.035, 0.045, 1.9, 8, T(0x8a8f95), 3.6, ry + 0.95, -2.0, { parent: R, cast: false, outline: true, ok: 0.008 });
    [0, 1].forEach(function (i) { box(0.5, 0.03, 0.03, T(0x8a8f95), 3.6, ry + 1.5 + i * 0.28, -2.0, { parent: R, cast: false }); });
    // 屋檐下的排气口与灯管痕
    [(-5.0), (-0.4), 3.0].forEach(function (x) { box(0.4, 0.22, 0.3, T(0x6a6e73), x, 3.36, -1.28, { parent: R, cast: false }); });
  })();

  SB.L.entry = L1;
  SB.signFlicker = L3;
})();
