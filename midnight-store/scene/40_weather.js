/* 40_weather.js — 雨夜动效：降雨 / 滴水 / 积水波纹 / 湿地反光 / 玻璃水痕 / 招牌闪烁 / 自动门 / 信号灯 */
(function () {
  const SB = window.SB, THREE = SB.THREE;
  const T = SB.toon, F = SB.flat, box = SB.box, plane = SB.plane, cyl = SB.cyl;
  const G = SB.g('weather');

  SB.groundY = function (x, z) { return (z < SB.LAY.ROAD_Z && x < SB.LAY.ALLEY_X) ? SB.LAY.SIDE_Y : 0.0; };

  /* ================= 湿地反光（灯光在积水上的拉长倒影） ================= */
  const streakTex = SB.tex(64, 512, function (g, w, h) {
    for (let x = 0; x < w; x++) for (let y = 0; y < h; y++) {
      const u = (x / w - 0.5) * 2, v = (y / h - 0.5) * 2;
      const a = Math.max(0, 1 - Math.abs(u)) * Math.max(0, 1 - Math.abs(v) * 1.05);
      g.fillStyle = 'rgba(255,255,255,' + (a * a * 0.5).toFixed(3) + ')';
      g.fillRect(x, y, 1, 1);
    }
  });
  SB.reflects = [];
  function reflect(color, x, z, w, len, base, y) {
    const m = plane(w, len, F(color, { map: streakTex, transparent: true, additive: true, depthWrite: false, opacity: base }), x, y === undefined ? 0.022 : y, z, { rx: -Math.PI / 2, parent: G, recv: false });
    m.renderOrder = 2;
    SB.reflects.push({ m: m, base: base, ph: SB.rnd(0, 6.3) });
    return m;
  }
  reflect(0xffa055, -1.6, 2.7, 8.4, 5.6, 0.4);               // 店内暖光
  reflect(0xffb066, -1.6, 0.42, 8.0, 1.5, 0.38, 0.185);      // 雨棚下
  reflect(0x4aa8ff, -7.55, 1.5, 1.7, 3.2, 0.3);              // 冷饮贩卖机
  reflect(0xff6a5a, -6.62, 1.3, 1.5, 2.6, 0.24);             // 热饮贩卖机
  reflect(0xffa860, 4.35, 3.3, 3.6, 4.4, 0.3);               // 街灯
  reflect(0x63e8c0, 3.4, 1.2, 2.6, 2.6, 0.16);               // 招牌青绿
  reflect(0xa8e6b0, 6.2, -3.0, 2.6, 3.2, 0.13, 0.03);        // 小巷壁灯
  reflect(0xff6a3c, -7.0, -0.9, 1.8, 2.4, 0.24, 0.185);      // 西侧居酒屋霓虹
  reflect(0xff5aa0, 5.4, -3.4, 1.8, 2.6, 0.18, 0.03);        // 小巷洋红灯箱
  SB.trafficRef = reflect(0xff3b30, 1.9, 2.0, 1.5, 3.4, 0.2);
  SB.storeRef = SB.reflects[0].m;
  // 雨幕下的整体水光流动
  const sheenTex = SB.tex(256, 256, function (g, w, h) {
    g.clearRect(0, 0, w, h);
    for (let i = 0; i < 90; i++) {
      g.save(); g.globalAlpha = 0.03 + Math.random() * 0.05; g.strokeStyle = '#cfe4ff'; g.lineWidth = 0.6 + Math.random() * 1.6;
      const x = Math.random() * w, y = Math.random() * h;
      g.beginPath(); g.moveTo(x, y); g.lineTo(x + (Math.random() - 0.5) * 22, y + 18 + Math.random() * 46); g.stroke(); g.restore();
    }
  });
  sheenTex.wrapS = sheenTex.wrapT = THREE.RepeatWrapping; sheenTex.repeat.set(3, 3);
  const sheen = plane(16, 16, F(0xffffff, { map: sheenTex, transparent: true, additive: true, depthWrite: false, opacity: 0.04, fog: false }), 0, 0.014, 0, { rx: -Math.PI / 2, parent: G, recv: false });
  sheen.renderOrder = 3;

  /* ================= 积水（不规则水洼） ================= */
  const puddleMat = F(0x0d1622, { transparent: true, opacity: 0.62, depthWrite: false });
  function puddle(cx, cz, rx, rz, y) {
    const sh = new THREE.Shape();
    const n = 14;
    for (let i = 0; i <= n; i++) {
      const a = i / n * Math.PI * 2, k = 0.78 + Math.sin(i * 2.3 + cx) * 0.12 + SB.rnd(-0.08, 0.08);
      const px = Math.cos(a) * rx * k, py = Math.sin(a) * rz * k;
      if (i === 0) sh.moveTo(px, py); else sh.lineTo(px, py);
    }
    const m = new THREE.Mesh(new THREE.ShapeGeometry(sh), puddleMat);
    m.rotation.x = -Math.PI / 2; m.position.set(cx, y + 0.004, cz);
    m.renderOrder = 1; G.add(m);
    return m;
  }
  const WET = [
    [-5.2, 4.3, 1.9, 0.9, 0], [1.1, 6.0, 2.2, 1.0, 0], [3.5, 2.9, 1.5, 0.8, 0],
    [-2.2, 2.1, 1.2, 0.6, 0], [6.7, 5.4, 1.9, 0.8, 0], [-7.0, 6.5, 1.4, 0.7, 0],
    [3.2, 1.4, 1.0, 0.5, 0], [0.6, 3.6, 1.3, 0.6, 0],
    [-3.4, 0.28, 1.0, 0.45, 0.16], [2.5, 0.36, 0.9, 0.4, 0.16], [-4.9, 0.15, 0.8, 0.36, 0.16],
    [6.2, -2.1, 1.2, 1.5, 0], [5.6, -5.1, 1.0, 1.3, 0]
  ];
  WET.forEach(function (w) { puddle(w[0], w[1], w[2], w[3], w[4]); });
  // 水洼上的高光倒影
  reflect(0xffa860, 4.9, 1.6, 1.2, 1.6, 0.22, 0.02);
  reflect(0x9fd8ff, 6.2, -2.1, 1.0, 1.4, 0.18, 0.02);

  /* ================= 水面波纹 ================= */
  const rippleGeo = new THREE.RingGeometry(0.36, 0.5, 26);
  const ripples = [];
  for (let i = 0; i < 30; i++) {
    const m = new THREE.Mesh(rippleGeo, F(0xbcd6ff, { transparent: true, additive: true, depthWrite: false, opacity: 0, side: THREE.DoubleSide }));
    m.rotation.x = -Math.PI / 2; m.visible = false; m.renderOrder = 4; G.add(m);
    ripples.push({ m: m, t: 0, life: 0 });
  }
  let rippleTimer = 0;
  function spawnRipple(x, y, z, maxR, life) {
    for (let i = 0; i < ripples.length; i++) {
      if (!ripples[i].m.visible) {
        const r = ripples[i];
        r.m.visible = true; r.m.position.set(x, y + 0.008, z);
        r.m.scale.setScalar(0.06); r.t = 0; r.life = life || 1.15; r.maxR = maxR || 1.0;
        r.m.material.opacity = 0.5;
        return r;
      }
    }
    return null;
  }
  SB.spawnRipple = spawnRipple;

  /* ================= 持续降雨 ================= */
  /* 店是封闭的，但雨滴的生成范围是整片场景（x/z 各 ±9.5），于是雨会穿墙
     落进店里。原模型只能从街上绕着看，这个问题不显形；改成第一人称走进
     店内之后，满屏都是斜着的雨丝。
     只排除「店内体积」里的雨滴 —— 顶棚以上的雨照常下，所以从街上抬头
     看，屋顶上方仍有雨，不会出现一块「没有雨的洞」。 */
  const DRY = { x0: -5.85, x1: 2.65, z0: -7.05, z1: -0.92, top: 3.25 };
  function indoors(x, y, z) {
    return y < DRY.top && x > DRY.x0 && x < DRY.x1 && z > DRY.z0 && z < DRY.z1;
  }
  /* 在给定范围内重掷一滴雨，掷到店外为止。
     注：一滴雨是「头 → 头-DIR·len」的线段。只管头还不够——头在店外、
     尾巴却斜着戳进店里的雨丝依旧会从门口探进来。所以头尾都要在店外。 */
  function reroll(d, x0, x1, z0, z1, y0, y1) {
    for (let k = 0; k < 12; k++) {
      d.x = SB.rnd(x0, x1); d.y = SB.rnd(y0, y1); d.z = SB.rnd(z0, z1);
      if (!indoors(d.x, d.y, d.z) &&
          !indoors(d.x - DIR.x * d.len, d.y - DIR.y * d.len, d.z - DIR.z * d.len)) return;
    }
    d.x = SB.rnd(x0, x1); d.y = SB.rnd(y0, y1); d.z = 4.0;   // 兜底：挪到店门前
  }

  const RAIN_N = 2200, DIR = new THREE.Vector3(0.17, -1, 0.1).normalize();
  const rpos = new Float32Array(RAIN_N * 6), drops = [];
  const R1 = [-9.5, 9.5, -9.5, 9.5, -1, 14];
  for (let i = 0; i < RAIN_N; i++) {
    const d = { x: 0, y: 0, z: 0, sp: SB.rnd(13, 24), len: SB.rnd(0.5, 1.05) };
    reroll(d, R1[0], R1[1], R1[2], R1[3], R1[4], R1[5]);
    drops.push(d);
  }
  const rainGeo = new THREE.BufferGeometry();
  rainGeo.setAttribute('position', new THREE.BufferAttribute(rpos, 3));
  const rain = new THREE.LineSegments(rainGeo, new THREE.LineBasicMaterial({
    color: 0xc2daff, transparent: true, opacity: 0.26, blending: THREE.AdditiveBlending, depthWrite: false, fog: true
  }));
  rain.frustumCulled = false; rain.name = 'rain'; G.add(rain);
  // 近处更亮的大雨滴
  const RAIN2 = 420, rpos2 = new Float32Array(RAIN2 * 6), drops2 = [];
  const R2 = [-6, 8, -3, 9, -1, 8];
  for (let i = 0; i < RAIN2; i++) {
    const d = { x: 0, y: 0, z: 0, sp: SB.rnd(18, 30), len: SB.rnd(0.9, 1.6) };
    reroll(d, R2[0], R2[1], R2[2], R2[3], R2[4], R2[5]);
    drops2.push(d);
  }
  const rainGeo2 = new THREE.BufferGeometry();
  rainGeo2.setAttribute('position', new THREE.BufferAttribute(rpos2, 3));
  const rain2 = new THREE.LineSegments(rainGeo2, new THREE.LineBasicMaterial({
    color: 0xdfeaff, transparent: true, opacity: 0.17, blending: THREE.AdditiveBlending, depthWrite: false
  }));
  rain2.frustumCulled = false; rain2.name = 'rain2'; G.add(rain2);

  function stepRain(arr, data, geo, pos, dt, range) {
    for (let i = 0; i < data.length; i++) {
      const d = data[i];
      d.y += DIR.y * d.sp * dt; d.x += DIR.x * d.sp * dt; d.z += DIR.z * d.sp * dt;
      /* 落到底、或被斜风飘进店里（头或尾巴戳进店里都算）—— 都重掷 */
      if (d.y < -1.2 || indoors(d.x, d.y, d.z) ||
          indoors(d.x - DIR.x * d.len, d.y - DIR.y * d.len, d.z - DIR.z * d.len)) {
        reroll(d, range[0], range[1], range[2], range[3], range[4], range[5]);
      }
      const g = i * 6;
      pos[g] = d.x; pos[g + 1] = d.y; pos[g + 2] = d.z;
      pos[g + 3] = d.x - DIR.x * d.len; pos[g + 4] = d.y - DIR.y * d.len; pos[g + 5] = d.z - DIR.z * d.len;
    }
    geo.attributes.position.needsUpdate = true;
  }

  /* ================= 雨棚滴水 ================= */
  const dripMat = new THREE.SpriteMaterial({ map: SB.glowTex, color: 0xcfe4ff, transparent: true, opacity: 0.5, blending: THREE.AdditiveBlending, depthWrite: false });
  const drips = [];
  for (let i = 0; i < 30; i++) {
    const s = new THREE.Sprite(dripMat);
    s.scale.set(0.035, 0.16, 1); G.add(s);
    drips.push({ s: s, x: SB.rnd(-6.0, 2.3), z: -0.22 + SB.rnd(-0.03, 0.03), y: SB.rnd(0.2, 2.6), sp: SB.rnd(2.6, 4.2) });
  }

  /* ================= 玻璃水痕 ================= */
  const streakTex2 = SB.tex(8, 128, function (g, w, h) {
    const lg = g.createLinearGradient(0, 0, 0, h);
    lg.addColorStop(0, 'rgba(255,255,255,0)'); lg.addColorStop(0.35, 'rgba(255,255,255,0.85)');
    lg.addColorStop(0.75, 'rgba(255,255,255,0.35)'); lg.addColorStop(1, 'rgba(255,255,255,0)');
    g.fillStyle = lg; g.fillRect(0, 0, w, h);
  });
  const gstreaks = [];
  for (let i = 0; i < 20; i++) {
    const w = SB.rnd(0.018, 0.05), h = SB.rnd(0.35, 0.85);
    const m = plane(w, h, F(0xdff4ff, { map: streakTex2, transparent: true, additive: true, depthWrite: false, opacity: SB.rnd(0.1, 0.24) }), SB.rnd(-5.5, 2.35), SB.rnd(0.7, 2.8), -1.13, { parent: G, recv: false });
    m.renderOrder = 8;
    gstreaks.push({ m: m, base: m.material.opacity, sp: SB.rnd(0.12, 0.4) });
  }

  /* ================= 招牌闪烁 / 自动门 / 信号灯 ================= */
  const faceMul = function (mesh, v) {
    const mats = mesh.material;
    if (!mesh.userData.base) mesh.userData.base = mats.map(function (m) { return m.color.getHex(); });
    mats.forEach(function (m, i) {
      const c = mesh.userData.base[i];
      m.color.setRGB(((c >> 16) & 255) / 255 * v, ((c >> 8) & 255) / 255 * v, (c & 255) / 255 * v);
    });
  };
  const OFF = [0x511a1a, 0x50431a, 0x1a4a24], ON = [0xff3b30, 0xffc02e, 0x2ee06a];

  SB.anim.push(function (t, dt) {
    /* 降雨 */
    stepRain(rain, drops, rainGeo, rpos, dt, R1);
    stepRain(rain2, drops2, rainGeo2, rpos2, dt, R2);

    /* 波纹生成
       可玩版：间隔 0.055 → 0.085，峰值不透明度 0.5 → 0.36。
       原参数是给「二十米外俯视微缩模型」调的；人眼站在地面高度时，
       透视把涟漪压在一起，整片路面会被加法混合洗成灰白。
       SB.fxRipple === false 可整块关掉（自检时用来 A/B）。 */
    if (SB.fxRipple !== false) {
      rippleTimer += dt;
      const interval = 0.085;
      while (rippleTimer > interval) {
        rippleTimer -= interval;
        const w = WET[(Math.random() * WET.length) | 0];
        spawnRipple(w[0] + SB.rnd(-w[2] * 0.7, w[2] * 0.7), w[4], w[1] + SB.rnd(-w[3] * 0.7, w[3] * 0.7), SB.rnd(0.35, 0.75), SB.rnd(0.85, 1.5));
      }
      for (let i = 0; i < ripples.length; i++) {
        const r = ripples[i]; if (!r.m.visible) continue;
        r.t += dt; const u = r.t / r.life;
        if (u >= 1) { r.m.visible = false; continue; }
        r.m.scale.setScalar(0.06 + u * r.maxR * 1.6);
        r.m.material.opacity = 0.36 * (1 - u) * (1 - u);
      }
    }

    /* 雨棚滴水 */
    for (let i = 0; i < drips.length; i++) {
      const d = drips[i];
      d.y -= d.sp * dt * 3.4;
      if (d.y <= 0.18) {
        spawnRipple(d.x, SB.LAY.SIDE_Y, d.z, SB.rnd(0.18, 0.32), SB.rnd(0.4, 0.7));
        d.y = SB.rnd(2.5, 2.75); d.x = SB.rnd(-6.0, 2.3); d.z = -0.22 + SB.rnd(-0.03, 0.03);
      }
      d.s.position.set(d.x, d.y, d.z);
    }

    /* 玻璃水痕 */
    for (let i = 0; i < gstreaks.length; i++) {
      const s = gstreaks[i];
      s.m.position.y -= s.sp * dt;
      if (s.m.position.y < 0.68) { s.m.position.y = 2.9; s.m.position.x = SB.rnd(-5.5, 2.35); }
      s.m.material.opacity = s.base * (0.55 + 0.45 * Math.abs(Math.sin(t * 0.8 + i)));
    }

    /* 湿地反光呼吸 */
    for (let i = 0; i < SB.reflects.length; i++) {
      const r = SB.reflects[i];
      r.m.material.opacity = r.base * (0.72 + 0.28 * Math.sin(t * 1.7 + r.ph));
      r.m.scale.x = 1 + 0.06 * Math.sin(t * 0.9 + r.ph);
    }
    sheen.material.map.offset.y = (t * 0.018) % 1;
    sheen.material.opacity = 0.035 + 0.015 * Math.sin(t * 0.6);

    /* 招牌闪烁：缓慢呼吸 + 偶然抖动 */
    let v = 0.9 + 0.1 * Math.sin(t * 2.3);
    const st = t % 11.3;
    if (st > 11.05) v *= 0.45 + 0.5 * Math.abs(Math.sin(st * 90));
    if (SB.signMain) faceMul(SB.signMain, v);
    if (SB.signVert) faceMul(SB.signVert, 1 - (1 - v) * 0.6);
    if (SB.signGlow) SB.signGlow.material.opacity = 0.16 * v;
    if (SB.L.entry) SB.L.entry.intensity = 1.15 * (0.94 + 0.06 * Math.sin(t * 3.1));
    if (SB.L.alley) SB.L.alley.intensity = 0.7 * (0.85 + 0.15 * Math.sin(t * 1.1 + 1.4));
    if (SB.storeRef) SB.storeRef.material.opacity = 0.4 * (0.8 + 0.2 * Math.sin(t * 2.1));

    /* 自动门
       展示版：按 14 秒周期自己开合，让静态模型看起来是活的。
       可玩版：SB.autoDoor = false 时改由玩家距离驱动，SB.doorOpen ∈ [0,1] 由 45_walk.js 写入。 */
    let open;
    if (SB.autoDoor === false) {
      open = Math.max(0, Math.min(1, SB.doorOpen || 0));
    } else {
      const c = t % 14;
      open = 0;
      if (c > 4.5 && c < 8.5) open = Math.min(1, (c - 4.5) / 0.9, (8.5 - c) / 0.9);
      open = Math.max(0, Math.min(1, open));
      open = open * open * (3 - 2 * open);
    }
    for (let i = 0; i < SB.doors.length; i++) {
      const d = SB.doors[i], dir = i === 0 ? -1 : 1;
      d.position.x = d.userData.baseX + dir * 0.6 * open;
    }

    /* 交通信号灯 */
    const ph = t % 17;
    let active = 2, blink = false;
    if (ph < 5.5) active = 2; else if (ph < 7.5) active = 1; else active = 0;
    if (SB.signal && SB.signal.lamps) {
      for (let i = 0; i < SB.signal.lamps.length; i++) {
        const L = SB.signal.lamps[i];
        L.mesh.material.color.setHex(L.idx === active ? ON[L.idx] : OFF[L.idx]);
      }
    }
    if (SB.signal && SB.signal.glow) {
      SB.signal.glow.material.color.setHex(ON[active]);
      SB.signal.glow.material.opacity = 0.2 + 0.04 * Math.sin(t * 5);
    }
    if (SB.trafficRef) SB.trafficRef.material.color.setHex(ON[active]);
    if (SB.signal) {
      const pedGreen = active === 0 && (ph < 15.5 || Math.sin(ph * 14) > 0);
      if (SB.signal.ped) SB.signal.ped.material.color.setHex(pedGreen ? 0x511a1a : 0xff3b30);
      if (SB.signal.ped2) SB.signal.ped2.material.color.setHex(pedGreen ? 0x2ee06a : 0x1a4a24);
    }
    /* 街灯微弱闪烁 */
    if (SB.L.lamp) SB.L.lamp.intensity = 1.7 * (0.95 + 0.05 * Math.sin(t * 9.3) * Math.sin(t * 1.7));
  });
})();
