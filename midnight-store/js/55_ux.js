/* ===========================================================
   55_ux.js  ——  输入形态适配（手机横屏 / 桌面）
   ------------------------------------------------------------
   同一个页面，桌面与手机的**可用输入**完全不同：

     · 手机没有 Tab / L / M / N / WASD —— 那些词出现在提示里，
       等于在教一个不存在的动作；
     · 手机没有「悬停」，却有「按住拖动」和「点一下」两种手势，
       而浏览器默认会把拖动认成滚页面、把双指认成缩放；
     · 手机横屏只有 360~430px 高，左侧 328px 的技能栏会吃掉三分之一。

   这一层只做三件事，且全部是**可回退的包装**：

     1. 把 00_core.js 的 SB.UX 判定写成 body 上的类（ux-phone /
        ux-touch / ux-portrait），样式在 world.css 里按类给。
        **不写媒体查询**：844×390 的手机横屏比不少桌面窗口还宽，
        按宽度写断点必然认错 —— 判据是「触屏 + 短边短」，见 uxDetect。
     2. 造一根左侧工具条（技能 / 状态 / 声音 / 音乐），把原本只挂在
        键盘上的四个开关搬到屏幕上。它调的是 60_loop 的同一个
        togglePanel 与 70_audio / 71_music 的同一个开关函数 ——
        「两块面板互斥」这条规则不能有第二份实现。
     3. 按布局改写提示文案。

   ⚠ 桌面文案**一个字都不重写**：先把原始 innerHTML 存下来，只在手机
     形态下替换，切回来就还原。重打一遍「WASD 走　·　左键拖动…」看着
     一样，但全角空格差一个字节，两个页面（index / selftest）就不再同构
     —— 而自检的几何断言恰恰靠那段文字撑出真实宽度。

   ⚠ 无头自检里指针永远是「细的」（pointer: coarse 为假、
     maxTouchPoints 为 0），自动判定必然得出「这是桌面」。所以
     ?ux=phone 这个强制口是必须的，不是方便 —— 没有它，「手机布局」
     这个状态在自检里根本走不进去。见 00_core.js 的 uxDetect。
   =========================================================== */

