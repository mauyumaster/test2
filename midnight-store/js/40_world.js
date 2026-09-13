/* ===========================================================
   40_world.js  ——  空间定义
   ------------------------------------------------------------
   把「一份选项列表」变成「一个有立场的地方」。这一层负责四件事：

   1. 边界     —— 能走到哪（人行道 + 店内 + 小巷，不上车道、不出街区）
   2. 碰撞体   —— 从场景图按分组白名单自动收集 AABB，而不是手抄坐标。
                  模型改了，碰撞自动跟着改。感应门按名字放行，否则进不去店。
   3. 视线     —— 解析式求交（线段 × AABB），不用射线检测。
                  透明材质（玻璃、雨、光晕）不算遮挡，所以站在雨里能透过
                  玻璃看见店里的热点；而墙和柜子会真的挡住。
   4. 热点     —— 每个热点有世界坐标、需要站多近、以及「谁能看见它」。
                  * 基础热点人人可见。
                  * 细节热点带 need（技能阈值或已内化的想法），
                    感知低的人根本不知道它在那里 —— 这是分辨率，不是数值。
                  细节不替换基础热点，而是作为第二个锚点并存：
                  高感知的人在同一面冷柜上看见两个东西，低感知的人看见一个。

   出口：window.W
   =========================================================== */

window.W = window.W || {};

