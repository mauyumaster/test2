/* ===========================================================
   05_scene.js  ——  场景装配
   ------------------------------------------------------------
   内容分五卷书写，这里合并成一张图，并做两件装配期的事：
   1. 给每个节点打上自己的 id —— 「检定失败」的标记键要用它，
      否则不同节点里同为 0 号的红检定会共用同一个键。
   2. 建立审计函数：断链、死胡同、孤立节点，供自检页调用。

   节点字段速查
     head      场景头（时间 / 地点）
     epi       引文（引文库 id，或内联 {t,who,src}）→ 顶部引文块
     script    〔可选〕分镜序列，按顺序混排台词 / 旁注 / 引文 / 被动判定
     lines     正文段落（字符串，或 {t, cls, who, ref, show}）
     aside     旁注（页边小字）
     passives  [{ skill, diff, text }] 进入时判定，通过才显示
     choices   [{ text, tag, check, onPass, onFail, to, note,
                  req, reqNote, hide }]
     onEnter   进入时执行（旗帜、自动穿上某件状态、发经验）
     ending / ending_note   结局
   =========================================================== */

window.DE = window.DE || {};

DE.SCENE = {
  title: '凌晨两点零七分 · 便利店',
  start: 'start',
  nodes: {},
  /* 场景化之后，节点可以由「走过去点它」进入，而不只是由上游选项指向。
     40_world.js 会把热点目标登记到这里，审计据此不再把它们判为孤立。 */
  entries: []
};

(function () {
  var parts = [
    DE.NODES_GATE, DE.NODES_STORE, DE.NODES_MIND,
    DE.NODES_TALK, DE.NODES_OLD, DE.NODES_END,
    DE.NODES_SPATIAL
  ];
  var dup = [];
  parts.forEach(function (p) {
    if (!p) return;
    Object.keys(p).forEach(function (k) {
      if (DE.SCENE.nodes[k]) dup.push(k);
      var n = p[k];
      n.id = k;
      DE.SCENE.nodes[k] = n;
    });
  });
  DE.SCENE.duplicates = dup;
  DE.SCENE.count = Object.keys(DE.SCENE.nodes).length;
})();

/* ---------------- 装配审计 ----------------
   返回 { broken: [{from,to}], deadEnd: [id], orphans: [id] }
   断链 = 指向不存在的节点；死胡同 = 既非结局又无选项；孤立 = 无入边。
   -------------------------------------------- */
DE.SCENE.audit = function () {
  var N = DE.SCENE.nodes, ids = Object.keys(N);
  var broken = [], deadEnd = [], orphans = [], targets = {};

  function addTarget(t) { if (t) targets[t] = true; }

  ids.forEach(function (id) {
    var n = N[id];
    (n.choices || []).forEach(function (c) {
      var outs = [c.to, c.onPass, c.onFail];
      outs.forEach(function (t) {
        if (!t) return;
        /* 以 @ 开头的是伪目标，不是节点 —— 目前只有 '@scene'
           （由 60_loop.js 拦截，含义是「离开，回到街面」）。
           不排除它的话，每一个回到街面的选项都会被判成断链。 */
        if (t.charAt(0) === '@') return;
        if (!N[t]) broken.push({ from: id, to: t });
        else addTarget(t);
      });
      if (!c.to && !c.onPass && !c.onFail) deadEnd.push(id + ' → ' + c.text);
    });
    if (!n.ending && !(n.choices || []).length) deadEnd.push(id);
  });

  ids.forEach(function (id) {
    if (id === DE.SCENE.start) return;
    if (DE.SCENE.entries.indexOf(id) >= 0) return;
    if (!targets[id]) orphans.push(id);
  });

  return { broken: broken, deadEnd: deadEnd, orphans: orphans };
};