(function () {
  var $ = function (id) { return document.getElementById(id); };
  var UX = SB.UX;

  /* ---------------- 文案 ----------------
     一处定义、三处消费（底部提示条 / 右栏待机内容 / 建卡提示条）。
     分开写必然会漂移：改了一处忘了另一处，屏幕上就出现两种说法。 */
  UX.phoneHint = '点地面走过去　·　按住拖动转视角（俯角固定）　·　点光点进入' +
                 '<br>左侧按钮：技能 / 状态 / 声音 / 音乐';
  UX.phoneCreateHint = '点 +/− 调四维属性　·　点技能名后的「◆」定锚　·　完成后点金色按钮';

  /* 右栏「怎么操作」那一段。桌面版保留原来的两行说法。 */
  UX.howTo = function () {
    if (UX.phone) {
      return ['点地面走过去　·　按住拖动转视角（俯角固定）',
              '点左栏条目或屏幕上的光点；技能 / 状态 / 声音 / 音乐在左侧按钮上'];
    }
    return ['WASD 走　·　左键拖动转视角（俯角固定）　·　点地面走过去',
            '点上面的条目、屏幕上的光点，或按 E'];
  };

  /* ---------------- 提示文案：只换手机那份 ----------------
     先存原文，任何时候切回桌面形态都能逐字还原。 */
  var ORIG = {};
  function applyTexts() {
    var map = [['hint', UX.phoneHint], ['hint-create', UX.phoneCreateHint]];
    map.forEach(function (m) {
      var el = $(m[0]);
      if (!el) return;
      if (ORIG[m[0]] === undefined) ORIG[m[0]] = el.innerHTML;
      el.innerHTML = UX.phone ? m[1] : ORIG[m[0]];
    });
  }

  /* ---------------- 左侧工具条 ----------------
     手机上这四个开关原本只挂在键盘上（Tab / L / M / N），
     等于没有 —— 这是「入口不能藏」在触屏上的版本。
     单字标签 + aria-label：横屏只有这么点高度，两字会把条撑宽，
     而这条恰好压在建卡卡片左边（卡片左边缘离屏幕左边只差几十像素）。 */
  var TOOLS = [
    { id: 'panel', label: '技', tip: '技能面板' },
    { id: 'side', label: '态', tip: '状态 / 想法 / 日志' },
    { id: 'mute', label: '声', tip: '静音（原 M 键）' },
    { id: 'music', label: '乐', tip: '主题曲（原 N 键）' }
  ];
  var bar = null, btns = {};

  function note(text) {
    if (W.loop && W.loop.notice) W.loop.notice(text);
  }

  function hit(id) {
    if (id === 'panel' || id === 'side') {
      if (W.loop && W.loop.togglePanel) W.loop.togglePanel(id);
    } else if (id === 'mute') {
      if (W.audio && W.audio.toggleMute) {
        note(W.audio.toggleMute() ? '声音：关' : '声音：开');
      }
    } else if (id === 'music') {
      if (W.music && W.music.toggle) {
        var on = W.music.toggle();
        if (W.audio && W.audio.resume) W.audio.resume();
        note(on ? '主题曲：开' : '主题曲：关');
      }
    }
    sync();
  }

  function buildBar() {
    if (bar) return bar;
    bar = document.createElement('div');
    bar.id = 'tools';
    bar.setAttribute('role', 'toolbar');
    bar.setAttribute('aria-label', '场景控制');
    TOOLS.forEach(function (t) {
      var b = document.createElement('button');
      b.type = 'button';
      b.className = 'ux-tool';
      b.setAttribute('data-tool', t.id);
      b.setAttribute('aria-label', t.tip);
      b.title = t.tip;
      b.textContent = t.label;
      b.addEventListener('click', function (ev) { ev.stopPropagation(); hit(t.id); });
      bar.appendChild(b);
      btns[t.id] = b;
    });
    document.body.appendChild(bar);
    return bar;
  }

  /* 高亮 = 当前真的开着。判断全部取自实现自己的状态，不另存一份布尔 ——
     另存一份就会出现「点了关掉、按钮还亮着」的假象。 */
  function sync() {
    if (!bar) return;
    var p = $('panel'), s = $('side');
    btns.panel.classList.toggle('on', !!(p && p.classList.contains('open')));
    btns.side.classList.toggle('on', !!(s && s.classList.contains('open')));
    btns.mute.classList.toggle('on', !!(W.audio && W.audio.muted && W.audio.muted()));
    btns.music.classList.toggle('on', !!(W.music && W.music.on && W.music.on()));
  }
  SB.syncUxTools = sync;

  /* ---------------- 竖屏：铺满全屏的转屏提示 ----------------
     这套布局是按横屏排的（右栏 34vw、短边只有 390）。竖着拿的时候
     左栏 268 + 右栏 288 > 390，两栏必然叠成一坨 —— 所以竖屏不做布局。
     但**不能把那坨重叠亮给用户**：拿一块铺满全屏的提示盖住（见
     world.css 的 #rotate。它是 inset:0 的全屏层，不是顶部小横幅）。
     不拦着不让玩（pointer-events: none）——「页面打不开」比「转过来
     就好」糟得多，万一判定误伤，底下的页面还是能操作的。 */
  var rot = null;
  function rotateBanner() {
    var need = UX.needsRotate();
    if (need && !rot) {
      rot = document.createElement('div');
      rot.id = 'rotate';
      rot.innerHTML = '<span class="rot-ico">&#8635;</span>' +
        '<b>把手机横过来</b>' +
        '<span>这个场景是按横屏排的：竖着拿，右侧文字栏会占掉大半个屏幕。</span>';
      document.body.appendChild(rot);
    }
    if (rot) rot.classList.toggle('show', need);
  }

  /* ---------------- 应用 ----------------
     布局类、工具条、文案、横幅 —— 一个入口，每次窗口变化都走这里，
     免得有哪一项在转屏后忘了更新（「转屏后按钮还在但文案是桌面的」
     这类不一致，截图里一眼看不出来）。 */
  SB.applyUxClasses = function () {
    var b = document.body;
    b.classList.toggle('ux-phone', !!UX.phone);
    b.classList.toggle('ux-touch', !!UX.touch);
    b.classList.toggle('ux-portrait', !!UX.portrait);
    /* 工具条只在手机上出现。桌面有键盘，多一个浮层只是挡视线；
       建卡模式下由 CSS 收起来（那屏左边本来就有技能栏，卡片才是主角）。 */
    if (UX.phone) buildBar();
    else if (bar && bar.parentNode) { bar.parentNode.removeChild(bar); bar = null; btns = {}; }
    applyTexts();
    rotateBanner();
    sync();
  };

  SB.applyUxClasses();

  /* 转屏：部分浏览器在 orientationchange 那一拍还读到旧尺寸，
     推到下一轮再算。 */
  window.addEventListener('orientationchange', function () {
    setTimeout(function () {
      if (SB.UX.refresh) SB.UX.refresh();
      if (SB.applyUxClasses) SB.applyUxClasses();
      if (SB.applyLens) SB.applyLens();
    }, 150);
  });
})();
