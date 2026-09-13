/* ===========================================================
   05a_gate.js  ——  第一卷 · 门外
   雨、招牌、伞架、猫、手机、公交站牌下没打伞的人。
   叙述不给解释，只给动作、话语、环境和感官；
   哲学交给顶部引文与内心声音去说。
   =========================================================== */

window.DE = window.DE || {};

DE.NODES_GATE = {

  /* ---------------- 起点 ---------------- */
  start: {
    head: '马路对面 · 02:07',
    epi: 'lom_2',
    script: [
      '雨从傍晚下到现在。没有变大，也没有变小。',
      '你站在马路这一头。斑马线从你脚下开始，湿得只剩白色。',
      '街对面那间便利店开着。这条街上只有它是亮的。',
      '你没有带伞。你也没有想去哪里。',
      '隔着雨和玻璃，收银台后面有个人，货架前面没有人。门上的感应器亮着一个小红点，它在等谁走过去。',
      { p: { skill: 'shivers', diff: 9,
        text: '（战栗）这条街是活的。它记得每一个走进那扇门、又空着手出来的人。' } },
      { p: { skill: 'perception', diff: 11,
        text: '（感知）玻璃上蒙着一层反光。要花掉一点时间，才能在里面找到你自己。' } },
      { p: { skill: 'inland', diff: 12,
        text: '（内心帝国）你不是来买东西的。你是来让那盏灯照一下的。' } },
      { p: { skill: 'halflight', diff: 13,
        text: '（半光）街角站牌下面站着一个人，没有伞。他已经站了很久，而且他在等你先动。' } },
      { aside: '雨声里没有别的信息。这大概就是它让人放松的原因。' }
    ],
    choices: [
      { text: '穿过斑马线，走到店门口。', to: 'inside' },
      { text: '在雨里再站一会儿。', to: 'linger' },
      { text: '看一眼那块招牌。', to: 'sign' },
      { text: '看门口的伞架。', to: 'umbrella' },
      { text: '掏出手机看时间。', to: 'phone' },
      { text: '看门口那只猫。', to: 'cat' }
    ]
  },

  /* ---------------- 招牌 ---------------- */
  sign: {
    head: '屋檐下 · 02:08',
    epi: 'dei_light',
    script: [
      '招牌是绿的，白字，下面一行小字写着二十四小时。',
      '灯管有一节在闪。它每十一秒漏一次气，像一个人快要睡着时的呼吸。',
      '这个亮度足够让整条人行道都发绿。你站在绿光里。',
      { p: { skill: 'encyclopedia', diff: 11,
        text: '（博闻）这一款灯箱是九十年代的规格，原厂早就停产了。它是被修出来的，不是被留下的。' } },
      { p: { skill: 'conceptual', diff: 11,
        text: '（概念化）「二十四小时」是一个承诺。问题是，它到底向谁承诺。' } },
      { p: { skill: 'shivers', diff: 12,
        text: '（战栗）这条街上还有六十七扇亮着的窗。其中四扇里面的人，今晚也睡不着。' } },
      { aside: '把「二十四小时」读快一点，听起来像某种祝福。' }
    ],
    choices: [
      { text: '推门进去。', to: 'inside' },
      { text: '再多看它灭一下、再亮一下。', to: 'sign_wait' },
      { text: '转身，往回走。', to: 'end_leave' }
    ]
  },

  sign_wait: {
    head: '屋檐下 · 02:09',
    epi: 'rilke_questions',
    lines: [
      '你数了四次。十四秒、十一秒、十一秒、十二秒。',
      '它没有规律。或者规律在你数不清的地方。',
      '路灯把你的影子压在人行道的地砖上，被雨打得一直在轻轻发抖。'
    ],
    passives: [
      { skill: 'logic', diff: 12,
        text: '（逻辑）没有规律，其实是一个结论。你只是不喜欢它。' },
      { skill: 'pain', diff: 11,
        text: '（痛觉阈值）你的脚已经开始麻了。你打算再站一会儿。' }
    ],
    choices: [
      { text: '推门进去。', to: 'inside' },
      { text: '转身，往回走。', to: 'end_leave' }
    ]
  },

  /* ---------------- 伞架 ---------------- */
  umbrella: {
    head: '门口伞架 · 02:08',
    script: [
      '伞架是塑料的，桶身上印着已经掉色的厂家名。里面插着三把伞。',
      '最右边那把，藏青色，伞骨第二节向外翻着。',
      '你上周把它丢在这里。你记得那天你也没有带伞回去，只是那时候雨小。',
      { p: { skill: 'visual', diff: 11,
        text: '（视觉演算）第二节伞骨的内侧有一道白痕，是你某次塞进地铁闸机时刮的。是它。' } },
      { p: { skill: 'inland', diff: 12,
        text: '（内心帝国）伞在替你待在这家店。它比你早一步做了决定：不走。' } },
      { aside: '伞架里还有一把不是伞。是一根卷起来的塑料布，被人仔细地扎了三道。' }
    ],
    choices: [
      {
        text: '把伞抽出来，放回包里。', tag: 'white',
        check: { skill: 'handeye', diff: 11 },
        onPass: 'umbrella_own', onFail: 'umbrella_awk',
        note: '「手眼协调」——在伞骨勾住栏杆之前，把它干净地抽出来。'
      },
      { text: '算了。让它继续放在那里。', to: 'start' },
      { text: '推门进去。', to: 'inside' }
    ]
  },

  umbrella_own: {
    head: '门口伞架 · 02:09',
    epi: 'zhangdai_fool',
    lines: [
      '你把它抽了出来。全程没有惊动另外两把。',
      '伞面还是湿的。有人在你之前用它遮过雨——可能是店员，可能不是。',
      '你把它夹在腋下。你现在是一个带了伞的人了。'
    ],
    onEnter: function (s) { s.activeMods.umbrella = true; },
    passives: [
      { skill: 'empathy', diff: 11,
        text: '（共情）也许她也拿它出过门。下大雨的凌晨，去倒一次垃圾，或者走到路口看一眼。' },
      { skill: 'esprit', diff: 12,
        text: '（团队精神）这条街上的东西一直在互相借用。你不用打招呼，因为它们也不打。' }
    ],
    choices: [
      { text: '推门进去。', to: 'inside' },
      { text: '转身，往回走。', to: 'end_leave' }
    ]
  },

  umbrella_awk: {
    head: '门口伞架 · 02:09',
    lines: [
      '伞骨和伞架缠在了一起。你拉了三次，第三次整桶盆都要翻。',
      '你松开手，等了两秒，再把它转了个角度抽出来。',
      '旁边没有人。你依然觉得自己被看见了。'
    ],
    choices: [
      { text: '推门进去。', to: 'inside' },
      { text: '把伞插回去，转身往回走。', to: 'end_leave' }
    ]
  },

  /* ---------------- 屋檐下 ---------------- */
  linger: {
    head: '屋檐下 · 02:09',
    epi: 'beckett_gogo',
    script: [
      '你不动。雨在离你四十厘米的地方落下。',
      '自动门感应到你，开了一次，又合上。它以为你要进去。',
      '门开的那一下，里面暖气的味道出来了：纸浆、关东煮、消毒水。',
      { p: { skill: 'endurance', diff: 9,
        text: '（耐力）你的鞋已经湿透了。你并不觉得冷——你只是知道这件事。' } },
      { p: { skill: 'inland', diff: 12,
        text: '（内心帝国）有些门你只需要站在旁边，就已经算进去过了。' } },
      { p: { skill: 'perception', diff: 12,
        text: '（感知）门开的时候，柜台后面的那本书翻了一页。用下巴翻的。' } },
      { p: { skill: 'halflight', diff: 13,
        text: '（半光）公交站牌下面有个人，没有伞，已经站了至少十分钟。他在等你先动。' } },
      { aside: '屋檐的边缘在滴水。滴的位置正好是你的鞋尖前面，规律得像节拍器。' }
    ],
    choices: [
      { text: '推门进去。', to: 'inside' },
      { text: '往公交站牌那边走。', to: 'busstop' },
      { text: '数一数屋檐上有几个滴水点。', to: 'drip' },
      { text: '转身，往回走。', to: 'end_leave' }
    ]
  },

  drip: {
    head: '屋檐下 · 02:10',
    epi: 'vol_1',
    lines: [
      '七个。其中两个落在同一块石砖上，中间隔着一米二。',
      '你把注意力全放在这件事上。你的呼吸慢下来了。',
      '这大概就是所谓的休息。'
    ],
    passives: [
      { skill: 'perception', diff: 12,
        text: '（感知）第八个不在屋檐上。在你的领口里。' },
      { skill: 'volition', diff: 11,
        text: '（意志）你现在可以做一件小事：走进去，或者走回去。只有两种。' },
      { skill: 'conceptual', diff: 13,
        text: '（概念化）「等雨停」是一种宗教。它的神从来不会出现，但仪式有效。' }
    ],
    choices: [
      { text: '推门进去。', to: 'inside' },
      { text: '转身，往回走。', to: 'end_leave' }
    ]
  },

  /* ---------------- 公交站牌下的人 ---------------- */
  busstop: {
    head: '公交站牌 · 02:12',
    epi: 'buber_meeting',
    script: [
      '站牌上的时刻表被雨泡得起皱。最后一行写着：末班 23:40。',
      '他站在站牌侧面，背对着车道。头发已经贴在额头上了。',
      '他没有看表，也没有看路。他只是在站着。',
      { p: { skill: 'empathy', diff: 11,
        text: '（共情）他没有在等车。这个时间没有车。他在等一个「有人来接」的可能性。' } },
      { p: { skill: 'halflight', diff: 12,
        text: '（半光）他的右手一直握着口袋里的东西，握得太久了，指节是白的。' } },
      { p: { skill: 'esprit', diff: 13,
        text: '（团队精神）凌晨两点还站在雨里的人彼此之间有一种默契：不问，只看一眼。' } }
    ],
    choices: [
      {
        text: '「你要去哪儿？这条路我可以陪你走一段。」', tag: 'white',
        check: { skill: 'rhetoric', diff: 12 },
        onPass: 'bus_ok', onFail: 'bus_no',
        note: '「修辞」——把「我注意到你了」包装成一件顺手的小事。'
      },
      {
        text: '什么也不说，站到他旁边，一起等。', tag: 'white',
        check: { skill: 'composure', diff: 11 },
        onPass: 'bus_silent', onFail: 'bus_awk',
        note: '「沉着」——用沉默完成一次陪伴，不让它变成尴尬。'
      },
      { text: '走回屋檐下。', to: 'linger' },
      { text: '推门进去。', to: 'inside' }
    ]
  },

  bus_ok: {
    head: '公交站牌 · 02:13',
    epi: 'bus_ok_ref',
    lines: [
      '他转过头。大概三秒之后才真正看清你。',
      '「不用，」他说，「我等人。」',
      '停了一下，他又说：「他说十一点半到。」',
      '他说完之后自己也听见了这句话。他把手从口袋里拿出来，又放回去。'
    ],
    passives: [
      { skill: 'empathy', diff: 12,
        text: '（共情）他不打算解释「他」是谁。他只需要有人听见这个时间。' },
      { skill: 'authority', diff: 12,
        text: '（权威）现在你有两个选择：戳破，或者接住。前者有助于你，后者有助于他。' },
      { skill: 'inland', diff: 13,
        text: '（内心帝国）他和你一样，是来借一盏灯的。只是他借的是路灯。' }
    ],
    choices: [
      { text: '「那我陪你等到十一点半。」', to: 'bus_stay' },
      { text: '「抽根烟吗。」', to: 'bus_smoke' },
      { text: '点点头，走回屋檐下。', to: 'linger' },
      { text: '推门进去。', to: 'inside' }
    ]
  },

  bus_no: {
    head: '公交站牌 · 02:13',
    lines: [
      '他看了你一眼，很短。',
      '「不用。」',
      '然后他把身体稍微转开了一个角度，不多不少，刚好让这次对话结束。',
      '雨落在他肩上的声音和你肩上的一样。'
    ],
    choices: [
      { text: '站着不动，再看一会儿雨。', to: 'bus_wait' },
      { text: '走回屋檐下。', to: 'linger' },
      { text: '推门进去。', to: 'inside' }
    ]
  },

  bus_wait: {
    head: '公交站牌 · 02:15',
    epi: 'aurelius_moment',
    lines: [
      '你们隔着三米，各自站着。',
      '一辆出租车从主路上过去，没有减速。积水被压起来，泼在人行道上，又落回去。',
      '这样过了很久。久到你已经不再觉得这是「在陪他」。'
    ],
    passives: [
      { skill: 'shivers', diff: 12,
        text: '（战栗）十一点半早就过了。你们两个都清楚。' },
      { skill: 'volition', diff: 12,
        text: '（意志）你可以走了。没有人会因此欠你什么。' }
    ],
    choices: [
      { text: '推门进去。', to: 'inside' },
      { text: '转身，往回走。', to: 'end_leave' }
    ]
  },

  bus_silent: {
    head: '公交站牌 · 02:13',
    epi: 'weil_attention',
    lines: [
      '你站到他旁边，也背对着车道。',
      '你们一起看着对面那栋楼的三层窗户。不知道是谁在看它。',
      '四分钟之后，他从口袋里拿出一支烟，点上，吸了一口，递向你。',
      '他没有看你。'
    ],
    passives: [
      { skill: 'pain', diff: 12,
        text: '（痛觉阈值）你知道自己该拒绝。你的肺在提醒你。' },
      { skill: 'inland', diff: 13,
        text: '（内心帝国）这支烟不是烟。这是一句「我接受你站在这里」。' }
    ],
    choices: [
      { text: '接过来，吸一口。', to: 'bus_smoke' },
      { text: '摇头。', to: 'bus_refuse' },
      { text: '推门进去。', to: 'inside' }
    ]
  },

  bus_awk: {
    head: '公交站牌 · 02:13',
    lines: [
      '你在他旁边站着。三十秒之后，他挪开了两步。',
      '你不知道该说什么，于是什么也没说。这就是沉默和沉默的区别。',
      '你退回屋檐下。他没有回头。'
    ],
    choices: [
      { text: '推门进去。', to: 'inside' },
      { text: '转身，往回走。', to: 'end_leave' }
    ]
  },

  bus_smoke: {
    head: '公交站牌 · 02:16',
    epi: 'cioran_failure',
    onEnter: function (s) { s.activeMods.lighter = true; },
    lines: [
      '烟是凉的。下雨天所有的烟都是凉的。',
      '他把烟按灭在站牌的柱子上，留下一小块灰。',
      '「谢了，」他说。你不知道他在谢什么。可能是「你没有问我为什么」。',
      '他走了。往西边，和你来的方向一样。'
    ],
    passives: [
      { skill: 'halflight', diff: 12,
        text: '（半光）他走出二十米之后，脚步开始有一点点乱。他在哭。别追。' },
      { skill: 'empathy', diff: 13,
        text: '（共情）他今晚不会等到任何人。但他今晚被人陪着站了十几分钟。这两件事不冲突。' }
    ],
    choices: [
      { text: '推门进去。', to: 'inside' },
      { text: '看着他的背影，直到看不见。', to: 'bus_after' }
    ]
  },

  bus_refuse: {
    head: '公交站牌 · 02:14',
    lines: [
      '你摇头。他把烟收回去，自己吸。',
      '「对，」他说，「这东西没什么好。」',
      '他把「没什么好」这四个字说得很平。'
    ],
    choices: [
      { text: '推门进去。', to: 'inside' },
      { text: '走回屋檐下。', to: 'linger' }
    ]
  },

  bus_after: {
    head: '人行道 · 02:18',
    epi: 'lu_xun_shadow',
    lines: [
      '他进了雨里，没有加快脚步。',
      '你站到看不见他为止。',
      '然后你发现自己在做一件很久没做过的事：目送一个不认识的人。'
    ],
    passives: [
      { skill: 'volition', diff: 13,
        text: '（意志）你今晚做过的第一件好事，没有观众，也不会被记住。这正好是它的价值。' }
    ],
    choices: [
      { text: '推门进去。', to: 'inside' },
      { text: '转身，往回走。', to: 'end_leave' }
    ]
  },

  bus_stay: {
    head: '公交站牌 · 02:20',
    epi: 'dostoevsky_love',
    lines: [
      '他笑了一下，很短，像被风吹歪的。',
      '「你是便利店的人？」',
      '「不是。」',
      '「那你站在这儿干嘛。」',
      '他没有等你回答。他把脸转回车道的方向。'
    ],
    passives: [
      { skill: 'drama', diff: 12,
        text: '（表演）他刚才那个问题是真的。他在确认你是不是某种「官方关心」。' },
      { skill: 'inland', diff: 13,
        text: '（内心帝国）他没有地方可以去。你有一个便利店。这个差别很大。' }
    ],
    choices: [
      { text: '「我也没有地方去。」', to: 'bus_both' },
      { text: '「那我进去买点东西，你要什么我给你带。」', to: 'inside' },
      { text: '不再说话，就这样站着。', to: 'bus_wait' }
    ]
  },

  bus_both: {
    head: '公交站牌 · 02:21',
    epi: 'gushi_nineteen',
    lines: [
      '他看了你一眼，这次长了一点。',
      '「你也没有。」他重复了一遍，像在核对一份名单。',
      '然后他从口袋里拿出那件一直握着的东西——是一张公交卡。旧的那种，卡面磨白了。',
      '「他给我的，」他说，「我一直在想能不能还回去。」',
      '他把卡放回口袋里。'
    ],
    passives: [
      { skill: 'empathy', diff: 12,
        text: '（共情）「还回去」的意思不是还卡。是要再见一次。' },
      { skill: 'conceptual', diff: 13,
        text: '（概念化）他手里握的不是卡，是一张可以正当去见一个人的票据。' }
    ],
    choices: [
      { text: '「那就留着。」', to: 'bus_leave_1' },
      { text: '「你已经等了很久了。」', to: 'bus_leave_2' },
      { text: '推门进去。', to: 'inside' }
    ]
  },

  bus_leave_1: {
    head: '公交站牌 · 02:23',
    epi: 'rilke_dragons',
    lines: [
      '「留着？」他把这两个字在嘴里放了一下。',
      '「留着干嘛。」',
      '你说不上来。他也没有真的要你回答。',
      '他把卡放进胸前口袋，那里比侧袋干一点。'
    ],
    choices: [
      { text: '推门进去。', to: 'inside' },
      { text: '转身，往回走。', to: 'end_leave' }
    ]
  },

  bus_leave_2: {
    head: '公交站牌 · 02:23',
    epi: 'kierkegaard_backward',
    lines: [
      '「十一点半到，现在两点二十。」他说得很准确。',
      '「我知道。」他说，「我知道。」',
      '他把这句话说给两个不同的人听：一个是你，一个是他自己。',
      '然后他走了，方向还是西边。'
    ],
    choices: [
      { text: '推门进去。', to: 'inside' },
      { text: '看着他的背影，直到看不见。', to: 'bus_after' }
    ]
  },

  /* ---------------- 手机 ---------------- */
  phone: {
    head: '屋檐下 · 02:08',
    epi: 'pessoa_nothing',
    onEnter: function (s) { s.activeMods.battery = true; },
    script: [
      '屏幕亮起来，37%。',
      '通知栏里躺着一行字，是四十分钟前发的。你没有点开。',
      '发送者的名字被截断成两个字。你认得那两个字。',
      { p: { skill: 'visual', diff: 11,
        text: '（视觉演算）发送者的头像被通知栏压住了下半边。但你认得那个构图——逆光，手举得比脸高。' } },
      { p: { skill: 'logic', diff: 12,
        text: '（逻辑）四十分钟前你还醒着。你没有点开，不是因为没看见。' } },
      { p: { skill: 'composure', diff: 12,
        text: '（沉着）你的拇指停在屏幕上方的空气里。它没有抖。它只是不动。' } },
      { p: { skill: 'empathy', diff: 13,
        text: '（共情）对方也在等。这四十分钟里可能看了六次屏幕。你知道吗，你知道。' } }
    ],
    choices: [
      {
        text: '点开它。', tag: 'white',
        check: { skill: 'composure', diff: 12 },
        onPass: 'phone_ok', onFail: 'phone_no'
      },
      { text: '不点开。就这样看着它在通知栏里待着。', to: 'phone_look' },
      { text: '熄屏，推门进去。', to: 'inside' },
      { text: '熄屏，转身往回走。', to: 'end_leave' }
    ]
  },

  phone_ok: {
    head: '屋檐下 · 02:09',
    epi: 'sartre_badfaith',
    lines: [
      '你点开了。',
      '一行字，没有标点，像随手扔出来的：「还没睡吗」',
      '你把手机放回兜里。雨声重新变得清楚。'
    ],
    passives: [
      { skill: 'empathy', diff: 11,
        text: '（共情）这不是一句问候。这是一句「我也醒着」。' },
      { skill: 'rhetoric', diff: 13,
        text: '（修辞）「还没睡吗」没有任何要求。所以它是一张空白的邀请函，你可以往上写任何东西。' }
    ],
    choices: [
      { text: '回一个字：「没」', to: 'phone_reply' },
      { text: '回一句：「你也没睡。」', to: 'phone_reply' },
      { text: '把手机放回去，推门进去。', to: 'inside' }
    ]
  },

  phone_reply: {
    head: '屋檐下 · 02:10',
    epi: 'buber_meeting',
    lines: [
      '发送。',
      '「已送达」变成「已读」，用了两秒。',
      '然后是「正在输入」。出现了三次，消失了三次。',
      '最后只来了一个字：「嗯」。'
    ],
    passives: [
      { skill: 'empathy', diff: 12,
        text: '（共情）那个「嗯」是删掉了很多次之后剩下的东西。剩下的部分你今晚听不到。' },
      { skill: 'logic', diff: 13,
        text: '（逻辑）「正在输入」消失三次，说明对方写了三句话，又都删了。你们在做同一件事。' }
    ],
    choices: [
      { text: '把手机收起来，推门进去。', to: 'inside' },
      { text: '回一句：「明天见。」', to: 'end_reply' },
      { text: '不再回了。转身往回走。', to: 'end_leave' }
    ]
  },

  phone_no: {
    head: '屋檐下 · 02:09',
    epi: 'pessoa_tired',
    lines: [
      '你的拇指停在屏幕上，没有按下去。',
      '然后屏幕自己黑了。你盯着那块黑玻璃看了一会儿，里面有个模糊的人。',
      '通知栏的红点还在通知栏里。它不会消失，除非你处理它。'
    ],
    passives: [
      { skill: 'volition', diff: 12,
        text: '（意志）你不是不敢看。你是不想让今晚变成「那个晚上」。' },
      { skill: 'inland', diff: 13,
        text: '（内心帝国）有些消息是门。推开之前你还是现在的你。' }
    ],
    choices: [
      { text: '再试一次，点开它。', to: 'phone_retry' },
      { text: '推门进去。', to: 'inside' },
      { text: '转身往回走。', to: 'end_leave' }
    ]
  },

  phone_retry: {
    head: '屋檐下 · 02:10',
    lines: [
      '这次点开了。',
      '「还没睡吗」',
      '你看了七秒，然后把它标记为未读。',
      '这是你今天做过的最熟练的一件技术动作。'
    ],
    choices: [
      { text: '推门进去。', to: 'inside' },
      { text: '转身，往回走。', to: 'end_leave' }
    ]
  },

  phone_look: {
    head: '屋檐下 · 02:09',
    epi: 'wittgenstein_silence',
    lines: [
      '你不点开。你看着那条通知，看它慢慢地被雨水打出的光斑比下去。',
      '你知道里面是什么。你甚至知道标点的位置。',
      '有些句子你已经读过了——在读之前。',
      '屏幕在你手里暗下去，像一件终于放下的东西。'
    ],
    passives: [
      { skill: 'conceptual', diff: 12,
        text: '（概念化）你正在做的事有一个名字：把一句话保持在还没有变成事实的状态。' },
      { skill: 'inland', diff: 13,
        text: '（内心帝国）门没有锁。门只是关着。你今晚决定不去推它。' },
      { skill: 'composure', diff: 14,
        text: '（沉着）这是一次成功。没有任何人知道它是一次成功。' }
    ],
    choices: [
      { text: '推门进去。', to: 'inside' },
      { text: '转身，往回走。', to: 'end_leave' }
    ]
  },

  /* ---------------- 猫 ---------------- */
  cat: {
    head: '车行道对面 · 02:11',
    epi: 'soseki_cat',
    script: [
      '它蹲在空调外机的正下方，那里有一块永远不会被雨打到的方形。',
      '一只橘猫，瘦，耳朵上有一个缺口。',
      '它没有躲你。它只是把尾巴卷紧了一点。',
      { p: { skill: 'shivers', diff: 11,
        text: '（战栗）它在这条街上比你久。它认识所有会在凌晨经过这里的人，并且不打算用这件事跟你交换什么。' } },
      { p: { skill: 'empathy', diff: 12,
        text: '（共情）它不怕你。它只是把你归进了「不构成威胁的动静」那一类。这已经是一种很高的评价。' } },
      { p: { skill: 'handeye', diff: 13,
        text: '（手眼协调）你蹲下去的角度可以更慢。你的膝盖知道该蹲多深。' } },
      { aside: '车道上没有车。积水把它的影子拉成了一长条。' }
    ],
    choices: [
      {
        text: '蹲下去，把手伸给它闻。', tag: 'white',
        check: { skill: 'handeye', diff: 12 },
        onPass: 'cat_ok', onFail: 'cat_no',
        note: '「手眼协调」——不吓到它的能力，本质上是一种克制。'
      },
      { text: '只是站在雨里看它。', to: 'cat_look' },
      { text: '走回屋檐下。', to: 'start' }
    ]
  },

  cat_ok: {
    head: '车行道对面 · 02:13',
    epi: 'montaigne_know',
    lines: [
      '它闻了闻你的指节，然后侧过头，把下巴搁在了你的手背上。',
      '它的头很轻。比你以为的轻得多。',
      '你保持这个姿势，直到膝盖开始响。',
      '它走的时候没有告别。它只是不在了。'
    ],
    passives: [
      { skill: 'empathy', diff: 12,
        text: '（共情）刚才那一分钟，你被一个不属于你的生命当成了安全的地方。' },
      { skill: 'inland', diff: 12,
        text: '（内心帝国）它从头到尾没有问你为什么在这里。' }
    ],
    choices: [
      { text: '推门进去。', to: 'inside' },
      { text: '转身，往回走。', to: 'end_leave' }
    ]
  },

  cat_no: {
    head: '车行道对面 · 02:12',
    lines: [
      '它后退了半步，但没有跑。',
      '它看着你的手，像在看一件还没有被证明安全的家具。',
      '你把手收回来的时候，它重新卷紧了尾巴。',
      '你们谈崩了。谈崩得很安静。'
    ],
    choices: [
      { text: '站着再看它一会儿。', to: 'cat_look' },
      { text: '走回屋檐下。', to: 'start' }
    ]
  },

  cat_look: {
    head: '车行道对面 · 02:14',
    epi: 'zhuangzi_butterfly',
    lines: [
      '你站着。它蹲着。雨在你们中间下。',
      '你忽然有一秒钟分不清——是你在看一只猫，还是某个正在某处躲雨的东西，借着你的眼睛在往外看。',
      '这一秒过去之后，你还是你，它还是它。',
      '你转身走回屋檐下，身上湿得比刚才更彻底。'
    ],
    passives: [
      { skill: 'inland', diff: 13,
        text: '（内心帝国）它刚才眨了一次眼。是「慢眨眼」。那是猫的语言里最接近「我信任你」的一句。' },
      { skill: 'shivers', diff: 12,
        text: '（战栗）它的耳朵缺口是被谁咬的，这条街知道。这条街不打算告诉任何人。' }
    ],
    choices: [
      { text: '推门进去。', to: 'inside' },
      { text: '转身，往回走。', to: 'end_leave' }
    ]
  }
};

/* 站牌线的引文（内联，因为要一张自己的） */
DE.REF.bus_ok_ref = {
  t: '有些人在雨里不是在等车。他们是在等一个可以不必解释的理由。',
  who: '洛姆·阿奇', src: '《雨声注释》', real: false, tag: '等待'
};
