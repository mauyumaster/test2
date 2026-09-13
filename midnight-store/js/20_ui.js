/* ===========================================================
   20_ui.js  ——  渲染层
   左栏技能面板 / 中栏正文与选项 / 右栏状态与日志 / 检定浮层
   =========================================================== */

window.DE = window.DE || {};
DE.ui = {};

function $(id) { return document.getElementById(id); }
function esc(t) { return String(t).replace(/&/g, '&amp;').replace(/</g, '&lt;'); }

/* ---------------- 文本渲染工具 ----------------
   一行可以是字符串，也可以是对象：
     { t: 文本, cls: 'verse'|'aside'|'whisper'|'big'|'hr',
       who: 说话人, ref: 引文 id 或内联引文对象, show: 函数 }
   cls    — verse 诗行 / aside 旁注 / whisper 耳语 / big 强调 / hr 分隔
   show   — 返回 false 则该行不显示（用于条件文本）
   ---------------------------------------------------- */
DE.ui.lineHTML = function (l) {
  if (l === '---') return '<div class="hr-sep"></div>';
  if (typeof l === 'string') return '<p class="line">' + l + '</p>';

  if (l.show && !l.show(DE.state)) return '';

  var cls = 'line' + (l.cls ? ' ' + l.cls : '');
  var h = '<p class="' + cls + '">';
  if (l.who) h += '<span class="speaker">' + l.who + '</span>';
  h += l.t;

  if (l.ref) {
    var r = DE.ref(l.ref);
    if (r) {
      DE.ui.collectRef(l.ref);
      h += '<span class="in-ref">　— ' + r.who + (r.src ? '《' + String(r.src).replace(/[《》]/g, '') + '》' : '') +
           (r.exact === false ? '（转述）' : '') + '</span>';
    }
  }
  return h + '</p>';
};

/* 引文块（带出处，可点击查看考据） */
DE.ui.epiHTML = function (spec) {
  var r = DE.ref(spec);
  if (!r) return '';
  DE.ui.collectRef(spec);
  var real = (r.real === false) ? ' invention' : '';
  var badge = (r.real === false) ? '虚构' : (r.exact === false ? '转述' : '原句');
  return '<blockquote class="epi' + real + '" data-ref="' + (typeof spec === 'string' ? spec : '') + '">' +
           '<p class="epi-t">' + r.t + '</p>' +
           (r.tr ? '<p class="epi-tr">' + r.tr + '</p>' : '') +
           '<cite class="epi-src">— ' + r.who + '　' + r.src +
             '<span class="epi-badge">' + badge + '</span>' +
             (r.note ? '<span class="epi-note">' + r.note + '</span>' : '') +
           '</cite>' +
         '</blockquote>';
};

/* 收集本局见过的引文 */
DE.ui.collectRef = function (spec) {
  var id = (typeof spec === 'string') ? spec : null;
  var key = id || (DE.ref(spec) ? DE.ref(spec).t : null);
  if (!key) return;
  var arr = DE.state.refsSeen;
  if (!arr) arr = DE.state.refsSeen = [];
  if (arr.indexOf(key) < 0) arr.push(key);
};


/* 旁注（页边小字） */
DE.ui.asideHTML = function (a) {
  if (typeof a === 'object' && a.show && !a.show(DE.state)) return '';
  var t = (typeof a === 'object') ? a.t : a;
  return '<p class="aside-note">' + t + '</p>';
};

/* 被动检定段落 */
DE.ui.passiveHTML = function (p) {
  if (!DE.passivePass(p.skill, p.diff)) return '';
  var attr = DE.attrOf(p.skill);
  DE.push({ type: 'pas', text: '<b>' + DE.SKILL_MAP[p.skill].cn + '</b> 被动通过 · ' + p.diff });
  return '<p class="psv a-' + attr + '">' + p.text +
         '<span class="p-src">　[' + DE.SKILL_MAP[p.skill].cn + ' ' + DE.effective(p.skill) +
         ' + 6 / 难度 ' + p.diff + ']</span></p>';
};

DE.ui.passivesHTML = function (list) {
  var h = '';
  (list || []).forEach(function (p) { h += DE.ui.passiveHTML(p); });
  return h;
};

/* 分镜序列：把台词、旁注、引文、被动判定按顺序排 */
DE.ui.scriptItem = function (item) {
  if (typeof item === 'string') return DE.ui.lineHTML(item);
  if (item.p)    return DE.ui.passiveHTML(item.p);
  if (item.epi)  return DE.ui.epiHTML(item.epi);
  if (item.aside) return DE.ui.asideHTML(item.aside);
  if (item.hr)   return '<div class="hr-sep"></div>';
  return DE.ui.lineHTML(item);
};

