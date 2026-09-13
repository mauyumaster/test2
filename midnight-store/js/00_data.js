/* ===========================================================
   00_data.js  ——  静态定义层
   属性 / 24 技能 / 难度刻度 / 修正值 / 想法
   =========================================================== */

window.DE = window.DE || {};

/* ---------------- 属性 ---------------- */
DE.ATTRS = [
  { id: 'int', cn: '智识', en: 'INTELLECT',  color: '#8fb8ff' },
  { id: 'psy', cn: '精神', en: 'PSYCHE',     color: '#b79cff' },
  { id: 'fys', cn: '体格', en: 'PHYSIQUE',   color: '#ff9f8a' },
  { id: 'mot', cn: '运动', en: 'MOTORICS',   color: '#7fd9b0' }
];

/* ---------------- 24 技能 ---------------- */
DE.SKILLS = [
  /* 智识 */
  { id: 'logic',      cn: '逻辑',     en: 'Logic',           attr: 'int' },
  { id: 'encyclopedia', cn: '博闻',   en: 'Encyclopedia',    attr: 'int' },
  { id: 'rhetoric',   cn: '修辞',     en: 'Rhetoric',        attr: 'int' },
  { id: 'drama',      cn: '表演',     en: 'Drama',           attr: 'int' },
  { id: 'conceptual', cn: '概念化',   en: 'Conceptualization', attr: 'int' },
  { id: 'visual',     cn: '视觉演算', en: 'Visual Calculus', attr: 'int' },
  /* 精神 */
  { id: 'volition',   cn: '意志',     en: 'Volition',        attr: 'psy' },
  { id: 'inland',     cn: '内心帝国', en: 'Inland Empire',   attr: 'psy' },
  { id: 'empathy',    cn: '共情',     en: 'Empathy',         attr: 'psy' },
  { id: 'authority',  cn: '权威',     en: 'Authority',       attr: 'psy' },
  { id: 'esprit',     cn: '团队精神', en: 'Esprit de Corps', attr: 'psy' },
  { id: 'suggestion', cn: '暗示',     en: 'Suggestion',      attr: 'psy' },
  /* 体格 */
  { id: 'endurance',  cn: '耐力',     en: 'Endurance',       attr: 'fys' },
  { id: 'pain',       cn: '痛觉阈值', en: 'Pain Threshold',  attr: 'fys' },
  { id: 'physical',   cn: '物理工具', en: 'Physical Instrument', attr: 'fys' },
  { id: 'electro',    cn: '电化学',   en: 'Electrochemistry', attr: 'fys' },
  { id: 'shivers',    cn: '战栗',     en: 'Shivers',         attr: 'fys' },
  { id: 'halflight',  cn: '半光',     en: 'Half Light',      attr: 'fys' },
  /* 运动 */
  { id: 'handeye',    cn: '手眼协调', en: 'Hand/Eye Coord.', attr: 'mot' },
  { id: 'perception', cn: '感知',     en: 'Perception',      attr: 'mot' },
  { id: 'reaction',   cn: '反应速度', en: 'Reaction Speed',  attr: 'mot' },
  { id: 'savoir',     cn: '潇洒风度', en: 'Savoir Faire',    attr: 'mot' },
  { id: 'interfacing',cn: '界面操作', en: 'Interfacing',     attr: 'mot' },
  { id: 'composure',  cn: '沉着',     en: 'Composure',       attr: 'mot' }
];

DE.SKILL_MAP = {};
DE.SKILLS.forEach(function (s) { DE.SKILL_MAP[s.id] = s; });
DE.ATTR_MAP = {};
DE.ATTRS.forEach(function (a) { DE.ATTR_MAP[a.id] = a; });

DE.attrOf = function (skillId) { return DE.SKILL_MAP[skillId].attr; };
DE.colorOf = function (skillId) { return DE.ATTR_MAP[DE.SKILL_MAP[skillId].attr].color; };

/* ---------------- 难度刻度 ----------------
   原作全游不存在难度值 6、7、19 的「主动」检定；
   被动检定的门槛 = 难度值 - 6（技能 + 修正 + 6 ≥ 难度即通过）。
   ------------------------------------------ */
DE.DIFFS = [
  { key: 'easy',        label: 'Easy',        cn: '容易',   v: 9  },
  { key: 'medium',      label: 'Medium',      cn: '中等',   v: 11 },
  { key: 'challenging', label: 'Challenging', cn: '挑战',   v: 12 },
  { key: 'formidable',  label: 'Formidable',  cn: '艰巨',   v: 13 },
  { key: 'legendary',   label: 'Legendary',   cn: '传奇',   v: 14 },
  { key: 'heroic',      label: 'Heroic',      cn: '英勇',   v: 15 },
  { key: 'godly',       label: 'Godly',       cn: '神级',   v: 16 },
  { key: 'impossible',  label: 'Impossible',  cn: '不可能', v: 18 }
];
DE.DIFF_MAP = {};
DE.DIFFS.forEach(function (d) { DE.DIFF_MAP[d.key] = d; });

