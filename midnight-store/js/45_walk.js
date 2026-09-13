/* ===========================================================
   45_walk.js  ——  行走 + 俯视第三人称吊臂
   ------------------------------------------------------------
   相机不再是玩家的眼睛，而是吊在角色后上方一根**刚性吊臂**的末端：

       落点 = 脚底 + CAM.aimH
       相机 = 落点 − 视线方向 × CAM.dist

   为什么刚性（不做位置阻尼）：截图夹具只调一次 W.walk.update()，
   任何平滑都会让相机停在半路 —— 夹具与真机看到两个构图。这条坑
   本项目已经栽过一次（夹具参数静默失效），不再踩。

   为什么要分离 yaw 与 face：yaw 是相机方位角，face 是角色本体的朝向。
   按 A/D 横走时角色侧过身去、相机不动 —— 这是俯视第三人称与第一人称
   最直观的区别，也是「我是谁、我朝哪边」能被读出来的前提。

   为什么不只用「点击地面自动走」：
     点走给了移动，但拿走了「我在往哪看」——而这件事恰恰是这类游戏
     表达情绪的地方。所以两种都给：WASD 走，按住左键拖动转动吊臂，
     也可以点地面让角色自己走过去。

   为什么不做 pointer lock：
     file:// 下能用，但一进入就锁死光标、且没有明显的退出提示。
     拖拽转头没有这个门槛，且随时可以松手。

   为什么锁死俯角（SB.CAM.lockPitch）：
     拖动只绕方位角转。俯角一旦能改，取景、视线判据、屋顶收放、剖切半径
     的几何全都在变，而自检是按固定俯角算出的算术；玩家也很容易把自己
     拖到接近平视的死角，那样既看不见地面也看不见角色。锁死之后
     「按 W 前进」与画面正上方的对应关系恒定，手感才是稳的。

   碰撞：逐轴解算。先试 X 再试 Z，撞墙时自动沿墙滑行，
   不会出现「贴着墙走不动」的手感。
   =========================================================== */

