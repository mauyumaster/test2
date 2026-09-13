/* ===========================================================
   90_main.js  ——  启动
   ------------------------------------------------------------
   顺序有讲究：
     DE.init()      先建状态，因为热点可见性要读技能值
     W.collect()    再扫场景图收碰撞体 —— 必须等 42_props.js 把物件摆完
     W.walk.bind()  再挂输入
     showCreate()   先渲染一次建卡界面
     applyShot()    截图夹具若有，覆盖掉上面的界面
     然后才是主循环
   =========================================================== */

(function () {
  var $ = function (id) { return document.getElementById(id); };

  /* 出错时只改标题，不生成任何可视元素（便于无头自检抓错） */
  window.addEventListener('error', function (e) {
    document.title = 'ERR: ' + e.message + ' @' + String(e.filename || '').split('/').pop() + ':' + e.lineno;
  });

  /* ---------------- 截图夹具 ----------------
     只在 URL 带 ?still 时生效，正常游玩完全不走这条路。
     用途：无头浏览器里把机位、技能、面板状态钉死，渲染固定帧数后停下，
     否则 rAF 会一直跑，截图进程会被拖到超时。

       ?still&scene                 建完卡，站在街面上
       &create=1                    停在建卡界面（否则夹具拍不到这一屏）
       &attrs=8                     四属性全设为 8（解锁全部细节热点）
       &px=&pz=&yaw=                指定站位与朝向（yaw 是相机吊臂的方位角；
                                    pitch 已锁定，传了也会被忽略）
       &node=counter                直接打开某个节点的对话
       &panel=1 / &side=1           展开左栏 / 左栏之二
       &nocol=1                     收起右侧常驻文字栏（拍纯场景构图用）
       &nohud=1                     隐藏 HUD 与操作提示
     -------------------------------------------- */
  function parseQuery() {
    var q = {};
    location.search.replace(/^\?/, '').split('&').forEach(function (kv) {
      if (!kv) return;
      var i = kv.indexOf('=');
      if (i < 0) q[kv] = '1'; else q[kv.slice(0, i)] = decodeURIComponent(kv.slice(i + 1));
    });
    return q;
  }

  function applyShot(Q) {
    /* &create=1 停在建卡界面。
       夹具默认会一路进到场景（applyShot 里 built=true），于是
       「建卡长什么样」从来没有截图可看 —— 而这正好是玩家打开页面
       看到的第一屏，也是最容易出「DOM 里有、屏幕上没有」的地方。 */
    if (Q.create) {
      DE.state.built = false;
      DE.ui.showCreate();
      W.loop.setMode('create');
      DE.ui.refresh();
      return;
    }
    DE.state.built = true;
    if (Q.attrs) {
      var A = parseFloat(Q.attrs);
      DE.ATTRS.forEach(function (a) { DE.state.attrs[a.id] = A; });
      DE.rebuildSkills();
      DE.state.skillPoints = 0;
    }
    if (Q.px !== undefined) SB.player.x = parseFloat(Q.px);
    if (Q.pz !== undefined) SB.player.z = parseFloat(Q.pz);
    /* 朝向必须走 setView：相机的 yaw/pitch 存在 45_walk 的私有 L 里，
       每帧用 L 反写 SB.player.yaw。只写 SB.player.yaw 会被立刻覆盖。 */
    W.walk.setView(
      Q.yaw === undefined ? undefined : parseFloat(Q.yaw),
      Q.pitch === undefined ? undefined : parseFloat(Q.pitch)
    );
    if (Q.flag) DE.state.flags[Q.flag] = true;
    if (Q.think) DE.state.thoughts.push(Q.think);

    DE.ui.refresh();

    if (Q.node) {
      /* 优先走「真的走过去点它」那条路：enterDialog 会把相机与角色转向它。
         夹具若只调 flow.goto，拍到的对话构图是没有取景的（镜头还朝着
         别处，而右栏在讲一件画面外的物事）—— 这种图会让人误判取景坏了。
         enterDialog 只从 scene 态进入，所以先把状态摆到 scene。 */
      W.loop.setMode('scene');
      var hit = null;
      W.HOTSPOTS.forEach(function (h) { if (!hit && h.to === Q.node) hit = h; });
      if (hit) W.loop.enterDialog(hit);
      else DE.flow.goto(Q.node);
    } else {
      W.loop.setMode('scene');
      W.loop.backToScene();
    }
    if (Q.panel) $('panel').classList.add('open');
    if (Q.side) $('side').classList.add('open');
    /* &nocol=1 收起右侧常驻文字栏 —— 只为拍「纯场景」的构图对照用，
       免得判断取景时被栏挡掉三分之一画面。 */
    if (Q.nocol) $('stage').style.display = 'none';
    if (Q.nohud) {
      $('hud').style.display = 'none';
      $('hint').style.display = 'none';
    }
    W.walk.update(0.016);
    /* 剖切是逐帧渐隐的，而夹具只跑一次 update —— 不 settle 的话，
       截图拍到的是「刚淡了 14%」的样子，看起来像效果没生效。
       这是本项目栽过两次的「夹具与真机看到两个状态」。 */
    if (W.cutaway && W.cutaway.settle) W.cutaway.settle();
    W.loop.tickIdle();
    W.reticle.update(true);
  }

  function boot() {
    var Q = parseQuery();
    var STILL = !!Q.still;

    DE.init();
    var stats = W.collect();

    W.walk.bind();
    /* E 是同一个键，两个方向：
         在街面上 —— 进入准星指着的那个东西；
         在对话里 —— 走开，回到街面（按钮上写着「按 E」，这里必须兑现）。 */
    W.walk.onInteract = function () {
      if (W.loop.mode === 'dialog') { W.loop.backToScene(); return; }
      var h = W.reticle.nearest();
      if (h) W.loop.enterDialog(h);
    };

    DE.ui.showCreate();
    DE.ui.refresh();

    if (STILL) applyShot(Q);
    else W.loop.setMode('create');

    DE.ui.renderHud();
    W.walk.update(0.016);

    var clock = new THREE.Clock();
    var frames = 0;
    var cover = $('cover');
    /* 注意：这里不能「渲染 N 帧后停下」。停掉 rAF 之后合成器会丢掉画布内容，
       无头截图会拍到一块全黑的画布（HTML 浮层却还在）——很难看出来是渲染问题。
       夹具模式靠 --virtual-time-budget 让进程退出，虚拟时间跑完即截图。 */
    var PROBE = STILL && /(^|[?&])probe(=|&|$)/.test(location.search);
    /* 自检不需要像素：几何、热点、矩形、音频全是算出来的，不依赖画布。
       但软件渲染（swiftshader）在 1280x800 下一帧要几百毫秒，一轮自检
       被拖到十几分钟，音频时钟和 setTimeout 的相对速度也全乱了
       （主题曲的调度断言因此假失败过）。加 &norender=1 只跑逻辑不画。
       截图夹具不要加这个 —— 那样拍到的是黑屏。 */
    var NORENDER = /(^|[?&])norender=1(&|$)/.test(location.search);

    function frame() {
      var dt = Math.min(clock.getDelta(), 0.05);
      var t = clock.elapsedTime;

      SB.runTocks(t);
      for (var i = 0; i < SB.anim.length; i++) SB.anim[i](t, dt);

      W.walk.update(dt);
      W.loop.tickIdle();
      W.reticle.update(false);
      W.audio.tick(dt);
      if (!NORENDER) SB.renderer.render(SB.scene, SB.camera);

      frames++;
      if (frames === 2 && cover) {
        cover.classList.add('gone');
        cover.classList.add('hidden');
      }
      if (PROBE && frames === 6) {
        /* 诊断用：渲染统计与屏幕中心像素写进标题，
           一眼就能分辨「没画」和「画了但是黑的」。 */
        var gl = SB.renderer.getContext();
        var w = SB.renderer.domElement.width, h = SB.renderer.domElement.height;
        var px = new Uint8Array(4);
        try {
          gl.readPixels(Math.floor(w / 2), Math.floor(h / 2), 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, px);
        } catch (err) { px = [255, 0, 255, 255]; }
        var info = SB.renderer.info.render;
        var c = SB.camera;
        document.title = 'SHOT calls=' + info.calls + ' tri=' + info.triangles +
          ' buf=' + w + 'x' + h + ' px=' + px[0] + ',' + px[1] + ',' + px[2] +
          ' cam=' + c.position.x.toFixed(2) + ',' + c.position.y.toFixed(2) + ',' + c.position.z.toFixed(2) +
          ' rot=' + c.rotation.x.toFixed(2) + ',' + c.rotation.y.toFixed(2) +
          ' marks=' + document.querySelectorAll('#marks .mark:not(.hidden)').length;
      }
      requestAnimationFrame(frame);
    }

    /* 场景统计写进标题，方便无头自检一条 grep 就能读到 */
    document.title = '凌晨两点零七分 · ' + DE.SCENE.count + ' 节点 / ' +
      stats.solids + ' 碰撞体 / ' + stats.occluders + ' 遮挡体';

    frame();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
})();
