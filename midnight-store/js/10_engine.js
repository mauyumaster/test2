/* ===========================================================
   10_engine.js  ——  状态与检定引擎
   公式（同原作）：
     主动检定：技能等级 + 修正 + 2d6 ≥ 难度
     被动检定：技能等级 + 修正 + 6  ≥ 难度（不掷骰）
   临界：双 1 必败、双 6 必胜；「岌岌可危的世界」把两端各放宽一档。
   =========================================================== */

window.DE = window.DE || {};

/* 2d6 点数分布：index = 点数和，值 = 组合数（总和 36） */
DE.D2 = [0, 0, 1, 2, 3, 4, 5, 6, 5, 4, 3, 2, 1];

DE.state = null;

/* ---------------- 初始化 ---------------- */
DE.init = function () {
  var s = {
    attrs: { int: 3, psy: 3, fys: 3, mot: 3 },
    sig: null,
    skills: {},
    activeMods: { tired: true, wet: true },
    thoughts: [],
    skillPoints: DE.SETUP.skillPoints,
    slots: DE.SETUP.slots,
    xp: 0,
    level: 1,
    node: DE.SCENE.start,
    flags: {},
    refsSeen: [],       // 本局见过的引文（文献库）
    fails: {},          // 白检定失败记录 { key: 次数 }
    log: [],
    built: false
  };
  DE.state = s;
  DE.SKILLS.forEach(function (k) { s.skills[k.id] = { base: 0, points: 0 }; });
  DE.rebuildSkills();
  return s;
};

/* 属性 → 技能基础值（标志性技能天生 +1） */
DE.rebuildSkills = function () {
  var s = DE.state;
  DE.SKILLS.forEach(function (k) {
    if (!s.skills[k.id]) s.skills[k.id] = { base: 0, points: 0 };
    var b = s.attrs[k.attr];
    if (s.sig === k.id) b += 1;
    s.skills[k.id].base = b;
  });
};

/* ---------------- 取值 ---------------- */
DE.skillLevel = function (id) {
  var k = DE.state.skills[id];
  return k.base + k.points;
};

DE.modTotal = function (id) {
  var s = DE.state, t = 0, i;
  for (i = 0; i < DE.MODS.length; i++) {
    var m = DE.MODS[i];
    if (s.activeMods[m.id]) t += (m.eff[id] || 0);
  }
  for (i = 0; i < DE.THOUGHTS.length; i++) {
    var th = DE.THOUGHTS[i];
    if (s.thoughts.indexOf(th.id) >= 0) t += ((th.eff || {})[id] || 0);
  }
  return t;
};

DE.effective = function (id) { return DE.skillLevel(id) + DE.modTotal(id); };

/* 学习上限 = 属性值 + 3（原型简化；原作上限规则更细） */
DE.skillCap = function (id) {
  var s = DE.state;
  var attr = DE.attrOf(id);
  var cap = s.attrs[attr] + 3;
  if (s.sig === id) cap += 1;
  DE.THOUGHTS.forEach(function (th) {
    if (s.thoughts.indexOf(th.id) >= 0 && th.capBonusAttr && th.capBonusAttr[attr]) {
      cap += th.capBonusAttr[attr];
    }
  });
  return cap;
};

DE.attrSpent = function () {
  var s = DE.state, n = 0;
  DE.ATTRS.forEach(function (a) { n += s.attrs[a.id]; });
  return n;
};
DE.attrLeft = function () { return DE.SETUP.attrPoints - DE.attrSpent(); };

DE.thought = function (id) {
  for (var i = 0; i < DE.THOUGHTS.length; i++) if (DE.THOUGHTS[i].id === id) return DE.THOUGHTS[i];
  return null;
};
DE.hasFlag = function (id) { return !!DE.state.flags[id]; };
DE.hasThought = function (id) { return DE.state.thoughts.indexOf(id) >= 0; };

/* ---------------- 概率（精确解，含临界修正） ---------------- */
DE.odds = function (skillId, diff) {
  var total = DE.effective(skillId);
  var need = diff - total;
  var prec = DE.hasThought('precarious');
  var ok = 0, s, i;

  for (s = 2; s <= 12; s++) {
    var wins = (s >= need);
    if (prec) {
      if (s <= 3) wins = false;        // 失败窗口放宽到 2–3
      if (s >= 11) wins = true;        // 成功窗口放宽到 11–12
    } else {
      if (s === 2) wins = false;       // 双 1 必败
      if (s === 12) wins = true;       // 双 6 必胜
    }
    if (wins) ok += DE.D2[s];
  }
  return ok / 36;
};