/* ---------------- 状态 / 穿戴（修正值来源） ----------------
   eff 为 { 技能 id: 修正 }。这是「把此刻的生活状态写进概率」的接口。
   ---------------------------------------------------------- */
DE.MODS = [
  { id: 'tired',   name: '没睡好',       note: '你已经超过三十小时没合眼。世界开始有一点延迟。',
    eff: { volition: -1, inland: 1 } },
  { id: 'wet',     name: '淋湿的外套',   note: '肩上是凉的，袖子贴在腕骨上。它提醒你外面在下雨。',
    eff: { composure: -1, endurance: 1 } },
  { id: 'coffee',  name: '便利店的咖啡', note: '烫、苦、廉价，但有效。喝下去之后，世界的声音会清楚一点。',
    eff: { perception: 1, logic: 1 } },
  { id: 'coins',   name: '兜里的硬币',   note: '刚好够，也刚好不够。',
    eff: { savoir: 1 } },
  { id: 'earbuds', name: '旧耳机（未播放）', note: '戴着它，世界会自动后退一步。你不需要放任何东西。',
    eff: { inland: 2, perception: -1 } },
  { id: 'notebook',name: '随身笔记本',   note: '边角泡软了，字迹在晕开。你写下的东西正在变回纸。',
    eff: { conceptual: 1, visual: 1 } },

  { id: 'shoes',   name: '湿透的鞋',     note: '每走一步都有一点声音。袜子已经不再是袜子，是一层水。',
    eff: { endurance: -1, shivers: 1 } },
  { id: 'oden',    name: '关东煮的汤',   note: '你还没买，但汤的气味已经进来了。那是「还活着」的味道。',
    eff: { endurance: 1, electro: -1 } },
  { id: 'battery', name: '手机只剩 12%', note: '你开始为一件其实不会发生的事节省。',
    eff: { composure: -1, reaction: 1 } },
  { id: 'lighter', name: '半支烟',       note: '你没有点。你只是把它拿在手里，像拿着一张还没决定要不要用的票。',
    eff: { composure: 1, endurance: -1 } },
  { id: 'umbrella',name: '借来的伞',     note: '伞柄上有一圈别人的胶带。你带着一件不属于自己的东西。',
    eff: { savoir: 1, inland: -1 } }
];

/* ---------------- 想法（thoughts） ----------------
   想法是本原型的「哲学层」：内化一条，等于接受一种看世界的方式，
   它给你加值，也向你收费。quote 指向引文库，note 是长内化文本。
   -------------------------------------------------- */