/* ---------------- 左栏 ---------------- */
DE.ui.renderPanel = function () {
  var s = DE.state, h = '';
  var creating = !s.built;

  h += '<div class="sec-h">' + (creating ? '分配属性 · 余 ' + DE.attrLeft() : '技能') + '</div>';

  DE.ATTRS.forEach(function (a) {
    h += '<div class="attr-block">';
    h += '<div class="attr-head">' +
           '<span class="a-name" style="color:' + a.color + '">' + a.cn + '</span>' +
           '<span class="a-en">' + a.en + '</span>' +
           '<span class="a-val" style="color:' + a.color + '">' + s.attrs[a.id] + '</span>' +
         '</div>';

    DE.SKILLS.forEach(function (k) {
      if (k.attr !== a.id) return;
      var lv = DE.skillLevel(k.id), md = DE.modTotal(k.id), eff = lv + md, cap = DE.skillCap(k.id);
      var capped = eff >= cap;
      var sig = (s.sig === k.id);

      h += '<div class="sk' + (capped ? ' capped' : '') + '" data-sk="' + k.id + '">';
      h += '<span class="s-name">' + k.cn + (sig ? ' ★' : '') + '<small>' + k.en + '</small></span>';
      if (md) h += '<span class="s-mod" style="color:' + (md > 0 ? '#6ec98a' : '#e0685f') + '">' + (md > 0 ? '+' : '') + md + '</span>';
      h += '<span class="s-val" style="color:' + a.color + '">' + eff + '</span>';
      if (creating) {
        h += '<button class="s-add" data-sig="' + k.id + '" title="设为标志性技能">◆</button>';
      } else {
        h += '<button class="s-add" data-add="' + k.id + '"' + (capped || s.skillPoints <= 0 ? ' disabled' : '') + ' title="上限 ' + cap + '">+</button>';
      }
      h += '</div>';
    });
    h += '</div>';
  });

  $('panel').innerHTML = h;

  /* 事件绑定 */
  $('panel').querySelectorAll('[data-add]').forEach(function (b) {
    b.onclick = function () { if (DE.addPoint(b.getAttribute('data-add'))) DE.ui.refresh(); };
  });
  $('panel').querySelectorAll('[data-sig]').forEach(function (b) {
    b.onclick = function () {
      var id = b.getAttribute('data-sig');
      DE.state.sig = (DE.state.sig === id) ? null : id;
      DE.rebuildSkills();
      DE.ui.refresh();
    };
  });
};

/* ---------------- 右栏 ---------------- */
DE.ui.renderSide = function () {
  var s = DE.state, h = '';

  h += '<div class="sec-h">状态</div>';
  h += '<div class="kv"><span>技能点</span><b>' + s.skillPoints + '</b></div>';
  h += '<div class="kv"><span>等级 / 经验</span><b>Lv.' + s.level + ' · ' + s.xp + '</b></div>';
  h += '<div class="kv"><span>想法槽</span><b>' + s.thoughts.length + ' / ' + s.slots + '</b></div>';
  var nref = (s.refsSeen || []).length;
  h += '<button class="lib-btn" id="open-refs"' + (nref ? '' : ' disabled') + '>' +
       '文献 · 本局已见 ' + nref + ' 条</button>';

  h += '<div class="sec-h">穿戴与状态</div>';
  DE.MODS.forEach(function (m) {
    var on = !!s.activeMods[m.id];
    var eff = Object.keys(m.eff).map(function (k) {
      var v = m.eff[k];
      return DE.SKILL_MAP[k].cn + (v > 0 ? ' +' : ' ') + v;
    }).join('　');
    h += '<div class="stat-row' + (on ? ' on' : '') + '" data-mod="' + m.id + '" title="' + esc(m.note) + '">' +
           '<span class="t-name">' + m.name + '<span class="t-eff">　' + eff + '</span></span>' +
           '<button>' + (on ? '启用' : '关闭') + '</button>' +
         '</div>';
  });

  h += '<div class="sec-h">想法 · 内化一条等于接受一种看世界的方式</div>';
  DE.THOUGHTS.forEach(function (th) {
    var on = s.thoughts.indexOf(th.id) >= 0;
    var full = (s.thoughts.length >= s.slots);
    h += '<div class="stat-row' + (on ? ' on' : '') + (full && !on ? ' full' : '') +
         '" data-th="' + th.id + '" title="' + esc(th.note) + '">' +
           '<span class="t-name">' + th.name + '<span class="t-eff">　' + (on ? '已内化' : '未内化') + '</span></span>' +
           '<button>' + (on ? '遗忘' : '内化') + '</button>' +
         '</div>';
    if (on) {
      var r = DE.ref(th.quote);
      if (r) {
        DE.ui.collectRef(th.quote);
        h += '<div class="th-quote">「' + r.t + '」<b>— ' + r.who + '　' + r.src + '</b></div>';
      }
      h += '<div class="th-note">' + th.note.replace(/\n/g, '<br>') + '</div>';
    }
  });
  h += '<div class="log-i pas" style="margin-top:8px">内化「岌岌可危的世界」期间，红色检定强制失败。</div>';

  h += '<div class="sec-h">检定记录</div>';
  if (!s.log.length) h += '<div class="log-i">尚未进行任何检定。</div>';
  s.log.forEach(function (it) {
    var cls = it.type === 'ok' ? 'ok' : (it.type === 'fail' ? 'fail' : (it.type === 'pas' ? 'pas' : ''));
    h += '<div class="log-i ' + cls + '">' + it.text +
         (it.detail ? '<span class="r"><br>' + it.detail + '</span>' : '') + '</div>';
  });

  $('side').innerHTML = h;

  $('side').querySelectorAll('[data-mod]').forEach(function (r) {
    r.onclick = function () { DE.toggleMod(r.getAttribute('data-mod')); DE.ui.refresh(); };
  });
  $('side').querySelectorAll('[data-th]').forEach(function (r) {
    r.onclick = function () { DE.toggleThought(r.getAttribute('data-th')); DE.ui.refresh(); };
  });
  var ob = $('open-refs');
  if (ob && !ob.disabled) ob.onclick = function () { DE.ui.showRefs(); };
};

