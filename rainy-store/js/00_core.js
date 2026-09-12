/* 00_core.js — 场景骨架 / 材质工具 / 通用构件 */
window.SB = window.SB || {};
(function () {
  const THREE = window.THREE;
  const SB = window.SB;
  SB.THREE = THREE;
  SB.anim = [];          // 每帧回调 (t, dt)
  SB.tocks = [];         // 延时/循环定时器

  /* ---------- 随机（固定种子，保证每次打开完全一致） ---------- */
  let seed = 20260912;
  SB.rand = function () { seed = (seed * 1103515245 + 12345) & 0x7fffffff; return seed / 0x7fffffff; };
  SB.rnd = function (a, b) { return a + SB.rand() * (b - a); };
  SB.pick = function (arr) { return arr[Math.floor(SB.rand() * arr.length)]; };

  /* ---------- 渲染器 / 场景 / 相机 ---------- */
  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false, powerPreference: 'high-performance' });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.outputEncoding = THREE.sRGBEncoding;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.0;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  document.body.appendChild(renderer.domElement);
  SB.renderer = renderer;

  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x070a12);
  scene.fog = new THREE.FogExp2(0x0a1220, 0.016);
  SB.scene = scene;

  const camera = new THREE.PerspectiveCamera(34, window.innerWidth / window.innerHeight, 0.1, 260);
  camera.position.set(13.0, 6.6, 16.8);
  SB.camera = camera;

  const controls = new THREE.OrbitControls(camera, renderer.domElement);
  controls.target.set(0.0, 1.2, -2.2);
  controls.enableDamping = true;
  controls.dampingFactor = 0.075;
  controls.rotateSpeed = 0.62;
  controls.zoomSpeed = 0.75;
  controls.panSpeed = 0.5;
  controls.minDistance = 11;
  controls.maxDistance = 48;
  controls.minPolarAngle = 0.18;
  controls.maxPolarAngle = Math.PI * 0.492;
  controls.enablePan = true;
  controls.screenSpacePanning = false;
  controls.update();
  SB.controls = controls;
  renderer.domElement.addEventListener('pointerdown', () => document.body.classList.add('dragging'));
  window.addEventListener('pointerup', () => document.body.classList.remove('dragging'));

  /* ---------- 卡通渐变贴图 ---------- */
  (function () {
    const steps = [0.1, 0.33, 0.64, 1.0];
    const data = new Uint8Array(steps.length * 4);
    steps.forEach((v, i) => {
      const b = Math.round(v * 255);
      data[i * 4] = b; data[i * 4 + 1] = b; data[i * 4 + 2] = b; data[i * 4 + 3] = 255;
    });
    const t = new THREE.DataTexture(data, steps.length, 1, THREE.RGBAFormat);
    t.minFilter = t.magFilter = THREE.NearestFilter;
    t.needsUpdate = true;
    SB.grad = t;
  })();

  /* ---------- 材质工厂 ---------- */
  SB.toon = function (color, o) {
    o = o || {};
    const m = new THREE.MeshToonMaterial({
      color: color, gradientMap: SB.grad,
      side: o.side || THREE.FrontSide,
      transparent: !!o.transparent,
      opacity: o.opacity === undefined ? 1 : o.opacity
    });
    if (o.emissive !== undefined) {
      m.emissive = new THREE.Color(o.emissive);
      m.emissiveIntensity = o.emissiveIntensity === undefined ? 1 : o.emissiveIntensity;
    }
    if (o.map) m.map = o.map;
    return m;
  };
  SB.flat = function (color, o) {
    o = o || {};
    return new THREE.MeshBasicMaterial({
      color: color,
      transparent: !!o.transparent,
      opacity: o.opacity === undefined ? 1 : o.opacity,
      side: o.side || THREE.FrontSide,
      blending: o.additive ? THREE.AdditiveBlending : THREE.NormalBlending,
      depthWrite: o.depthWrite !== false,
      map: o.map || null,
      fog: o.fog === undefined ? true : o.fog
    });
  };
  SB.wet = function (color, o) {
    o = o || {};
    return new THREE.MeshStandardMaterial({
      color: color, metalness: o.metalness === undefined ? 0.85 : o.metalness,
      roughness: o.roughness === undefined ? 0.12 : o.roughness,
      transparent: !!o.transparent, opacity: o.opacity === undefined ? 1 : o.opacity
    });
  };
  SB.OUT = new THREE.MeshBasicMaterial({ color: 0x101620, side: THREE.BackSide, fog: true });

  /* ---------- 描边 ---------- */
  SB.outline = function (mesh, t) {
    t = t === undefined ? 0.028 : t;
    const g = mesh.geometry, p = g.parameters;
    let og;
    if (g.type === 'BoxGeometry' && p) og = new THREE.BoxGeometry(p.width + t * 2, p.height + t * 2, p.depth + t * 2);
    else if (g.type === 'CylinderGeometry' && p) og = new THREE.CylinderGeometry(p.radiusTop + t, p.radiusBottom + t, p.height + t * 2, p.radialSegments, 1, p.openEnded);
    else if (g.type === 'PlaneGeometry' && p) og = new THREE.PlaneGeometry(p.width + t * 2, p.height + t * 2);
    else { og = g.clone(); og.scale(1 + t * 2, 1 + t * 2, 1 + t * 2); }
    const om = new THREE.Mesh(og, SB.OUT);
    om.renderOrder = -2;
    mesh.add(om);
    return om;
  };

  /* ---------- 基础几何封装 ---------- */
  SB.box = function (w, h, d, mat, x, y, z, o) {
    o = o || {};
    const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat);
    m.position.set(x, y, z);
    if (o.rx) m.rotation.x = o.rx;
    if (o.ry) m.rotation.y = o.ry;
    if (o.rz) m.rotation.z = o.rz;
    m.castShadow = o.cast !== false;
    m.receiveShadow = o.recv !== false;
    if (o.parent) o.parent.add(m); else SB.scene.add(m);
    if (o.outline !== false) SB.outline(m, o.ok);
    return m;
  };
  SB.cyl = function (rt, rb, h, seg, mat, x, y, z, o) {
    o = o || {};
    const m = new THREE.Mesh(new THREE.CylinderGeometry(rt, rb, h, seg, 1, !!o.open), mat);
    m.position.set(x, y, z);
    if (o.rx) m.rotation.x = o.rx;
    if (o.ry) m.rotation.y = o.ry;
    if (o.rz) m.rotation.z = o.rz;
    m.castShadow = o.cast !== false;
    m.receiveShadow = true;
    (o.parent || SB.scene).add(m);
    if (o.outline) SB.outline(m, o.ok);
    return m;
  };
  SB.plane = function (w, h, mat, x, y, z, o) {
    o = o || {};
    const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), mat);
    m.position.set(x, y, z);
    if (o.rx) m.rotation.x = o.rx;
    if (o.ry) m.rotation.y = o.ry;
    if (o.rz) m.rotation.z = o.rz;
    m.receiveShadow = o.recv !== false;
    (o.parent || SB.scene).add(m);
    return m;
  };
  SB.g = function (name, parent) {
    const g = new THREE.Group(); g.name = name;
    (parent || SB.scene).add(g);
    return g;
  };

  /* ---------- 贴图工具 ---------- */
  SB.tex = function (w, h, draw) {
    const c = document.createElement('canvas'); c.width = w; c.height = h;
    const g = c.getContext('2d'); draw(g, w, h);
    const t = new THREE.CanvasTexture(c);
    t.encoding = THREE.sRGBEncoding; t.anisotropy = 4;
    return t;
  };
  const JP = '"Yu Gothic UI","Hiragino Sans","Microsoft YaHei","Noto Sans CJK SC",sans-serif';
  SB.JP = JP;

  SB.signTex = function (lines, o) {
    o = o || {};
    const w = o.w || 1024, h = o.h || 256;
    return SB.tex(w, h, function (g) {
      g.fillStyle = o.bg || '#0f5f52'; g.fillRect(0, 0, w, h);
      if (o.grad) {
        const lg = g.createLinearGradient(0, 0, 0, h);
        lg.addColorStop(0, o.grad[0]); lg.addColorStop(1, o.grad[1]);
        g.fillStyle = lg; g.fillRect(0, 0, w, h);
      }
      if (o.border) { g.strokeStyle = o.border; g.lineWidth = h * 0.045; g.strokeRect(h * 0.03, h * 0.03, w - h * 0.06, h - h * 0.06); }
      g.textAlign = 'center'; g.textBaseline = 'middle';
      (lines || []).forEach(function (ln) {
        g.fillStyle = ln.color || '#ffffff';
        g.font = (ln.weight || 'bold') + ' ' + Math.round((ln.size || 0.5) * h) + 'px ' + (ln.font || JP);
        g.fillText(ln.t, w * (ln.x === undefined ? 0.5 : ln.x), h * (ln.y === undefined ? 0.5 : ln.y));
      });
    });
  };

  /* 发光广告灯箱：正面贴图，其余面纯色 */
  SB.lightbox = function (w, h, d, tex, x, y, z, o) {
    o = o || {};
    const side = SB.flat(o.sideColor === undefined ? 0xe9e5dc : o.sideColor);
    const face = SB.flat(o.faceColor || 0xffffff, { map: tex, fog: o.fog });
    const mats = [side, side, side, side, face, side]; // +x -x +y -y +z -z
    const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mats);
    m.position.set(x, y, z);
    if (o.rx) m.rotation.x = o.rx;
    if (o.ry) m.rotation.y = o.ry;
    if (o.rz) m.rotation.z = o.rz;
    (o.parent || SB.scene).add(m);
    if (o.outline !== false) SB.outline(m, o.ok || 0.026);
    return m;
  };

  /* ---------- 辉光精灵 ---------- */
  SB.glowTex = SB.tex(128, 128, function (g, w, h) {
    const rg = g.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, w / 2);
    rg.addColorStop(0, 'rgba(255,255,255,1)');
    rg.addColorStop(0.25, 'rgba(255,255,255,0.55)');
    rg.addColorStop(0.55, 'rgba(255,255,255,0.16)');
    rg.addColorStop(1, 'rgba(255,255,255,0)');
    g.fillStyle = rg; g.fillRect(0, 0, w, h);
  });
  SB.glow = function (color, size, opacity, x, y, z, parent) {
    const sp = new THREE.Sprite(new THREE.SpriteMaterial({
      map: SB.glowTex, color: color, transparent: true, opacity: opacity === undefined ? 0.5 : opacity,
      blending: THREE.AdditiveBlending, depthWrite: false, fog: true
    }));
    sp.scale.set(size, size, 1);
    sp.position.set(x, y, z);
    (parent || SB.scene).add(sp);
    return sp;
  };

  /* ---------- 灯光 ---------- */
  const L = {};
  scene.add(new THREE.HemisphereLight(0x2f4874, 0x070a11, 0.19));
  const moon = new THREE.DirectionalLight(0x9db6ff, 0.22);
  moon.position.set(-9, 15, 8);
  moon.castShadow = true;
  moon.shadow.mapSize.set(2048, 2048);
  const sc = moon.shadow.camera;
  sc.left = -14; sc.right = 14; sc.top = 14; sc.bottom = -14; sc.near = 2; sc.far = 46;
  moon.shadow.bias = -0.0012;
  scene.add(moon);
  L.moon = moon;
  SB.L = L;

  /* ---------- 定时器（用于自动门、信号灯等周期性事件） ---------- */
  SB.every = function (period, offset, fn) {
    SB.tocks.push({ p: period, o: offset || 0, last: -1, fn: fn });
  };
  SB.runTocks = function (t) {
    for (let i = 0; i < SB.tocks.length; i++) {
      const k = SB.tocks[i];
      const n = Math.floor((t + k.o) / k.p);
      if (n !== k.last) { k.last = n; k.fn(n, t); }
    }
  };

  SB.fps = function (t, dt) { /* placeholder for future */ };

  window.addEventListener('resize', function () {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
  });
})();
