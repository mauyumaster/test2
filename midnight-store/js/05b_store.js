/* ===========================================================
   05b_store.js  ——  第二卷 · 店内
   六个货架各自属于一个主题：
     饮料柜 = 选择 / 便当 = 时间 / 杂志 = 他者
     关东煮 = 劳动 / 咖啡机 = 倦怠 / 冰淇淋 = 记忆
   后场门与公告板是两条支线。窗边坐着的人另卷。
   =========================================================== */

window.DE = window.DE || {};

DE.NODES_STORE = {

  /* ---------------- 进店 ---------------- */
  inside: {
    head: '店内 · 02:11',
    epi: 'weil_attention',
    script: [
      '自动门在你身后合上，把雨声关在外面。',
      '冷气扑过来，干净、干燥、有一点塑料味。还有关东煮的汤在滚。',
      '店里只有两个人。柜台后面一个，窗边坐着一个。',
      { p: { skill: 'empathy', diff: 9,
        text: '（共情）柜台后面那个人在读同一页。已经读得很久了。她不是在读书，是在熬时间。' } },
      { p: { skill: 'perception', diff: 11,
        text: '（感知）她的工牌是别的店的名牌，贴了一张手写纸条盖住原来的名字。' } },
      { p: { skill: 'electro', diff: 12,
        text: '（电化学）关东煮的汤还在滚。那不是食物的味道，是「还活着」的味道。' } },
      { p: { skill: 'esprit', diff: 12,
        text: '（团队精神）你和这两个人之间有一种东西：你们三个人都没有在该睡觉的时候睡觉。' } },
      { p: { skill: 'logic', diff: 13,
        text: '（逻辑）地上的导视箭头是往里的，不是往外的。每家便利店都这样。没有人设计过这个。' } },
      { aside: '广播里放着一首你没听过的歌。它不悲伤，只是有很多空拍。' }
    ],
    choices: [
      { text: '走向饮料柜。', to: 'drinks' },
      { text: '走向便当区。', to: 'bento' },
      { text: '走向杂志架。', to: 'magazine' },
      { text: '走向关东煮与热食柜。', to: 'oden' },
      { text: '走向咖啡机。', to: 'coffee' },
      { text: '走向冰淇淋柜。', to: 'ice' },
      { text: '看一眼后场的门。', to: 'door_back' },
      { text: '看墙上的公告板。', to: 'board' },
      { text: '看收银台旁边那摞被人翻旧的书。', to: 'shelf' },
      { text: '看一眼窗边坐着的那个人。', to: 'window_seat' },
      { text: '闭上眼，先站一会儿。', to: 'mind_1' },
      { text: '直接去收银台。', to: 'counter' }
    ]
  },

  /* ---------------- 饮料柜：选择 ---------------- */
  drinks: {
    head: '饮料柜前 · 02:14',
    epi: 'sartre_condemned',
    script: [
      '冷柜的玻璃上有一层薄雾。里面的灯是白的，白得有点残忍。',
      '一整排都亮着，一整排都不需要你。',
      '你的手扶上柜门的把手。金属是凉的。',
      { p: { skill: 'electro', diff: 11,
        text: '（电化学）你要的不是水。你要的是糖，是咖啡因，是某种还能把你往上提一点的东西。' } },
      { p: { skill: 'composure', diff: 12,
        text: '（沉着）你的手在把手上停了两秒。两秒之后，你还在原地。' } },
      { p: { skill: 'conceptual', diff: 13,
        text: '（概念化）四十七种饮料，四十七种明天早上醒来的方式。哪一种都不是你想要的那种。' } },
      { aside: '柜子最下面一层只有矿泉水。它们看起来像在罚站。' }
    ],
    choices: [
      {
        text: '拿一罐最便宜的黑咖啡。', tag: 'white',
        check: { skill: 'visual', diff: 12 },
        onPass: 'drinks_pick', onFail: 'drinks_pick_bad',
        note: '「视觉演算」——在一整排相似的包装里，认出真正你要的那一罐。'
      },
      { text: '拿一瓶水。最便宜的那种。', to: 'drinks_water' },
      { text: '把柜门开着，让冷气扑在脸上。', to: 'drinks_cold' },
      { text: '什么都不拿，去收银台。', to: 'counter' }
    ]
  },

  drinks_pick: {
    head: '饮料柜前 · 02:15',
    epi: 'montaigne_know',
    lines: [
      '你的手伸出去，没有犹豫，停在第三排最左边。',
      '是因为标签的角度、罐身那道凹槽，还是因为上周你也拿过同一罐？你没有深究。',
      '罐身是冰的。你把它贴在手腕内侧，停了一下。'
    ],
    passives: [
      { skill: 'savoir', diff: 12,
        text: '（潇洒风度）你合上柜门的动作很稳。没有人看见，但你自己看见了。' },
      { skill: 'inland', diff: 13,
        text: '（内心帝国）你选它，是因为它从来没让你失望过。人有的时候就是这么简单：找一个不会变的东西。' }
    ],
    choices: [ { text: '去收银台。', to: 'counter' } ]
  },

  drinks_pick_bad: {
    head: '饮料柜前 · 02:16',
    epi: 'camus_revolt',
    lines: [
      '你拿了一罐。走出两步，又折回来换了一罐。再走两步，又换回去。',
      '冷柜的玻璃映出你的动作，看起来像在犹豫什么大事。',
      '其实你只是在挑饮料。'
    ],
    passives: [
      { skill: 'drama', diff: 13,
        text: '（表演）柜台后面的人抬眼看了你一下。她看见的是一个人在货架前站了太久。她见过很多这样的人。' }
    ],
    choices: [ { text: '去收银台。', to: 'counter' } ]
  },

  drinks_water: {
    head: '饮料柜前 · 02:15',
    epi: 'lucretius_nothing',
    lines: [
      '矿泉水。两块钱。你把它拿在手里。',
      '透明的、没有味道的、没有承诺的。',
      '你忽然有点感谢它——它是这整柜东西里唯一没有试图让你高兴的。'
    ],
    passives: [
      { skill: 'endurance', diff: 12,
        text: '（耐力）你身体缺的确实是水。这件事它比你先知道。' }
    ],
    choices: [ { text: '去收银台。', to: 'counter' } ]
  },

  drinks_cold: {
    head: '饮料柜前 · 02:16',
    epi: 'pascal_silence',
    lines: [
      '你把柜门拉开，让冷气出来。白光照在你的手背上。',
      '你站了大概四十秒。',
      '一个陌生的声音在心里说：这里的空气是空的，它什么也不会对你说。',
      '你合上门。玻璃上留下你手指的痕迹，很快被雾盖回去。'
    ],
    choices: [
      { text: '还是拿一罐吧。', to: 'drinks' },
      { text: '去收银台。', to: 'counter' }
    ]
  },

  /* ---------------- 便当区：时间 ---------------- */
  bento: {
    head: '便当区 · 02:13',
    epi: 'aurelius_moment',
    script: [
      '便当整整齐齐，标签上印着时间。',
      '最上面那排是今天的。最下面那排贴了黄色折扣贴纸。',
      { p: { skill: 'shivers', diff: 12,
        text: '（战栗）这排便当会在凌晨四点被丢掉。它们不知道。它们只是被放在那里。' } },
      { p: { skill: 'inland', diff: 12,
        text: '（内心帝国）你从来没在凌晨两点饿过。你只是想让手上有点东西。' } },
      { p: { skill: 'pain', diff: 13,
        text: '（痛觉阈值）你知道被贴黄标是什么感觉。你上个月经历过一次，那份工作。' } }
    ],
    choices: [
      {
        text: '拿了贴黄标的那一份。', tag: 'white',
        check: { skill: 'conceptual', diff: 12 },
        onPass: 'bento_ok', onFail: 'bento_no',
        note: '「概念化」——在「省钱」和「不至于太可怜」之间，给自己编一个理由。'
      },
      { text: '拿走最上面那一排。全价。', to: 'bento_new' },
      { text: '低头看标签上那行时间。', to: 'bento_time' },
      { text: '什么都不拿，去收银台。', to: 'counter' }
    ]
  },

  bento_ok: {
    head: '便当区 · 02:14',
    lines: [
      '你拿了贴黄标的那一份。',
      '心里那句话是这么说的：反正只是填一下，味道都一样。',
      '这句话你信了。这已经足够。'
    ],
    choices: [ { text: '去收银台。', to: 'counter' } ]
  },

  bento_no: {
    head: '便当区 · 02:14',
    epi: 'fre_2',
    lines: [
      '你拿了贴黄标的那一份，又放回去。',
      '然后你站在那排便当前面，像个审计员，开始比较日期、分量和折扣百分比。',
      '没有人看你。但你花了四分钟。',
      '你为了省三块钱，付出了四分钟。这个交易划不划算，取决于你的时间值多少钱——而这个问题今晚没有答案。'
    ],
    choices: [ { text: '去收银台。', to: 'counter' } ]
  },

  bento_new: {
    head: '便当区 · 02:14',
    epi: 'nietzsche_why',
    lines: [
      '你拿了最上面那一排。全价。',
      '这个动作里有一点说不清的东西——像是今天还值得吃一份新鲜的。'
    ],
    passives: [
      { skill: 'volition', diff: 12,
        text: '（意志）注意这个动作。你刚才替自己做了一个选择，并且没有道歉。' },
      { skill: 'authority', diff: 13,
        text: '（权威）你没有拿折扣的。你不想让今晚这件事看起来像「忍一忍就过去了」。' }
    ],
    choices: [ { text: '去收银台。', to: 'counter' } ]
  },

  bento_time: {
    head: '便当区 · 02:15',
    epi: 'montaigne_death',
    script: [
      '标签上印着两行字。',
      '上面一行是「制造」。下面一行是「消费期限」。',
      '下面那行是黑色的，比上面那行粗。它是这盒饭里唯一一件被印得最用力的事。',
      { p: { skill: 'logic', diff: 12,
        text: '（逻辑）你手上这盒饭有一个明确的、被人预先知道并印在纸上的死期。这一点上它比你清楚。' } },
      { p: { skill: 'encyclopedia', diff: 13,
        text: '（博闻）「消费期限」和「赏味期限」是两种不同的承诺。前者是关于安全的，后者是关于美好的。人们经常把这两个词弄混。' } },
      { p: { skill: 'inland', diff: 14,
        text: '（内心帝国）站在便当前面的这一刻，你忽然完全清醒了。像有人在你后脑勺吹了一口气。' } }
    ],
    choices: [
      { text: '把最下面那排推到最前面。', to: 'bento_face' },
      { text: '拿一盒全价的，去收银台。', to: 'bento_new' },
      { text: '什么都不拿，去收银台。', to: 'counter' }
    ]
  },

  bento_face: {
    head: '便当区 · 02:16',
    epi: 'beckett_try_again',
    lines: [
      '你把黄标那几盒往前提了一格。',
      '没有人会知道。也没有人因此多拿到一分钱。',
      '你做完这件事之后站在原地，手还搭在货架上。',
      '你不需要为它找一个理由。你已经很久没有做过一件没有理由的事了。'
    ],
    onEnter: function (s) { s.xp += 5; },
    choices: [
      { text: '去收银台。', to: 'counter' }
    ]
  },

  /* ---------------- 杂志架：他者 ---------------- */
  magazine: {
    head: '杂志架前 · 02:13',
    epi: 'sil_1',
    script: [
      '杂志架上有六本，其中三本是同一期的不同封面。',
      '没有人在凌晨两点会需要任何一本。',
      { p: { skill: 'encyclopedia', diff: 11,
        text: '（博闻）左边那本出了一百四十七期。这是最后一期，停刊号。' } },
      { p: { skill: 'drama', diff: 12,
        text: '（表演）你可以拿着它站一会儿。这样就有一个「在这里的理由」。' } },
      { p: { skill: 'empathy', diff: 13,
        text: '（共情）第三本被人翻过很多次。装订处已经软了。有人在这里站过很多个凌晨。' } }
    ],
    choices: [
      {
        text: '看看哪本被翻得最旧。', tag: 'white',
        check: { skill: 'empathy', diff: 12 },
        onPass: 'mag_ok', onFail: 'mag_no',
        note: '「共情」——从纸页的痕迹里，读出一个不在场的人。'
      },
      { text: '拿起那本停刊号。', to: 'mag_stop' },
      { text: '去收银台。', to: 'counter' }
    ]
  },

  mag_ok: {
    head: '杂志架前 · 02:14',
    epi: 'buber_meeting',
    lines: [
      '最旧的那本边角都卷了，是第三本。翻得最多的是中间那篇——关于一列开往北方的火车。',
      '有人在这里站过很多次，每次翻到同一页。',
      '你把那本放平了一点。',
      '你注意到自己刚才做了一件事：把一个不认识的人放得更舒服了一点。'
    ],
    passives: [
      { skill: 'inland', diff: 13,
        text: '（内心帝国）那个人今晚也醒着，在城市的某个地方。你们没有见过面，但你们摸过同一页纸。' }
    ],
    choices: [ { text: '去收银台。', to: 'counter' } ]
  },

  mag_no: {
    head: '杂志架前 · 02:14',
    lines: [
      '你翻了翻，每一本都太新了。塑封还在，纸页干硬。',
      '凌晨两点的杂志架，属于那些没有被任何人需要过的东西。'
    ],
    choices: [
      { text: '拿起那本停刊号。', to: 'mag_stop' },
      { text: '去收银台。', to: 'counter' }
    ]
  },

  mag_stop: {
    head: '杂志架前 · 02:15',
    epi: 'lu_xun_despair',
    script: [
      '封面右下角印着「终刊」两个小字，字号比刊名小很多。',
      '编者的话在第一页，很短。最后一句是：「感谢所有还在买的人。」',
      '一百四十七期。这个数字在纸上看起来很小。',
      { p: { skill: 'conceptual', diff: 12,
        text: '（概念化）停刊不是死亡。死亡是没有人再等下一期。它只是不再有下一期了。' } },
      { p: { skill: 'empathy', diff: 13,
        text: '（共情）写这句话的人，写完那天大概也在便利店买过东西。' } },
      { p: { skill: 'volition', diff: 14,
        text: '（意志）你手里拿着一个被承认了的结束。这在这个世界上不多见。' } }
    ],
    choices: [
      { text: '把它买下来。', to: 'mag_buy' },
      { text: '放回去，去收银台。', to: 'counter' }
    ]
  },

  mag_buy: {
    head: '杂志架前 · 02:16',
    epi: 'vol_2',
    lines: [
      '你把它夹在胳膊下面。',
      '一本已经停刊的杂志，明天开始就不需要任何人了。而你现在把它带回家。',
      '这个行为没有意义。所以你做得毫不犹豫。'
    ],
    choices: [ { text: '去收银台。', to: 'counter' } ]
  },

  /* ---------------- 关东煮：劳动与维持 ---------------- */
  oden: {
    head: '热食柜前 · 02:15',
    epi: 'tanikawa_alive',
    script: [
      '汤在滚。格子上面浮着一层薄薄的油光。',
      '萝卜、昆布、竹轮、鸡蛋。它们在这一格里已经待了四个小时。',
      '汤的味道很温，不浓，是那种「已经咕嘟了很久所以不再需要被注意」的味道。',
      { p: { skill: 'endurance', diff: 11,
        text: '（耐力）你的身体在劝你。它不饿，它只是想要热的东西。' } },
      { p: { skill: 'electro', diff: 12,
        text: '（电化学）买一串。就一串。它不会毁掉任何东西，它会让你好受二十分钟。' } },
      { p: { skill: 'authority', diff: 13,
        text: '（权威）这口锅从开门就没关过火。有人一直在替它加汤。你现在是被谁照顾着。' } }
    ],
    choices: [
      {
        text: '只买一串萝卜。就一串。', tag: 'white',
        check: { skill: 'volition', diff: 12 },
        onPass: 'oden_buy', onFail: 'oden_full',
        note: '「意志」——在一整锅都想要的时候，只要一样。'
      },
      { text: '买三串，再要一份汤。', to: 'oden_full' },
      { text: '只是站着闻一会儿。', to: 'oden_smell' },
      { text: '去收银台。', to: 'counter' }
    ]
  },

  oden_buy: {
    head: '热食柜前 · 02:17',
    epi: 'takuboku_hands',
    onEnter: function (s) { s.activeMods.oden = true; },
    lines: [
      '她要给你捞的时候，你说了「萝卜就好」。',
      '她捞得很准。汤从勺边滴回锅里。',
      '「要汤吗。」',
      '「要。」',
      '你端着那杯汤站在那里喝了两口。热的东西从喉咙下去的时候，身体会把肩膀放下来。'
    ],
    passives: [
      { skill: 'endurance', diff: 12,
        text: '（耐力）你今晚会睡得着。就凭这两口汤。' },
      { skill: 'empathy', diff: 13,
        text: '（共情）她刚才问你「要汤吗」的时候，声音比「袋子要吗」高一点。' }
    ],
    choices: [
      { text: '端着，去收银台。', to: 'counter' },
      { text: '再要一串鸡蛋。', to: 'oden_egg' }
    ]
  },

  oden_egg: {
    head: '热食柜前 · 02:18',
    epi: 'camus_sisyphus',
    onEnter: function (s) { s.xp += 5; },
    lines: [
      '「再要一个鸡蛋。」',
      '她说了一个字：「嗯。」',
      '捞蛋的时候她用勺背敲了一下，蛋在格里转了一圈。',
      '「蛋要泡汤吃。」她说。这是一句多余的话。她今晚说的第一句多余的话。'
    ],
    choices: [
      { text: '「好。」端着去收银台。', to: 'counter' }
    ]
  },

  oden_full: {
    head: '热食柜前 · 02:18',
    epi: 'dostoevsky_consciousness',
    onEnter: function (s) { s.activeMods.oden = true; },
    lines: [
      '三串，一份汤。她给你找了个带盖的碗。',
      '你端着这一碗东西站到窗边的高脚桌前面。',
      '这不是晚餐。这是某种仪式，只是没有人主持。',
      '吃到一半你会发现自己其实不太饿。这个发现不会影响你把它吃完。'
    ],
    passives: [
      { skill: 'pain', diff: 12,
        text: '（痛觉阈值）胃在提醒你：你今天只吃过一顿。它用的是一个很轻的语气。' }
    ],
    choices: [ { text: '吃完，去收银台。', to: 'counter' } ]
  },

  oden_smell: {
    head: '热食柜前 · 02:17',
    epi: 'weil_death',
    lines: [
      '你站着，让那口锅的热气扑在脸上。',
      '柜台后面的人没有催你。她大概知道有一种客人叫「只是闻」的。',
      '你在那里站了很久。久到热气变成了一种被领受过的东西。',
      '然后你走开了。'
    ],
    passives: [
      { skill: 'electro', diff: 13,
        text: '（电化学）你赢了这一次。它会把这一次记下来。' }
    ],
    choices: [
      { text: '走回货架那边。', to: 'inside' },
      { text: '去收银台。', to: 'counter' }
    ]
  },

  /* ---------------- 咖啡机：倦怠 ---------------- */
  coffee: {
    head: '咖啡机前 · 02:16',
    epi: 'cioran_insomnia',
    script: [
      '这台机器有一块发绿的屏幕，上面写着「请稍候」。',
      '它已经「请稍候」了很久。',
      '杯子是一小杯，纸的，上面印着一句你不想看的话。',
      { p: { skill: 'interfacing', diff: 11,
        text: '（界面操作）出水的顺序是先苦后淡。等它把最后一滴吐完，味道会好一点。' } },
      { p: { skill: 'logic', diff: 12,
        text: '（逻辑）你并不困。你已经在凌晨两点喝过咖啡了。你要的不是清醒，是某个动作。' } },
      { p: { skill: 'conceptual', diff: 13,
        text: '（概念化）这台机器卖的不是咖啡，是「还可以再撑一会儿」的许可。' } }
    ],
    choices: [
      {
        text: '按下去。', tag: 'white',
        check: { skill: 'interfacing', diff: 11 },
        onPass: 'coffee_ok', onFail: 'coffee_no',
        note: '「界面操作」——在这台机器的脾气里，找到那个正确的时刻。'
      },
      { text: '不按。只是看着它的屏幕。', to: 'coffee_look' },
      { text: '去收银台。', to: 'counter' }
    ]
  },

  coffee_ok: {
    head: '咖啡机前 · 02:18',
    epi: 'han_burnout',
    onEnter: function (s) { s.activeMods.coffee = true; },
    lines: [
      '机器开始响。先是磨的声音，然后是水流，最后是一声很轻的「咔」。',
      '你端起那杯。纸杯很烫，你要换两次手。',
      '苦、薄、有一点焦。它是这座城市凌晨最诚实的味道。',
      '喝下去之后，世界清楚了大概百分之八。这百分之八就是全部收获。'
    ],
    passives: [
      { skill: 'volition', diff: 12,
        text: '（意志）你刚给自己上了一点药。承认这件事，比假装自己只是喜欢咖啡要轻松。' }
    ],
    choices: [
      { text: '端着杯子，去收银台。', to: 'counter' },
      { text: '先在高脚桌旁站一会儿。', to: 'coffee_stand' }
    ]
  },

  coffee_no: {
    head: '咖啡机前 · 02:17',
    lines: [
      '你按早了。水流出来，颜色很淡，像茶。',
      '旁边贴着一张小纸条，是手写的：「先等灯变绿再按。」',
      '你把那杯淡的东西端起来。它还是热的。热的东西有热的东西的用处。',
      '写那张纸条的人，也在这个时间站过这里。'
    ],
    onEnter: function (s) { s.activeMods.coffee = true; },
    choices: [
      { text: '端着，去收银台。', to: 'counter' }
    ]
  },

  coffee_look: {
    head: '咖啡机前 · 02:17',
    epi: 'nietzsche_return',
    lines: [
      '你没有按。屏幕的光照在你脸上，绿的。',
      '你站在这里想一件事：如果这一分钟要重复一万次，你愿不愿意。',
      '你发现你愿意。这一分钟很简单，很安静，它什么也不要求你。',
      '然后你走开了。'
    ],
    passives: [
      { skill: 'inland', diff: 13,
        text: '（内心帝国）你刚才对着一台咖啡机做了一次伦理判断。这是今晚最有内容的一分钟。' }
    ],
    choices: [
      { text: '走回货架那边。', to: 'inside' },
      { text: '去收银台。', to: 'counter' }
    ]
  },

  coffee_stand: {
    head: '高脚桌旁 · 02:19',
    epi: 'reva_2',
    lines: [
      '高脚桌贴着玻璃，外面是雨。',
      '你站在这儿，和外面只隔一层玻璃和一盏灯。',
      '城市在玻璃上只剩下一半：亮的地方更亮，暗的地方全都被吃掉了。',
      '你把杯子放在桌沿。那一声很轻。'
    ],
    passives: [
      { skill: 'shivers', diff: 12,
        text: '（战栗）从这扇窗看出去，能看见三条街和两个红绿灯。它们今晚一直在替人做决定。' },
      { skill: 'perception', diff: 13,
        text: '（感知）玻璃上有一道水痕，从上面一直划到底。是人用指头划的。不是今晚。' }
    ],
    choices: [
      { text: '看一眼窗边那个坐着的人。', to: 'window_seat' },
      { text: '去收银台。', to: 'counter' }
    ]
  },

  /* ---------------- 冰淇淋柜：记忆 ---------------- */
  ice: {
    head: '冰淇淋柜前 · 02:16',
    epi: 'lishangyin',
    script: [
      '冰柜是卧式的，盖子是一块压花的玻璃。里面打着灯，白得有点甜。',
      '十几种。前面那一排的包装纸上都印着卡通的脸。',
      { p: { skill: 'encyclopedia', diff: 11,
        text: '（博闻）这一款的包装从九〇年代就没换过。同一个笑脸，画了三十年，颜色已经有点旧了。' } },
      { p: { skill: 'inland', diff: 12,
        text: '（内心帝国）你上一次买这个，是有人替你付钱的时候。那个人现在在别的城市。' } },
      { p: { skill: 'empathy', diff: 13,
        text: '（共情）凌晨两点买甜的东西，通常不是为了甜。是为了确认自己还剩下一点想要的东西。' } }
    ],
    choices: [
      { text: '买一支。', to: 'ice_buy' },
      { text: '掀开盖子看了一眼，又合上。', to: 'ice_look' },
      { text: '去收银台。', to: 'counter' }
    ]
  },

  ice_buy: {
    head: '冰淇淋柜前 · 02:18',
    epi: 'proust_ref',
    lines: [
      '你拿了一支。纸包装上那道折痕是新的。',
      '在柜台后面她把它扫过去的时候，冰已经在你手里开始化了。',
      '你会在走出门之前把它吃完。边走边吃，像一个刚刚从什么地方逃走的人。'
    ],
    choices: [
      { text: '去收银台。', to: 'counter' }
    ]
  },

  ice_look: {
    head: '冰淇淋柜前 · 02:17',
    epi: 'impermanent_ref',
    lines: [
      '你掀开盖子。冷气涌出来，是甜的。',
      '你看了一眼那些笑脸，然后把盖子放回去。',
      '你不需要它。你只是需要一个可以掀开的东西。'
    ],
    choices: [
      { text: '走回货架那边。', to: 'inside' },
      { text: '去收银台。', to: 'counter' }
    ]
  },

  /* ---------------- 后场门：边界 ---------------- */
  door_back: {
    head: '后场门前 · 02:17',
    epi: 'kafka_cage',
    script: [
      '门是灰色的，比店里的其他东西都旧。门上贴着一张纸：「员工专用」。',
      '纸的四个角都翘起来了，其中一角被人重新按过。',
      '门缝下面有一条光。里面有人，或者有什么东西是开着的。',
      { p: { skill: 'perception', diff: 12,
        text: '（感知）门缝下面的光在极轻微地动。有人在里面走动，走得很慢。' } },
      { p: { skill: 'halflight', diff: 13,
        text: '（半光）你身后有个人正在看你。柜台后面那个。她已经看了两秒。' } },
      { p: { skill: 'conceptual', diff: 14,
        text: '（概念化）「员工专用」这四个字的意思是：这里有一份生活，而你不属于它。' } }
    ],
    choices: [
      {
        text: '敲门。', tag: 'white',
        check: { skill: 'composure', diff: 11 },
        onPass: 'door_knock', onFail: 'door_no',
        note: '「沉着」——敲门的力度要刚好不像是来找事的。'
      },
      {
        text: '推门进去看看。', tag: 'white',
        check: { skill: 'savoir', diff: 14 },
        onPass: 'door_ok', onFail: 'door_bad',
        note: '「潇洒风度」——让这件事看起来像一件你有权做的事。'
      },
      { text: '退回去。', to: 'inside' }
    ]
  },

  door_knock: {
    head: '后场门前 · 02:18',
    epi: 'kafka_belief',
    lines: [
      '你敲了两下。',
      '里面的动静停了。停了大概四秒。',
      '然后继续。没有人来开门，没有人问「谁」。',
      '你退开一步。那扇门没有拒绝你，它只是不需要你。'
    ],
    passives: [
      { skill: 'inland', diff: 13,
        text: '（内心帝国）有一个人在里面休息，坐在地上，靠着货架。她今晚只有这四分钟。你刚才差点把它拿走。' }
    ],
    choices: [
      { text: '退回去。', to: 'inside' },
      { text: '去收银台。', to: 'counter' }
    ]
  },

  door_no: {
    head: '后场门前 · 02:18',
    lines: [
      '你敲得太用力了。声音在店里显得很大。',
      '窗边坐着的那个人抬了一下头。',
      '里面没有回应。你把手放下来，手心里有一点汗。'
    ],
    choices: [
      { text: '退回去。', to: 'inside' }
    ]
  },

  door_ok: {
    head: '后场 · 02:19',
    epi: 'lu_xun_abyss',
    lines: [
      '你推开门，走进去，像本来就该走进去一样。',
      '里面是一个两米见方的空间：一个置物架、一箱纸杯、一个正在充电的手机、一把塑料凳。',
      '灯是白的，没有灯罩。墙上钉着一张排班表。',
      '排班表上，从明天开始，那个位置是空的。'
    ],
    passives: [
      { skill: 'visual', diff: 13,
        text: '（视觉演算）排班表上一整周的同一个位置都是空白。不是请假，是没有人。' },
      { skill: 'empathy', diff: 13,
        text: '（共情）凳子上有一个坐了很久的凹痕。有人每天在这里坐着吃自己带来的饭。' }
    ],
    choices: [
      { text: '看着那张排班表，站一会儿。', to: 'door_schedule' },
      { text: '退出去。', to: 'inside' }
    ]
  },

  door_bad: {
    head: '后场门前 · 02:18',
    lines: [
      '你手搭在门上的时候，柜台那边传来一个声音。',
      '「不好意思，那边不能进。」',
      '不高，也不客气。就是一句规定。',
      '你退回去。你的耳朵有点烫——虽然你根本没有做错什么大事。'
    ],
    choices: [
      { text: '退回去。', to: 'inside' },
      { text: '转身去收银台。', to: 'counter' }
    ]
  },

  door_schedule: {
    head: '后场 · 02:20',
    epi: 'arendt_labor',
    lines: [
      '你站在排班表前面。表上有很多名字的缩写、很多划掉又重写的格子。',
      '这些格子是别人的人生长度。一格一小时。',
      '你忽然理解了为什么这扇门上要写「员工专用」：里面放着的不是杂物，是一张被排出来的生活。',
      '你走出去，把门轻轻带上。'
    ],
    onEnter: function (s) { s.flags.sawSchedule = true; },
    choices: [
      { text: '走回店里。', to: 'inside' }
    ]
  },

  /* ---------------- 公告板：共同体 ---------------- */
  board: {
    head: '公告板前 · 02:18',
    epi: 'arendt_labor',
    script: [
      '公告板上钉着七张纸。',
      '招工：夜间时段，时薪写着，联系方式写着一个手机号。',
      '走失的猫：一只黑白猫的照片，日期是三个月前。',
      '语言交换：日语换英语，周末。',
      '还有一张只有一句话：「有人在 3 月 14 日凌晨捡到一串钥匙吗。请联系我。它是我妈妈的。」',
      { p: { skill: 'encyclopedia', diff: 12,
        text: '（博闻）走失的猫那张纸用的是最便宜的打印纸。它已经被雨水泡过，又重新钉上过一次。' } },
      { p: { skill: 'empathy', diff: 13,
        text: '（共情）钥匙那张没有留照片。写的人觉得光凭一句话就够了。' } },
      { p: { skill: 'esprit', diff: 13,
        text: '（团队精神）这七张纸之间没有关系。它们唯一的共同点是：都相信会有陌生人看见。' } }
    ],
    choices: [
      {
        text: '把「钥匙」那张重新钉牢一点。', tag: 'white',
        check: { skill: 'handeye', diff: 11 },
        onPass: 'board_ok', onFail: 'board_no',
        note: '「手眼协调」——按住图钉，别把纸撕破。'
      },
      { text: '把七张都读一遍。', to: 'board_read' },
      { text: '走回货架那边。', to: 'inside' }
    ]
  },

  board_ok: {
    head: '公告板前 · 02:19',
    epi: 'zhangdai_fool',
    lines: [
      '你把那颗图钉重新按进去。按到一半的时候纸滑了一下，你换了个角度。',
      '现在那行字是平的。',
      '你没有留联系方式。你只是让一件事比刚才更不容易掉下来。'
    ],
    passives: [
      { skill: 'volition', diff: 12,
        text: '（意志）这件事不会有人知道。这就是它值得做的原因。' }
    ],
    choices: [
      { text: '走回货架那边。', to: 'inside' },
      { text: '去收银台。', to: 'counter' }
    ]
  },

  board_no: {
    head: '公告板前 · 02:19',
    lines: [
      '你按下去的时候纸破了。',
      '一个小小的口子，在「钥匙」两个字旁边。',
      '你把它抚平，看起来还是破了。',
      '你退开半步，看它两秒，然后走开。'
    ],
    passives: [
      { skill: 'conceptual', diff: 13,
        text: '（概念化）你想修好一件事，结果留下了一个新的痕迹。这是你在所有事情上的平均水平。' }
    ],
    choices: [
      { text: '走回货架那边。', to: 'inside' },
      { text: '去收银台。', to: 'counter' }
    ]
  },

  board_read: {
    head: '公告板前 · 02:20',
    epi: 'montaigne_know',
    lines: [
      '你从左上读到右下。七张纸，七种请求，没有一个和你有关。',
      '你在最后一张前面停了久一点：有人在找一间可以养猫的房子，租金写得比市场价低，括号里写着「它可以睡阳台」。',
      '这张纸的边角写着一个小小的日期，是昨天。',
      '这些纸每几天就会被换掉一批。有人一直在钉，也一直有人在揭。'
    ],
    passives: [
      { skill: 'inland', diff: 13,
        text: '（内心帝国）这座城市在你不知道的地方，一直在小声地互相求助。它从不出声，它只是钉纸。' }
    ],
    choices: [
      { text: '走回货架那边。', to: 'inside' },
      { text: '去收银台。', to: 'counter' }
    ]
  },

  /* ---------------- 收银台旁的书堆 ---------------- */
  shelf: {
    head: '收银台旁 · 02:20',
    epi: 'vol_2',
    script: [
      '收银台旁边的窗台上摞着一叠书，都是平装本，书脊上贴着已经褪色的价签。',
      '不是卖的书。是有人放在这里，供人翻的。',
      { p: { skill: 'encyclopedia', diff: 12,
        text: '（博闻）这些都是同一家旧书店的库存。它们的书脊上有同一种褪色的胶带。' } },
      { p: { skill: 'empathy', diff: 12,
        text: '（共情）最上面那本的书页间夹着一张收据，是别人的，一直没有人拿出来。' } },
      { p: { skill: 'conceptual', diff: 13,
        text: '（概念化）这一摞东西是一间不收钱的图书馆。它的门禁是：你得在凌晨两点还醒着。' } }
    ],
    choices: [
      {
        text: '一本一本看它们的扉页。', tag: 'white',
        check: { skill: 'encyclopedia', diff: 13 },
        onPass: 'shelf_ok', onFail: 'shelf_no',
        note: '「博闻」——从版式、纸张和印次里，认出这些书各自的来路。'
      },
      { text: '把那本被翻得最旧的抽出来。', to: 'shelf_worn' },
      { text: '一本一本看它们各自被谁写过什么。', to: 'shelf_list' },
      { text: '走回货架那边。', to: 'inside' },
      { text: '去收银台。', to: 'counter' }
    ]
  },

  shelf_list: {
    head: '收银台旁 · 02:24',
    epi: 'cioran_failure',
    script: [
      '你把它们摊在窗台上。八本，八种旧法。',
      { t: '第一本的书名是《公社万岁》，扉页有一句被铅笔画了两道线：', cls: 'flat' },
      { t: '历史会原谅我们。这是唯一还没有被证明为假的承诺。', cls: 'verse', ref: 'commu_2' },
      { t: '第二本是小说，叫《不眠之夜》。开头第一句是：', cls: 'flat' },
      { t: '他在天花板上数裂纹，数到第四十三条的时候，天亮了。他给这一夜起了个名字，叫事业。', cls: 'verse', ref: 'reva_1' },
      { t: '第三本是讲时间的，页边有人写着「高利贷」三个字：', cls: 'flat' },
      { t: '过去的重量不在于它发生过，而在于你还在替它付款。', cls: 'verse', ref: 'vol_2' },
      { t: '第四本是关于自由的，那一页被水泡过，字迹晕开：', cls: 'flat' },
      { t: '最重的镣铐是那种你亲手锻造、还替自己解释过理由的。', cls: 'verse', ref: 'fre_2' },
      { t: '第五本是《雨声注释》，扉页上只有一行：', cls: 'flat' },
      { t: '雨声是一种语言，它只说一件事：这里没有人需要你，你可以放心地待着。', cls: 'verse', ref: 'lom_1' },
      { p: { skill: 'encyclopedia', diff: 13,
        text: '（博闻）这四本都出自同一家已经倒闭的出版社，印量都很小。它们在那家旧书店的书架上躺了很久，最后被搬到了收银台旁边。' } },
      { p: { skill: 'conceptual', diff: 13,
        text: '（概念化）有人把这些书挑出来放在这里，是因为它们都同一个题目：在一个不值得的时刻，怎么办。' } },
      { p: { skill: 'inland', diff: 14,
        text: '（内心帝国）这一摞不是书。这是某个人留给凌晨两点的陌生人的一封信，写在八本书里面。' } },
      { aside: '其中一本的定价用铅笔改过三次。改到最后没有人再卖它了，所以它才在这里。' }
    ],
    choices: [
      { text: '把最上面那本带走。', to: 'shelf_take' },
      { text: '把书摆回原来的顺序，去收银台。', to: 'counter' },
      { text: '走回货架那边。', to: 'inside' }
    ]
  },

  shelf_take: {
    head: '收银台旁 · 02:26',
    epi: 'wittgenstein_limit',
    lines: [
      '你拿了最上面那本。是那本关于自由的。',
      '它的封面很旧，书脊上有一条折痕，说明它被翻开过很多次，而且每次都被压在某一个固定的位置。',
      '你把它夹在胳膊下面。',
      '你不知道你会不会读它。你只是不想让它在今晚之后还留在这里。'
    ],
    choices: [
      { text: '去收银台。', to: 'counter' },
      { text: '带着它去窗边坐下。', to: 'window_seat' }
    ]
  },

  shelf_ok: {
    head: '收银台旁 · 02:22',
    epi: 'shelley_ref',
    script: [
      '你一本一本翻开，只看第一页和第二页。每一本都有别人的痕迹：折角、铅笔线、被压平的糖纸。',
      '其中一本的扉页上写着一行字，字很小：「给还没有决定要不要活下去的人。」',
      '下面没有署名，也没有第二行。',
      { p: { skill: 'inland', diff: 14,
        text: '（内心帝国）写这行字的人，现在大概在别的城市，做着别的事，并且已经忘了自己写过它。' } },
      { p: { skill: 'volition', diff: 13,
        text: '（意志）这一行字今晚只对一个人生效，而那个人刚好翻开它。这件事发生的概率很低，但它发生了。' } }
    ],
    choices: [
      { text: '把它放回原处，去收银台。', to: 'counter' },
      { text: '把那本带到窗边去读。', to: 'window_seat' }
    ]
  },

  shelf_no: {
    head: '收银台旁 · 02:21',
    lines: [
      '你翻了四本，没有找到任何东西。都是很普通的旧书，印次普通，纸张普通。',
      '第五本的时候你停下了——不是因为发现了什么，是因为你忽然意识到自己在找什么。',
      '你把书放回去。'
    ],
    passives: [
      { skill: 'conceptual', diff: 13,
        text: '（概念化）你在找一句能替你说话的话。这是所有人翻开别人的书时都在做的事。' }
    ],
    choices: [
      { text: '走回货架那边。', to: 'inside' },
      { text: '去收银台。', to: 'counter' }
    ]
  },

  shelf_worn: {
    head: '收银台旁 · 02:22',
    epi: 'train_north',
    lines: [
      '最旧的那本是《开往北方的列车》。封面是一张照片，站台的灯是黄的。',
      '你翻开第一页：「列车开往北方。车上的人都不说话，因为他们要去的地方不需要语言。」',
      '你要到后面才会看到那句：「有人问：北方有什么？列车员说：北方有北方。这就是全部答案。」',
      '你把书合上，又打开。中间那几页被翻得最软。'
    ],
    passives: [
      { skill: 'inland', diff: 13,
        text: '（内心帝国）这个书名你听过。有人说这是本烂书。烂书也有人在凌晨两点翻它，并且翻了很多次。' }
    ],
    choices: [
      { text: '去收银台。', to: 'counter' },
      { text: '带着它去窗边坐下来读。', to: 'window_seat' }
    ]
  }
};

/* 本卷用到的内联引文 */
DE.REF.proust_ref = {
  t: '记忆不是在回忆里被找到的，是被一种味道、一种温度突然撞开的。',
  who: '（原型自拟，关于普鲁斯特的转述）', src: '—', exact: false, tag: '记忆'
};
DE.REF.impermanent_ref = {
  t: '你不需要它。你只是需要一个可以掀开的东西。这就是夜里大部分欲望的形状。',
  who: '卡布林·维达', src: '《夜班神学》', real: false, tag: '欲望'
};
DE.REF.shelley_ref = {
  t: '给还没有决定要不要活下去的人。',
  who: '（书中扉页的无名题词）', src: '—', real: false, tag: '题词'
};