/* 被动检定：不掷骰 */
DE.passivePass = function (skillId, diff) {
  return DE.effective(skillId) + 6 >= diff;
};

DE.passiveNeed = function (diff) { return Math.max(0, diff - 6); };

/* ---------------- 主动检定 ---------------- */
DE.d6 = function () { return 1 + Math.floor(Math.random() * 6); };

DE.activeCheck = function (skillId, diff, type) {
  var s = DE.state;
  var level = DE.skillLevel(skillId);
  var mod = DE.modTotal(skillId);
  var total = level + mod;
  var d1 = DE.d6(), d2 = DE.d6();
  var sum = d1 + d2;
  var prec = DE.hasThought('precarious');

  var critFail, critSucc;
  if (prec) { critFail = (sum <= 3); critSucc = (sum >= 11); }
  else { critFail = (d1 === 1 && d2 === 1); critSucc = (d1 === 6 && d2 === 6); }

  var locked = (type === 'red' && DE.hasThought('precarious'));   // 原作：内化期间红检定强制失败
  var pass = critSucc || (!critFail && !locked && (total + sum >= diff));

  var res = {
    skill: skillId, diff: diff, type: type,
    d1: d1, d2: d2, sum: sum,
    level: level, mod: mod, total: total,
    grand: total + sum,
    critFail: critFail, critSucc: critSucc,
    locked: locked,
    pass: pass
  };
  DE.grantXP(pass ? 10 : 5);
  DE.push({ type: pass ? 'ok' : 'fail',
    text: (type === 'red' ? '红色检定 · ' : '白色检定 · ') + DE.SKILL_MAP[skillId].cn +
          ' → ' + (pass ? '通过' : '失败'),
    detail: d1 + ' + ' + d2 + ' + ' + total + ' = ' + res.grand + ' / 难度 ' + diff });
  return res;
};

/* ---------------- 成长 ---------------- */
DE.addPoint = function (skillId) {
  var s = DE.state;
  if (s.skillPoints <= 0) return false;
  var k = s.skills[skillId];
  if (k.base + k.points >= DE.skillCap(skillId)) return false;
  k.points += 1;
  s.skillPoints -= 1;
  DE.push({ type: 'sys', text: '<b>' + DE.SKILL_MAP[skillId].cn + '</b> 提升至 ' + (k.base + k.points) + '（消耗 1 技能点）' });
  return true;
};

DE.grantXP = function (n) {
  var s = DE.state;
  s.xp += n;
  while (s.xp >= 100 * s.level) {
    s.xp -= 100 * s.level;
    s.level += 1;
    s.skillPoints += 1;
    DE.push({ type: 'sys', text: '升级 → <b>Lv.' + s.level + '</b>，获得 1 技能点' });
  }
};

DE.toggleMod = function (id) {
  var s = DE.state;
  s.activeMods[id] = !s.activeMods[id];
};

DE.toggleThought = function (id) {
  var s = DE.state, i = s.thoughts.indexOf(id);
  if (i >= 0) { s.thoughts.splice(i, 1); return; }
  if (s.thoughts.length >= s.slots) {
    if (DE.ui && DE.ui.toast) DE.ui.toast('想法槽已满（' + s.thoughts.length + ' / ' + s.slots + '）。你得先忘掉一件事，才能接受另一件。');
    return;
  }
  s.thoughts.push(id);
  DE.push({ type: 'sys', text: '内化想法 · <b>' + DE.thought(id).name + '</b>' });
};

DE.expandSlot = function () {
  var s = DE.state;
  if (s.skillPoints < 1 || s.slots >= DE.SETUP.slotsMax) return false;
  s.skillPoints -= 1; s.slots += 1;
  DE.push({ type: 'sys', text: '想法槽扩展至 <b>' + s.slots + '</b>' });
  return true;
};

/* ---------------- 日志 ---------------- */
DE.push = function (item) {
  DE.state.log.unshift(item);
  if (DE.state.log.length > 60) DE.state.log.pop();
};
