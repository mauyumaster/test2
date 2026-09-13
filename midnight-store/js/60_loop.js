/* ===========================================================
   60_loop.js  ——  场景 ↔ 对话 的状态机
   ------------------------------------------------------------
   三种状态：
     create  建卡。技能面板和一个居中的开场框。
     scene   在走。热点浮在空气里，底部没有对话框。
     dialog  在读。走路停下，角色转向那个东西，对话框从底部升起来。

   两条约定：
     · 节点的选项里写 to: '@scene' 就是「离开，回到街面」，
       不跳节点、不关对话树以外的东西。
     · 一进入局就显示 start 节点当序幕 —— 但它的六个选项已经没用了
       （那些选项原本是用来代替空间的），所以只会有一个「回到街面」。
   =========================================================== */

(function () {
  var THREE = window.THREE, SB = window.SB;
  var $ = function (id) { return document.getElementById(id); };

  var SPAWN = { x: SB.player.x, z: SB.player.z, yaw: SB.player.yaw };

  W.loop = {
    mode: 'create',
    current: null,
    sceneVisits: 0,

    /* ---------------- 状态切换 ---------------- */
    setMode: function (m) {
      this.mode = m;
      var b = document.body;
      b.classList.toggle('mode-create', m === 'create');
      b.classList.toggle('mode-scene', m === 'scene');
      b.classList.toggle('mode-dialog', m === 'dialog');
      var walking = (m === 'scene');
      W.walk.enabled = walking;
      if (!walking) W.walk.stop();
      W.reticle.setVisible(walking);
      if (walking) W.reticle.update(true);
      /* 镜头平移跟着模式走：建卡时右栏不在（卡片居中），平移必须归零，
         否则背景会莫名其妙地偏到一边。 */
      if (SB.applyLens) SB.applyLens();
      /* 走路时右栏不能空着 —— 见 DE.ui.showIdle */
      if (walking) DE.ui.showIdle();
    },

    /* ---------------- 进入某个热点 ---------------- */
    enterDialog: function (h) {
      if (this.mode !== 'scene') return;
      this.current = h;
      W.walk.facePoint(h.at[0], h.at[1], h.at[2]);
      if (h.kind === 'detail') DE.state.flags['seen:' + h.to] = true;
      DE.state.flags['stood:' + h.id] = true;
      DE.flow.goto(h.to);
    },

    /* 由 DE.flow.goto 的内部约定调用 */
    openPanel: function () {
      this.setMode('dialog');
    },

    backToScene: function () {
      this.current = null;
      this.sceneVisits++;
      DE.ui.renderHud();
      this.setMode('scene');
    },

    /* ---------------- 重开一局：把世界也复位 ---------------- */
    resetWorld: function () {
      var p = SB.player;
      p.x = SPAWN.x; p.z = SPAWN.z;
      p.walkPhase = 0; p.bob = 0;
      SB.doorOpen = 0;
      /* 让相机高度立刻落到正确的地面上，不要从上一局的楼层滑过来 */
      W.walk.enabled = true;
      W.walk.update(0.016);
      this.current = null;
      this.setMode('create');
    },

    notice: function (text) {
      var el = $('notice');
      if (!el) return;
      el.textContent = text;
      el.classList.add('show');
      clearTimeout(this._nt);
      this._nt = setTimeout(function () { el.classList.remove('show'); }, 2400);
    }
  };

  /* ---------------- 右栏：走路时的待机内容 ----------------
     第一人称时这段路是「空」的（对话框一收，屏幕上只剩几个光点）。
     换成右侧常驻文字栏之后，走路时那一栏必须有东西可看，否则它只是
     一块遮住画面的黑板。这里放三样：我在哪、附近能碰什么、怎么操作。

     「附近能碰什么」同时承担了可点击入口的职责：俯视时有些光点会被
     右栏盖住，列表是它们的兜底 —— 同一批热点，两条进入路径。
     -------------------------------------------- */
  function idleSignature() {
    var p = SB.player, k = [W.regionName(p.x, p.z)];
    W.HOTSPOTS.forEach(function (h) {
      if (W.visible(h) && W.inReach(h)) k.push(h.id);
    });
    return k.join(',');
  }
  var idleKey = null;

  DE.ui.showIdle = function () {
    var st = $('stage');
    if (!st) return;
    var p = SB.player;
    var near = W.HOTSPOTS.filter(function (h) {
      return W.visible(h) && W.inReach(h);
    }).sort(function (a, b) { return W.distTo(a) - W.distTo(b); });

    var h = '<div class="idle-head">' + W.regionName(p.x, p.z) + '</div>';
    h += '<div class="idle-sub">' +
         (near.length ? '够得着 ' + near.length + ' 样' : '附近没有够得着的东西，走两步看看') +
         '</div><div class="idle-list">';
    near.forEach(function (n) {
      h += '<button class="choice idle-i' + (n.kind === 'detail' ? ' idle-detail' : '') +
           '" data-hot="' + n.id + '">' +
           '<span class="i-name">' + n.label + '</span>' +
           '<span class="i-dist">' + W.distTo(n).toFixed(1) + 'm</span></button>';
    });
    h += '</div>';
    h += '<div class="idle-hint">' + SB.UX.howTo().join('<br>') + '</div>';
    st.innerHTML = h;
    idleKey = idleSignature();
    st.querySelectorAll('[data-hot]').forEach(function (b) {
      b.onclick = function () {
        var id = b.getAttribute('data-hot'), hit = null;
        W.HOTSPOTS.forEach(function (x) { if (x.id === id) hit = x; });
        if (hit) W.loop.enterDialog(hit);
      };
    });
  };

  /* 走得够远、或够得着的东西变了才重排右栏 —— 每帧重排会把按钮
     从鼠标底下抽走。 */
  W.loop.tickIdle = function () {
    if (this.mode !== 'scene') return;
    if (idleSignature() === idleKey) return;
    DE.ui.showIdle();
  };

  /* ---------------- HUD ----------------
     只放三样：我在哪、我看见了几个别人看不见的东西、怎么操作。 */
  DE.ui.renderHud = function () {
    var hud = $('hud');
    if (!hud) return;
    var p = SB.player;
    var d = W.detailStats();
    hud.innerHTML =
      '<div class="hud-region">' + W.regionName(p.x, p.z) + '</div>' +
      '<div class="hud-detail" title="只有相应技能够高、或内化了某个想法的人，才会在场景里看见这些东西。">' +
        '细节 <b>' + d.seen + '</b> / ' + d.total + '</div>';
    /* 左栏与 HUD 抢的是同一个角。任何一栏打开时 HUD 让位，
       否则「马路上 / 细节 0/11」会正好压在技能表的表头上。 */
    var busy = ['panel', 'side'].some(function (id) {
      var el = $(id);
      return el && el.classList.contains('open');
    });
    hud.classList.toggle('behind', busy);
    /* 底部提示条跟 HUD 是同一个病：左栏一开就压在它上面。一起让位。 */
    var hint = $('hint');
    if (hint) hint.classList.toggle('behind', busy);
  };

  /* ---------------- 钩住流程 ----------------
     这一层只加两件事，不改 30_flow.js 一行：
       1. 每次 goto 都把对话框打开（这样序幕、检定后的跳转、结局都自动生效）
       2. 结局的「再来一次」顺便把世界复位 */
  (function () {
    var origGoto = DE.flow.goto;
    DE.flow.goto = function (id) {
      if (id === '@scene') { W.loop.backToScene(); return; }
      if (!DE.SCENE.nodes[id]) { console.warn('[flow] 缺失节点：' + id); return; }
      W.loop.openPanel();
      origGoto(id);
      DE.ui.renderHud();
    };

    var origRestart = DE.flow.restart;
    DE.flow.restart = function () {
      origRestart();
      W.loop.resetWorld();
    };

    /* 对话框里统一补一个「回到街面」，省得每个节点都写一遍 */
    var origShowNode = DE.ui.showNode;
    DE.ui.showNode = function (node, choices) {
      /* 序幕：这一节点的选项原本是拿来代替空间的，现在空间有了，
         把它们收起来，只留一条出口。 */
      var list = choices;
      if (node.id === DE.SCENE.start) list = [];
      origShowNode(node, list);
      var st = $('stage');
      if (!st) return;
      var back = document.createElement('button');
      back.className = 'choice back-scene';
      back.innerHTML = (W.loop.current ? '↩ 走开' : '↩ 走到街面上') +
        '<span class="kbd-hint">点击 或 按 E</span>';
      back.onclick = function () { W.loop.backToScene(); };
      st.appendChild(back);
      /* 新节点从头读 */
      st.scrollTop = 0;
      var wrap = st.parentNode;
      if (wrap && wrap.scrollTop !== undefined) wrap.scrollTop = 0;
    };
  })();

  /* ---------------- 面板开关 ----------------
     两块都贴在左边（右边让给常驻文字栏），所以必须互斥：
     同时开会精确重叠成一坨。

     ⚠ 提成 W.loop.togglePanel 而不是留在键盘回调里，是因为手机上
     没有 Tab / L 键 —— 左侧工具条（55_ux.js）要调同一个实现。
     各写一份的话，「互斥」这条规则就有了两个版本，改一边忘一边。 */
  W.loop.togglePanel = function (id) {
    var el = $(id);
    if (!el) return false;
    var on = !el.classList.contains('open');
    ['panel', 'side'].forEach(function (o) {
      if (o === id) return;
      var other = $(o);
      if (other) other.classList.remove('open');
    });
    el.classList.toggle('open', on);
    DE.ui.renderHud();
    return on;
  };
  /* 有没有哪块面板开着（自检与工具条高亮共用一份判据） */
  W.loop.anyPanelOpen = function () {
    return ['panel', 'side'].some(function (id) {
      var el = $(id);
      return el && el.classList.contains('open');
    });
  };

  window.addEventListener('keydown', function (e) {
    if (W.loop.mode === 'create') return;
    var k = e.key.toLowerCase();
    if (k === 'tab') { e.preventDefault(); W.loop.togglePanel('panel'); }
    else if (k === 'l') { W.loop.togglePanel('side'); }
    else if (k === 'escape') {
      if (W.loop.mode === 'dialog') { W.loop.backToScene(); }
      ['panel', 'side'].forEach(function (id) {
        var el = $(id); if (el) el.classList.remove('open');
      });
      var o = $('overlay'); if (o) o.classList.add('hidden');
      DE.ui.renderHud();
      if (SB.syncUxTools) SB.syncUxTools();
    }
  });

  /* 面板状态一变（键盘、工具条、Esc 三条路都算），工具条的高亮要跟上 */
  if (SB.syncUxTools) SB.syncUxTools();
})();
