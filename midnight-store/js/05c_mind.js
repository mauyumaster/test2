/* ===========================================================
   05c_mind.js  ——  第三卷 · 精神内景
   闭上眼之后，技能各自开口。六个声音各有立场，互相不承认对方。
   这一卷是「技能即人格」最直接的演示：
   它们不是在给你能力，是在争着替你解释这一夜。
   听过的声音会从选项里消失（hide），你只能带走一部分。
   =========================================================== */

window.DE = window.DE || {};

DE.NODES_MIND = {

  /* ---------------- 入口 ---------------- */
  mind_1: {
    head: '店内 · 02:22',
    epi: 'zhuangzi_self',
    script: [
      '你闭上眼。',
      '自动门的风、冷柜的压缩机、关东煮的水声、广播里那首歌的空拍——它们先是分开的，然后开始叠在一起。',
      '你听见自己的呼吸排在最后面，像一个迟到的声部。',
      { p: { skill: 'inland', diff: 11,
        text: '（内心帝国）你现在站的地方，是你今晚唯一没有在赶路的地方。' } },
      { p: { skill: 'shivers', diff: 12,
        text: '（战栗）这条街在你闭眼的时候，把它的重量轻轻压在了你的肩膀上。' } },
      { p: { skill: 'volition', diff: 12,
        text: '（意志）你会睁眼的。但你可以决定在睁眼之前听完多少。' } },
      { aside: '你不需要真的闭眼。你只是需要有一件事不需要你看着。' }
    ],
    choices: [
      { text: '让它们说吧。', to: 'mind_hub' },
      { text: '睁眼。', to: 'inside' }
    ]
  },

  /* ---------------- 核心：多声部 ---------------- */
  mind_hub: {
    head: '精神内景 · 无时间',
    epi: 'pessoa_orchestra',
    lines: [
      '它们不在一个房间里。它们在不同的方向上。',
      '每一个都认为自己才是你。'
    ],
    aside: [
      '你可以只听一个，也可以全都听。听完之后，有些声音会跟着你走出去。'
    ],
    choices: [
      { text: '听逻辑说话。', to: 'v_logic',
        hide: function () { return DE.hasFlag('heard_logic'); } },
      { text: '听内心帝国说话。', to: 'v_empire',
        hide: function () { return DE.hasFlag('heard_empire'); } },
      { text: '听电化学说话。', to: 'v_electro',
        hide: function () { return DE.hasFlag('heard_electro'); } },
      { text: '听意志说话。', to: 'v_volition',
        hide: function () { return DE.hasFlag('heard_volition'); } },
      { text: '听半光说话。', to: 'v_halflight',
        hide: function () { return DE.hasFlag('heard_halflight'); } },
      { text: '听共情说话。', to: 'v_empathy',
        hide: function () { return DE.hasFlag('heard_empathy'); } },
      { text: '睁眼。', to: 'mind_open' }
    ]
  },

  /* ---------------- 逻辑 ---------------- */
  v_logic: {
    head: '精神内景 · 逻辑',
    epi: 'epictetus_view',
    onEnter: function (s) { s.flags.heard_logic = true; },
    script: [
      { t: '「我们来把这件事理清楚。」', cls: 'whisper' },
      '你今晚出门的时候没有想过去哪里。你在雨里站了十九分钟。你现在的坐标是一家二十四小时营业的便利店门前。',
      '这三件事之间没有因果关系。它们只是先后发生。',
      { t: '「你把它叫做「出来走走」。这是一个描述，不是一个理由。」', cls: 'whisper' },
      { p: { skill: 'logic', diff: 12,
        text: '（逻辑）你真正想问的问题，是「我为什么会变成现在这样」。但这个问题太大，你把它换成了「我要买什么」。这是你能处理的尺寸。' } },
      { p: { skill: 'encyclopedia', diff: 13,
        text: '（博闻）「理由」这个词在十九世纪之前不承担这么多责任。是后来的人开始要求每一件事都得有个说法。' } },
      { p: { skill: 'conceptual', diff: 14,
        text: '（概念化）理由是一种债务。你欠世界的、世界欠你的，都用它记账。今晚这笔账你不想再算。' } }
    ],
    choices: [
      { text: '「我知道。今晚我不打算有理由。」', to: 'mind_hub', flag: 'agree_logic',
        note: '同意它：理性到此为止，接下来的事不需要解释。' },
      { text: '「不。理由是可以事后补的。」', to: 'mind_hub',
        note: '反驳它：你不接受必须当场交代。' },
      { text: '听下一个。', to: 'mind_hub' }
    ]
  },

  /* ---------------- 内心帝国 ---------------- */
  v_empire: {
    head: '精神内景 · 内心帝国',
    epi: 'train_north_2',
    onEnter: function (s) { s.flags.heard_empire = true; },
    script: [
      { t: '「你不是来买东西的。」', cls: 'whisper' },
      '你站在门口的时候，门就已经知道了。你以为你在犹豫要不要进去，其实你在拖时间——拖到某个东西自己出现。',
      '那个东西可以是雨里的一片纸，可以是一辆不减速的出租车，可以是任何人说的一句话。',
      { t: '「你今晚是在等下一个人先开口。这一点，我从你鞋子的湿法就看出来了。」', cls: 'whisper' },
      { p: { skill: 'inland', diff: 12,
        text: '（内心帝国）闭上眼的时候你能听见整条街。这不是幻觉，这是你把耳朵借给了它。' } },
      { p: { skill: 'shivers', diff: 13,
        text: '（战栗）这条街在某个角度上会告诉你：这扇门今晚会开。它已经开过很多次了，今晚它还会开一次。' } },
      { p: { skill: 'conceptual', diff: 14,
        text: '（概念化）「命运」是一个你不相信但一直在用的词。' } }
    ],
    choices: [
      { text: '「那就让我等下一个人先开口。」', to: 'mind_hub', flag: 'agree_empire',
        note: '同意它：今晚的走向交给别人或者别的东西。' },
      { text: '「出现什么都一样。我只是在躲雨。」', to: 'mind_hub',
        note: '反驳它：不接受有剧本。' },
      { text: '听下一个。', to: 'mind_hub' }
    ]
  },

  /* ---------------- 电化学 ---------------- */
  v_electro: {
    head: '精神内景 · 电化学',
    epi: 'nihil_1',
    onEnter: function (s) { s.flags.heard_electro = true; },
    script: [
      { t: '「喝点东西。」', cls: 'whisper' },
      '不要水。要那种下去之后有响声的。',
      '前面直走三百米有一家开到四点的店，里面有人在唱歌，跑调，但是很响。',
      { t: '「你现在很痛苦，而且你在假装这不叫痛苦。我们有更简单的办法。」', cls: 'whisper' },
      { p: { skill: 'electro', diff: 11,
        text: '（电化学）酒精会在四十分钟后让你觉得今晚的事变小一圈。这是真的。它骗不了你，因为它从来不骗你——它只是让你不太在意。' } },
      { p: { skill: 'pain', diff: 13,
        text: '（痛觉阈值）你的胃，你的肝，你上次醒来时的那种感觉。它们也有话要说，但它们说得比较小声。' } },
      { p: { skill: 'volition', diff: 13,
        text: '（意志）它说的每一句都是真的。真话有时候是陷阱。' } }
    ],
    choices: [
      { text: '「今晚不喝。」', to: 'mind_hub', flag: 'against_electro',
        note: '拒绝它：把今晚的痛保持原样。' },
      { text: '「你说得有道理。」', to: 'mind_hub', flag: 'agree_electro',
        note: '同意它：把痛苦交给化学处理。' },
      { text: '听下一个。', to: 'mind_hub' }
    ]
  },

  /* ---------------- 意志 ---------------- */
  v_volition: {
    head: '精神内景 · 意志',
    epi: 'tillich_courage',
    onEnter: function (s) { s.flags.heard_volition = true; },
    script: [
      { t: '「坐直。」', cls: 'whisper' },
      '你不知道自己该做什么，这是事实。但你现在可以做的事，其实只有两件：走出去，或者留下来。',
      '其他的都是拖延。拖延不产生内容，它只产生时间。',
      { t: '「你不是没有力气。你是没有决定。」', cls: 'whisper' },
      { p: { skill: 'volition', diff: 12,
        text: '（意志）凌晨两点的人最容易犯的错，是以为自己在思考。其实他在等一个自己不会做的决定自己做完。' } },
      { p: { skill: 'composure', diff: 13,
        text: '（沉着）你的手是稳的。这件事你已经检查过两次了。' } },
      { p: { skill: 'authority', diff: 14,
        text: '（权威）现在，对自己下一个命令。不用很响，但要清楚。' } }
    ],
    choices: [
      { text: '「我知道我要做什么。」', to: 'mind_hub', flag: 'agree_volition',
        note: '同意它：今晚你会做一个决定，并且不收回。' },
      { text: '「再等一会儿。」', to: 'mind_hub',
        note: '反驳它：你选择继续拖着。' },
      { text: '听下一个。', to: 'mind_hub' }
    ]
  },

  /* ---------------- 半光 ---------------- */
  v_halflight: {
    head: '精神内景 · 半光',
    epi: 'nietzsche_abyss',
    onEnter: function (s) { s.flags.heard_halflight = true; },
    script: [
      { t: '「柜台后面那个人，一直在看你。」', cls: 'whisper' },
      '不是敌意。她在判断你是不是要买什么，还是只是站着。这是夜班的职业习惯。',
      '但更早一点，在门口的时候，你身后有一个脚步。你没回头。',
      { t: '「你今晚害怕过的次数是三次。你一次都没有承认。」', cls: 'whisper' },
      { p: { skill: 'halflight', diff: 12,
        text: '（半光）恐惧不是敌人。它是一个一直替你值班的东西，它从来没睡过，也没向你要过工资。' } },
      { p: { skill: 'perception', diff: 13,
        text: '（感知）刚才那个脚步没有跟进店里。它已经在别处了，可能是回家，可能不是。' } },
      { p: { skill: 'inland', diff: 14,
        text: '（内心帝国）有些东西只在你不看它的时候才存在。你回头它会消失，你不回头它就会陪你走完这段路。' } }
    ],
    choices: [
      { text: '「谢谢它一直值班。」', to: 'mind_hub', flag: 'agree_halflight',
        note: '接受恐惧：它不是敌人，是一个提醒。' },
      { text: '「这里没有危险。这里只有雨。」', to: 'mind_hub',
        note: '让它安静：今晚不需要警戒。' },
      { text: '听下一个。', to: 'mind_hub' }
    ]
  },

  /* ---------------- 共情 ---------------- */
  v_empathy: {
    head: '精神内景 · 共情',
    epi: 'sil_2',
    onEnter: function (s) { s.flags.heard_empathy = true; },
    script: [
      { t: '「她也醒着。」', cls: 'whisper' },
      '她今天大概站了八个小时。她的鞋跟一定很酸。她今天说过很多次「袋子要吗」，那句话在她嘴里已经变成一种空气。',
      '她明天可能不来了。或者她不来这件事已经决定了很久，只是没有人问过。',
      { t: '「你不需要救她。你今晚甚至不需要和她说话。但你得知道：你现在累，是因为你在替她累。」', cls: 'whisper' },
      { p: { skill: 'empathy', diff: 12,
        text: '（共情）你能感觉到别人，这不是善良，这是一种漏。世界从你这个漏里进来，一直进来，你关不掉。' } },
      { p: { skill: 'esprit', diff: 13,
        text: '（团队精神）你们三个人都在同一个凌晨里。只是没有人说「我们」。' } },
      { p: { skill: 'rhetoric', diff: 14,
        text: '（修辞）如果你今晚真的要开口，开口之前先想一件事：你说话是为了她，还是为了让你自己好受一点。' } }
    ],
    choices: [
      { text: '「我知道。我会开口。」', to: 'mind_hub', flag: 'agree_empathy',
        note: '同意它：今晚你会对她说一句话。' },
      { text: '「我关不掉它，但我可以不听。」', to: 'mind_hub',
        note: '反驳它：你选择降低共情的音量。' },
      { text: '听下一个。', to: 'mind_hub' }
    ]
  },

  /* ---------------- 收束 ---------------- */
  mind_open: {
    head: '店内 · 02:24',
    epi: 'wittgenstein_death',
    onEnter: function (s) {
      var n = 0;
      ['agree_logic', 'agree_empire', 'agree_electro', 'against_electro',
       'agree_volition', 'agree_halflight', 'agree_empathy'].forEach(function (k) {
        if (s.flags[k]) n++;
      });
      s.flags.mindVoices = n;
    },
    script: [
      '你睁眼。',
      '店还在。冷柜的压缩机刚好在这一秒停了，声音的东西一下子少了一半。',
      '你手里还拿着刚才那样东西。你不知道自己拿了多久。',
      { t: '刚才那些声音都不见了。但它们留下了重量——你能分辨出哪一句话还在。', cls: 'verse' },
      { p: { skill: 'volition', diff: 12,
        text: '（意志）你从里面带走的东西不会写在任何地方。除了你现在站得更稳一点。' } },
      { aside: '广播里那首歌已经换了一首。你还是没听过。' }
    ],
    choices: [
      { text: '看看自己手上拿着什么。', to: 'mind_hands' },
      { text: '直接走向收银台。', to: 'counter' },
      { text: '走回货架那边。', to: 'inside' }
    ]
  },

  mind_hands: {
    head: '店内 · 02:25',
    epi: 'aurelius_exit',
    lines: [
      '你低头看。',
      '一罐咖啡，或者一瓶水，或者一本停刊的杂志——你刚才在货架前面选的那样东西，一直被你握在手里，握得很紧。',
      '你把它换到另一只手上。那只手的手指有点发白。',
      '你今晚已经拿着它站了很久，而你自己没有注意到。'
    ],
    passives: [
      { skill: 'perception', diff: 12,
        text: '（感知）罐身已经不那么冰了。你的手把它焐热了。' },
      { skill: 'inland', diff: 13,
        text: '（内心帝国）你握着它的方式，像有人在握着别人给的东西。' }
    ],
    choices: [
      { text: '走向收银台。', to: 'counter' },
      { text: '走回货架那边。', to: 'inside' }
    ]
  }
};
