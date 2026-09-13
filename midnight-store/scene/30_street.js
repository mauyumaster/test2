/* 30_street.js — 街道元素：贩卖机 / 自行车 / 电线杆 / 信号灯 / 护栏 / 斑马线 / 小巷 / 邻楼 */
(function () {
  const SB = window.SB, THREE = SB.THREE;
  const T = SB.toon, F = SB.flat, box = SB.box, cyl = SB.cyl, plane = SB.plane;
  const G = SB.g('street'), SY = SB.LAY.SIDE_Y, ROAD = SB.LAY.ROAD_Z, AX = SB.LAY.ALLEY_X;
  const cache = {};
  const Tc = function (c) { return cache[c] || (cache[c] = T(c)); };
  const concrete = Tc(0x31363d), concreteD = Tc(0x24292f), beamMat = Tc(0x767c83), paintW = F(0x4e5254);

  /* ================= 路面标线 ================= */
  const gMark = SB.g('markings', G);
  [0.45, 1.35, 2.25, 3.15].forEach(function (x) {           // 横断步道（反光斑马线）
    const m = plane(0.5, 6.4, F(0x565a58, { transparent: true, opacity: 0.66 }), x, 0.012, 4.5, { rx: -Math.PI / 2, parent: gMark, recv: false });
    m.material.depthWrite = false;
  });
  for (let i = 0; i < 9; i++)                                // 中央虚线
    plane(1.1, 0.14, paintW, -7.4 + i * 1.75, 0.011, 4.6, { rx: -Math.PI / 2, parent: gMark, recv: false });
  plane(16, 0.12, F(0x7d8280, { transparent: true, opacity: 0.5 }), 0, 0.011, 1.28, { rx: -Math.PI / 2, parent: gMark, recv: false });
  plane(6.6, 0.26, paintW, 0.6, 0.012, 1.9, { rx: -Math.PI / 2, parent: gMark, recv: false });   // 停止线
  // 停止线旁「止まれ」路面文字
  plane(2.2, 1.1, F(0x5c6062, {
    transparent: true, opacity: 0.75, map: SB.tex(512, 256, function (g, w, h) {
      g.clearRect(0, 0, w, h); g.fillStyle = '#ffffff'; g.font = 'bold 150px ' + SB.JP;
      g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('止まれ', w / 2, h / 2);
    })
  }), 2.0, 0.013, 3.0, { rx: -Math.PI / 2, parent: gMark, recv: false });
  // 停车位
  const bay = SB.g('parking', G);
  [-7.4, -5.4, -3.4].forEach(function (x) { plane(0.1, 3.3, paintW, x, 0.012, 3.35, { rx: -Math.PI / 2, parent: bay, recv: false }); });
  plane(4.1, 0.1, paintW, -5.4, 0.012, 5.0, { rx: -Math.PI / 2, parent: bay, recv: false });
  [-6.4, -4.4].forEach(function (x) { box(0.6, 0.14, 0.22, Tc(0xd8d2c6), x, 0.07, 4.72, { parent: bay }); });
  // 点字ブロック（盲道）
  const dotTex = SB.tex(64, 64, function (g) {
    g.fillStyle = '#8a7028'; g.fillRect(0, 0, 64, 64);
    g.fillStyle = '#6d571d'; g.beginPath(); g.arc(32, 32, 13, 0, 6.3); g.fill();
  });
  dotTex.wrapS = dotTex.wrapT = THREE.RepeatWrapping; dotTex.repeat.set(26, 1);
  box(11.8, 0.028, 0.42, T(0xffffff, { map: dotTex }), -1.7, SY + 0.014, 0.62, { parent: gMark, cast: false });
  box(0.42, 0.028, 0.34, Tc(0x8a7028), 1.8, SY + 0.014, 0.92, { parent: gMark, cast: false });

  /* ================= 贩卖机 ================= */
  function vending(x, bodyColor, panelColor, kind) {
    const V = SB.g('vending', G);
    const tex = SB.tex(512, 1024, function (g, w, h) {
      g.fillStyle = '#f7f9fa'; g.fillRect(0, 0, w, h);
      g.fillStyle = panelColor; g.fillRect(0, 0, w, 150);
      g.fillStyle = '#ffffff'; g.font = 'bold 88px ' + SB.JP; g.textAlign = 'center'; g.textBaseline = 'middle';
      g.fillText(kind, w / 2, 78);
      for (let r = 0; r < 4; r++) {
        g.fillStyle = '#e6ecef'; g.fillRect(30, 180 + r * 118, w - 60, 100);
        for (let i = 0; i < 5; i++) {
          g.fillStyle = ['#e0453b', '#2f77c4', '#3f9e5a', '#f5c93b', '#c98a3c', '#f0a0b8'][(r * 5 + i) % 6];
          g.beginPath(); g.roundRect ? g.roundRect(46 + i * 88, 190 + r * 118, 62, 80, 8) : g.rect(46 + i * 88, 190 + r * 118, 62, 80); g.fill();
        }
        g.fillStyle = '#2a2f36'; g.font = 'bold 26px Arial'; g.textAlign = 'left';
        g.fillText('130', 36, 238 + r * 118);
      }
      g.fillStyle = bodyColor; g.fillRect(0, 660, w, 70);
      g.fillStyle = '#ffffff'; g.font = 'bold 34px ' + SB.JP; g.textAlign = 'center';
      g.fillText('つめた〜い / あたたか〜い', w / 2, 698);
      g.fillStyle = '#2a2f36'; g.fillRect(40, 780, w - 80, 90);
      g.fillStyle = '#454c54'; g.fillRect(60, 800, w - 120, 50);
    });
    box(0.9, 0.08, 0.84, Tc(0x3a4048), x, SY + 0.04, -0.55, { parent: V, cast: false });
    SB.lightbox(0.88, 1.9, 0.78, tex, x, SY + 1.05, -0.55, { parent: V, sideColor: bodyColor, ok: 0.024 });
    box(0.9, 0.1, 0.8, F(bodyColor, { fog: false }), x, SY + 2.02, -0.55, { parent: V, outline: false, cast: false });
    SB.glow(bodyColor, 2.4, 0.26, x, SY + 1.2, -0.05, V);
    const l = new THREE.PointLight(bodyColor, 0.85, 4.6, 2); l.position.set(x, SY + 1.2, -0.1); V.add(l);
    return V;
  }
  vending(-7.55, 0x2f7fc4, '#1b5c9e', 'つめたい');
  vending(-6.62, 0xc9473f, '#a8342c', 'あたたかい');
  // 贩卖机背后的矮墙（西侧邻地围墙）
  box(1.9, 2.05, 0.22, concrete, -7.1, SY + 1.02, -1.06, { parent: G });
  box(1.96, 0.1, 0.28, Tc(0x757b85), -7.1, SY + 2.08, -1.06, { parent: G, cast: false });

  /* ================= 自行车 ================= */
  (function () {
    const B = SB.g('bike', G);
    const frame = Tc(0x2f4f6b), chrome = Tc(0x7d838a), rubber = Tc(0x1b1f24), seatM = Tc(0x22262c);
    function wheel(x) {
      const w = new THREE.Mesh(new THREE.TorusGeometry(0.33, 0.026, 8, 22), rubber);
      w.position.set(x, 0.33, 0); w.castShadow = true; B.add(w); SB.outline(w, 0.008);
      for (let i = 0; i < 5; i++) {
        const s = new THREE.Mesh(new THREE.BoxGeometry(0.62, 0.014, 0.014), chrome);
        s.position.set(x, 0.33, 0); s.rotation.z = i * Math.PI / 5; B.add(s);
      }
      cyl(0.045, 0.045, 0.09, 8, chrome, x, 0.33, 0, { parent: B, rz: Math.PI / 2, cast: false, outline: false });
    }
    wheel(-0.52); wheel(0.52);
    function tube(x1, y1, x2, y2, r) {
      const dx = x2 - x1, dy = y2 - y1, len = Math.hypot(dx, dy);
      const m = new THREE.Mesh(new THREE.CylinderGeometry(r, r, len, 7), frame);
      m.position.set((x1 + x2) / 2, (y1 + y2) / 2, 0);
      m.rotation.z = Math.atan2(dy, dx) - Math.PI / 2; m.castShadow = true; B.add(m); SB.outline(m, 0.008);
    }
    tube(-0.52, 0.33, -0.12, 0.68, 0.026); tube(-0.12, 0.68, 0.3, 0.62, 0.026);
    tube(-0.12, 0.68, 0.34, 0.33, 0.026); tube(0.3, 0.62, 0.52, 0.33, 0.022);
    tube(0.3, 0.62, 0.42, 0.92, 0.024); tube(0.42, 0.92, 0.52, 0.94, 0.02);
    tube(-0.12, 0.68, -0.2, 0.92, 0.022); tube(-0.2, 0.92, -0.05, 0.94, 0.02);
    box(0.26, 0.07, 0.12, seatM, -0.16, 0.97, 0, { parent: B });
    box(0.44, 0.05, 0.05, chrome, 0.46, 0.98, 0, { parent: B, rz: 0.1 });
    cyl(0.03, 0.03, 0.34, 8, chrome, 0.36, 0.86, 0, { parent: B, rx: Math.PI / 2, cast: false, outline: false });
    box(0.3, 0.24, 0.24, Tc(0x8d959c), 0.46, 0.78, 0.06, { parent: B });       // 前篮
    cyl(0.028, 0.028, 0.62, 8, chrome, 0.02, 0.5, 0, { parent: B, rz: 0.15, cast: false, outline: false }); // 停车支架
    B.position.set(-6.58, SY, 0.42);
    B.rotation.y = 0.24; B.rotation.z = 0.04;
  })();

  /* ================= 雨伞架 / 垃圾桶 ================= */
  (function () {
    const U = SB.g('umbrella', G);
    cyl(0.23, 0.2, 0.5, 14, Tc(0x5f656b), 1.95, SY + 0.25, -0.82, { parent: U, outline: true, ok: 0.012 });
    const cols = [0xd94f5c, 0x3f6fb5, 0x2f7d6a, 0xe0b83f, 0x6b4fa0];
    for (let i = 0; i < 5; i++) {
      const a = i * 1.32, r = 0.11;
      const p = new THREE.Vector3(1.95 + Math.cos(a) * r, SY + 0.62, -0.82 + Math.sin(a) * r);
      cyl(0.016, 0.016, 0.66, 6, Tc(cols[i]), p.x, p.y, p.z, { parent: U, rz: Math.cos(a) * 0.24, rx: -Math.sin(a) * 0.24, cast: false, outline: false });
      box(0.06, 0.05, 0.06, Tc(0x5a6068), p.x + Math.cos(a) * 0.04, SY + 0.96, p.z + Math.sin(a) * 0.04, { parent: U, cast: false });
    }
    // 三分类垃圾桶（小巷口）
    const Tg = SB.g('bins', G);
    [[5.02, 0x2f7fc4], [5.62, 0xe0b83f], [6.22, 0xc9473f]].forEach(function (b) {
      box(0.52, 0.82, 0.52, Tc(0x42474e), b[0], 0.41, -0.72, { parent: Tg });
      box(0.56, 0.12, 0.56, F(b[1], { fog: false }), b[0], 0.87, -0.72, { parent: Tg, outline: false, cast: false });
      box(0.36, 0.05, 0.36, Tc(0x2a2f35), b[0], 0.95, -0.72, { parent: Tg, cast: false });
    });
    plane(1.9, 0.34, F(0x8b908f, { map: SB.signTex([{ t: 'ゴミの分別にご協力ください', size: 0.36, y: 0.5, color: '#3a4048' }], { w: 1024, h: 192, bg: '#e9e6de' }), fog: false }), 5.62, 1.5, -0.44, { parent: Tg, recv: false });
  })();

  /* ================= 电线杆 / 电线 ================= */
  function pole(x, z, h) {
    const P = SB.g('pole', G);
    cyl(0.155, 0.2, h, 12, concrete, x, SY + h / 2, z, { parent: P, outline: true, ok: 0.016 });
    cyl(0.24, 0.26, 0.12, 12, concreteD, x, SY + 0.06, z, { parent: P, cast: false });
    [[h * 0.62, 1.5], [h * 0.72, 1.24], [h * 0.82, 1.0]].forEach(function (c) {
      box(c[1], 0.08, 0.08, Tc(0x8a9098), x, SY + c[0], z, { parent: P, cast: false });
      [-1, 0, 1].forEach(function (k) {
        cyl(0.035, 0.035, 0.16, 7, Tc(0x5f7a6a), x + k * c[1] * 0.36, SY + c[0] + 0.12, z, { parent: P, cast: false, outline: false });
      });
    });
    cyl(0.2, 0.2, 0.42, 12, Tc(0x707880), x + 0.26, SY + h * 0.55, z, { parent: P, cast: false });     // 变压器
    for (let i = 0; i < 3; i++) box(0.62, 0.05, 0.05, Tc(0x9aa1a8), x - 0.3 + i * 0.3, SY + h * 0.9, z, { parent: P, cast: false });
    return P;
  }
  pole(-7.5, 1.55, 6.9);
  pole(-0.6, 7.6, 6.4);
  function wire(a, b, sag, r) {
    const mid = new THREE.Vector3((a.x + b.x) / 2, Math.min(a.y, b.y) - sag, (a.z + b.z) / 2);
    const curve = new THREE.CatmullRomCurve3([a, mid, b]);
    const m = new THREE.Mesh(new THREE.TubeGeometry(curve, 20, r || 0.022, 5, false), Tc(0x22262c));
    m.castShadow = false; G.add(m);
  }
  const SY2 = SB.LAY.SIDE_Y;
  [[5.5, 0], [6.0, 0.5], [6.5, 1.0]].forEach(function (w) {
    wire(new THREE.Vector3(-7.5, SY2 + w[0], 1.55), new THREE.Vector3(-0.6, SY2 + w[0] - 0.2, 7.6), w[1] + 0.45);
  });
  wire(new THREE.Vector3(-7.5, SY2 + 4.6, 1.55), new THREE.Vector3(-0.6, SY2 + 4.4, 7.6), 0.8, 0.016);
  wire(new THREE.Vector3(-7.5, SY2 + 5.6, 1.55), new THREE.Vector3(-8.6, SY2 + 5.2, -0.4), 0.5);
  wire(new THREE.Vector3(-7.5, SY2 + 6.0, 1.55), new THREE.Vector3(-8.6, SY2 + 5.8, -0.6), 0.5);
  wire(new THREE.Vector3(-0.6, SY2 + 5.5, 7.6), new THREE.Vector3(8.6, SY2 + 5.3, 6.8), 0.7);
  wire(new THREE.Vector3(-0.6, SY2 + 6.2, 7.6), new THREE.Vector3(8.6, SY2 + 6.0, 7.2), 0.7);

  /* ================= 街灯 + 信号灯 ================= */
  (function () {
    const P = SB.g('corner', G);
    const px = 4.18, pz = 0.52;
    cyl(0.17, 0.2, 5.6, 12, Tc(0x5e6469), px, SY + 2.8, pz, { parent: P, outline: true, ok: 0.016 });
    cyl(0.26, 0.28, 0.14, 12, concreteD, px, SY + 0.07, pz, { parent: P, cast: false });
    // 街灯（悬臂朝向车行道）
    tube: {
      const arm = new THREE.Mesh(new THREE.CylinderGeometry(0.055, 0.055, 1.5, 8), Tc(0x5e6469));
      arm.position.set(px + 0.05, SY + 5.45, pz + 0.66); arm.rotation.x = Math.PI / 2 - 0.22;
      arm.castShadow = true; P.add(arm); SB.outline(arm, 0.012);
    }
    box(0.72, 0.16, 0.34, Tc(0x7c8288), px + 0.08, SY + 5.36, pz + 1.42, { parent: P });
    box(0.62, 0.06, 0.26, F(0xfff0cf, { fog: false }), px + 0.08, SY + 5.27, pz + 1.42, { parent: P, outline: false, cast: false });
    const lamp = new THREE.PointLight(0xffb877, 1.7, 11, 2);
    lamp.position.set(px + 0.08, SY + 5.1, pz + 1.42); P.add(lamp);
    SB.L.lamp = lamp;
    SB.glow(0xffb877, 4.2, 0.34, px + 0.08, SY + 5.3, pz + 1.42, P);
    // 车辆信号灯（横臂伸出车道上方，双面可见）
    const arm2 = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 2.7, 8), Tc(0x4c545c));
    arm2.position.set(px - 1.35, SY + 5.15, pz); arm2.rotation.z = Math.PI / 2;
    arm2.castShadow = true; P.add(arm2); SB.outline(arm2, 0.012);
    SB.signal = {};
    const body = box(1.0, 0.36, 0.3, Tc(0x272d33), px - 2.1, SY + 4.85, pz, { parent: P });
    box(1.06, 0.1, 0.36, Tc(0x1e2329), px - 2.1, SY + 5.06, pz, { parent: P, cast: false });
    const lampTex = ['#5a1414', '#5a4814', '#14501e'];
    [0, 1, 2].forEach(function (i) {
      const cx = px - 2.1 - 0.32 + i * 0.32;
      [-1, 1].forEach(function (s) {
        const l = box(0.2, 0.2, 0.03, F(Tc(lampTex[i]).color.getHex(), { fog: false }), cx, SY + 4.85, pz + s * 0.16, { parent: P, outline: false, cast: false });
        if (!SB.signal.lamps) SB.signal.lamps = [];
        SB.signal.lamps.push({ mesh: l, idx: i, side: s });
      });
    });
    // 行人信号灯（面向横断步道）
    box(0.28, 0.52, 0.22, Tc(0x272d33), px - 0.02, SY + 2.5, pz - 0.24, { parent: P });
    SB.signal.ped = box(0.2, 0.18, 0.03, F(0x5a1414, { fog: false }), px - 0.02, SY + 2.62, pz - 0.36, { parent: P, outline: false, cast: false });
    SB.signal.ped2 = box(0.2, 0.18, 0.03, F(0x14501e, { fog: false }), px - 0.02, SY + 2.38, pz - 0.36, { parent: P, outline: false, cast: false });
    SB.signal.glow = SB.glow(0xd94f5c, 2.0, 0.22, px - 2.1, SY + 4.85, pz - 0.3, P);
    // 路牌
    plane(1.5, 0.3, F(0x8f9499, { map: SB.signTex([{ t: 'あかり坂 通り', size: 0.5, y: 0.5, color: '#1b4f8a' }], { w: 768, h: 160, bg: '#f4f6f8', border: '#1b4f8a' }), fog: false }), px - 0.02, SY + 3.6, pz - 0.16, { parent: P, recv: false });
    plane(1.5, 0.3, F(0x8f9499, { map: SB.signTex([{ t: 'あかり坂 通り', size: 0.5, y: 0.5, color: '#1b4f8a' }], { w: 768, h: 160, bg: '#f4f6f8', border: '#1b4f8a' }), fog: false }), px - 0.02, SY + 3.6, pz + 0.16, { parent: P, ry: Math.PI, recv: false });
    // 停车标志
    const pp = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.045, 2.3, 8), Tc(0x62686e));
    pp.position.set(-3.0, SY + 1.15, 0.52); pp.castShadow = true; P.add(pp); SB.outline(pp, 0.01);
    plane(0.52, 0.68, F(0x7f8790, { map: SB.signTex([{ t: 'P', size: 0.62, y: 0.34, color: '#ffffff' }, { t: '時間貸', size: 0.26, y: 0.74 }], { w: 256, h: 336, bg: '#1b4f8a' }), fog: false }), -3.0, SY + 2.3, 0.54, { parent: P, recv: false });
  })();

  /* ================= 护栏 ================= */
  (function () {
    const R = SB.g('rail', G), z = 1.14;
    for (let x = -7.6; x <= -3.3; x += 1.42) {
      cyl(0.055, 0.055, 0.9, 8, beamMat, x, SY + 0.45, z, { parent: R, outline: true, ok: 0.012 });
    }
    const n = 4, len = 4.3;
    for (let i = 0; i < n; i++) {
      const x = -7.6 + 1.42 / 2 + i * 1.42;
      box(1.34, 0.3, 0.07, beamMat, x, SY + 0.72, z, { parent: R });
      box(1.34, 0.07, 0.09, Tc(0xdde2e6), x, SY + 0.9, z, { parent: R, cast: false });
    }
  })();

  /* ================= 公告栏 ================= */
  (function () {
    const N = SB.g('notice', G);
    cyl(0.045, 0.045, 1.7, 8, Tc(0x5e6469), 4.0, SY + 0.85, -0.72, { parent: N, outline: true, ok: 0.01 });
    cyl(0.045, 0.045, 1.7, 8, Tc(0x5e6469), 4.72, SY + 0.85, -0.72, { parent: N, outline: true, ok: 0.01 });
    box(1.0, 0.78, 0.07, Tc(0x413c34), 4.36, SY + 1.42, -0.72, { parent: N });
    box(1.06, 0.07, 0.22, Tc(0x37332c), 4.36, SY + 1.84, -0.7, { parent: N, cast: false });
    const cols = [0xf3efe6, 0xe8e2d4, 0xf7f3ea, 0xf0e9dc];
    for (let i = 0; i < 4; i++)
      plane(0.4, 0.31, F(0x9c9c96, { map: SB.signTex([{ t: ['町内会', '防災', 'ラーメン', '募集'][i], size: 0.32, y: 0.36, color: '#3a4048' }], { w: 256, h: 200, bg: '#' + cols[i].toString(16) }), fog: false }), 4.06 + (i % 2) * 0.6, SY + 1.58 - Math.floor(i / 2) * 0.36, -0.68, { parent: N, recv: false });
  })();

  /* ================= 小巷：空调外机 / 配管 / 垃圾箱 / 铁网门 / 邻楼墙 ================= */
  (function () {
    const A = SB.g('alley', G);
    const wallMat = Tc(0x1c2126);
    // 邻楼墙（x = 7.9）
    box(0.22, 3.1, 8.9, wallMat, 7.89, 1.55, -3.55, { parent: A, cast: false });
    box(0.3, 0.12, 8.98, Tc(0x3a3f46), 7.89, 3.13, -3.55, { parent: A, cast: false });
    [[-2.2], [-5.4]].forEach(function (w) {
      box(0.06, 0.8, 0.9, Tc(0x161a1f), 7.76, 1.9, w[0], { parent: A, cast: false });
    });
    cyl(0.07, 0.07, 3.0, 8, Tc(0x43484e), 7.72, 1.5, -6.95, { parent: A, cast: false, outline: false });
    // 空调外机（挂便利店东墙）
    [[-2.5], [-4.4]].forEach(function (u) {
      const g2 = SB.g('ac', A);
      box(0.34, 0.56, 0.76, Tc(0x757b81), 4.42, 1.05, u[0], { parent: g2 });
      cyl(0.2, 0.2, 0.06, 14, Tc(0x494e54), 4.6, 1.05, u[0], { parent: g2, rz: Math.PI / 2, cast: false, outline: true, ok: 0.008 });
      box(0.3, 0.06, 0.7, Tc(0x5c6167), 4.36, 0.74, u[0], { parent: g2, cast: false });
      box(0.09, 0.5, 0.1, Tc(0x4e535a), 4.3, 0.62, u[0] + 0.3, { parent: g2, cast: false });
    });
    // 配管与落水管
    cyl(0.075, 0.075, 3.3, 8, Tc(0x50555b), 4.32, 1.7, -1.55, { parent: A, cast: false, outline: true, ok: 0.01 });
    cyl(0.11, 0.11, 0.12, 10, Tc(0x43484e), 4.32, 2.6, -1.55, { parent: A, cast: false, outline: false });
    // 垃圾箱 / 啤酒箱 / 废弃物
    box(1.15, 1.0, 0.85, Tc(0x3a4048), 6.9, 0.5, -3.2, { parent: A });
    box(1.2, 0.1, 0.9, Tc(0x464c54), 6.9, 1.03, -3.2, { parent: A, cast: false });
    for (let r = 0; r < 2; r++) for (let i = 0; i < 2; i++)
      box(0.44, 0.3, 0.34, Tc(r ? 0xd8a33c : 0xc9473f), 7.0 + i * 0.48, 0.15 + r * 0.31, -5.6, { parent: A, ry: 0.06 * i });
    // 墙角灯
    box(0.2, 0.1, 0.28, Tc(0x272d33), 4.35, 2.65, -3.1, { parent: A, cast: false });
    box(0.16, 0.05, 0.24, F(0xdff0e0, { fog: false }), 4.42, 2.62, -3.1, { parent: A, outline: false, cast: false });
    SB.glow(0xa8e6b0, 1.8, 0.16, 4.5, 2.6, -3.1, A);
    const al = new THREE.PointLight(0xbfe8c8, 0.7, 6.5, 2); al.position.set(5.4, 2.5, -3.1); A.add(al);
    SB.L.alley = al;
    // 小巷尽头的铁网门
    const linkTex = SB.tex(128, 128, function (g) {
      g.clearRect(0, 0, 128, 128); g.strokeStyle = 'rgba(200,208,214,0.95)'; g.lineWidth = 5;
      for (let i = -4; i < 12; i++) {
        g.beginPath(); g.moveTo(i * 16, 0); g.lineTo(i * 16 + 64, 128); g.stroke();
        g.beginPath(); g.moveTo(i * 16, 128); g.lineTo(i * 16 + 64, 0); g.stroke();
      }
    });
    linkTex.wrapS = linkTex.wrapT = THREE.RepeatWrapping; linkTex.repeat.set(4, 2);
    plane(3.4, 1.9, F(0xffffff, { map: linkTex, transparent: true, opacity: 0.85, side: THREE.DoubleSide, fog: false }), 6.25, 1.05, -7.3, { parent: A, recv: false });
    cyl(0.05, 0.05, 2.1, 8, Tc(0x8f959c), 4.6, 1.05, -7.3, { parent: A, outline: true, ok: 0.01 });
    cyl(0.05, 0.05, 2.1, 8, Tc(0x8f959c), 7.9, 1.05, -7.3, { parent: A, outline: true, ok: 0.01 });
    // 小巷入口小灯箱
    SB.lightbox(0.5, 0.34, 0.1, SB.signTex([{ t: '← 入', size: 0.42, y: 0.5 }], { w: 256, h: 176, bg: '#1b4f8a' }), 5.35, 2.5, -1.35, { parent: A, ok: 0.02, fog: false });
    // 小巷侧墙上的洋红色小灯箱（暖色点缀）
    const magTex = SB.signTex([{ t: '酒', size: 0.42, y: 0.28 }, { t: 'タバコ', size: 0.24, y: 0.66 }], { w: 384, h: 700, bg: '#b3286a', border: 'rgba(255,255,255,0.35)' });
    SB.lightbox(0.5, 1.1, 0.12, magTex, 4.22, 1.95, -3.6, { parent: A, ry: Math.PI / 2, sideColor: 0x8d1f52, ok: 0.02, fog: false });
    SB.glow(0xff5aa0, 2.6, 0.26, 4.35, 1.95, -3.6, A);
    SB.L.mag = new THREE.PointLight(0xff6aa8, 0.55, 4.5, 2);
    SB.L.mag.position.set(4.7, 1.9, -3.6); A.add(SB.L.mag);
  })();

  /* ================= 西侧 / 北侧邻楼片段 ================= */
  (function () {
    const N = SB.g('neighbor', G);
    const m1 = Tc(0x2b3037);
    box(0.26, 3.4, 7.1, m1, -7.88, 1.7, -4.45, { parent: N, cast: false });
    box(0.34, 0.14, 7.2, Tc(0x33383f), -7.88, 3.44, -4.45, { parent: N, cast: false });
    box(1.86, 3.4, 0.26, m1, -7.07, 1.7, -7.88, { parent: N, cast: false });
    box(1.94, 0.14, 0.34, Tc(0x33383f), -7.07, 3.44, -7.88, { parent: N, cast: false });
    // 暗窗
    [[-2.6], [-5.2]].forEach(function (w) {
      box(0.06, 0.9, 1.0, Tc(0x14181d), -7.72, 1.9, w[0], { parent: N, cast: false });
      box(0.08, 0.98, 1.08, Tc(0x2a2f35), -7.74, 1.9, w[0], { parent: N, cast: false });
    });
    box(0.06, 0.9, 1.0, Tc(0x14181d), -6.6, 1.9, -7.72, { parent: N, rz: 0, cast: false, ry: Math.PI / 2 });
    box(0.5, 0.5, 0.3, Tc(0x60666c), -7.6, 0.9, -6.4, { parent: N, cast: false });
    // 西侧邻楼的竖式霓虹灯箱（暖红点缀）
    const neoTex = SB.signTex([{ t: '居酒屋', size: 0.26, y: 0.2, color: '#ffe6c8' }, { t: 'とり', size: 0.3, y: 0.5, color: '#ffd0a0' }, { t: '松', size: 0.34, y: 0.8, color: '#ffb27a' }], { w: 320, h: 760, grad: ['#8e1f1a', '#4a0f0d'] });
    SB.lightbox(0.62, 1.5, 0.14, neoTex, -7.72, 1.95, -1.5, { parent: N, ry: Math.PI / 2, sideColor: 0x5c1614, ok: 0.02, fog: false });
    SB.glow(0xff6a3c, 3.0, 0.3, -7.5, 1.95, -1.5, N);
    SB.L.neon = new THREE.PointLight(0xff7a44, 0.75, 5.5, 2);
    SB.L.neon.position.set(-7.3, 1.9, -1.5); N.add(SB.L.neon);
  })();
})();