(function () {
  var THREE = window.THREE, SB = window.SB;
  W.THREE = THREE;

  /* ---------------- 1. 世界边界 ----------------
     z1 放到斑马线那一头（7.6），而不是路缘石（0.9）或车道中段（4.4）。
     理由是一个取景结论，不是随手放宽：站在离店面 4.5m 处、眼高 1.62m、
     水平视野 87° 时，宽 10.4m 的店面正好铺满整个画框 —— 暗的天空和暗的
     马路都被挤出画面，整帧只剩「发光的店面 + 被照亮的人行道」，夜景
     于是读起来像白天。退到 7m 外，店面只占中间约 45%，上下各留三成暗，
     才回到参考图那种「深夜里一块发光的招牌」的读法。
     凌晨两点的空街没有车，允许站在车道上。路缘石高 23cm，低于 STEP_OVER，
     所以是「走下去」而不是「撞上去」。 */
  W.BOUND = { x0: -7.62, x1: 7.62, z0: -7.16, z1: 7.60 };

  /* ---------------- 2. 碰撞体 / 遮挡体 ---------------- */
  /* 白名单：这些分组里的实心东西参与碰撞。地面、标线、停车位、屋顶、
     雨幕、灯箱框架都不在内 —— 要么可以踩过去，要么根本不该挡人。 */
  var SOLID_GROUPS = [
    'store', 'shelfA', 'cooler', 'backdoor', 'islandA', 'islandB', 'leftwall',
    'counter', 'front', 'awning', 'umbrella', 'vending', 'bins', 'pole',
    'corner', 'rail', 'notice', 'alley', 'ac', 'neighbor', 'bike',
    /* 可玩版新建的物件 */
    'booth', 'busstop', 'bookpile', 'clerk', 'seat', 'lamp'
  ];
  /* 感应门：位置由分组承载，但人要能走过去 */
  var PASSABLE = { door0: 1, door1: 1 };
  /* 可以踩过去的高度（门槛 6cm、地垫、地贴） */
  var STEP_OVER = 0.30;
  /* 玩家的竖直占用：从脚底往上 HEAD 米。用于把「从头顶过去的东西」
     （雨棚、横臂、路牌）排除在碰撞之外。 */
  var HEAD = 1.68;
  /* 太薄的贴片不参与（标价签、海报）
     —— 否则它们会在货架前形成一层看不见的墙 */

  function firstMat(m) {
    if (!m.material) return null;
    return Array.isArray(m.material) ? (m.material[4] || m.material[0]) : m.material;
  }
  function isSeeThrough(m) {
    var mat = firstMat(m);
    if (!mat) return true;
    /* 加法混合的东西是「叠上去的光」，不遮后面 —— 辉光、玻璃反光条纹、
       路面反光都属这一类。它们常常 opacity 是 1，靠贴图自带 alpha 生效，
       所以不能只看 opacity。橱窗那层反光条纹就是典型：它铺满整个玻璃幕墙
       （x -5.6~2.4，y 0.66~2.9），一旦被当成遮挡，站在马路上就永远
       看不见店内的热点。 */
    if (mat.blending === THREE.AdditiveBlending) return true;
    if (mat.transparent && mat.opacity < 0.75) return true;              // 玻璃幕墙、门玻璃、雨幕
    if (mat.transparent && mat.depthWrite === false && mat.map) return true; // 贴图自带 alpha 的贴片
    return false;
  }

  W.solids = [];      /* 碰撞：AABB，已按 STEP_OVER 过滤 */
  W.occluders = [];   /* 视线：AABB，已排除透明材质 */
  W.blocks = [];      /* 剖切候选：全场景实心 mesh，无高度/厚度门槛（见 2b） */
  /* 屋顶当前是否在位。俯视第三人称下玩家进店会收掉屋顶与吊顶
     （45_walk.js 驱动），此时**由屋顶产生的遮挡体必须一起失效** ——
     否则女儿墙、水箱这些已经看不见的东西还会挡住相机看向店内的视线，
     表现成「进店了却有些热点浮不出来」，而且看不出任何原因。
     遮挡体的 roof 标记在 collect() 里按节点祖先名打上。 */
  W.roofShown = true;
  W.collectStats = null;

  var ROOF_SET = {};
  (SB.ROOF_NODES || []).forEach(function (n) { ROOF_SET[n] = 1; });
  function isRoofObj(o) {
    for (var p = o; p; p = p.parent) {
      if (p.name && ROOF_SET[p.name]) return true;
    }
    return false;
  }

  function addMesh(m) {
    if (m.material === SB.OUT) return;                  // 描边：既不是墙也不是遮挡
    var b = new THREE.Box3().setFromObject(m);
    if (b.isEmpty()) return;
    var h = b.max.y - b.min.y;
    if (h < STEP_OVER) return;                          // 门槛 / 地垫 / 地贴：踩过去
    if (h < 0.06) return;
    b.roof = isRoofObj(m);                              // 属于会被收掉的屋顶/吊顶
    W.solids.push(b);
    if (!isSeeThrough(m) && b.max.y > 0.90 && h > 0.20) {
      /* 记下它对应的 mesh：热点标记要按 AABB 找到该被挡住的那个物体。
         ⚠ 这一份**不是**剖切用的候选集 —— 门槛（高过 0.9m、厚过 0.2m）是
         为「热点浮标看不看得见」定的，会把玻璃门、货架顶板、一罐饮料、
         吊挂灯箱这些「挡得住角色、却挡不住浮标」的东西全排除在外。
         剖切另有 W.blocks，见下面的 2b。 */
      b.mesh = m;
      W.occluders.push(b);
    }
  }

  function walkGroup(g) {
    for (var i = 0; i < g.children.length; i++) {
      var c = g.children[i];
      if (c.name && PASSABLE[c.name]) continue;         // 感应门放行
      if (c.isMesh) { addMesh(c); continue; }           // 命中 mesh 就不再往下（跳过描边子物体）
      if (c.children && c.children.length) walkGroup(c);
    }
  }

  /* ---------------- 2b. 剖切候选集：整棵场景树里的实心 mesh ----------------
     室内剖切问的是「屏幕上角色所占的那个圆里，挡着他的东西」。
     这和「什么挡住了热点浮标的视线」不是同一个问题，判据也不同：

       · 热点可见性关心「高过 0.9m、厚过 0.2m」的东西 —— 矮隔断、标价签不算；
       · 剖切只关心「有没有与相机→角色的那几条射线相交」，多薄多矮都算。

     于是冷柜的玻璃门（0.05 厚）、货架的顶层板（0.055 厚）、架子上的一罐
     饮料（0.2 高）、吊挂灯箱、还有 'interior' 组里的墙内衬 —— 全都可能
     是挡住角色的那一件，而它们一个都不在 W.occluders 里。

     ⚠ 这条是踩出来的：第一版图省事直接复用 W.occluders，结果「挡着角色的
     东西一件都没剖，倒把旁边并不挡人的墙剖了 8 样」。**判据不同就不能共用集合。**

     所以这里独立走一遍**全场景**（不按分组白名单 —— 白名单是给碰撞定的，
     'interior' 不在里面，而墙内衬、吊挂灯箱恰好都在 'interior'）。
     排除：描边、玩家自己、加法混合的叠光（本来就是透的）、本来就半透明的、
     以及铺在地上/雨幕这些「不是陈设」的组。
     收集只在启动时做一次；运行时只做几何判定。 */
  var NO_CUT_GROUPS = { ground: 1, street: 1, markings: 1, parking: 1, sky: 1, weather: 1 };
  /* 多材质的 mesh 只要有一面是实心的就算实心 —— 那一面就可能挡住角色 */
  function anyOpaque(m) {
    var arr = Array.isArray(m.material) ? m.material : [m.material];
    for (var i = 0; i < arr.length; i++) {
      var mt = arr[i];
      if (mt && mt.blending !== THREE.AdditiveBlending &&
          !(mt.transparent && mt.opacity < 0.75)) return true;
    }
    return false;
  }

  W.collect = function () {
    W.solids = []; W.occluders = []; W.blocks = [];
    SB.scene.updateMatrixWorld(true);
    for (var i = 0; i < SOLID_GROUPS.length; i++) {
      var name = SOLID_GROUPS[i], hit = [];
      SB.scene.traverse(function (o) {
        if (o.isGroup && o.name === name) hit.push(o);
      });
      for (var k = 0; k < hit.length; k++) walkGroup(hit[k]);
    }
    /* 剖切候选：整棵场景树（见上面 2b 的说明） */
    SB.scene.traverse(function (o) {
      if (!o.isMesh) return;
      if (o.material === SB.OUT) return;                       // 描边
      for (var q = o; q; q = q.parent) {
        if (q === SB.avatar) return;                           // 玩家自己 + 它的影子/描边
        if (q.name && NO_CUT_GROUPS[q.name]) return;           // 地面、街面、标线、雨幕
      }
      if (!anyOpaque(o)) return;
      var bb = new THREE.Box3().setFromObject(o);
      if (bb.isEmpty()) return;
      bb.mesh = o;
      bb.roof = isRoofObj(o);                                  // 随屋顶一起收掉的那批
      W.blocks.push(bb);
    });
    /* 只留下与世界边界相交的，减少每帧的判定量 */
    var B = W.BOUND, pad = 1.2;
    function near(b) {
      return b.max.x > B.x0 - pad && b.min.x < B.x1 + pad &&
             b.max.z > B.z0 - pad && b.min.z < B.z1 + pad;
    }
    var rawSolids = W.solids.length, rawOcc = W.occluders.length, rawBlocks = W.blocks.length;
    W.solids = W.solids.filter(near);
    W.occluders = W.occluders.filter(near);
    W.blocks = W.blocks.filter(near);
    /* 屋顶盖（SB.ROOF_CAP）：一块盖住整个店铺占地、位于屋顶高度的
       合成遮挡体。真实屋顶板只有 0.16m 厚，达不到遮挡体的高度门槛，
       于是相机在半空俯视时视线会绕过屋顶落进店里 —— 表现成站在马路上
       就能看见「收银台」「饮料冷柜」的浮标隔着房顶浮出来。
       它同样带 roof 标记，随屋顶一起失效。 */
    if (SB.ROOF_CAP) {
      var C = SB.ROOF_CAP;
      var cap = new THREE.Box3(
        new THREE.Vector3(C.min.x, C.min.y, C.min.z),
        new THREE.Vector3(C.max.x, C.max.y, C.max.z));
      cap.roof = true;
      W.occluders.push(cap);
    }
    W.collectStats = { solids: W.solids.length, occluders: W.occluders.length,
      blocks: W.blocks.length, rawSolids: rawSolids, rawOccluders: rawOcc,
      rawBlocks: rawBlocks };
    return W.collectStats;
  };

  /* ---------------- 3. 可行走判定 ---------------- */
  W.insideBound = function (x, z) {
    var B = W.BOUND;
    return x >= B.x0 && x <= B.x1 && z >= B.z0 && z <= B.z1;
  };

  W.blocked = function (x, z, r, y0) {
    r = r === undefined ? SB.player.radius : r;
    if (y0 === undefined) y0 = W.floorAt ? W.floorAt(x, z) : 0.16;
    var lo = y0 + STEP_OVER, hi = y0 + HEAD;
    for (var i = 0; i < W.solids.length; i++) {
      var b = W.solids[i];
      /* 只比 x/z 是不够的 —— 雨棚、信号灯横臂、街灯悬臂、路牌、雨棚顶
         这些离地两三米的板，会在整条街面上立起一道看不见的墙。
         必须把玩家的竖直占用区间 [脚+STEP_OVER, 脚+HEAD] 也算进去：
         从头顶过去的（雨棚）不挡，从脚下过去的（门槛）也不挡。 */
      if (b.max.y <= lo || b.min.y >= hi) continue;
      if (x > b.min.x - r && x < b.max.x + r && z > b.min.z - r && z < b.max.z + r) return b;
    }
    return null;
  };

  W.canWalk = function (x, z, r) {
    return W.insideBound(x, z) && !W.blocked(x, z, r);
  };

  /* ---------------- 4. 视线：线段 × AABB（slab 法） ----------------
     返回 true 表示被挡住。ax/ay/az 是视点，bx/by/bz 是目标点。 */

  /* 单次「线段 × 一个盒子」的 slab 求交。抽出来是因为 45_walk.js 的
     室内剖切要用同一套数学 —— 视线判定和剖切判定必须源自同一份实现，
     两边各抄一份、改一边忘一边，就会出现「看着透明、判定还挡着」这种
     自相矛盾的状态。

     两个入口：`segBoxT` 返回**进入参数 t**（0=视点，1=目标点；没有交点
     返回 −1），`segBox` 只回布尔。剖切要 t 是因为「命中在射线的哪一段」
     本身就是信息 —— 见 45_walk.js 里「宽容带不得向后越过身体」那一段。 */
  W.segBoxT = function (ax, ay, az, bx, by, bz, b) {
    var dx = bx - ax, dy = by - ay, dz = bz - az;
    var t0 = 0, t1 = 1;
    /* 三轴各收一次区间；遇到平行且在外侧就直接排除 */
    var p = [[ax, dx, b.min.x, b.max.x], [ay, dy, b.min.y, b.max.y], [az, dz, b.min.z, b.max.z]];
    for (var k = 0; k < 3; k++) {
      var o = p[k][0], d = p[k][1], lo = p[k][2], hi = p[k][3];
      if (Math.abs(d) < 1e-8) {
        if (o < lo || o > hi) return -1;
      } else {
        var ta = (lo - o) / d, tb = (hi - o) / d;
        if (ta > tb) { var s = ta; ta = tb; tb = s; }
        if (ta > t0) t0 = ta;
        if (tb < t1) t1 = tb;
        if (t0 > t1) return -1;
      }
    }
    return t0;
  };

  W.segBox = function (ax, ay, az, bx, by, bz, b) {
    return W.segBoxT(ax, ay, az, bx, by, bz, b) >= 0;
  };

  W.sightBlocked = function (ax, ay, az, bx, by, bz) {
    for (var i = 0; i < W.occluders.length; i++) {
      var b = W.occluders[i];
      /* 屋顶已收起 → 由它产生的遮挡体（女儿墙 / 水箱 / 屋顶盖）一起失效 */
      if (b.roof && !W.roofShown) continue;
      if (W.segBox(ax, ay, az, bx, by, bz, b)) return true;
    }
    return false;
  };

  /* ---------------- 5. 区域名 ---------------- */
  W.regionName = function (x, z) {
    if (z > 1.02) return '马路上';
    if (z >= -1.12) {
      if (x > 4.60) return '小巷口';
      if (x < -6.40) return '自动售货机前';
      return '门前人行道';
    }
    if (x <= -6.15) return '店西侧';
    if (x >= 4.15) return '小巷';
    if (z > -3.30) return '店内 · 前场';
    return '店内 · 后场';
  };

  /* ---------------- 6. 热点 ----------------
     at    标记浮在哪个世界坐标
     aim   视线检测的终点（默认同 at）
     reach 需要站多近（水平距离，米）
     need  可见条件：{ skill, value } 或 { thought }
     细节热点不替换基础热点，而是并存 —— 分辨率高的玩家看得见更多。 */
  W.HOTSPOTS = [

    /* ======== 门前人行道 ======== */
    { id: 'sign', label: '屋檐下的招牌', at: [-1.60, 3.05, -0.95], reach: 6.0,
      to: 'sign', kind: 'main' },

    { id: 'reflect', label: '玻璃里的那个影子', at: [-2.20, 1.55, -1.14], reach: 3.0,
      to: 'reflect', kind: 'main' },

    { id: 'doorstep', label: '门口', at: [3.00, 0.70, -1.05], reach: 2.4,
      to: 'doorstep', kind: 'main' },

    { id: 'umbrella', label: '门口的伞架', at: [1.95, 1.10, -0.82], reach: 2.8,
      to: 'umbrella', kind: 'main' },

    { id: 'cat', label: '雨棚下的猫', at: [0.75, 0.48, -0.85], reach: 3.0,
      to: 'cat', kind: 'main' },

    { id: 'awning', label: '雨棚边缘', at: [-3.60, 2.42, -0.55], reach: 4.5,
      to: 'drip', kind: 'main' },

    { id: 'curb', label: '路缘石', at: [0.40, 0.40, 0.55], reach: 3.0,
      to: 'curb', kind: 'main' },

    { id: 'busstop', label: '公交站牌和那个人', at: [5.75, 2.42, 1.00], reach: 3.4,
      to: 'busstop', kind: 'main' },

    { id: 'booth', label: '电话亭', at: [-4.15, 1.35, 0.05], reach: 2.8,
      to: 'booth', kind: 'main' },

    { id: 'vend', label: '自动售货机', at: [-7.05, 2.45, -0.50], reach: 3.4,
      to: 'vend', kind: 'main' },

    { id: 'notice', label: '街角公告栏', at: [4.36, 2.02, -0.72], reach: 2.8,
      to: 'board', kind: 'main' },

    { id: 'alleymouth', label: '小巷', at: [5.60, 1.20, -1.20], reach: 3.4,
      to: 'alley_1', kind: 'main' },

    { id: 'alleyneon', label: '巷里的灯箱', at: [4.62, 1.95, -3.60], reach: 3.2,
      to: 'alley_neon', kind: 'main' },

    /* —— 门口的细节：全店门槛最低的一个，用来教会玩家「看得见」这件事 —— */
    { id: 'd_end_door', label: '门上的小红点', at: [3.00, 2.62, -1.16], reach: 3.0,
      to: 'd_end_door', kind: 'detail',
      need: { skill: 'perception', value: 4 }, needText: '感知 4' },

    { id: 'd_umbrella_roll', label: '伞架底下的东西', at: [2.14, 0.72, -0.70], reach: 2.6,
      to: 'd_umbrella_roll', kind: 'detail',
      need: { skill: 'perception', value: 6 }, needText: '感知 6' },

    { id: 'd_cat_eye', label: '猫的一只眼睛', at: [0.62, 0.36, -0.80], reach: 2.6,
      to: 'd_cat_eye', kind: 'detail',
      need: { skill: 'empathy', value: 5 }, needText: '共情 5' },

    /* ======== 店内 · 前场 ======== */
    { id: 'counter', label: '收银台', at: [2.75, 1.38, -2.05], reach: 3.2,
      to: 'counter', kind: 'main' },

    { id: 'seat', label: '窗边那个人', at: [0.45, 1.35, -1.58], reach: 3.0,
      to: 'window_seat', kind: 'main' },

    { id: 'ice', label: '冰淇淋柜', at: [-4.30, 1.35, -1.78], reach: 3.0,
      to: 'ice', kind: 'main' },

    { id: 'coffee', label: '咖啡机', at: [-5.30, 1.93, -2.35], reach: 2.8,
      to: 'coffee', kind: 'main' },

    { id: 'magazine', label: '杂志架', at: [-5.20, 1.28, -3.25], reach: 2.8,
      to: 'magazine', kind: 'main' },

    { id: 'd_mag_cover', label: '封面朝外的那一本', at: [-5.30, 1.42, -3.05], reach: 2.6,
      to: 'd_mag_cover', kind: 'detail',
      need: { skill: 'conceptual', value: 5 }, needText: '概念化 5' },

    { id: 'd_receipt', label: '压着的一张纸', at: [3.42, 1.13, -2.05], reach: 2.6,
      to: 'd_receipt', kind: 'detail',
      need: { skill: 'perception', value: 5 }, needText: '感知 5' },

    { id: 'd_clerk_hands', label: '她的手', at: [1.95, 1.50, -2.28], reach: 2.6,
      to: 'd_clerk_hands', kind: 'detail',
      need: { skill: 'empathy', value: 6 }, needText: '共情 6' },

    { id: 'd_floor_arrow', label: '地上的箭头', at: [-1.00, 0.28, -5.00], reach: 2.8,
      to: 'd_floor_arrow', kind: 'detail',
      need: { skill: 'logic', value: 5 }, needText: '逻辑 5' },

    { id: 'd_ceiling_light', label: '在闪的那根灯管', at: [-2.20, 2.76, -3.95], reach: 7.0,
      to: 'd_ceiling_light', kind: 'detail',
      need: { skill: 'perception', value: 6 }, needText: '感知 6' },

    /* ======== 店内 · 后场 ======== */
    { id: 'snack', label: '零食货架', at: [-2.95, 1.98, -6.00], reach: 3.4,
      to: 'snack', kind: 'main' },

    { id: 'cooler', label: '饮料冷柜', at: [2.06, 1.45, -5.71], reach: 3.6,
      to: 'drinks', kind: 'main' },

    { id: 'd_bottle', label: '第三排左起第四瓶', at: [1.30, 1.05, -5.80], reach: 2.8,
      to: 'd_bottle', kind: 'detail',
      need: { skill: 'perception', value: 5 }, needText: '感知 5' },

    { id: 'islandA', label: '便当岛', at: [-1.05, 1.32, -3.50], reach: 3.0,
      to: 'bento', kind: 'main' },

    { id: 'islandB', label: '饭团和面包', at: [2.20, 1.32, -3.72], reach: 3.0,
      to: 'island_b', kind: 'main' },

    { id: 'd_bento_date', label: '最里面那三个', at: [2.72, 1.14, -3.90], reach: 2.8,
      to: 'd_bento_date', kind: 'detail',
      need: { skill: 'perception', value: 5 }, needText: '感知 5' },

    { id: 'oden', label: '关东煮', at: [-5.26, 1.58, -4.70], reach: 2.8,
      to: 'oden', kind: 'main' },

    { id: 'd_oden_steam', label: '汤上面那层', at: [-5.10, 1.92, -4.98], reach: 2.8,
      to: 'd_oden_steam', kind: 'detail',
      need: { skill: 'perception', value: 6 }, needText: '感知 6' },

    { id: 'hotfood', label: '热食柜', at: [-5.28, 1.87, -5.98], reach: 3.0,
      to: 'hotfood', kind: 'main' },

    { id: 'clock', label: '墙上的钟', at: [-1.40, 2.42, -6.58], reach: 5.0,
      to: 'clock', kind: 'main' },

    { id: 'backdoor', label: '后场门', at: [-5.28, 1.93, -6.55], reach: 3.0,
      to: 'door_back', kind: 'main' },

    { id: 'bookpile', label: '墙角那摞书', at: [-4.55, 0.72, -5.60], reach: 2.6,
      to: 'shelf', kind: 'main' }
  ];

  /* ---------------- 7. 热点取值 ---------------- */

  /* 玩家与热点的水平距离 */
  W.distTo = function (h) {
    var dx = SB.player.x - h.at[0], dz = SB.player.z - h.at[2];
    return Math.sqrt(dx * dx + dz * dz);
  };

  /* 这个热点此刻是否「够得着」 */
  W.inReach = function (h) {
    return W.distTo(h) <= h.reach;
  };

  /* 可见性：需要技能达标、或已内化某个想法 */
  W.visible = function (h) {
    if (!h.need) return true;
    var s = DE.state;
    if (h.need.thought) return DE.hasThought(h.need.thought);
    if (h.need.skill) return DE.effective(h.need.skill) >= h.need.value;
    return true;
  };

  /* 细节节点的发现进度 —— HUD 显示用。不剧透总共有哪些。 */
  W.detailStats = function () {
    var total = 0, seen = 0;
    W.HOTSPOTS.forEach(function (h) {
      if (h.kind !== 'detail') return;
      total++;
      if (DE.state.flags['seen:' + h.to]) seen++;
    });
    return { seen: seen, total: total };
  };

  /* 可交互（够得着 + 看得见）的热点 */
  W.active = function () {
    return W.HOTSPOTS.filter(function (h) {
      return W.visible(h) && W.inReach(h);
    });
  };

  /* ---------------- 8. 隐藏微缩底座 ----------------
     原模型是摆在底座上的微缩景观，裙边在 y = -0.07。人眼高度 1.78 望出去，
     七米外的边缘会露在画面下缘。铺一片延伸到地平线的暗色地面把它盖住，
     顺便让世界看起来是「继续的」，而不是「一块模型」。 */
  (function () {
    var mat = new THREE.MeshBasicMaterial({ color: 0x14171d, fog: true });
    var plane = new THREE.Mesh(new THREE.PlaneGeometry(620, 620), mat);
    plane.rotation.x = -Math.PI / 2;
    plane.position.set(0, -0.03, 0);
    plane.renderOrder = -1;
    plane.name = 'farGround';
    SB.scene.add(plane);
  })();

  /* ---------------- 9. 登记入口 + 自检 ---------------- */

  /* 热点目标就是场景入口：不登记的话，审计会把它们全判成孤立节点 */
  DE.SCENE.entries = W.HOTSPOTS.map(function (h) { return h.to; });

  /* 热点体检：返回发现的问题清单，供自检页与启动期 warn 使用 */
  W.auditHotspots = function () {
    var problems = [], seen = {}, N = DE.SCENE.nodes;
    W.HOTSPOTS.forEach(function (h) {
      if (seen[h.id]) problems.push({ id: h.id, why: '热点 id 重复' });
      seen[h.id] = true;
      if (!N[h.to]) problems.push({ id: h.id, why: '指向不存在的节点：' + h.to });
      if (!h.at || h.at.length !== 3) problems.push({ id: h.id, why: '锚点坐标不合法' });
      if (!(h.reach > 0)) problems.push({ id: h.id, why: 'reach 必须为正数' });
      /* 锚点不该落在实心体内 —— 那样它永远被自己挡住。
         这里必须直接拿点比 AABB，不能借 W.blocked：后者带玩家的竖直
         占用区间过滤，会把「高处的锚点埋在横臂里」这类问题放过。 */
      for (var si = 0; si < W.solids.length; si++) {
        var sb = W.solids[si];
        if (h.at[0] > sb.min.x && h.at[0] < sb.max.x &&
            h.at[1] > sb.min.y && h.at[1] < sb.max.y &&
            h.at[2] > sb.min.z && h.at[2] < sb.max.z) {
          problems.push({ id: h.id, why: '锚点埋进了实心体内部' });
          break;
        }
      }
      if (h.need) {
        if (h.need.skill && !DE.SKILL_MAP[h.need.skill]) {
          problems.push({ id: h.id, why: '可见性引用了不存在的技能：' + h.need.skill });
        }
        if (h.need.thought && !DE.thought(h.need.thought)) {
          problems.push({ id: h.id, why: '可见性引用了不存在的想法：' + h.need.thought });
        }
      }
    });
    return problems;
  };
})();
