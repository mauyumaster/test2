/* ===========================================================
   03_refs.js  ——  引文库（真实来源）
   ------------------------------------------------------------
   每条：t 文本 / who 作者 / src 出处 / exact 是否原句 / note 考据
   exact = true  → 通行译本的原句
   exact = false → 转述或意译（排版时标注「转述」）
   这一层是诚实的来源层：宁可标「转述」，也不要假造原话。
   =========================================================== */

window.DE = window.DE || {};

DE.REF = {

  /* ---------------- 加缪：荒诞 ---------------- */
  camus_suicide: {
    t: '真正严肃的哲学问题只有一个，那就是自杀。判断生活是否值得经历，这本身就是在回答哲学的根本问题。',
    who: '阿尔贝·加缪', src: '《西西弗神话》', exact: true, tag: '荒诞'
  },
  camus_sisyphus: {
    t: '必须想象西西弗斯是幸福的。',
    who: '阿尔贝·加缪', src: '《西西弗神话》结尾', exact: true, tag: '荒诞'
  },
  camus_revolt: {
    t: '我反抗，故我们存在。',
    who: '阿尔贝·加缪', src: '《反抗者》', exact: true, tag: '荒诞'
  },
  camus_indifference: {
    t: '我敞开自己，任凭世界那温柔的冷漠接纳我。',
    who: '阿尔贝·加缪', src: '《局外人》结尾', exact: false,
    note: '通行译文差异较大，此处按语义转述。', tag: '荒诞'
  },
  camus_mother: {
    t: '今天，妈妈死了。也许是昨天，我不知道。',
    who: '阿尔贝·加缪', src: '《局外人》开篇', exact: true, tag: '荒诞'
  },

  /* ---------------- 萨特：自由与自欺 ---------------- */
  sartre_existence: {
    t: '存在先于本质。',
    who: '让-保罗·萨特', src: '《存在主义是一种人道主义》', exact: true, tag: '自由'
  },
  sartre_condemned: {
    t: '人是被判处自由的。',
    who: '让-保罗·萨特', src: '《存在与虚无》', exact: true,
    note: '常被引作「人被判决为自由」。', tag: '自由'
  },
  sartre_hell: {
    t: '他人即地狱。',
    who: '让-保罗·萨特', src: '《禁闭》', exact: true, tag: '他者'
  },
  sartre_badfaith: {
    t: '自欺，就是对自己说谎，并且相信这个谎言。',
    who: '让-保罗·萨特', src: '《存在与虚无》第一卷', exact: false,
    note: '术语 mauvaise foi 的语义转述。', tag: '自欺'
  },
  sartre_nausea: {
    t: '一切存在者都是无缘无故地诞生，因软弱而延续，因偶然而死去。',
    who: '让-保罗·萨特', src: '《恶心》', exact: false, tag: '荒诞'
  },
  sartre_choice: {
    t: '人除了自己所作出的那个样子以外，什么都不是。',
    who: '让-保罗·萨特', src: '《存在主义是一种人道主义》', exact: true, tag: '自由'
  },

  /* ---------------- 克尔凯郭尔：焦虑 ---------------- */
  kierkegaard_anxiety: {
    t: '焦虑是自由的眩晕。',
    who: '索伦·克尔凯郭尔', src: '《焦虑的概念》', exact: true, tag: '焦虑'
  },
  kierkegaard_backward: {
    t: '生活只能倒着被理解，但必须正着被生活。',
    who: '索伦·克尔凯郭尔', src: '《日记》', exact: true, tag: '时间'
  },
  kierkegaard_truth: {
    t: '我必须找到一个对我而言是真理的真理，一个我愿意为之生、为之死的理念。',
    who: '索伦·克尔凯郭尔', src: '《日记》', exact: true, tag: '真理'
  },
  kierkegaard_despair: {
    t: '绝望是一种致死的病：它不死，也不生。',
    who: '索伦·克尔凯郭尔', src: '《致死的疾病》', exact: false, tag: '绝望'
  },

  /* ---------------- 尼采 ---------------- */
  nietzsche_abyss: {
    t: '当你凝视深渊时，深渊也在凝视你。',
    who: '弗里德里希·尼采', src: '《善恶的彼岸》', exact: true, tag: '深渊'
  },
  nietzsche_why: {
    t: '一个人知道自己为什么而活，就可以忍受任何一种生活。',
    who: '弗里德里希·尼采', src: '《偶像的黄昏》', exact: true, tag: '意义'
  },
  nietzsche_return: {
    t: '假如有一个魔鬼对你说：你此刻所过的这种生活，你必须再过一次，而且还要过无数次……',
    who: '弗里德里希·尼采', src: '《快乐的科学》第341节', exact: true, tag: '时间'
  },
  nietzsche_god: {
    t: '上帝死了，而且是我们杀死了他。',
    who: '弗里德里希·尼采', src: '《快乐的科学》第125节', exact: true, tag: '虚无'
  },

  /* ---------------- 海德格尔 ---------------- */
  heidegger_death: {
    t: '向死而生：只有当人把自己投入死亡之中，此在才真正地成为它自己。',
    who: '马丁·海德格尔', src: '《存在与时间》', exact: false,
    note: '德文 Sein-zum-Tode 的释义，非单句原文。', tag: '死亡'
  },
  heidegger_thrown: {
    t: '此在被抛入世界：它从不询问自己是否愿意，就已经在这里了。',
    who: '马丁·海德格尔', src: '《存在与时间》', exact: false, tag: '存在'
  },
  heidegger_language: {
    t: '语言是存在之家。',
    who: '马丁·海德格尔', src: '《关于人道主义的书信》', exact: true, tag: '语言'
  },
  heidegger_care: {
    t: '此在的存在即是操心。',
    who: '马丁·海德格尔', src: '《存在与时间》', exact: true, tag: '存在'
  },

  /* ---------------- 陀思妥耶夫斯基 ---------------- */
  dostoevsky_allowed: {
    t: '如果没有上帝，那么一切都被允许。',
    who: '陀思妥耶夫斯基', src: '《卡拉马佐夫兄弟》', exact: true, tag: '虚无'
  },
  dostoevsky_underground: {
    t: '我是一个有病的人……我是一个心怀恶意的人。我是一个不讨人喜欢的人。',
    who: '陀思妥耶夫斯基', src: '《地下室手记》开篇', exact: true, tag: '自轻'
  },
  dostoevsky_love: {
    t: '我越是爱整个人类，就越是厌恶具体的人。',
    who: '陀思妥耶夫斯基', src: '《卡拉马佐夫兄弟》', exact: false,
    note: '原文为佐西马长老的对话段落，此处压缩转述。', tag: '他者'
  },
  dostoevsky_wheat: {
    t: '一粒麦子落在地里若不死，仍旧是一粒；若是死了，就结出许多子粒来。',
    who: '《约翰福音》12:24', src: '《卡拉马佐夫兄弟》引文', exact: true, tag: '死亡'
  },
  dostoevsky_consciousness: {
    t: '意识太过发达，也是一种病。',
    who: '陀思妥耶夫斯基', src: '《地下室手记》', exact: true, tag: '过度自觉'
  },

  /* ---------------- 卡夫卡 ---------------- */
  kafka_cage: {
    t: '一只笼子在寻找一只鸟。',
    who: '弗朗茨·卡夫卡', src: '《蓝色八开笔记本》', exact: true, tag: '困'
  },
  kafka_metamorphosis: {
    t: '一天早晨，格里高尔·萨姆沙从不安的睡梦中醒来，发现自己躺在床上变成了一只巨大的甲虫。',
    who: '弗朗茨·卡夫卡', src: '《变形记》开篇', exact: true, tag: '异化'
  },
  kafka_trial: {
    t: '一定有人诬告了约瑟夫·K，因为他并没有做错什么事，却在一天早上被捕了。',
    who: '弗朗茨·卡夫卡', src: '《审判》开篇', exact: true, tag: '罪'
  },
  kafka_road: {
    t: '目标虽有，道路却无；我们所谓的路，无非是彷徨。',
    who: '弗朗茨·卡夫卡', src: '《误入世界》', exact: false, tag: '彷徨'
  },
  kafka_belief: {
    t: '相信进步，并不等于相信进步已经发生。',
    who: '弗朗茨·卡夫卡', src: '《八开笔记本》', exact: true, tag: '希望'
  },

  /* ---------------- 贝克特 ---------------- */
  beckett_gogo: {
    t: '咱们走吧。（他们没有动。）',
    who: '萨缪尔·贝克特', src: '《等待戈多》', exact: true,
    note: '全剧反复出现的台词与舞台指示。', tag: '等待'
  },
  beckett_nothing: {
    t: '没有什么比不幸更可笑了。',
    who: '萨缪尔·贝克特', src: '《等待戈多》', exact: true, tag: '荒谬'
  },
  beckett_try_again: {
    t: '再试一次。再失败一次。失败得好一点。',
    who: '萨缪尔·贝克特', src: '《向着更糟去》', exact: true, tag: '失败'
  },

  /* ---------------- 齐奥朗 ---------------- */
  cioran_born: {
    t: '若不是为了不再出生，我们活着又是为了什么？',
    who: 'E.M. 齐奥朗', src: '《解体概要》', exact: false, tag: '虚无'
  },
  cioran_insomnia: {
    t: '失眠者不是醒着的人，而是被时间遗弃在门外的人。',
    who: 'E.M. 齐奥朗', src: '《生而为人的不便》', exact: false,
    note: '齐奥朗谈失眠的语义转述。', tag: '失眠'
  },
  cioran_failure: {
    t: '我唯一的功劳，就是在失败中始终坚持。',
    who: 'E.M. 齐奥朗', src: '《苦涩的三段论》', exact: false, tag: '失败'
  },

  /* ---------------- 韦伊：注意力 ---------------- */
  weil_attention: {
    t: '注意力是最稀有、最纯粹的慷慨。',
    who: '西蒙娜·韦伊', src: '《重力与恩典》', exact: true,
    note: '本原型的核心命题之一：技能即注意力，注意力即给予。', tag: '注意力'
  },
  weil_death: {
    t: '死亡是瞬间的事，但活着要一点点地交付自己。',
    who: '西蒙娜·韦伊', src: '《重力与恩典》', exact: false, tag: '交付'
  },

  /* ---------------- 列维纳斯 / 布伯：他者 ---------------- */
  levinas_face: {
    t: '他者的脸，是一种不容我回避的召唤。',
    who: '伊曼纽尔·列维纳斯', src: '《总体与无限》', exact: false, tag: '他者'
  },
  levinas_ethics: {
    t: '伦理学是第一哲学。',
    who: '伊曼纽尔·列维纳斯', src: '《总体与无限》', exact: true, tag: '他者'
  },
  buber_meeting: {
    t: '一切真实的人生皆是相遇。',
    who: '马丁·布伯', src: '《我与你》', exact: true, tag: '相遇'
  },

  /* ---------------- 佩索阿 ---------------- */
  pessoa_nothing: {
    t: '我什么都不是。我永远不会成为什么。我不可能想成为什么。除此以外，我心中怀有世上所有的梦。',
    who: '费尔南多·佩索阿', src: '《烟草店》', exact: true, tag: '虚无'
  },
  pessoa_orchestra: {
    t: '我的灵魂是一支隐秘的管弦乐团。',
    who: '费尔南多·佩索阿', src: '《惶然录》', exact: false, tag: '内在'
  },
  pessoa_tired: {
    t: '我厌倦了，不是厌倦某一件事，而是厌倦了一切。',
    who: '费尔南多·佩索阿', src: '《惶然录》', exact: false, tag: '倦怠'
  },

  /* ---------------- 里尔克 ---------------- */
  rilke_questions: {
    t: '请对心中所有未解之事保持耐心，试着去爱这些问题本身。',
    who: '赖内·玛利亚·里尔克', src: '《给青年诗人的信》', exact: true, tag: '疑问'
  },
  rilke_dragons: {
    t: '也许我们心中所有的龙，都是需要我们的公主。',
    who: '赖内·玛利亚·里尔克', src: '《给青年诗人的信》', exact: true, tag: '恐惧'
  },
  rilke_beauty: {
    t: '美，是我们尚且能够承受的恐怖的开端。',
    who: '赖内·玛利亚·里尔克', src: '《杜伊诺哀歌》第一首', exact: true, tag: '美'
  },

  /* ---------------- 古典与近代哲学 ---------------- */
  montaigne_death: {
    t: '哲学，就是学习如何死亡。',
    who: '蒙田', src: '《随笔集》', exact: true,
    note: '蒙田引西塞罗，用于阐述「预想死亡即是预想自由」。', tag: '死亡'
  },
  montaigne_know: {
    t: '我知道什么呢？',
    who: '蒙田', src: '《随笔集》箴言', exact: true, tag: '怀疑'
  },
  aurelius_exit: {
    t: '你随时都可以选择退出。让这一点决定你所做的每一件事。',
    who: '马可·奥勒留', src: '《沉思录》', exact: true, tag: '自由'
  },
  aurelius_moment: {
    t: '人所失去的，只是他正在过的这一瞬；人所拥有的，也只是这一瞬。',
    who: '马可·奥勒留', src: '《沉思录》', exact: false, tag: '时间'
  },
  pascal_reed: {
    t: '人是一根会思想的芦苇。',
    who: '布莱兹·帕斯卡', src: '《思想录》', exact: true, tag: '脆弱'
  },
  pascal_silence: {
    t: '这无限空间的永恒沉默使我恐惧。',
    who: '布莱兹·帕斯卡', src: '《思想录》', exact: true, tag: '恐惧'
  },
  seneca_time: {
    t: '并非我们拥有的时间太短，而是我们浪费掉的时间太多。',
    who: '塞内加', src: '《论生命之短暂》', exact: true, tag: '时间'
  },
  epictetus_view: {
    t: '扰乱人的不是事情本身，而是人对事情的判断。',
    who: '爱比克泰德', src: '《手册》', exact: true, tag: '判断'
  },
  lucretius_nothing: {
    t: '没有什么能由无中生有。',
    who: '卢克莱修', src: '《物性论》', exact: true, tag: '存在'
  },

  /* ---------------- 维特根斯坦 ---------------- */
  wittgenstein_silence: {
    t: '凡是不可言说的，必须保持沉默。',
    who: '路德维希·维特根斯坦', src: '《逻辑哲学论》末句', exact: true, tag: '语言'
  },
  wittgenstein_death: {
    t: '死亡不是生命中的事件。人并不经历死亡。',
    who: '路德维希·维特根斯坦', src: '《逻辑哲学论》6.4311', exact: true, tag: '死亡'
  },
  wittgenstein_limit: {
    t: '我的语言的界限，意味着我的世界的界限。',
    who: '路德维希·维特根斯坦', src: '《逻辑哲学论》5.6', exact: true, tag: '语言'
  },

  /* ---------------- 波德莱尔 / 策兰 ---------------- */
  baudelaire_crowd: {
    t: '人群，就是孤独。',
    who: '夏尔·波德莱尔', src: '《巴黎的忧郁》', exact: true, tag: '孤独'
  },
  celan_master: {
    t: '死亡是一个来自德国的大师。',
    who: '保罗·策兰', src: '《死亡赋格》', exact: true, tag: '死亡'
  },

  /* ---------------- 日本文学 ---------------- */
  dazai_disqualified: {
    t: '胆小鬼连幸福都怕，碰到棉花都会受伤。',
    who: '太宰治', src: '《人间失格》', exact: true, tag: '自轻'
  },
  dazai_sorry: {
    t: '生而为人，我很抱歉。',
    who: '寺内寿太郎', src: '《人间失格》引用其诗句',
    exact: true,
    note: '这句常被误归为太宰治本人。原作中太宰治引用了诗人寺内寿太郎的诗句，并借角色之口说出。',
    tag: '自轻'
  },
  soseki_cat: {
    t: '我是猫。名字？还没有。',
    who: '夏目漱石', src: '《我是猫》开篇', exact: true, tag: '旁观'
  },
  soseki_moon: {
    t: '今晚的月色真美。',
    who: '夏目漱石', src: '翻译逸话（非作品原文）', exact: false,
    note: '相传为夏目漱石对 I love you 的译法，出自学生回忆，并非其作品中的句子。',
    tag: '含蓄'
  },
  soseki_heart: {
    t: '我是个坏人。这一点，我自己最清楚。',
    who: '夏目漱石', src: '《心》', exact: false, tag: '罪'
  },
  akutagawa_hell: {
    t: '人生比地狱还要地狱。',
    who: '芥川龙之介', src: '《侏儒的话》', exact: true, tag: '绝望'
  },
  akutagawa_clever: {
    t: '最聪明的处世之道，是既对世俗冷笑，又不被世俗驯服。',
    who: '芥川龙之介', src: '《侏儒的话》', exact: false, tag: '处世'
  },
  takuboku_hands: {
    t: '働けど働けど　わが暮らし楽にならざり　ぢつと手を見る',
    who: '石川啄木', src: '《一握之砂》',
    tr: '劳动啊，劳动啊，日子却始终不见轻松——我盯着自己的手看。',
    exact: true,
    note: '「啄木调」短歌。被反复用来说明劳动与贫困之间的荒诞。',
    tag: '劳动'
  },
  miyazawa_rain: {
    t: '不怕雨，不怕风，不怕雪与夏日的炎热。',
    who: '宫泽贤治', src: '《不输给雨》', exact: true, tag: '坚韧'
  },
  tanikawa_alive: {
    t: '活着，此刻活着，那就是喉咙的干渴，是日光穿过眼睑的明亮。',
    who: '谷川俊太郎', src: '《活着》', exact: false, tag: '活着'
  },

  /* ---------------- 中文学术与中国古典 ---------------- */
  zhuangzi_self: {
    t: '今者吾丧我。',
    who: '庄子', src: '《齐物论》', exact: true,
    note: '「吾丧我」：我失去了那个被社会与欲望构成的自己。全原型最锋利的一句。',
    tag: '无我'
  },
  zhuangzi_fish: {
    t: '相濡以沫，不如相忘于江湖。',
    who: '庄子', src: '《大宗师》', exact: true, tag: '他者'
  },
  zhuangzi_death: {
    t: '方生方死，方死方生。',
    who: '庄子', src: '《齐物论》', exact: true, tag: '生死'
  },
  zhuangzi_butterfly: {
    t: '不知周之梦为胡蝶与，胡蝶之梦为周与？',
    who: '庄子', src: '《齐物论》', exact: true, tag: '梦'
  },
  libai_inn: {
    t: '夫天地者，万物之逆旅也；光阴者，百代之过客也。',
    who: '李白', src: '《春夜宴从弟桃花园序》', exact: true, tag: '过客'
  },
  gushi_nineteen: {
    t: '人生天地间，忽如远行客。',
    who: '《古诗十九首》', src: '《青青陵上柏》', exact: true, tag: '过客'
  },
  tao_yuanming: {
    t: '纵浪大化中，不喜亦不惧。',
    who: '陶渊明', src: '《形影神赠答诗》', exact: true, tag: '无常'
  },
  tao_return: {
    t: '已矣乎，寓形宇内复几时，曷不委心任去留。',
    who: '陶渊明', src: '《归去来兮辞》', exact: true, tag: '无常'
  },
  sushi_traveler: {
    t: '人生如逆旅，我亦是行人。',
    who: '苏轼', src: '《临江仙·送钱穆父》', exact: true, tag: '过客'
  },
  sushi_body: {
    t: '长恨此身非我有，何时忘却营营。',
    who: '苏轼', src: '《临江仙·夜饮东坡醒复醉》', exact: true, tag: '无我'
  },
  zhangdai_snow: {
    t: '天与云与山与水，上下一白。湖上影子，惟长堤一痕、湖心亭一点、与余舟一芥、舟中人两三粒而已。',
    who: '张岱', src: '《湖心亭看雪》', exact: true,
    note: '「舟中人两三粒」——把人在世界中的尺度写到极小，正是孤独的量化。',
    tag: '孤独'
  },
  zhangdai_fool: {
    t: '莫说相公痴，更有痴似相公者。',
    who: '张岱', src: '《湖心亭看雪》', exact: true, tag: '同类'
  },
  lishangyin: {
    t: '此情可待成追忆，只是当时已惘然。',
    who: '李商隐', src: '《锦瑟》', exact: true, tag: '追忆'
  },
  lu_xun_shadow: {
    t: '我独自远行，不但没有你，并且再没有别的影在黑暗里。',
    who: '鲁迅', src: '《影的告别》', exact: true, tag: '孤独'
  },
  lu_xun_despair: {
    t: '绝望之为虚妄，正与希望相同。',
    who: '鲁迅', src: '《希望》', exact: true,
    note: '把绝望也拆穿为虚妄——比虚无主义更进一步。', tag: '绝望'
  },
  lu_xun_abyss: {
    t: '于浩歌狂热之际中寒；于天上看见深渊。',
    who: '鲁迅', src: '《墓碣文》', exact: true, tag: '深渊'
  },
  wang_guowei: {
    t: '人生只似风前絮，欢也零星，悲也零星。',
    who: '王国维', src: '《采桑子》', exact: true, tag: '无常'
  },
  wang_yangming: {
    t: '你未看此花时，此花与汝心同归于寂。',
    who: '王阳明', src: '《传习录》', exact: true, tag: '注意力'
  },
  diamond_sutra: {
    t: '过去心不可得，现在心不可得，未来心不可得。',
    who: '《金刚经》', src: '第十八品', exact: true, tag: '时间'
  },

  /* ---------------- 当代 ---------------- */
  han_byungchul: {
    t: '过度的积极性，是二十一世纪的暴力。',
    who: '韩炳哲', src: '《倦怠社会》', exact: false, tag: '倦怠'
  },
  han_burnout: {
    t: '倦怠社会里的人不是被他人剥削，而是自愿地剥削自己，直到倒下。',
    who: '韩炳哲', src: '《倦怠社会》', exact: false, tag: '倦怠'
  },
  arendt_labor: {
    t: '劳动的人，被自身的生命过程所奴役。',
    who: '汉娜·阿伦特', src: '《人的境况》', exact: false, tag: '劳动'
  },
  fromm_free: {
    t: '现代人挣脱了所有束缚，却因此在自由中感到无力与孤独。',
    who: '埃里希·弗洛姆', src: '《逃避自由》', exact: false, tag: '自由'
  },
  tillich_courage: {
    t: '勇气，是尽管有非存在，仍然肯定自身的存在。',
    who: '保罗·蒂利希', src: '《存在的勇气》', exact: true, tag: '勇气'
  },
  unamuno_hunger: {
    t: '对不朽的渴望，是人之为人的根本激情。',
    who: '米格尔·德·乌纳穆诺', src: '《生命的悲剧意识》', exact: false, tag: '不朽'
  }
};

/* ---------------- 取用与展示 ---------------- */
DE.ref = function (id) {
  if (!id) return null;
  if (typeof id === 'object') return id;          // 允许节点内联写一条
  return DE.REF[id] || DE.BOOK[id] || null;
};

DE.refLine = function (r) {
  return r.who + (r.src ? '　' + r.src : '');
};
