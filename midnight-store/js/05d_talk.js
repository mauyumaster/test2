/* ===========================================================
   05d_talk.js  ——  第四卷 · 收银台
   与她对话。三轮问答不是三个按钮，而是三种问法：
   问得轻、问得准、问得太重，她会给出完全不同的东西。
   精神内景里同意过的声音，会在这里变成额外的选项（req）。
   =========================================================== */

window.DE = window.DE || {};

DE.NODES_TALK = {

  /* ---------------- 第一轮 ---------------- */
  counter: {
    head: '收银台 · 02:26',
    epi: 'kabu_2',
    script: [
      '你把东西放在台面上。她抬起头，说：「袋子要吗。」',
      '她的声音比你以为的低。眼睛下面有很淡的一层青。',
      '扫码器亮着一条红线，在等下一件东西。',
      { p: { skill: 'perception', diff: 11,
        text: '（感知）她左手食指内侧有一道新划痕。她注意到了你在看，把手收了下去。' } },
      { p: { skill: 'empathy', diff: 11,
        text: '（共情）「袋子要吗」是她今晚说的第几遍？她已经不用想了。' } },
      { p: { skill: 'inland', diff: 13,
        text: '（内心帝国）你站在这里的时间，比她今晚接待过的任何一个人都长。她已经注意到这件事了。' } },
      { aside: '台面下面有一块磨白的区域，是她每天站的位置。' }
    ],
    choices: [
      {
        text: '「不用袋子。另外——你还好吗？」', tag: 'white',
        check: { skill: 'rhetoric', diff: 12 },
        onPass: 'sm_ok', onFail: 'sm_no',
        note: '「修辞」——把这句突兀的关心，包装成不像在打听什么的样子。'
      },
      {
        text: '「这么晚还一个人，怕不怕？」', tag: 'white',
        check: { skill: 'drama', diff: 13 },
        onPass: 'jk_ok', onFail: 'jk_no',
        note: '「表演」——用玩笑的语气说一句真的话。演砸了就是冒犯。'
      },
      {
        text: '「你在读什么？」', tag: 'white',
        check: { skill: 'empathy', diff: 11 },
        onPass: 'reading_ok', onFail: 'reading_no',
        note: '「共情」——问一件她可以安全回答的事，先给她一个台阶。'
      },
      { text: '接过袋子，说谢谢。', to: 'quiet' },
      { text: '什么也不说，扫码付款。', to: 'pay' },
      {
        text: '「我今晚不是来买东西的。」', tag: 'white',
        check: { skill: 'inland', diff: 12 },
        onPass: 'confess', onFail: 'confess_bad',
        req: function (s) { return !!s.flags.agree_empire; },
        reqNote: '需要在精神内景里同意过「内心帝国」——让今晚的走向交给别人先开口。',
        note: '「内心帝国」——把一句没法解释的话，直接放在台面上。'
      },
      {
        text: '「你明天不来了吧。」', tag: 'white',
        check: { skill: 'empathy', diff: 13 },
        onPass: 'direct_ok', onFail: 'direct_no',
        req: function (s) { return !!s.flags.agree_empathy; },
        reqNote: '需要在精神内景里同意过「共情」——承认自己一直在替别人累。',
        note: '「共情」——直接跳过所有铺垫。要么命中，要么伤人。'
      }
    ]
  },

  /* ---------------- 安全的问题 ---------------- */
  reading_ok: {
    head: '收银台 · 02:27',
    epi: 'soseki_heart',
    onEnter: function (s) { s.flags.asked_reading = true; s.xp += 5; },
    script: [
      '她把书合上，翻过来给你看封面。是一本短篇集，书脊已经裂了。',
      '「看很多次了，」她说，「看熟了就不费脑子。」',
      '「这句我每次都会看两遍。」她指了一行。',
      '那行写的是一个女人在等一班车。等了很久，最后没有上车。',
      { p: { skill: 'empathy', diff: 12,
        text: '（共情）她指这句的时候，拇指压在「没有上车」四个字上。' } },
      { p: { skill: 'conceptual', diff: 13,
        text: '（概念化）「看熟了就不费脑子」——这是很多人重读一本书的真正原因。他们要的不是内容，是熟悉。' } },
      { p: { skill: 'encyclopedia', diff: 13,
        text: '（博闻）这本书的版本很旧，定价还是两位数的年代。它比她年纪大。' } }
    ],
    choices: [
      { text: '「最后她为什么没有上车？」', to: 'talk_1' },
      { text: '「谢谢。」把东西收好。', to: 'talk_1' },
      { text: '「你在这里读了很久吧。」', to: 'shift' }
    ]
  },

  reading_no: {
    head: '收银台 · 02:27',
    lines: [
      '「随便看看。」',
      '她把书往下压了压，压到台面以下，让你看不见封面。',
      '这个动作很轻，很熟练。她做过很多次。',
      '你意识到你刚才问的是一个她不想被问的问题——不是因为隐私，是因为那本书是她今晚唯一剩下的东西。'
    ],
    passives: [
      { skill: 'empathy', diff: 13,
        text: '（共情）她把书压下去的时候，眼睛没有跟着动。她在保护它，不是躲你。' }
    ],
    choices: [
      { text: '「那我看看这本吧。」指指台上那摞书。', to: 'talk_1' },
      { text: '「抱歉。」', to: 'talk_1' },
      { text: '付钱，离开。', to: 'end_bought' }
    ]
  },

  shift: {
    head: '收银台 · 02:27',
    epi: 'kabu_1',
    onEnter: function (s) { s.flags.asked_shift = true; s.xp += 5; },
    lines: [
      '「到六点，」她说，「六点接班的那个来了我就走。」',
      '「她每次都迟到十分钟。我已经不算了。」',
      '「其实也行。多十分钟少十分钟，天都是从黑到亮。」'
    ],
    passives: [
      { skill: 'logic', diff: 12,
        text: '（逻辑）「我已经不算了」是一句精确的话。她不是不在乎，她是把这件事从账本上划掉了。' },
      { skill: 'endurance', diff: 13,
        text: '（耐力）六点。还有三小时三十三分钟。你算的时候没有告诉她。' }
    ],
    choices: [
      { text: '「那你打算什么时候不干了？」', to: 'talk_1' },
      { text: '「六点我来接你。」', to: 'joke_6' },
      { text: '付钱，离开。', to: 'end_bought' }
    ]
  },

  joke_6: {
    head: '收银台 · 02:28',
    epi: 'dazai_disqualified',
    lines: [
      '她看了你一眼。',
      '「你知道我是谁吗。」',
      '「不知道。」',
      '「那你接我干什么。」',
      '她把最后一样东西扫过，报了个数。她还在笑，但笑的是刚才那句话。'
    ],
    choices: [
      { text: '「那现在开始知道。」', to: 'talk_1' },
      { text: '付钱。', to: 'end_bought' }
    ]
  },

  /* ---------------- 精神内景解锁的两条路 ---------------- */
  confess: {
    head: '收银台 · 02:27',
    epi: 'sartre_choice',
    onEnter: function (s) { s.flags.confessed = true; s.xp += 10; },
    script: [
      '「我今晚不是来买东西的。」',
      '你说完，扫码器的红线在台面上空转着。',
      '她没有笑，也没有说「那你来干什么」。她只是把手从扫码器上拿下来，放在台面上。',
      '「那你要什么。」',
      '这是一个真的问题。她问得很轻，因为她不知道你会不会答。',
      { p: { skill: 'volition', diff: 13,
        text: '（意志）现在轮到你。你已经把最假的那句话说出去了，剩下的只能是真的。' } },
      { p: { skill: 'inland', diff: 13,
        text: '（内心帝国）她今晚也一直在等一个不是来买东西的人。这就是为什么她没有笑。' } }
    ],
    choices: [
      { text: '「不知道。站一会儿。」', to: 'talk_1' },
      { text: '「有人说话。」', to: 'talk_1' },
      { text: '「随便什么。你手上的东西给我扫码。」', to: 'talk_1' }
    ]
  },

  confess_bad: {
    head: '收银台 · 02:27',
    lines: [
      '「我今晚不是来买东西的。」',
      '这句话说出口的时候是歪的。你听见了它的形状——它像一句台词，不像一句真话。',
      '她抬起眼睛看你，然后把扫码器重新拿起来。',
      '「那你要买什么。」',
      '她给了你一个退路。也收回了一个可能性。'
    ],
    choices: [
      { text: '「就这些。」', to: 'talk_1' },
      { text: '付钱，离开。', to: 'end_bought' }
    ]
  },

  direct_ok: {
    head: '收银台 · 02:27',
    epi: 'sil_2',
    onEnter: function (s) { s.flags.directSaid = true; s.xp += 10; },
    script: [
      '「你明天不来了吧。」',
      '她的手停在扫码器上。停了三秒。',
      '「谁说的。」',
      '「没有人说。你手上那张手写的纸条，写了四个下周了。」',
      '她把纸条从工牌上撕下来，放在台面上，没有揉，也没有丢。',
      '「明天是最后一天，」她说，「排班表上已经没我了。」',
      { p: { skill: 'empathy', diff: 12,
        text: '（共情）她刚才三秒里想的不是「你怎么知道」，是「终于有人问了」。' } },
      { p: { skill: 'esprit', diff: 13,
        text: '（团队精神）她今晚对你说的话，比她对这十一个月里所有人说的话加起来都多。' } }
    ],
    choices: [
      { text: '「那明天我来。」', to: 'truth' },
      { text: '「谢谢你这十一个月。」', to: 'talk_1' },
      { text: '什么也不说，把东西付了。', to: 'end_bought' }
    ]
  },

  direct_no: {
    head: '收银台 · 02:27',
    lines: [
      '「你明天不来了吧。」',
      '她说：「你怎么知道。」',
      '这句话里没有惊讶，只有一点被冒犯的东西。',
      '「我明天来。」她说，然后把你的东西扫过。她报了一个数。'
    ],
    choices: [
      { text: '「好。」付钱。', to: 'end_bought' },
      { text: '「我不是那个意思。」', to: 'talk_1' }
    ]
  },

  /* ---------------- 第二轮：三轮递进 ---------------- */
  talk_1: {
    head: '收银台 · 02:30',
    epi: 'kabu_1',
    onEnter: function (s) { s.flags.talked_1 = true; },
    script: [
      '她说她在这里做了十一个月，本来只打算做三个月。',
      '「因为离住的地方近。」她说完自己先笑了，「其实也没多近。走过去要二十二分钟。」',
      '「我起初是记时间的。后来不记了。」',
      { p: { skill: 'esprit', diff: 12,
        text: '（团队精神）她在说给谁听？凌晨两点，她需要一个会把这句话听完的人。' } },
      { p: { skill: 'inland', diff: 13,
        text: '（内心帝国）你和她之间隔着这台机器，可你们站在同一边——都在拖时间。' } },
      { p: { skill: 'logic', diff: 14,
        text: '（逻辑）「三个月」和「十一个月」之间差的八个月，不是任何人的决定。它是没被决定出来的。' } }
    ],
    choices: [
      {
        text: '「那你打算什么时候走？」', tag: 'white',
        check: { skill: 'empathy', diff: 13 },
        onPass: 'truth', onFail: 'retreat',
        note: '「共情」——这个问题必须问得刚好轻，才不会被当成审问。'
      },
      { text: '「你的名牌上是手写的字。」', to: 'name' },
      { text: '「那二十二分钟你怎么走的？」', to: 'walk_home' },
      { text: '「谢谢。」拿上东西走。', to: 'pay' }
    ]
  },

  walk_home: {
    head: '收银台 · 02:31',
    epi: 'reva_1',
    onEnter: function (s) { s.xp += 5; },
    lines: [
      '「走小路，」她说，「有一条巷子，可以少走四分钟。」',
      '「巷子里有一家做夜间外卖的。每天这个点都在炸东西。闻着就饱了。」',
      '「有一次我看见他们家的猫蹲在油锅旁边的窗台上。那个猫一点也不怕油。」',
      '她说到这里停了一下，好像在核对这段记忆是不是自己的。',
      '「就这些。没什么好说的。」'
    ],
    passives: [
      { skill: 'shivers', diff: 13,
        text: '（战栗）那条巷子今晚也在炸东西。味道还在往上飘，穿过雨，一直飘到这条街上。' },
      { skill: 'empathy', diff: 13,
        text: '（共情）「闻着就饱了」——她说的不是香，她说的是「我没有在那里买过东西」。' }
    ],
    choices: [
      { text: '「那条巷子我也走过。」', to: 'talk_2' },
      { text: '「猫现在还蹲在那儿吗。」', to: 'talk_2' },
      { text: '「谢谢。」拿上东西走。', to: 'pay' }
    ]
  },

  name: {
    head: '收银台 · 02:31',
    epi: 'soseki_moon',
    onEnter: function (s) { s.flags.asked_name = true; },
    lines: [
      '她低头看了一眼那张手写纸条。',
      '「原来的那个是上一任的，」她说，「店长说新的下周到。已经说了四个下周。」',
      '她把纸条按平了一下，又让它翘回去。'
    ],
    passives: [
      { skill: 'empathy', diff: 11,
        text: '（共情）她不是在说名牌。她是在说「我随时可以不在」。' },
      { skill: 'conceptual', diff: 13,
        text: '（概念化）在一张纸上写自己的名字，是为了替代一个印好的名字。而那个印好的名字属于一个已经离开的人。' }
    ],
    choices: [
      { text: '「那你叫什么？」', to: 'talk_name' },
      { text: '「那你打算什么时候走？」', to: 'truth_soft' },
      { text: '付钱，离开。', to: 'end_bought' }
    ]
  },

  talk_name: {
    head: '收银台 · 02:32',
    epi: 'pessoa_orchestra',
    onEnter: function (s) { s.xp += 5; },
    lines: [
      '她说了两个字。发音很短，尾音有一点上扬。',
      '「你记不住的，」她说，「凌晨两点听到的名字，第二天早上就没了。」',
      '「我记不住，」她说，「别人的名字我也记不住。」'
    ],
    passives: [
      { skill: 'inland', diff: 13,
        text: '（内心帝国）你记住了。你会记得很久。这件事你今晚不会告诉她。' }
    ],
    choices: [
      { text: '「我记得住。」', to: 'talk_2' },
      { text: '「那就不记。反正你明天还来。」', to: 'talk_2' },
      { text: '付钱，离开。', to: 'end_bought' }
    ]
  },

  truth_soft: {
    head: '收银台 · 02:32',
    epi: 'kierkegaard_anxiety',
    lines: [
      '「那你打算什么时候走？」',
      '她说：「不知道。」',
      '这一次的「不知道」和上一次不一样。上一次是一扇门，这一次是一句真话。',
      '「我一直想有一天走进来，然后跟他们说我不干了。但我没有准备好那句话。」',
      '「"我不干了"这四个字，说出来会是什么声音，我试过很多次。」'
    ],
    onEnter: function (s) { s.xp += 5; },
    choices: [
      { text: '「那我们一起试一次。」', to: 'talk_2' },
      { text: '「那你现在试。」', to: 'talk_2' },
      { text: '付钱，离开。', to: 'end_bought' }
    ]
  },

  talk_2: {
    head: '收银台 · 02:34',
    epi: 'heidegger_thrown',
    onEnter: function (s) { s.flags.talked_2 = true; },
    script: [
      '她问你是做什么的。',
      '你说了。她「哦」了一声，然后过了几秒才接话——她在真的想这件事。',
      '「那也挺没意思的吧。」她说，「我是说，跟我这个一样。」',
      { p: { skill: 'empathy', diff: 12,
        text: '（共情）「跟我这个一样」是她今晚第一次承认自己的是「没意思的」。这是信任的形状。' } },
      { p: { skill: 'conceptual', diff: 13,
        text: '（概念化）两个陌生人互相承认生活没意思，比互相鼓励要亲密得多。' } },
      { p: { skill: 'pain', diff: 13,
        text: '（痛觉阈值）你的手腕还提着一袋东西。你已经忘了它的重量。' } }
    ],
    choices: [
      {
        text: '「那你打算什么时候走？」', tag: 'white',
        check: { skill: 'volition', diff: 13 },
        onPass: 'truth', onFail: 'retreat',
        note: '「意志」——问出口，并且不把问题收回来。'
      },
      { text: '「你为什么做夜班？」', to: 'why_night' },
      { text: '「我该走了。」', to: 'pay' }
    ]
  },

  why_night: {
    head: '收银台 · 02:35',
    epi: 'cioran_born',
    onEnter: function (s) { s.flags.asked_whynight = true; s.xp += 5; },
    script: [
      '「白班人多。」她说。',
      '「人多就要说话。夜班不用。」',
      '「而且夜里没人看见你在干什么。你可以一边上班一边想别的事，也没有人会说你。」',
      { t: '「想什么别的事？」你问。', cls: 'flat' },
      '她想了想。「想一些没用的。」',
      '「比如？」',
      '「比如，我为什么在这里。」她把这句话说得很平，像在报一个商品的价钱。',
      { p: { skill: 'inland', diff: 13,
        text: '（内心帝国）她说这句的时候看着门外的雨，不是在看你。她是在对着雨说。' } },
      { p: { skill: 'empathy', diff: 14,
        text: '（共情）她刚才把今晚最重要的一句话当成了一句闲话。她一直都是这么处理的。' } }
    ],
    choices: [
      { text: '「我也在想这个。」', to: 'talk_3' },
      { text: '「那你想出来了吗。」', to: 'talk_3' },
      { text: '「谢谢你跟我说这个。」', to: 'talk_3' }
    ]
  },

  talk_3: {
    head: '收银台 · 02:37',
    epi: 'gushi_nineteen',
    onEnter: function (s) { s.flags.talked_3 = true; },
    script: [
      '自动门开了。没有人进来。是风吹的，或者感应器自己抽了一下。',
      '外面的雨声涌进来两秒，又被关掉。',
      '她说：「你听。」',
      '「半夜的雨声跟白天的是一样的。但半夜听起来像有人在旁边。」',
      { p: { skill: 'shivers', diff: 12,
        text: '（战栗）她说对了。现在这个雨声就在你们两个人中间。' } },
      { p: { skill: 'volition', diff: 14,
        text: '（意志）她刚才不是在说雨。她是在告诉你，她这十一个月是怎么过来的。' } },
      { p: { skill: 'inland', diff: 15,
        text: '（内心帝国）现在，如果有一句话要说，就是现在。再往后就是天亮，天亮以后这句话的重量会不一样。' } }
    ],
    choices: [
      {
        text: '「我也一样。」', tag: 'red',
        check: { skill: 'volition', diff: 14 },
        onPass: 'end_together', onFail: 'end_unsaid',
        note: '红色检定——只有一次机会。这一句说出口，今晚就再也不是随便一个晚上。'
      },
      {
        text: '「那你打算什么时候走？」', tag: 'white',
        check: { skill: 'empathy', diff: 13 },
        onPass: 'truth', onFail: 'retreat'
      },
      { text: '「……祝你顺利。」', to: 'end_walked' },
      { text: '什么也不说，把东西付了。', to: 'end_bought' }
    ]
  },

  retreat: {
    head: '收银台 · 02:41',
    epi: 'kafka_road',
    lines: [
      '你说完那句，她抬起眼睛，看你一秒。',
      '就一秒。然后她把目光收回去，手重新落在扫码器上。',
      '「不知道。」她说。这个「不知道」是一扇关上的门。',
      '扫码器响了一声。你的东西已经被扫完了。'
    ],
    passives: [
      { skill: 'empathy', diff: 13,
        text: '（共情）她关上的不是对你的门，是那个话题的门。她自己也不想进去。' }
    ],
    choices: [
      { text: '付钱，离开。', to: 'end_bought' },
      { text: '再问一次。', to: 'retry_q' }
    ]
  },

  retry_q: {
    head: '收银台 · 02:42',
    epi: 'beckett_try_again',
    lines: [
      '「刚刚那问题，」你说，「你不想说也没关系。」',
      '「不是不想说。」她说，「是说了也没用。」',
      '「你要走了，我要走了。说完这句，明天还是这样。」',
      '她把找零推过来。硬币在台面上滑了一下，停住。'
    ],
    choices: [
      { text: '「那至少今天不一样。」', to: 'truth' },
      { text: '把零钱收起来，离开。', to: 'end_bought' }
    ]
  },

  /* ---------------- 真相与红检定 ---------------- */
  truth: {
    head: '收银台 · 02:44',
    epi: 'montaigne_death',
    script: [
      '她停下来，手撑在台面上，看着门外的雨。',
      '「明天。」她说，「明天是我最后一天。其实今天是。明天排班表上已经没有我了。」',
      '「我本来想的是，最后一天要是有个客人跟我说句什么，我就……」',
      '她没说完。',
      { p: { skill: 'volition', diff: 14,
        text: '（意志）现在。你要么说点什么，要么把这一秒也浪费掉。这一秒不会回来。' } },
      { p: { skill: 'inland', diff: 15,
        text: '（内心帝国）你早就知道会这样。你站在门口的时候就知道——你今晚不是来买东西的。' } },
      { p: { skill: 'empathy', diff: 13,
        text: '（共情）她把没说完的那半句留在空气里，不是忘了，是留着给你接。' } }
    ],
    choices: [
      {
        text: '「我也一样。」', tag: 'red',
        check: { skill: 'volition', diff: 14 },
        onPass: 'end_together', onFail: 'end_unsaid',
        note: '红色检定——只有一次机会。这一句说出口，今晚就再也不是随便一个晚上。'
      },
      { text: '「……祝你顺利。」', to: 'end_walked' },
      { text: '「你本来想的是什么？」', to: 'truth_2' },
      {
        text: '「我不走了。我在这儿坐到天亮。」',
        to: 'end_stay',
        req: function (s) { return (s.flags.mindVoices || 0) >= 3; },
        reqNote: '需要在精神内景里至少听懂三个声音——只有听懂了的人，才会把「坐着」当成一个选择。'
      },
      { text: '什么也不说，把东西付了。', to: 'end_bought' }
    ]
  },

  truth_2: {
    head: '收银台 · 02:45',
    epi: 'rilke_questions',
    lines: [
      '「本来想的。」她重复了一遍，像在检查这个说法成不成立。',
      '「本来想的是，有人会问我一句『你叫什么』。」',
      '「然后就这一句就够了。我就把那句话说出去。」',
      '「结果这十一个月，没有人问过。」',
      '她看了一眼台面上那本合着的书。'
    ],
    passives: [
      { skill: 'empathy', diff: 13,
        text: '（共情）而今晚有人问了。这就是为什么她刚才停了三秒。' },
      { skill: 'volition', diff: 14,
        text: '（意志）你手里已经有那把钥匙了。她在等你用它。' }
    ],
    choices: [
      {
        text: '「我也一样。」', tag: 'red',
        check: { skill: 'volition', diff: 15 },
        onPass: 'end_together', onFail: 'end_unsaid',
        note: '红色检定（难度更高：你已经用过一次机会，这一次代价更大）。'
      },
      { text: '「……祝你顺利。」', to: 'end_walked' },
      { text: '付钱，离开。', to: 'end_bought' }
    ]
  },

  /* ---------------- 沉默的两条 ---------------- */
  quiet: {
    head: '收银台 · 02:28',
    epi: 'hume_ref',
    lines: [
      '你接过袋子，说谢谢。',
      '「谢。」她说，然后是收银机弹出的声音。',
      '你走到门口，自动门先你一步打开。'
    ],
    passives: [
      { skill: 'inland', diff: 12,
        text: '（内心帝国）你刚才有那么一瞬间想说什么。它已经过去了。' }
    ],
    choices: [
      { text: '走出去。', to: 'end_bought' },
      { text: '在门口停一下，回头。', to: 'quiet_back' }
    ]
  },

  quiet_back: {
    head: '门口 · 02:29',
    epi: 'baudelaire_crowd',
    lines: [
      '你回头。',
      '她已经低下头，重新翻开那本书。翻到的是原来那一页。',
      '她没有抬头。她大概知道你会回头，也知道你不会说话。',
      '你走出去。'
    ],
    choices: [
      { text: '走出去。', to: 'end_bought' }
    ]
  },

  pay: {
    head: '收银台 · 02:30',
    epi: 'tillich_courage',
    lines: [
      '扫码的滴声之后，是找零、小票、袋子摩擦的声音。',
      '「谢谢光临。」她说。这是她今晚说的第几遍，她自己也不知道。',
      '小票上印着时间：02:30。下面一行是流水号。再下面一行是「感谢惠顾」。'
    ],
    choices: [
      { text: '走出去。', to: 'end_bought' },
      { text: '再说一句。', to: 'pay_say' }
    ]
  },

  pay_say: {
    head: '收银台 · 02:31',
    epi: 'fromm_free',
    lines: [
      '「这家店开到几点？」',
      '「二十四小时。」',
      '「那你呢。」',
      '她笑了一下，很短：「我又不是店。」',
      '然后她把小票递给你。'
    ],
    choices: [
      { text: '「明天见。」', to: 'talk_1' },
      { text: '走出去。', to: 'end_bought' }
    ]
  },

  /* ---------------- 冲突的两条 ---------------- */
  sm_ok: {
    head: '收银台 · 02:28',
    epi: 'kabu_2',
    lines: [
      '她说：「还行。」停了一下，又说：「你是今晚第二个问我这个的人。」',
      '「第一个是个喝醉的大叔，问完就在门口吐了。」',
      '她笑了一下。不是礼貌的那种。'
    ],
    passives: [
      { skill: 'empathy', diff: 12,
        text: '（共情）她已经很久没有对一个陌生人笑过了。她自己大概也是刚刚才意识到。' },
      { skill: 'drama', diff: 13,
        text: '（表演）她现在在给你一个位置：一个可以继续说话的位置。这个位置是她让出来的。' }
    ],
    choices: [ { text: '顺着说下去。', to: 'talk_1' }, { text: '到此为止，付钱。', to: 'pay' } ]
  },

  sm_no: {
    head: '收银台 · 02:28',
    epi: 'sartre_badfaith',
    lines: [
      '「不用袋子。另外——你还好吗？」',
      '这句话落地的时候，你听见了它有多重。她抬起眼睛看你，像在核对一张不该出现的单据。',
      '「……好。」她说。然后她低下头，把东西一个个扫过。'
    ],
    passives: [
      { skill: 'inland', diff: 13,
        text: '（内心帝国）你刚才越过的不是她的防线，是她今晚给自己划的那条线：不问，也不想。' }
    ],
    choices: [
      { text: '付钱，离开。', to: 'end_bought' },
      { text: '「我知道这有点冒犯。」', to: 'talk_1' }
    ]
  },

  jk_ok: {
    head: '收银台 · 02:28',
    epi: 'nightshift_ref',
    lines: [
      '她说：「怕。」',
      '「怕的是三点半以后。三点以后就没有人了，只有关东煮在响。」',
      '她用手指敲了敲台面：「你笑起来像也没睡过。」'
    ],
    passives: [
      { skill: 'halflight', diff: 12,
        text: '（半光）她说「怕」的时候，手指压在台面上。她在按着某个东西。' }
    ],
    choices: [ { text: '顺着说下去。', to: 'talk_1' }, { text: '到此为止，付钱。', to: 'pay' } ]
  },

  jk_no: {
    head: '收银台 · 02:28',
    epi: 'sartre_hell',
    lines: [
      '你的玩笑出来的时候，比你想的更像调侃。',
      '她说：「不怕啊。」然后是三秒钟的安静，安静得能听见冷柜的压缩机。',
      '你把钱放在台面上。'
    ],
    choices: [
      { text: '付钱，离开。', to: 'end_bought' },
      { text: '「我不是开玩笑。」', to: 'talk_1' }
    ]
  }
};

/* 本卷用到的内联引文 */
DE.REF.hume_ref = {
  t: '沉默不是没有话说。沉默是已说过的所有话的余额。',
  who: 'V. 奥尔玛', src: '《时间的器械》', real: false, tag: '沉默'
};
DE.REF.nightshift_ref = {
  t: '凌晨三点以后，世界只剩下两件事：汤在响，和你在。',
  who: '卡布林·维达', src: '《夜班神学》', real: false, tag: '夜班'
};