DE.THOUGHTS = [
  {
    id: 'precarious',
    name: '岌岌可危的世界',
    quote: 'nietzsche_return',
    note: '双 1 与双 6 的判定窗口各放宽一档（失败扩至 2–3，成功扩至 11–12）。\n' +
          '你开始相信命运是可以被撬动的——代价是，内化期间所有红色检定强制失败。\n' +
          '「假如有一个魔鬼对你说：你此刻所过的这种生活，你必须再过一次，而且还要过无数次……」',
    eff: {},
    capBonus: 0,
    precarious: true,
    redLock: true
  },
  {
    id: 'jamaisvu',
    name: '既视感（解离）',
    quote: 'zhuangzi_butterfly',
    note: '一切都在重复，一切都已经发生过一次。\n' +
          '所有「智识」技能的学习上限 +1。你不再确定哪些想法是你自己的。',
    eff: { logic: -1, conceptual: 1 },
    capBonusAttr: { int: 1 }
  },
  {
    id: 'essence',
    name: '存在先于本质',
    quote: 'sartre_existence',
    note: '你不是先有某个「本性」，然后才活着；你是先活着，然后才有那个本性。\n' +
          '每一次选择都在定义那个还没有被定义的东西。\n' +
          '代价是：你再也不能把任何事推给「我本来就是这样的人」。',
    eff: { volition: 1, conceptual: 1, authority: -1 }
  },
  {
    id: 'sisyphus',
    name: '西西弗斯的幸福',
    quote: 'camus_sisyphus',
    note: '这块石头明天还会滚下来。这不是失败，这只是它的形状。\n' +
          '一旦承认这一点，推石头这件事就不再需要理由了——它可以只是被继续做下去。\n' +
          '加值来自于不再期待终点。',
    eff: { endurance: 2, reaction: -1 }
  },
  {
    id: 'eternal',
    name: '永恒轮回',
    quote: 'nietzsche_return',
    note: '这一夜会重复无数次：同样的雨、同样的灯、同样的「袋子要吗」。\n' +
          '既然如此，重来就不是恩赐，而是义务——你必须把这一刻过成你愿意重复的样子。\n' +
          '【白色检定重开不再消耗技能点】。代价：每次重开都在削弱你对「这次会不同」的信念。',
    eff: { composure: -1 },
    reopenFree: true
  },
  {
    id: 'beingdeath',
    name: '向死而生',
    quote: 'heidegger_death',
    note: '你把自己的死当作一种可能性带入此刻。这么做之后，很多事会立刻失去分量，\n' +
          '而剩下的事会突然变得极重。你还注意到：你不再在意自己看起来像什么了。',
    eff: { volition: 2, pain: 1, savoir: -2 }
  },
  {
    id: 'otherface',
    name: '他者之脸',
    quote: 'levinas_face',
    note: '她的脸在收银台的灯下面。那张脸上有一件你没有权利忽略的事情。\n' +
          '这不是同情——同情是自上而下的；这是被要求。\n' +
          '你欠她一个回应，在你开口之前就已经欠下了。',
    eff: { empathy: 2, esprit: 1, composure: -1 }
  },
  {
    id: 'attention',
    name: '注意力是慷慨',
    quote: 'weil_attention',
    note: '「注意力是最稀有、最纯粹的慷慨。」\n' +
          '那意味着：真正看着一个人，本身就是给予；而走神，是一种偷窃。\n' +
          '你今晚所有的技能点，买的都不是力量，而是「看得见的能力」。',
    eff: { perception: 2, empathy: 1, electro: -1 }
  },
  {
    id: 'goddead',
    name: '上帝死了',
    quote: 'nietzsche_god',
    note: '没有人再替你签字。所有被继承下来的答案同时失效了，\n' +
          '包括「这样不对」和「这样才对」。剩下的工作是重估一切价值——\n' +
          '而这项工作没有下班时间。',
    eff: { authority: 1, conceptual: 1, esprit: -2 }
  },
  {
    id: 'wosangwo',
    name: '吾丧我',
    quote: 'zhuangzi_self',
    note: '「今者吾丧我。」——我失去了那个由姓名、职业、社会关系构成的自己。\n' +
          '剩下的那个还在呼吸、还在听雨。它比原来那个安静得多。\n' +
          '所有「自我认同」类的检定变难，但内心帝国从来没有这么清楚过。',
    eff: { inland: 2, authority: -1, esprit: -1 }
  },
  {
    id: 'impermanent',
    name: '无常',
    quote: 'tao_yuanming',
    note: '「纵浪大化中，不喜亦不惧。」\n' +
          '事情在消散，这就够了——它们不需要被留住，也不需要被反对。\n' +
          '得失的重量下降了，但不等于什么都不在乎。',
    eff: { composure: 1, volition: 1, electro: -1, esprit: -1 }
  },
  {
    id: 'burnout',
    name: '倦怠社会',
    quote: 'han_byungchul',
    note: '你不是被别人剥削的，你是自愿地、积极地、充满热情地剥削自己，直到倒下。\n' +
          '凌晨两点还醒着的人，常常不是失眠，是不肯下班。\n' +
          '看清这一点之后，你能更准确地识别同类——但也更难忍受自己。',
    eff: { esprit: 2, conceptual: 1, pain: -1 }
  },
  {
    id: 'limit',
    name: '语言的界限',
    quote: 'wittgenstein_limit',
    note: '「我的语言的界限，意味着我的世界的界限。」\n' +
          '有些东西不是难以说出，而是根本不在这套语言里——它们只存在于动作、停顿和雨声里。\n' +
          '你开始避开解释性的句子。',
    eff: { logic: 1, rhetoric: 1, inland: -1, conceptual: -1 }
  },
  {
    id: 'rainvoice',
    name: '雨声注释',
    quote: 'lom_1',
    note: '雨声在说：这里没有人需要你，你可以放心地待着。\n' +
          '接受这个解释之后，被雨淋这件事从「倒霉」变成了「许可」。',
    eff: { shivers: 2, composure: 1, perception: -1 }
  },
  {
    id: 'nightshift',
    name: '夜班神学',
    quote: 'kabu_1',
    note: '收银台是一个告解室，区别是这里没有神，只有一台会打印小票的机器。\n' +
          '「谢谢光临」是仪式语，「袋子要吗」是开场白。你开始听见这些话底下的东西。',
    eff: { empathy: 1, endurance: 1, drama: -1 }
  }
];


/* ---------------- 初始分配 ---------------- */
DE.SETUP = {
  attrPoints: 12,     // 四项属性的总点数，每项 1–6
  attrMin: 1,
  attrMax: 6,
  skillPoints: 2,     // 初始技能点
  slots: 3,           // 想法槽
  slotsMax: 12
};