/* ---------------- 文献库浮层 ----------------
   本局见过的全部引文，按来源性质分组：
   原句 / 转述 / 虚构，并附考据注释。
   -------------------------------------------- */
DE.ui.showRefs = function () {
  var seen = DE.state.refsSeen || [];
  var groups = { exact: [], para: [], fiction: [] };

  seen.forEach(function (key) {
    /* 引文库与虚构书目共用一套 id，两处都要查 */
    var r = DE.REF[key] || DE.BOOK[key] || null;
    if (!r) {                                   // 兜底：内联引文以正文为键
      for (var k in DE.REF) if (DE.REF[k].t === key) { r = DE.REF[k]; break; }
      if (!r) for (var b in DE.BOOK) if (DE.BOOK[b].t === key) { r = DE.BOOK[b]; break; }
    }
    if (!r) return;
    var g = (r.real === false) ? 'fiction' : (r.exact === false ? 'para' : 'exact');
    groups[g].push(r);
  });

  var h = '<div class="lib-head">文 献</div>';
  h += '<div class="lib-sub">本局出现过 ' + seen.length + ' 条。' +
       '「原句」为通行译本，「转述」为语义复述，「虚构」是本原型自拟的</div>';

  var defs = [
    ['exact',   '原句', '来自真实来源，采通行译本。'],
    ['para',    '转述', '真实作者，但为语义复述而非原句译文。'],
    ['fiction', '虚构', '原型自拟的世界内文献，不对应任何真实著作。']
  ];
  defs.forEach(function (d) {
    var list = groups[d[0]];
    if (!list.length) return;
    h += '<div class="lib-group">' + d[1] + ' · ' + list.length +
         '<span class="lib-gnote">' + d[2] + '</span></div>';
    list.forEach(function (r) {
      h += '<div class="lib-i">' +
             '<p class="lib-t">' + r.t + '</p>' +
             (r.tr ? '<p class="lib-tr">' + r.tr + '</p>' : '') +
             '<div class="lib-src">— ' + r.who + '　' + r.src + '</div>' +
             (r.note ? '<div class="lib-note">' + r.note + '</div>' : '') +
           '</div>';
    });
  });

  h += '<button class="rb-btn" id="refs-close">关闭</button>';
  $('rollbox').innerHTML = h;
  $('rollbox').className = 'libbox';
  $('overlay').classList.remove('hidden');
  $('refs-close').onclick = function () {
    $('overlay').classList.add('hidden');
    $('rollbox').className = '';
  };
};

