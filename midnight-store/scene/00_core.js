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
  /* 截图夹具（?still）下必须保留绘制缓冲：页面只渲染固定帧数就停，
     而 preserveDrawingBuffer 默认为 false 时，缓冲区在合成后即被清空，
     无头截图会拍到一块全黑的画布。正常游玩不开，避免无谓的拷贝开销。 */
  var SHOT = /(^|[?&])still(=|&|$)/.test(location.search);

  const renderer = new THREE.WebGLRenderer({
    antialias: true, alpha: false, powerPreference: 'high-performance',
    preserveDrawingBuffer: SHOT
  });
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

  /* 可玩版：俯视第三人称。相机不再架在玩家的眼窝里，而是吊在一根
     刚性吊臂的末端（几何在 45_walk.js）。视野比第一人称版本收窄
     （62 → 46）：俯视本来就能看到更多地面，视野再宽会让画面四角的
     透视拉伸变得刺眼。近裁面保持 0.06。 */
  const camera = new THREE.PerspectiveCamera(46, window.innerWidth / window.innerHeight, 0.06, 420);
  camera.rotation.order = 'YXZ';
  SB.camera = camera;

  /* ---------- 吊臂参数（45_walk.js 消费） ----------
     为什么是「刚性」吊臂而不是带阻尼的跟随：截图夹具只调一次
     W.walk.update()，任何位置平滑都会让相机停在半路 —— 夹具与真机
     看到两个构图，而这正是本项目栽过的坑（夹具参数静默失效）。 */
  SB.CAM = {
    dist: 6.4,      // 吊臂长度：沿视线反方向退开这么多米
    aimH: 1.02,     // 视线落点离脚底多高（胸口：角色落在画面中下部）
    pitch: -0.96,   // 俯角 55°（弧度，负 = 朝下）
    /* ---------- 俯角锁定 ----------
       拖动只绕方位角转，俯角不给改。理由不是「懒得做」，是三条：
       · 俯角一动，取景、视线判据、屋顶收放、剖切半径的几何**全部在变** ——
         而自检是按固定俯角算出来的算术，一变就全部失效；
       · 玩家很容易把自己拖到「接近平视」的死角，那样既看不见地面也看不见
         角色，只觉得「游戏坏了」；
       · 固定俯角之后「按 W 前进」与画面正上方的对应关系恒定，手感才是稳的。
       解锁只需把 lockPitch 改成 false —— 下面的 min/max 还在。 */
    lockPitch: true,
    min: -1.34,     // 解锁后允许的俯角上限 ≈ 77°（近乎正俯视）
    max: -0.40,     // 解锁后允许的俯角下限 ≈ 23°（接近平视）
    lensX: 0.16,    // 画面整体左移比例 —— 给右侧常驻文字栏让位
    sens: 0.0055    // 拖动转**方位角**的灵敏度（竖直方向现在不响应）
  };

  /* 玩家站位：x/z 为落脚点，y 由 groundY 求出。
     yaw 是**相机的**方位角（0 = 朝 -Z 看），face 是**角色本体的**朝向
     （世界角，0 = 面向 +Z）。两者分开：按 A/D 横走时角色会侧过身去，
     而相机不动 —— 这是俯视第三人称与第一人称最直观的区别。 */
  SB.player = {
    x: -1.70, z: 6.45,
    yaw: 0.15, pitch: SB.CAM.pitch,
    face: 0.15 + Math.PI,
    eye: 1.62, radius: 0.34,
    speed: 2.30, walkPhase: 0, bob: 0
  };

  /* ---------- 镜头平移（lens shift） ----------
     右侧常驻文字栏会盖掉画面右边约三分之一。这里把相机当成移轴镜头
     整体平移 —— 而不是把相机转过去：旋转会让「按 W 前进」的方向与
     画面正上方不一致，走起来会觉得角色在斜着漂。

     setViewOffset 只改投影矩阵，不引入梯形畸变；热点投影用的
     projectionMatrix、点地走路用的 projectionMatrixInverse 都会自动跟上。
     建卡模式下没有右栏（卡片居中），平移归零。 */
  SB.applyLens = function () {
    var w = window.innerWidth, h = window.innerHeight;
    if (document.body.classList.contains('mode-create')) camera.clearViewOffset();
    else camera.setViewOffset(w, h, Math.round(w * SB.CAM.lensX), 0, w, h);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
  };

  /* ---------- 可隐藏的屋顶 / 吊顶 ----------
     俯视 55° 时相机在屋顶之上（y≈7），不把屋顶拿掉就完全看不见店内。
     这里只登记「哪些节点属于屋顶」；切换逻辑在 45_walk.js（要读玩家位置）。
     · roofplate  —— 10_store.js 的屋顶板（+女儿墙之外的出檐）
     · roof       —— 10_store.js 的屋顶设备组（冷却机组 / 水箱 / 天线）
     · ceiling    —— 20_interior.js 的吊顶盒 / 顶棚内衬 / AC 出风口
     灯带与光晕不在此列：它们在吊顶下方，去掉吊顶后正好充当「天花板灯」，
     是剖面视图里该留下的东西。 */
  SB.ROOF_NODES = ['roofplate', 'roof', 'ceiling'];

  /* 屋顶盖：一块盖住整个店铺占地、位于屋顶高度的动态遮挡体。
     屋顶还在时它参与视线判定 —— 否则相机在半空俯视时视线会绕过真实
     屋顶落在店里，于是站在马路上就能看见「收银台」「饮料冷柜」的浮标。
     （屋顶板只有 0.16m 厚，达不到遮挡体的高度门槛，所以必须单独补这一块。） */
  SB.ROOF_CAP = { min: { x: -6.36, y: 3.40, z: -7.18 }, max: { x: 4.37, y: 3.82, z: -0.92 } };

  /* ---------- 室内剖切 ----------
     进店之后，把「挡住角色」的东西平滑推成半透明。

     为什么需要：吊臂挂在角色后上方 3.67m 水平 / 6.26m 高 处，而店里净高
     只有 2.85m —— 靠墙站的时候，后墙、货架、冷柜正好卡在相机与角色之间，
     角色就整个消失了。俯视第三人称的全部意义就是「看得见自己」，
     所以这时候必须把挡路的东西让开。

     判据（与 45_walk.js 的 cutTargets 一致）：从相机向**角色身体上的一圈
     采样点**各连一条线，与其中任意一条相交的东西就变透明。这些采样点撑出
     来的锥体，就是屏幕上「角色所占的那个圆」—— 凡是在这个锥体里的物件，
     投影下来必然落在角色身上；只是从旁边擦过的东西则不会被误伤。

     bodyR 取 0.30m：角色本体水平半径约 0.34m，0.30 的采样圈刚好罩住肩宽。
     采样高度与圈数写死在 45_walk.js 里（BODY_H 0.40~1.70、每层两圈各 8 点，
     共 85 条射线）—— 下限 0.40 不是随手的：店内地面顶面在 0.215，
     射线再往下就会命中「地板」，把地板剖成半透明的。

     ⚠ 这里换过一次判据。第一版是「把相机→角色的线段按 radius 膨胀成圆管」，
     radius 取 0.65。那个近似太松：一段 0.16m 厚的门头横梁会被膨胀成 1.46m，
     实测「剖了 8 样、全是并不挡人的墙，而真正挡在身前的 1 样没剖」。
     膨胀半径只该由「角色的体型」决定，而体型用采样点表达更直接。

     opacity 取 0.18：还认得出来是什么东西，但绝对挡不住后面的人。 */
  SB.CUT = {
    on: true,
    bodyR: 0.30,    // 身体采样圈的半径（不是「视线圆管」的半径）
    opacity: 0.18,
    rateIn: 9,      // 变透明有多快（每秒收敛比例）
    rateOut: 6      // 复原有多快（稍慢一点，免得走两步就闪一下）
  };

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
    /* 镜头平移是按窗口宽度算的，窗口一变必须重算 ——
       只改 aspect 会让画面重新回到居中，右栏就压到角色身上了。 */
    SB.applyLens();
    renderer.setSize(window.innerWidth, window.innerHeight);
  });
})();
