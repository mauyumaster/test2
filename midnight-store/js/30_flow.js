/* ===========================================================
   30_flow.js  ——  流程调度
   · 白检定失败后：显示「重开」，需投入 1 点技能点（并受学习上限约束）
   · 红检定失败后：该选项永久关闭（原型里可在日志中看到经验补偿）
   =========================================================== */

window.DE = window.DE || {};

DE.flow = {

  /* 进入节点 */
  goto: function (id) {
    var node = DE.SCENE.nodes[id];
    if (!node) { console.warn('[flow] 缺失节点：' + id); return; }
    DE.state.node = id;
    if (node.onEnter) node.onEnter(DE.state);
    DE.ui.renderPanel();
    DE.ui.showNode(node, DE.flow.buildChoices(node));
  },

  /* 构造可点击的选项 */
  buildChoices: function (node) {
    var s = DE.state;
    var out = [];

    (node.choices || []).forEach(function (c, i) {
      var key = node.id + '#' + i;

      /* --- 已满足隐藏条件：这个选项不再出现 --- */
      if (typeof c.hide === 'function' && c.hide(s)) return;

      /* --- 前置条件不满足：显示为锁定，但让玩家看见「本来还有一条路」 --- */
      if (typeof c.req === 'function' && !c.req(s)) {
        out.push({
          text: c.text, tag: c.tag || 'plain', locked: true,
          note: '※ ' + (c.reqNote || '此刻你还不具备条件。')
        });
        return;
      }

      /* --- 无检定的普通选项 --- */
      if (!c.check) {
        out.push({
          text: c.text, tag: c.tag || 'plain', note: c.note,
          onClick: function () {
            if (c.flag) {
              s.flags[c.flag] = true;
              DE.grantXP(5);
              DE.push({ type: 'sys', text: '留下了一个声音 · <b>' + String(c.text).replace(/[「」]/g, '') + '</b>' });
            }
            DE.flow.goto(c.to);
          }
        });
        return;
      }

      var diff = c.check.diff, skill = c.check.skill, type = c.tag === 'red' ? 'red' : 'white';
      var cap = DE.skillCap(skill), eff = DE.effective(skill);

      /* --- 红检定：失败过就永久关闭 --- */
      if (type === 'red' && s.flags['redfail:' + key]) {
        out.push({
          text: c.text + '（已关闭）', tag: 'red', dead: true,
          note: '红色检定已经失败，这一条路不会再打开。'
        });
        return;
      }

      /* --- 白检定：失败过则转为「重开」 --- */
      var failed = !!s.flags['whitefail:' + key];
      if (failed) {
        var free = DE.hasThought('eternal');          // 永恒轮回：重开不再收费
        var canReopen = (free || s.skillPoints >= 1) && (eff < cap);
        out.push({
          text: (free ? '［重来］' : '［重开］') + c.text,
          tag: 'white', reopen: true,
          odds: DE.odds(skill, diff),
          note: canReopen
            ? (free
                ? '「永恒轮回」正在内化——无偿重掷这一次。（技能 ' + eff + '，上限 ' + cap + '）'
                : '上次失败。投入 1 点技能点提升「' + DE.SKILL_MAP[skill].cn + '」（' + eff + '→' + (eff + 1) + '，上限 ' + cap + '）后重掷。')
            : (eff >= cap
                ? '已达学习上限（' + cap + '），无法再提升——这条路到此为止。'
                : '技能点不足，无法重开。'),
          onClick: function () {
            if (eff >= cap) { DE.ui.toast('「' + DE.SKILL_MAP[skill].cn + '」已达学习上限 ' + cap + '。'); return; }
            if (!free && s.skillPoints < 1) { DE.ui.toast('没有技能点。失败给了你经验——攒够再说。'); return; }
            if (!free) DE.addPoint(skill);
            delete s.flags['whitefail:' + key];
            DE.flow.runCheck(node, c, key, skill, diff, type, true);
          }
        });
        return;
      }

      /* --- 初次尝试 --- */
      out.push({
        text: c.text, tag: type === 'red' ? 'red' : 'white', note: c.note,
        odds: DE.odds(skill, diff),
        onClick: function () { DE.flow.runCheck(node, c, key, skill, diff, type, false); }
      });
    });

    return out;
  },

  /* 执行一次主动检定 */
  runCheck: function (node, c, key, skill, diff, type, isReopen) {
    var res = DE.activeCheck(skill, diff, type);
    DE.ui.showRoll(res, function () {
      if (res.pass) {
        DE.flow.goto(c.onPass || c.to);
        return;
      }
      if (type === 'red') {
        DE.state.flags['redfail:' + key] = true;
      } else {
        DE.state.flags['whitefail:' + key] = true;
      }
      DE.flow.goto(c.onFail || c.to);
    });
  },

  /* 重开一局 */
  restart: function () {
    DE.init();
    DE.ui.showCreate();
    DE.ui.refresh();
  }
};