/* ---------------- 中栏：创建 ---------------- */
DE.ui.showCreate = function () {
  var s = DE.state, h = '';
  h += '<div class="node-head">角色创建</div>';
  h += '<p class="line">你是一个凌晨两点还没睡的人。四个属性共 ' + DE.SETUP.attrPoints + ' 点，每项 1–6；' +
       '左侧面板里点技能名后的 <b>◆</b> 指定一个「标志性技能」（天生 +1，并抬高它的学习上限）。</p>';
  h += '<p class="line quote">技能值 = 你在那个方向上「听得见多少」。它不让你变强，它让你看见别的。</p>';
  h += '<p class="line">规则速记：主动检定 <b>技能 + 修正 + 2d6 ≥ 难度</b>；被动检定 <b>技能 + 修正 + 6 ≥ 难度</b>（不掷骰，达标必然通过）。' +
       '双 1 必败，双 6 必胜。</p>';

  h += '<div style="margin-top:22px">';
  DE.ATTRS.forEach(function (a) {
    h += '<div class="stat-row' + (s.attrs[a.id] > 1 ? ' on' : '') + '" data-attr="' + a.id + '">' +
           '<span class="t-name" style="color:' + a.color + '">' + a.cn + ' ' + a.en + '</span>' +
           '<button data-minus="' + a.id + '">−</button>' +
           '<span style="font-family:var(--serif);font-size:16px;min-width:20px;text-align:center">' + s.attrs[a.id] + '</span>' +
           '<button data-plus="' + a.id + '">+</button>' +
         '</div>';
  });
  h += '</div>';

  h += '<button class="choice begin-cta" id="begin">' +
         '走进去' +
         '<span class="kbd-hint">点击 或 按 Enter · Space</span>' +
       '</button>';

  $('stage').innerHTML = h;

  /* 任意键进入：Enter / Space 都行，避免玩家盯着按钮找鼠标 */
  window.addEventListener('keydown', function _beginKey(e) {
    if (DE.state.built) {
      window.removeEventListener('keydown', _beginKey, true);
      return;
    }
    var k = e.key.toLowerCase();
    if (k === 'enter' || k === ' ' || k === 'spacebar') {
      var b = document.getElementById('begin');
      if (b) { e.preventDefault(); b.click(); }
    }
  }, true);

  $('stage').querySelectorAll('[data-plus]').forEach(function (b) {
    b.onclick = function () {
      var id = b.getAttribute('data-plus');
      if (DE.attrLeft() > 0 && DE.state.attrs[id] < DE.SETUP.attrMax) {
        DE.state.attrs[id] += 1; DE.rebuildSkills(); DE.ui.refresh();
      }
    };
  });
  $('stage').querySelectorAll('[data-minus]').forEach(function (b) {
    b.onclick = function () {
      var id = b.getAttribute('data-minus');
      if (DE.state.attrs[id] > DE.SETUP.attrMin) {
        DE.state.attrs[id] -= 1; DE.rebuildSkills(); DE.ui.refresh();
      }
    };
  });
  $('begin').onclick = function () {
    DE.state.built = true;
    DE.ui.refresh();
    DE.flow.goto(DE.SCENE.start);
  };
  /* 让开始按钮自己拿到焦点——回车键要生效，焦点得在这条路径上 */
  setTimeout(function () {
    var b = document.getElementById('begin');
    if (b) b.focus();
  }, 50);
};

/* ---------------- 中栏：节点 ---------------- */
DE.ui.showNode = function (node, choices) {
  var h = '';
  if (node.head) h += '<div class="node-head">' + node.head + '</div>';
  if (node.epi) h += DE.ui.epiHTML(node.epi);

  if (node.script) {
    node.script.forEach(function (it) { h += DE.ui.scriptItem(it); });
  } else {
    (node.lines || []).forEach(function (l) { h += DE.ui.lineHTML(l); });
    (node.aside || []).forEach(function (a) { h += DE.ui.asideHTML(a); });
    h += DE.ui.passivesHTML(node.passives);
  }

  if (node.ending) {
    h += '<div class="ending">' + node.ending + '</div>';
    if (node.ending_note) h += '<p class="line quote">' + node.ending_note + '</p>';
    h += '<button class="choice restart" id="again">再来一次（换一副眼睛）</button>';
    $('stage').innerHTML = h;
    $('again').onclick = function () { DE.flow.restart(); };
    DE.ui.renderSide();
    return;
  }

  (choices || []).forEach(function (c, i) {
    var cls = 'choice tag-' + (c.tag || 'plain') +
              (c.dead ? ' red-dead' : '') + (c.reopen ? ' reopen' : '') +
              (c.locked ? ' locked' : '');
    h += '<button class="' + cls + '" data-ci="' + i + '"' + ((c.dead || c.locked) ? ' disabled' : '') + '>';
    if (c.tag === 'white') h += '<span class="c-tag">白</span>';
    if (c.tag === 'red') h += '<span class="c-tag">红</span>';
    h += c.text;
    if (typeof c.odds === 'number') {
      var pc = Math.round(c.odds * 100);
      h += '<span class="odds"><span class="o-bar"><i style="width:' + pc + '%"></i></span>' +
           '<span class="o-num">' + pc + '%</span></span>';
    }
    if (c.note) h += '<span class="c-note">' + c.note + '</span>';
    h += '</button>';
  });

  $('stage').innerHTML = h;
  $('stage').querySelectorAll('[data-ci]').forEach(function (b) {
    b.onclick = function () {
      var c = choices[parseInt(b.getAttribute('data-ci'), 10)];
      if (c && c.onClick) c.onClick();
    };
  });
  DE.ui.renderSide();
};