(function () {
  var THREE = window.THREE, SB = window.SB;
  SB.autoDoor = false;          // 交给玩家距离驱动
  SB.doorOpen = 0;

  var CAM = SB.CAM;
  var L = { yaw: SB.player.yaw, pitch: SB.player.pitch };
  /* 相机的方位角目标与角色的朝向目标。
     facePoint（点某个东西进对话）只设目标、不直接落值 —— 相机 180° 瞬移
     在俯视视角里等于把整个世界抽一下，人会晕。手动操作（WASD / 拖动）
     会先把目标清空，保证「我推的方向永远优先」。 */
  var yawT = null, faceT = null;
  var keys = {};
  var dragging = false, moved = 0, lastX = 0, lastY = 0;
  var target = null;            // 点走去向 {x, z}
  var stuck = 0;
  var env = { root: null };
  var floorNow = null;

  var LOOK_SENS = CAM.sens;
  var PITCH_MIN = CAM.min, PITCH_MAX = CAM.max;
  /* 俯角锁定：拖动只改方位角。min/max 留着是为了将来解锁时不用翻代码。 */
  var LOCK_PITCH = CAM.lockPitch !== false;
  /* 角色转身速度（弧度/秒）。瞬转看着像抽搐，太慢又像在冰上漂。 */
  var FACE_RATE = 11;
  /* 相机转方位角的速度：比角色慢慢来（镜头扫一下是「看过去」，
     转太快就变成视角被打了）。 */
  var YAW_RATE = 4.2;

  /* ---------------- 屋顶 / 吊顶的收放 ----------------
     俯视 55° 时相机在 y≈7，正好在屋顶之上：不把屋顶与吊顶收掉，
     玩家进店后只能拍到一块天花板。收放由玩家位置驱动，带 0.25m 滞回
     —— 站在门槛上不动时不能来回闪。
     灯带与光晕不在收起的名单里（见 00_core.js 的 SB.ROOF_NODES）。 */
  var roofNodes = [];
  var roofShown = null;         // null = 还没落盘过，第一次 setRoof 必须真的执行
  var IN_STORE = { x0: -6.20, x1: 4.20, z0: -7.00, z1: -1.02 };
  var HYST = 0.25;

  function initRoof() {
    (SB.ROOF_NODES || []).forEach(function (n) {
      var g = SB.scene.getObjectByName(n);
      if (g) roofNodes.push(g);
    });
  }

  function inStore(x, z) {
    return x > IN_STORE.x0 && x < IN_STORE.x1 && z > IN_STORE.z0 && z < IN_STORE.z1;
  }

  function setRoof(show) {
    if (show === roofShown) return;
    roofShown = show;
    for (var i = 0; i < roofNodes.length; i++) roofNodes[i].visible = show;
    /* 视线判定跟着一起走：屋顶在位时那块「盖」要挡住从半空俯视店内的
       视线；收起来时，所有带 roof 标记的遮挡体（女儿墙 / 水箱 / 盖）
       一并失效 —— 否则进店之后相机的视线仍被看不见的东西挡着。 */
    W.roofShown = show;
  }

  function updateRoof(x, z) {
    var inside = inStore(x, z);
    if (roofShown && inside) setRoof(false);
    else if (!roofShown && !inside) {
      /* 向外再多走 HYST 才算真的离开，免得在门槛线上闪 */
      var out = x < IN_STORE.x0 - HYST || x > IN_STORE.x1 + HYST ||
                z < IN_STORE.z0 - HYST || z > IN_STORE.z1 + HYST;
      if (out) setRoof(true);
    }
  }

  /* ---------------- 地面高度 ----------------
     40_weather.js 的 groundY 只知道人行道与车道，不知道店内地板
     比人行道高 5.5cm。这里补上。 */
  W.floorAt = function (x, z) {
    if (x > -5.83 && x < 4.03 && z < -1.13 && z > -6.83) return 0.215;
    return SB.groundY(x, z);
  };

  /* ---------------- 吊臂：把相机与角色放到该在的位置 ----------------
     落点固定在「脚底 + aimH」，不跟着走路起伏抖 —— 俯视时相机一晃
     整屏都在晃。 */
  function applyCamera() {
    var cam = SB.camera, p = SB.player;
    var fy = floorNow === null ? W.floorAt(p.x, p.z) : floorNow;
    var cp = Math.cos(L.pitch), sp = Math.sin(L.pitch);
    /* 视线方向 = 绕 Y 转 yaw、绕 X 转 pitch 之后的 -Z 轴，展开就是
         (-cosθ·sinφ, sinθ, -cosθ·cosφ)   （θ=pitch，φ=yaw）
       相机放在「落点沿视线反方向退开 CAM.dist」处。两者严格互逆，
       因此不需要 lookAt，也就不会引入任何滚转。 */
    cam.position.set(
      p.x + cp * Math.sin(L.yaw) * CAM.dist,
      fy + CAM.aimH - sp * CAM.dist,
      p.z + cp * Math.cos(L.yaw) * CAM.dist
    );
    cam.rotation.set(L.pitch, L.yaw, 0);
    p.yaw = L.yaw; p.pitch = L.pitch;
  }

  /* ---------------- 角色本体 ----------------
     走路起伏加在角色身上，不是加在相机上。 */
  function applyAvatar() {
    var a = SB.avatar, p = SB.player;
    if (!a) return;
    var fy = floorNow === null ? W.floorAt(p.x, p.z) : floorNow;
    var bob = Math.abs(Math.sin(p.walkPhase)) * p.bob * 0.035;
    a.position.set(p.x, fy + bob, p.z);
    a.rotation.y = p.face;
  }

  /* 角色转向：走最短的一边，按 FACE_RATE 收敛（瞬转像抽搐，太慢像在漂） */
  function turnTo(aim, dt) {
    var p = SB.player;
    var d = aim - p.face;
    while (d > Math.PI) d -= Math.PI * 2;
    while (d < -Math.PI) d += Math.PI * 2;
    var step = FACE_RATE * dt;
    if (d > step) d = step; else if (d < -step) d = -step;
    p.face += d;
  }

  /* 相机方位角向目标收敛（facePoint 设的目标） */
  function easeYaw(dt) {
    if (yawT === null) return;
    var d = yawT - L.yaw;
    while (d > Math.PI) d -= Math.PI * 2;
    while (d < -Math.PI) d += Math.PI * 2;
    var step = YAW_RATE * dt;
    if (Math.abs(d) <= step) { L.yaw = yawT; yawT = null; }
    else L.yaw += (d > 0 ? step : -step);
  }

  /* ---------------- 室内剖切：挡住角色的东西变透明 ----------------
     吊臂挂在角色后上方（水平 3.67m、高 6.26m），而店里净高只有 2.85m。
     靠墙站的时候，后墙 / 货架 / 冷柜正好卡在相机与角色之间，角色整个
     消失 —— 而俯视第三人称的全部意义就是「看得见自己」。

     判据：从相机向**角色身体上的一圈采样点**各连一条线，与其中任意一条
     相交的东西就变透明。这些采样点撑出来的锥体，就是屏幕上「角色所占的
     那个圆」—— 凡是在这个锥体里的物件，投影下来必然落在角色身上；只是
     从旁边擦过的东西不会被误伤。

     ⚠ 为什么不是「把相机→角色的线段按半径膨胀成圆管」：那个近似太松。
     膨胀 0.65m 等于把一段 0.16m 厚的门头横梁当成 1.46m 厚，于是「与圆管
     相交」的名单里有大量根本没挡到角色的东西。实测（同一机位）：
     圆管法剖了 8 样 —— 店面框架、左墙、门头，全是并不挡人的；而真正压在
     角色身前的 1 样（吊顶灯槽）恰恰没被剖。射线法两头都对。

     ⚠ 候选集必须用 W.blocks（全场景实心 mesh），不能用 W.occluders ——
     后者带「高过 0.9m、厚过 0.2m」的门槛，是为热点可见性定的，会把玻璃门、
     货架顶板、一罐饮料、吊挂灯箱、墙内衬全排除在外。

     ⚠ 材质是**共享**的：20_interior.js 的 Tc(c) 按颜色缓存、10_store.js 的
     wallMat / innerMat 也是一个材质铺很多个 mesh。直接改 opacity 会把用同一
     材质的别的东西一起改掉（而且复原时互相打架）—— 所以第一次要变透明
     之前先克隆一份给自己。three.js 的着色器程序缓存按材质参数做键，
     参数相同的克隆不会重新编译，代价可以忽略。

     ⚠ 渐隐是逐帧收敛的，而截图夹具只调一次 update()。所以对外提供
     settle()：立刻推到终态 —— 夹具与自检都调它，免得看到「淡到一半」的样子。
     这是本项目栽过两次的坑（夹具参数静默失效）。 */
  var CUT = SB.CUT || { on: false };
  var ghosts = new Map();          // mesh -> { cur, mats, outlines }

  /* 身体采样点：5 个高度 × 每个高度（正中 + 两圈各 8 个点）。
     高度下限 0.40 不是随手写的：店内地面顶面在 0.215，射线终点若低于它，
     就会命中「地板」并把地板推成半透明 —— 那等于把脚下的世界挖空。
     两圈半径取 bodyR 的 0.5 与 1.0（0.15 / 0.30），覆盖肩宽
     （角色本体水平半径约 0.34）。

     ⚠ 采样不能稀。只取「正中 + 前后左右」四个方向时射线之间留着 30cm 的缝，
     一个 7cm 宽的罐子恰好落在 0.15m 的偏移上就一条线也不碰 —— 于是
     「挡着角色的东西没被剖」会在便当岛前一类的场景里悄悄发生（实测漏 3 件）。
     两圈各 8 个点把缝压到 6cm 以下，代价是 85 条线而不是 20 条。
     数组预分配并原地改写：每帧新建一堆小数组纯属喂 GC。 */
  var BODY_H = [0.40, 0.72, 1.05, 1.38, 1.70];
  var RING_N = 8;
  var _pts = [];
  for (var _i = 0; _i < BODY_H.length * (1 + RING_N * 2); _i++) _pts.push([0, 0, 0]);
  function fillBodyPts(px, pz, fy) {
    var R = CUT.bodyR, n = 0;
    for (var i = 0; i < BODY_H.length; i++) {
      var y = fy + BODY_H[i];
      _pts[n][0] = px; _pts[n][1] = y; _pts[n][2] = pz; n++;   // 正中
      for (var ring = 1; ring <= 2; ring++) {
        var r = R * ring * 0.5;
        for (var k = 0; k < RING_N; k++) {
          var a = k * Math.PI * 2 / RING_N;
          _pts[n][0] = px + Math.cos(a) * r;
          _pts[n][1] = y;
          _pts[n][2] = pz + Math.sin(a) * r;
          n++;
        }
      }
    }
  }

  /* 屏幕上真的看得见吗：祖先链上只要有一层 visible=false 就等于没有。
     不能只看 m.visible —— 隐藏父分组不会改子节点的 .visible。 */
  function shownInScene(o) {
    for (var q = o; q; q = q.parent) if (q.visible === false) return false;
    return true;
  }

  function ghostState(mesh) {
    var src = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
    var orig = [], own = [], outlines = [];
    for (var i = 0; i < src.length; i++) {
      var o = src[i];
      if (!o) { orig.push(null); own.push(null); continue; }
      orig.push({ transparent: o.transparent, opacity: o.opacity, depthWrite: o.depthWrite });
      var c = o.clone();
      c.needsUpdate = true;
      own.push(c);
    }
    mesh.material = Array.isArray(mesh.material) ? own : own[0];
    for (var k = 0; k < mesh.children.length; k++) {
      var ch = mesh.children[k];
      if (ch.isMesh && ch.material === SB.OUT) outlines.push(ch);
    }
    return { cur: 0, mats: orig, outlines: outlines };
  }

  function applyGhost(mesh, st, k) {
    var faded = k > 0.002;
    var mats = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
    for (var i = 0; i < mats.length; i++) {
      var m = mats[i], o = st.mats[i];
      if (!m || !o) continue;
      /* transparent 一改就要 needsUpdate（换着色器变体）。所以只在真的
         跨过 0 的时候改一次，不是每帧写 —— 逐帧写会每帧重编译。 */
      var wantT = o.transparent || faded;
      if (m.transparent !== wantT) { m.transparent = wantT; m.needsUpdate = true; }
      m.opacity = o.opacity * (1 - k) + CUT.opacity * k;
      /* 变透明时不再写深度，否则它会挡住同一批里后画的透明物 */
      m.depthWrite = faded ? false : o.depthWrite;
    }
    /* 描边共用一套 SB.OUT 材质，没法单独调透明度 —— 变透明时整根收掉。
       留着一个黑色线框幽灵，比不剖还难看。 */
    for (var j = 0; j < st.outlines.length; j++) st.outlines[j].visible = !faded;
  }

  /* 此刻「应该变透明」的那批 mesh。纯算术，不依赖渲染与像素。
     站位与相机都没动时直接复用上一帧的结论 —— 全场景候选有数百件 × 20 条
     射线，站着读对话时每帧白算一遍纯属浪费。 */
  var _cutSig = null, _cutOut = [];
  /* 命中判定的宽容带：射线离盒子 5cm 以内就算「挡在身前」。
     这一条不是宽松，是补采样量化的缝：离散采样点最多留 6cm 的间隙，
     一件刚好落在缝里的东西会因为 1cm 的差别在「剖 / 不剖」之间跳 ——
     实测便当岛上方的挡板就是这样：探针的采样半径比实现大 1cm 就打中它，
     实现自己打不中。加了宽容带，边缘那些 10cm 级的薄片不会再忽隐忽现。

     ⚠ 但宽容带是拿**轴向 AABB 膨胀**做的，它在横向加宽轮廓的同时，
     也沿着射线方向把盒子向两端撑大。向后撑的那 5cm 会制造假命中：
     实测站在后墙货架前 0.43m 处，身后货架上一件商品 z[−6.16,−5.63]
     （人背后最远的采样点在 z=−5.60，在商品之前 3cm）本来碰不到任何射线，
     膨胀后盒子伸到 −5.58、刚好把那个采样点吞进去，于是「身后货架上的
     一包零食」被剖成了半透明 —— 屏幕上看着像凭空消失。
     所以再加一条：**命中点必须真的在身体之前**。把 t 换算成世界距离，
     要求它比射线全长至少短一个宽容带 —— 等于说「宽容带可以横向吞掉
     轮廓边缘，但不许向后越过身体」。 */
  var CUT_PAD = 0.05;
  var _padBox = new THREE.Box3();
  /* 重算节流：一次重算是 895 个候选 × 85 条射线（实测冷启动 3ms，最坏 7.6ms），
     按帧算会吃掉五分之一的帧预算。渐隐本来就要 0.1~0.35 秒才收敛，
     所以 9Hz 的更新频率在屏幕上看不出差别，站着不动时更是零开销。
     夹具与自检走 force=true，不受节流影响 —— 它们要的是「最终态」。 */
  var CUT_EVERY = 0.11;
  var _cutAge = 0;
  function cutTargets(force) {
    if (!CUT.on) return [];
    var p = SB.player;
    if (!inStore(p.x, p.z)) return [];          // 街上不剖：没有需要让开的顶
    var blocks = W.blocks;
    if (!blocks || !blocks.length) return [];
    var cam = SB.camera.position;
    var sig = p.x.toFixed(2) + ',' + p.z.toFixed(2) + ',' +
      cam.x.toFixed(2) + ',' + cam.y.toFixed(2) + ',' + cam.z.toFixed(2) +
      ',' + (W.roofShown ? 1 : 0) + ',' + CUT.bodyR;
    if (sig === _cutSig) return _cutOut;
    if (!force && _cutAge < CUT_EVERY) return _cutOut;
    _cutAge = 0;
    var fy = floorNow === null ? W.floorAt(p.x, p.z) : floorNow;
    fillBodyPts(p.x, p.z, fy);
    var out = [];
    for (var i = 0; i < blocks.length; i++) {
      var b = blocks[i];
      if (b.roof && !W.roofShown) continue;     // 屋顶已收，本来就看不见
      _padBox.min.set(b.min.x - CUT_PAD, b.min.y - CUT_PAD, b.min.z - CUT_PAD);
      _padBox.max.set(b.max.x + CUT_PAD, b.max.y + CUT_PAD, b.max.z + CUT_PAD);
      var hit = false;
      for (var k = 0; k < _pts.length; k++) {
        var pt = _pts[k];
        var t = W.segBoxT(cam.x, cam.y, cam.z, pt[0], pt[1], pt[2], _padBox);
        if (t < 0) continue;
        /* 命中点落在端点前 CUT_PAD 之内 → 这是「宽容带向后撑出来」的
           假命中（那条线段的实测正是 t≈1.000），不是真的挡在身前。 */
        var dx = pt[0] - cam.x, dy = pt[1] - cam.y, dz = pt[2] - cam.z;
        var len = Math.sqrt(dx * dx + dy * dy + dz * dz);
        if (t * len > len - CUT_PAD) continue;
        hit = true; break;
      }
      /* 可见性放命中之后判：绝大多数候选连射线都碰不到，先过筛再看祖先链 */
      if (hit && shownInScene(b.mesh)) out.push(b.mesh);
    }
    _cutSig = sig; _cutOut = out;
    return out;
  }

  function stepGhost(mesh, st, go, dt) {
    var rate = go ? CUT.rateIn : CUT.rateOut;
    st.cur += (go - st.cur) * Math.min(1, dt * rate);
    if (go && st.cur > 0.999) st.cur = 1;
    applyGhost(mesh, st, st.cur);
  }

  function updateCutaway(dt) {
    if (!CUT.on && !ghosts.size) return;
    _cutAge += dt;
    var want = cutTargets(false), wish = {};
    for (var i = 0; i < want.length; i++) {
      var mesh = want[i];
      wish[mesh.uuid] = 1;
      var st = ghosts.get(mesh);
      if (!st) { st = ghostState(mesh); ghosts.set(mesh, st); }
      stepGhost(mesh, st, 1, dt);
    }
    var drop = [];
    ghosts.forEach(function (s, m) {
      if (wish[m.uuid]) return;
      stepGhost(m, s, 0, dt);
      if (s.cur <= 0.002) drop.push(m);
    });
    for (var d = 0; d < drop.length; d++) {
      var sd = ghosts.get(drop[d]);
      if (sd) { applyGhost(drop[d], sd, 0); ghosts.delete(drop[d]); }
    }
  }

  /* 立刻推到终态 —— 夹具与自检用，避免「淡到一半」被当成实现错。
     force=true 绕开节流：调用者要的是「此刻的最终态」，不是「上一批」。 */
  function settleCutaway() {
    var want = cutTargets(true), wish = {};
    for (var i = 0; i < want.length; i++) {
      var mesh = want[i];
      wish[mesh.uuid] = 1;
      var st = ghosts.get(mesh);
      if (!st) { st = ghostState(mesh); ghosts.set(mesh, st); }
      st.cur = 1; applyGhost(mesh, st, 1);
    }
    var drop = [];
    ghosts.forEach(function (s, m) {
      if (wish[m.uuid]) return;
      s.cur = 0; applyGhost(m, s, 0);
      drop.push(m);
    });
    for (var d = 0; d < drop.length; d++) ghosts.delete(drop[d]);
  }

  function ghostList() {
    var out = [];
    ghosts.forEach(function (s, m) { if (s.cur > 0.5) out.push(m); });
    return out;
  }

  /* 站在 (x,z)、朝 yaw 时，哪些东西会被剖掉（只返回名字，供日志用）。
     这是剖切的「可断言版本」：不动渲染、不动材质，纯算术。

     ⚠ 相机**必须让引擎自己摆**（调 applyCamera），不能在这里另抄一遍几何。
     原来这里用 W.cam.posFor() 自己算相机位置，而 applyCamera() 用的是
     **会平滑过渡的 floorNow** —— 两边差几厘米，剖切集合就不一样，
     于是探针说「这里挡了 5 样」、真跑起来却是 2 样（实测）。
     这就是本项目的常客「夹具参数静默失效」：重建状态 = 两套事实。
     这里只把输入钉住（站位、朝向、地面高度取站定后的值），其余交给引擎。 */
  function cutProbe(px, pz, yaw) {
    var sx = SB.player.x, sz = SB.player.z, sf = floorNow, sy = L.yaw;
    SB.player.x = px; SB.player.z = pz;
    floorNow = W.floorAt(px, pz);           // 站定之后的地面高度（终态）
    L.yaw = yaw;
    applyCamera();
    var list = cutTargets(true).map(function (m) {
      return m.name || (m.parent && m.parent.name) || (m.geometry && m.geometry.type) || 'mesh';
    });
    SB.player.x = sx; SB.player.z = sz; floorNow = sf; L.yaw = sy;
    applyCamera();
    return list;
  }

  /* 扫店内可达点 × 12 个方位角，找一个「确实有东西挡着角色」的站位。
     自检用它把场景摆到剖切真正生效的那一帧；文档也可以用它举例子。 */
  function findCutSpot() {
    var best = null;
    for (var x = IN_STORE.x0 + 0.5; x < IN_STORE.x1 && !(best && best.count >= 4); x += 0.5) {
      for (var z = IN_STORE.z0 + 0.5; z < IN_STORE.z1; z += 0.5) {
        if (!W.canWalk(x, z)) continue;
        for (var a = 0; a < 12; a++) {
          var yaw = a * Math.PI / 6;
          var n = cutProbe(x, z, yaw).length;
          if (n && (!best || n > best.count)) {
            best = { x: x, z: z, yaw: yaw, count: n };
            if (n >= 4) break;
          }
        }
        if (best && best.count >= 4) break;
      }
    }
    return best;
  }

  /* ---------------- 逐轴移动 ---------------- */
  function step(dx, dz) {
    var p = SB.player, r = p.radius;
    if (dx) { if (W.canWalk(p.x + dx, p.z, r)) p.x += dx; }
    if (dz) { if (W.canWalk(p.x, p.z + dz, r)) p.z += dz; }
  }

  /* ---------------- 输入 ---------------- */
  function onKey(e, down) {
    var k = e.key.toLowerCase();
    keys[k] = down;
    if (down && (k === ' ' || k === 'e')) {
      if (W.walk.onInteract) W.walk.onInteract();
      e.preventDefault();
    }
    if (down && ['w', 'a', 's', 'd', 'arrowup', 'arrowdown', 'arrowleft', 'arrowright'].indexOf(k) >= 0) {
      target = null;                     // 手动操作即取消自动走
      yawT = null; faceT = null;         // …也取消 facePoint 留下的转镜头
      e.preventDefault();
    }
  }

  function bindPointer(canvas) {
    canvas.addEventListener('pointerdown', function (e) {
      if (!W.walk.enabled) return;
      if (e.button !== 0) return;
      dragging = true; moved = 0; lastX = e.clientX; lastY = e.clientY;
      /* 包 try/catch：合成事件（自检里派发的 PointerEvent）的 pointerId
         没有真正注册过，setPointerCapture 会抛 InvalidPointerId，
         而抛在事件处理函数里会冒到 window.onerror、把页面标题改成 ERR。 */
      try { canvas.setPointerCapture(e.pointerId); } catch (err) { }
    });
    canvas.addEventListener('pointermove', function (e) {
      if (!dragging || !W.walk.enabled) return;
      var dx = e.clientX - lastX, dy = e.clientY - lastY;
      lastX = e.clientX; lastY = e.clientY;
      moved += Math.abs(dx) + Math.abs(dy);
      yawT = null;                       // 手动拖动优先于缓动目标
      L.yaw -= dx * LOOK_SENS;
      /* 竖直方向不响应 —— 俯角锁死。dy 仍要读进来更新 lastY，
         否则松手再按下时会把竖直位移算到第一帧的水平量上。 */
      if (!LOCK_PITCH) {
        L.pitch -= dy * LOOK_SENS;
        if (L.pitch < PITCH_MIN) L.pitch = PITCH_MIN;
        if (L.pitch > PITCH_MAX) L.pitch = PITCH_MAX;
      }
    });
    function up(e) {
      if (!dragging) return;
      dragging = false;
      try { canvas.releasePointerCapture(e.pointerId); } catch (err) { }
      if (moved < 6) clickGround(e.clientX, e.clientY);
    }
    canvas.addEventListener('pointerup', up);
    canvas.addEventListener('pointercancel', function () { dragging = false; });
  }

  /* ---------------- 点地面走：与水平面解析求交 ----------------
     不走射线检测整个场景——场景里有几十个辉光 Sprite，
     three.js 投影 Sprite 时会读 raycaster.camera，容易踩坑。
     与一个水平面求交只需要一次除法。 */
  var ndc = new THREE.Vector2();
  function clickGround(cx, cy) {
    if (!W.walk.enabled) return;
    var rect = SB.renderer.domElement.getBoundingClientRect();
    ndc.x = ((cx - rect.left) / rect.width) * 2 - 1;
    ndc.y = -((cy - rect.top) / rect.height) * 2 + 1;
    /* 用相机基向量直接构造射线，避免再建一个 Raycaster */
    var inv = new THREE.Matrix4().copy(SB.camera.projectionMatrixInverse);
    var v = new THREE.Vector3(ndc.x, ndc.y, 0.5).applyMatrix4(inv)
      .applyMatrix4(SB.camera.matrixWorld);
    var dir = v.sub(SB.camera.position).normalize();
    if (dir.y > -0.12) return;                      // 看得太平，交给玩家自己走
    var p = SB.player;
    var fy = W.floorAt(p.x, p.z) + 0.02;
    var t = (fy - SB.camera.position.y) / dir.y;
    if (t <= 0 || t > 26) return;
    var tx = SB.camera.position.x + dir.x * t;
    var tz = SB.camera.position.z + dir.z * t;
    /* 落点不可走时，沿方向往回缩，找最近的可走点 */
    for (var i = 0; i < 14 && !W.canWalk(tx, tz); i++) {
      var f = 1 - (i + 1) * 0.055;
      tx = SB.camera.position.x + dir.x * t * f;
      tz = SB.camera.position.z + dir.z * t * f;
    }
    if (!W.canWalk(tx, tz)) return;
    target = { x: tx, z: tz };
  }

  /* ---------------- 每帧 ---------------- */
  W.walk = {
    enabled: true,
    keys: keys,
    target: function () { return target; },
    /* ⚠ 这里只清「移动输入」，不能顺手清 yawT/faceT：
       enterDialog 的顺序是 facePoint → goto → setMode('dialog') → stop()，
       把转向目标一起清掉的话，相机永远转不到刚点的那个东西上。 */
    stop: function () { target = null; for (var k in keys) keys[k] = false; },
    /* 转向并看向某个世界坐标（进入对话前用）。
       第三人称下这一步要做两件事：把吊臂转到「玩家背后 → 朝向它」，
       并让角色本体也转过去。只转相机的话，玩家看到的是自己背对
       要交互的东西，读起来像「我在看别处」。俯角不动 —— 每次进对话
       都改俯角会让构图忽高忽低。 */
    facePoint: function (x, y, z) {
      var p = SB.player;
      var dx = x - p.x, dz = z - p.z;
      if (Math.abs(dx) + Math.abs(dz) < 1e-4) return;
      yawT = Math.atan2(-dx, -dz);
      faceT = Math.atan2(dx, dz);
    },
    onInteract: null,
    setTarget: function (x, z) { target = { x: x, z: z }; },
    /* 直接改朝向。别只写 SB.player.yaw —— 那份只是每帧被 L 覆盖的副本，
       写它等于没写（截图夹具曾经因此静默失效：&yaw= 一直不生效）。
       同时清掉缓动目标：夹具给的是终值，不该被慢慢转过去。 */
    setView: function (yaw, pitch) {
      if (yaw !== undefined && !isNaN(yaw)) { L.yaw = yaw; yawT = null; }
      /* 俯角锁定后，夹具传的 &pitch= 一律忽略 —— 否则「锁定」就成了
         一句只在玩家手上生效、在夹具里失效的话，两边看到的构图又不一样。 */
      if (!LOCK_PITCH && pitch !== undefined && !isNaN(pitch)) {
        /* 夹在吊臂允许的俯角区间里：夹具传一个第一人称时代的 -0.06
           会被夹到 23°，而不是把相机放平到看不见地面。 */
        L.pitch = Math.max(PITCH_MIN, Math.min(PITCH_MAX, pitch));
      }
    },

    update: function (dt) {
      var p = SB.player;

      if (W.walk.enabled) {
        /* 平滑地面高度，跨门槛不跳 */
        var want = W.floorAt(p.x, p.z);
        floorNow = floorNow === null ? want : floorNow + (want - floorNow) * Math.min(1, dt * 9);

        var fx = 0, fz = 0;
        if (keys['w'] || keys['arrowup']) fz += 1;
        if (keys['s'] || keys['arrowdown']) fz -= 1;
        if (keys['a'] || keys['arrowleft']) fx -= 1;
        if (keys['d'] || keys['arrowright']) fx += 1;

        var speed = p.speed * (keys['shift'] ? 1.7 : 1);
        var sp = 0;

        if (fx || fz) {
          var len = Math.sqrt(fx * fx + fz * fz);
          fx /= len; fz /= len;
          var sy = Math.sin(L.yaw), cy = Math.cos(L.yaw);
          /* 前 = 相机朝向在水平面的投影；右 = 其右手方向 */
          var wx = (-sy * fz + cy * fx) * speed * dt;
          var wz = (-cy * fz - sy * fx) * speed * dt;
          step(wx, wz);
          /* 角色面朝「真正走的方向」，而不是永远背着相机 ——
             横走时侧过身去，这是俯视视角里唯一能把方向讲清楚的地方。
             手动一走就丢掉 facePoint 留下的目标朝向（人推的方向优先）。 */
          faceT = null;
          turnTo(Math.atan2(wx, wz), dt);
          sp = speed;
        } else if (target) {
          var ddx = target.x - p.x, ddz = target.z - p.z;
          var d = Math.sqrt(ddx * ddx + ddz * ddz);
          if (d < 0.12) { target = null; stuck = 0; }
          else {
            var st = Math.min(speed * dt, d);
            var bx = p.x, bz = p.z;
            step(ddx / d * st, ddz / d * st);
            faceT = null;
            turnTo(Math.atan2(ddx, ddz), dt);
            /* 被卡住超过半秒就放弃这次自动走 */
            if (Math.abs(p.x - bx) + Math.abs(p.z - bz) < st * 0.3) {
              stuck += dt;
              if (stuck > 0.5) { target = null; stuck = 0; }
            } else stuck = 0;
            sp = speed;
          }
        }

        /* 走路起伏：只在真的移动时累积相位 */
        var bobTarget = sp ? 1 : 0;
        p.bob += (bobTarget - p.bob) * Math.min(1, dt * 6);
        if (sp) p.walkPhase += dt * 9.2;

        /* 感应门：离门洞越近开得越大 */
        var dxDoor = p.x - 3.0, dzDoor = p.z + 1.18;
        var dd = Math.sqrt(dxDoor * dxDoor + dzDoor * dzDoor);
        var want2 = Math.max(0, Math.min(1, (2.45 - dd) / 0.95));
        SB.doorOpen = SB.doorOpen + (want2 - SB.doorOpen) * Math.min(1, dt * 7);
      }

      /* 目标朝向 / 目标方位角：进对话时 facePoint 设的那两个目标
         在这里慢慢收敛。放 enabled 之外 —— 读对话框的时候相机
         本来就该继续把镜头摆过去。 */
      if (faceT !== null) turnTo(faceT, dt);
      easeYaw(dt);

      /* 屋顶收放与角色同步在两种状态下都要跑：进对话时相机与角色
         仍然要停在正确的位置上，不能只更新相机不更新人。 */
      updateRoof(p.x, p.z);
      applyCamera();
      applyAvatar();
      /* 剖切放在最后：它要读这一帧相机的最终位置。对话里也要跑 ——
         进对话时镜头正对着某个东西，角色更不该被挡掉。 */
      updateCutaway(dt);
    },

    bind: function () {
      var canvas = SB.renderer.domElement;
      bindPointer(canvas);
      window.addEventListener('keydown', function (e) { onKey(e, true); });
      window.addEventListener('keyup', function (e) { onKey(e, false); });
      window.addEventListener('blur', function () { for (var k in keys) keys[k] = false; dragging = false; });
      initRoof();
      /* 强制落一次屋顶状态：动态遮挡体（W.dynOccluders）也要跟着初始化，
         否则站在马路上时，俯视视线会绕过屋顶落在店里，
         「收银台」「饮料冷柜」的浮标会隔着房顶浮出来。 */
      setRoof(!inStore(SB.player.x, SB.player.z));
      SB.applyLens();
      applyCamera();
      applyAvatar();
    }
  };

  /* 对外暴露，供自检/夹具查询与调试（第三人称的几何是可断言的算术） */
  W.cam = {
    dist: function () { return CAM.dist; },
    pitch: function () { return L.pitch; },
    yaw: function () { return L.yaw; },
    lockPitch: function () { return LOCK_PITCH; },
    roofShown: function () { return roofShown; },
    inStore: function (x, z) { return inStore(x, z); },
    /* 把「屋顶在不在」设成「玩家站在 (x,z) 时」的样子。
       自检靠它复现第三人称的可见性：站到某个位置时，相机在哪儿、
       屋顶收没收，两件事都定下来，才谈得上「那里看得见吗」。 */
    setRoofAt: function (x, z) { setRoof(!inStore(x, z)); },
    /* 给定站位与朝向，算出吊臂会把相机放在哪里 ——
       自检用它代替第一人称时代的「眼高视线」。
       ⚠ 问的若是**当前站位**，要跟 applyCamera 用同一份地面高度：
       那个值在门口是平滑过渡的（floorNow），查表值会和实际相机差几厘米。
       问别的站位时用查表值 —— 那里没有「过渡」，只有几何。 */
    posFor: function (px, pz, yaw) {
      var same = Math.abs(px - SB.player.x) < 1e-6 && Math.abs(pz - SB.player.z) < 1e-6;
      var fy = (same && floorNow !== null) ? floorNow : W.floorAt(px, pz);
      var cp = Math.cos(L.pitch), sp = Math.sin(L.pitch);
      return {
        x: px + cp * Math.sin(yaw) * CAM.dist,
        y: fy + CAM.aimH - sp * CAM.dist,
        z: pz + cp * Math.cos(yaw) * CAM.dist
      };
    }
  };

  /* 室内剖切的对外接口。自检靠它验证「站到某处时到底有没有东西在挡」，
     不需要读像素，也不需要真的渲染 —— 割的判定和显示用的是同一份算术。 */
  W.cutaway = {
    on: function () { return !!CUT.on; },
    bodyR: function () { return CUT.bodyR; },
    pad: function () { return CUT_PAD; },
    opacity: function () { return CUT.opacity; },
    candidates: function () { return (W.blocks || []).length; },
    /* 此刻生效吗：开着 + 人在店里。街上不剖。 */
    active: function () { return !!(CUT.on && inStore(SB.player.x, SB.player.z)); },
    ghosts: ghostList,                       // 当前真的变透明了的那批
    targets: function () { return cutTargets(true); },
    settle: settleCutaway,                   // 立刻到终态（夹具/自检用）
    probe: cutProbe,                         // 指定站位与朝向 → 会被剖掉的名字
    findSpot: findCutSpot,                   // 找一个「确实被挡」的站位
    /* 采样点本身也是规格的一部分，交出去让自检用它做**独立的**复核：
       自检不复用 cutTargets 的结论，而是拿同一批射线回到原始场景图上重算
       一遍候选，这样「候选集漏了东西」才可能被抓住。 */
    rays: function () {
      var p = SB.player;
      var fy = floorNow === null ? W.floorAt(p.x, p.z) : floorNow;
      fillBodyPts(p.x, p.z, fy);
      var out = [];
      for (var i = 0; i < _pts.length; i++) out.push([_pts[i][0], _pts[i][1], _pts[i][2]]);
      return out;
    }
  };
})();