/* ---------------- 检定浮层 ---------------- */
DE.ui.showRoll = function (res, done) {
  var kind = res.type === 'red' ? '红 色 检 定' : '白 色 检 定';
  var sk = DE.SKILL_MAP[res.skill];
  var diffDef = null;
  for (var i = 0; i < DE.DIFFS.length; i++) if (DE.DIFFS[i].v === res.diff) diffDef = DE.DIFFS[i];

  var h = '<div class="rb-kind ' + (res.type === 'red' ? 'red' : 'white') + '">' + kind + '</div>';
  h += '<div class="rb-skill" style="color:' + DE.colorOf(res.skill) + '">' + sk.cn + '</div>';
  h += '<div class="rb-diff">' + (diffDef ? diffDef.cn + ' · ' + diffDef.label + ' · ' : '') + '难度 ' + res.diff + '</div>';
  h += '<div class="rb-dice"><div class="die rolling" id="d1">?</div><div class="die rolling" id="d2">?</div></div>';
  h += '<div id="rb-res"></div>';
  $('rollbox').innerHTML = h;
  $('rollbox').className = '';
  $('overlay').classList.remove('hidden');

  var a = 0, b = 0;
  var iv = setInterval(function () {
    a = DE.d6(); b = DE.d6();
    $('d1').textContent = a; $('d2').textContent = b;
  }, 75);

  setTimeout(function () {
    clearInterval(iv);
    var d1 = $('d1'), d2 = $('d2');
    d1.classList.remove('rolling'); d2.classList.remove('rolling');
    d1.textContent = res.d1; d2.textContent = res.d2;
    if (res.critSucc) { d1.classList.add('crit-ok'); d2.classList.add('crit-ok'); }
    if (res.critFail) { d1.classList.add('crit-no'); d2.classList.add('crit-no'); }

    var modTxt = res.mod ? (res.mod > 0 ? ' + ' + res.mod : ' ' + res.mod) : '';
    var rh = '<div class="rb-eq">技能 <b>' + res.level + '</b>' + modTxt + '　+　骰 <b>' + res.d1 + ' + ' + res.d2 + '</b></div>';
    rh += '<div class="rb-total">' + res.grand + ' <span style="font-size:15px;color:var(--dim)">/ ' + res.diff + '</span></div>';
    if (res.critSucc) rh += '<div class="rb-crit">双 6 —— 无论如何，成功。</div>';
    if (res.critFail) rh += '<div class="rb-crit">双 1 —— 无论如何，失败。</div>';
    if (res.locked) rh += '<div class="rb-crit" style="color:var(--fail)">「岌岌可危的世界」正在内化 —— 红色检定强制失败。</div>';
    rh += '<div class="rb-verdict ' + (res.pass ? 'ok' : 'no') + '">' + (res.pass ? '通 过' : '失 败') + '</div>';
    rh += '<button class="rb-btn" id="rb-ok">继续</button>';
    $('rb-res').innerHTML = rh;
    $('rb-ok').onclick = function () {
      $('overlay').classList.add('hidden');
      if (done) done();
    };
  }, 720);
};

/* ---------------- toast ---------------- */
DE.ui.toast = function (msg) {
  var t = $('toast');
  t.textContent = msg;
  t.classList.remove('hidden');
  clearTimeout(DE.ui._tt);
  DE.ui._tt = setTimeout(function () { t.classList.add('hidden'); }, 1900);
};

/* ---------------- 刷新 ---------------- */
DE.ui.refresh = function () {
  DE.ui.renderPanel();
  DE.ui.renderSide();
};
