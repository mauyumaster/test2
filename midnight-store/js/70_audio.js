/* ===========================================================
   70_audio.js  ——  声音
   ------------------------------------------------------------
   为什么不用音频文件：
     1. 版权。素材站的「免费」大多带署名或禁商用，而这东西是要发到
        bingwenwang.top 上的。
     2. 依赖。项目是单页、双击即开、不联网的；塞进 mp3 就要么破坏
        这个约定，要么多出一大堆二进制。
     3. 更重要的：**程序化合成的声音能随站位连续变化**。雨在街上、
        屋檐下、店里是三种滤波，人走过去是渐变，不是三段音频交叉
        淡入。这是文件素材做不到的。

   所以这里全部用 Web Audio 现场合成：
     · 雨    噪声 → 滤波（街上清脆 / 屋檐下密集 / 屋顶上发闷）
     · 店内  50Hz 荧光灯嗡鸣 + 冷柜压缩机 + 滴水
     · 街景  车流扫过 + 远雷 + 风
     · 事件  脚步、感应门叮咚、翻纸、易拉罐、蒸汽、猫、霓虹噼啪

   三条硬约束：
     1. 浏览器不允许自动播放。必须在用户手势里 resume()。
        开局的「走进去」就是那个手势（mode 离开 create 即触发）。
     2. 无头环境没有音频设备。所有调用都包 try/catch ——
        音频挂了页面照跑，自检和截图不能因此全废。
     3. ?still 夹具默认不启动音频，除非显式 &audio=1。
   =========================================================== */

(function () {
  var W = window.W, SB = window.SB;

  var ctx = null;
  var master = null;          // 总音量
  var bedGain = null;         // 环境床（对话时压低）
  var rainBus = null;         // 雨这一组的总线：整组一起调，雨才算「背景」
  var ready = false;
  var muted = false;
  var started = false;

  /* 常驻音源：建成后一直响，靠增益开关与滤波改变性格 */
  var L = {};                 // 各层的 { gain, ... }
  var timers = { car: 6, thunder: 22, drip: 1.5, bubble: 4, neon: 9, clock: 0 };
  var lastStep = 0;
  var region = '';
  var mode = 'create';
  var bedTarget = 1;
  /* 雨量总开关。小于 1 是「雨只是背景」的意思：它要一直在，
     但不能盖过主题曲，也不能盖过对话。想再小就改这一个数。 */
  var RAIN = 0.12;
  var analyser = null, meterBuf = null, freqBuf = null;
  var rainAnalyser = null, rainBuf = null;

  /* ---------------- 工具 ---------------- */
  function clamp(v, a, b) { return v < a ? a : (v > b ? b : v); }
  function rnd(a, b) { return a + Math.random() * (b - a); }

  /* ?still 夹具默认不开音频：无头环境没有音频设备，且软件渲染本来就慢。
     要验声音就显式加 &audio=1 —— 自检的第七节会用到。 */
  function allowed() {
    var s = location.search;
    if (!/(^|[?&])still(=|&|$)/.test(s)) return true;
    return /(^|[?&])audio=1(&|$)/.test(s);
  }

  /* 白噪声：4 秒循环。选 4 秒是因为它足够长，滤波之后听不出首尾。 */
  function whiteBuf(sec) {
    var n = Math.floor(ctx.sampleRate * sec);
    var b = ctx.createBuffer(1, n, ctx.sampleRate);
    var d = b.getChannelData(0);
    for (var i = 0; i < n; i++) d[i] = Math.random() * 2 - 1;
    return b;
  }

  /* 粉红噪声：Paul Kellett 近似。雨声用白噪太「嘶」，粉噪才有
     「一大片水落下来」的重量感。 */
  function pinkBuf(sec) {
    var n = Math.floor(ctx.sampleRate * sec);
    var b = ctx.createBuffer(1, n, ctx.sampleRate);
    var d = b.getChannelData(0);
    var b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;
    for (var i = 0; i < n; i++) {
      var w = Math.random() * 2 - 1;
      b0 = 0.99886 * b0 + w * 0.0555179;
      b1 = 0.99332 * b1 + w * 0.0750759;
      b2 = 0.96900 * b2 + w * 0.1538520;
      b3 = 0.86650 * b3 + w * 0.3104856;
      b4 = 0.55000 * b4 + w * 0.5329522;
      b5 = -0.7616 * b5 - w * 0.0168980;
      d[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + w * 0.5362) * 0.11;
      b6 = w * 0.115926;
    }
    return b;
  }

  /* 一条常驻噪声链：源 →（高通）→ 滤波 → 增益
     hp 是可选的「去轰隆」高通：雨的轰隆感几乎全在 250Hz 以下，
     粉噪本身低频就重，不切掉的话听感是一大片闷响而不是雨点。
     bus 让整组雨挂到 rainBus 上，好整体调「雨量」。 */
  function noiseLayer(buf, filterType, freq, q, vol, hp, bus) {
    var src = ctx.createBufferSource();
    src.buffer = buf; src.loop = true;
    var head = src, h = null;
    if (hp) {
      h = ctx.createBiquadFilter();
      h.type = 'highpass'; h.frequency.value = hp;
      src.connect(h); head = h;
    }
    var f = ctx.createBiquadFilter();
    f.type = filterType; f.frequency.value = freq;
    if (q !== undefined) f.Q.value = q;
    var g = ctx.createGain(); g.gain.value = 0;
    head.connect(f); f.connect(g); g.connect(bus || bedGain);
    try { src.start(0); } catch (e) { }
    return { src: src, hp: h, filter: f, gain: g, vol: vol, target: 0 };
  }

  /* 一条常驻正弦（嗡鸣用） */
  function toneLayer(freq, type, vol) {
    var o = ctx.createOscillator();
    o.type = type || 'sine'; o.frequency.value = freq;
    var g = ctx.createGain(); g.gain.value = 0;
    o.connect(g); g.connect(bedGain);
    try { o.start(0); } catch (e) { }
    return { osc: o, gain: g, vol: vol, target: 0 };
  }

  /* ---------------- 建图 ---------------- */
  function build() {
    master = ctx.createGain(); master.gain.value = muted ? 0 : 0.55;
    master.connect(ctx.destination);
    bedGain = ctx.createGain(); bedGain.gain.value = 1;
    bedGain.connect(master);
    /* 雨单独走一条总线。雨是这个世界的底噪，不该和灯嗡、冷柜抢位置；
       有了一条总线，「雨再小一点」就是改一个数的事。 */
    rainBus = ctx.createGain(); rainBus.gain.value = RAIN;
    rainBus.connect(bedGain);

    var white = whiteBuf(4), pink = pinkBuf(4);

    /* 雨的三层。分开做是因为它们在不同位置此消彼长：
       街上听见清脆的那层，屋檐下听见打在雨棚上的那层，
       进了店只剩屋顶上发闷的那层。 */
    /* 雨曾经是「轰隆隆」的：粉噪 + lowpass 900，量出来 43% 的能量压在
       250Hz 以下——那不是雨，那是一台机器在隔壁房间运转。
       改成高通 420 之后的粉噪：低频被切掉，剩下的才是「一大片雨点
       落在湿沥青上」的那层沙沙。代价是雨不再有「体积感」，
       但体积感本来就该由主题曲来给，不该由底噪来给。 */
    L.rain = noiseLayer(pink, 'lowpass', 3200, 0.5, 0.155, 420, rainBus);  // 远处一直在下
    L.hiss = noiseLayer(white, 'bandpass', 3600, 0.55, 0.075, 0, rainBus); // 近处的噼啪
    L.roof = noiseLayer(white, 'lowpass', 800, 0.8, 0.085, 260, rainBus);  // 屋顶上的闷响
    L.wind = noiseLayer(pink, 'lowpass', 620, 0.6, 0.032, 160, rainBus);   // 风

    /* 荧光灯：50Hz 基频 + 两个谐波。三条一起才像镇流器，
       单独一条正弦只像测试音。 */
    L.hum = toneLayer(50, 'sine', 0.040);
    L.hum2 = toneLayer(100, 'sine', 0.016);
    L.hum3 = toneLayer(150, 'sine', 0.008);
    /* 冷柜压缩机：比灯低一点，带轻微的振幅抖动 */
    L.fridge = toneLayer(57, 'sine', 0.050);
    L.fridgeAir = noiseLayer(pink, 'lowpass', 180, 0.8, 0.045);

    /* 电平表在建图时就挂上。不能等第一次 meter() 再挂 ——
       那样第一读拿到的是全零：分析器还没经过任何一个渲染量子。 */
    try {
      analyser = ctx.createAnalyser();
      analyser.fftSize = 2048;
      master.connect(analyser);
      meterBuf = new Float32Array(analyser.fftSize);
    } catch (e) { }

    /* 雨自己也要一个测量点。挂在 master 上量出来的低频占比是「雨＋雷
       ＋车＋音乐」，一场远雷就能把 250Hz 以下拉到 48%，于是你会以为
       雨没改好 —— 其实轰隆的是雷。要判断雨，就只量雨这一条总线。 */
    try {
      rainAnalyser = ctx.createAnalyser();
      rainAnalyser.fftSize = 2048;
      rainBus.connect(rainAnalyser);
    } catch (e) { }

    /* 压缩机的抖动：一个 4.7Hz 的 LFO 调制它的音量 */
    var lfo = ctx.createOscillator(), lfoG = ctx.createGain();
    lfo.frequency.value = 4.7; lfoG.gain.value = 0.020;
    lfo.connect(lfoG); lfoG.connect(L.fridge.gain.gain);
    try { lfo.start(0); } catch (e) { }

    /* 风的起伏 */
    var lfo2 = ctx.createOscillator(), lfo2G = ctx.createGain();
    /* 风的起伏幅度也跟着降。原来 0.030 的摆动配上 0.07 的基准音量是
       「一阵一阵」，现在风只有 0.032，同样的摆动会把它抽成断续的呼呼声。 */
    lfo2.frequency.value = 0.07; lfo2G.gain.value = 0.014;
    lfo2.connect(lfo2G); lfo2G.connect(L.wind.gain.gain);
    try { lfo2.start(0); } catch (e) { }

    ready = true;
  }

  /* ---------------- 一次性音效 ---------------- */
  /* 空间化：按玩家与声源的相对方位算左右与衰减。
     不用 PannerNode —— 它依赖 AudioListener 的朝向设置，
     各浏览器 setPosition/positionX 两套 API 容易踩坑；
     手算 pan 完全够用，而且可控。
     ⚠ 用的是 **p.yaw（相机方位角）**，不是 p.face（角色朝向）：
     俯视第三人称下角色可能侧着身，但声像要跟着**画面**左右走，
     不然「屏幕左边在响」和「左耳更响」会对不上。 */
  function place(at, baseVol) {
    var out = ctx.createGain();
    out.gain.value = baseVol === undefined ? 1 : baseVol;
    var pan = null;
    if (at && SB && SB.player) {
      var p = SB.player;
      var dx = at[0] - p.x, dz = at[2] - p.z;
      var d = Math.sqrt(dx * dx + dz * dz);
      /* 相机前向量与右向量（yaw=0 时相机看向 -Z，右手为 +X） */
      var fx = -Math.sin(p.yaw), fz = -Math.cos(p.yaw);
      var rx = Math.cos(p.yaw), rz = -Math.sin(p.yaw);
      var rgt = dx * rx + dz * rz;
      var v = clamp(rgt / Math.max(1.1, d), -1, 1);
      /* 背后的声音压暗一点，这是「没看见所以听不清」的廉价近似 */
      var fwd = (dx * fx + dz * fz) / Math.max(1.1, d);
      var atten = 1 / (1 + Math.pow(Math.max(0.6, d) / 3.2, 1.5));
      out.gain.value *= atten * (0.55 + 0.45 * (fwd * 0.5 + 0.5));
      if (ctx.createStereoPanner) {
        pan = ctx.createStereoPanner();
        pan.pan.value = v;
        out.connect(pan); pan.connect(master);
        return { input: out, out: pan };
      }
    }
    out.connect(master);
    return { input: out, out: out };
  }

  /* 一小段噪声脉冲：脚步、翻纸、噼啪都从它派生 */
  function burst(opts) {
    var t = ctx.currentTime + (opts.delay || 0);
    var src = ctx.createBufferSource();
    src.buffer = opts.buf || NOISE.short;
    var f = ctx.createBiquadFilter();
    f.type = opts.type || 'bandpass';
    f.frequency.value = opts.freq || 1200;
    f.Q.value = opts.q === undefined ? 1.0 : opts.q;
    var g = ctx.createGain();
    var dur = opts.dur || 0.09, vol = opts.vol === undefined ? 0.3 : opts.vol;
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(vol, t + (opts.attack || 0.006));
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    src.connect(f); f.connect(g);
    /* 滤波扫频：脚步的「啪」和车过的「唰」全靠它 */
    if (opts.sweep) {
      f.frequency.setValueAtTime(opts.freq, t);
      f.frequency.exponentialRampToValueAtTime(Math.max(60, opts.sweep), t + dur);
    }
    var chain = place(opts.at, 1);
    g.connect(chain.input);
    try { src.start(t); src.stop(t + dur + 0.02); } catch (e) { }
    return g;
  }

  /* 一个带音高的短音：叮咚、易拉罐、钟都用它 */
  function ping(opts) {
    var t = ctx.currentTime + (opts.delay || 0);
    var o = ctx.createOscillator();
    o.type = opts.type || 'sine';
    o.frequency.setValueAtTime(opts.freq, t);
    if (opts.to) o.frequency.exponentialRampToValueAtTime(opts.to, t + (opts.dur || 0.3));
    var g = ctx.createGain();
    var dur = opts.dur || 0.3, vol = opts.vol === undefined ? 0.2 : opts.vol;
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(vol, t + (opts.attack || 0.008));
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    /* FM：载波被一个非整数倍的调制波打一下，就有了金属感 */
    if (opts.fm) {
      var m = ctx.createOscillator(), mg = ctx.createGain();
      m.frequency.value = opts.freq * opts.fm;
      mg.gain.value = opts.fmDepth || opts.freq * 0.8;
      m.connect(mg); mg.connect(o.frequency);
      try { m.start(t); m.stop(t + dur + 0.02); } catch (e) { }
    }
    if (opts.filter) {
      var f = ctx.createBiquadFilter();
      f.type = opts.filter; f.frequency.value = opts.filterFreq || 2000;
      o.connect(f); f.connect(g);
    } else o.connect(g);
    var chain = place(opts.at, 1);
    g.connect(chain.input);
    try { o.start(t); o.stop(t + dur + 0.02); } catch (e) { }
    return g;
  }

  /* 复音：两个振荡器叠一起，做便利店那声「叮—咚」 */
  function chime(freq, dur, vol, at, delay) {
    ping({ freq: freq, dur: dur, vol: vol, at: at, delay: delay, type: 'sine' });
    ping({ freq: freq * 2.01, dur: dur * 0.7, vol: vol * 0.28, at: at, delay: delay, type: 'sine' });
  }

  var NOISE = {};

  var SFX = {
    /* 脚步：湿沥青是一声闷「嗒」，瓷砖多一层高频的「哒」。
       两者的差别全在滤波中心频率和衰减长度上。 */
    step_wet: function (at) {
      burst({ freq: 1500, sweep: 500, q: 0.9, dur: 0.085, vol: 0.20, at: at });
      burst({ freq: 4200, q: 0.7, dur: 0.035, vol: 0.055, at: at, delay: 0.004 });
    },
    step_tile: function (at) {
      burst({ freq: 2600, sweep: 1100, q: 1.6, dur: 0.060, vol: 0.17, at: at });
      burst({ freq: 5600, q: 2.2, dur: 0.045, vol: 0.075, at: at, delay: 0.002 });
    },

    /* 感应门：进便利店的那两声。E6 → B5，中间夹一点气动。 */
    door: function (at) {
      chime(1318.5, 0.42, 0.16, at, 0);
      chime(987.8, 0.55, 0.15, at, 0.19);
      burst({ type: 'bandpass', freq: 900, sweep: 2600, q: 0.6, dur: 0.5, vol: 0.045, at: at, attack: 0.12 });
    },

    /* 界面：进入对话 / 选了什么 */
    chime_soft: function (at) { chime(784, 0.30, 0.075, at, 0); },
    blip: function (at) { ping({ freq: 620, to: 880, dur: 0.075, vol: 0.075, at: at }); },

    /* 翻纸：三下不连续的「唰啦」 */
    paper: function (at) {
      burst({ type: 'highpass', freq: 2600, q: 0.5, dur: 0.075, vol: 0.11, at: at });
      burst({ type: 'highpass', freq: 3400, q: 0.5, dur: 0.055, vol: 0.085, at: at, delay: 0.075 });
      burst({ type: 'highpass', freq: 2200, q: 0.5, dur: 0.095, vol: 0.070, at: at, delay: 0.14 });
    },

    /* 易拉罐 / 玻璃瓶：金属感来自 FM */
    can: function (at) {
      ping({ freq: 780, dur: 0.30, vol: 0.10, at: at, fm: 1.47, fmDepth: 900 });
      ping({ freq: 1170, dur: 0.18, vol: 0.055, at: at, fm: 1.31, fmDepth: 500, delay: 0.02 });
      burst({ freq: 5200, q: 1.2, dur: 0.05, vol: 0.05, at: at });
    },

    /* 关东煮：汤面上那层。噪声慢慢涨再慢慢落，像有东西在底下滚 */
    steam: function (at) {
      burst({ type: 'bandpass', freq: 620, q: 0.8, dur: 1.1, vol: 0.075, at: at, attack: 0.35 });
      burst({ type: 'bandpass', freq: 1500, q: 0.6, dur: 0.7, vol: 0.030, at: at, attack: 0.5, delay: 0.25 });
    },

    /* 墙上的钟：干巴巴的一声「嗒」，没有余韵 */
    clock: function (at) {
      burst({ freq: 5200, q: 2.4, dur: 0.030, vol: 0.10, at: at });
      burst({ freq: 1900, q: 3.0, dur: 0.055, vol: 0.045, at: at, delay: 0.006 });
    },

    /* 霓虹 / 在闪的那根灯管：电流嗡 + 一串噼啪 */
    neon: function (at) {
      ping({ freq: 120, dur: 0.5, vol: 0.045, at: at, type: 'sawtooth', filter: 'lowpass', filterFreq: 700 });
      var n = 2 + Math.floor(Math.random() * 4);
      for (var i = 0; i < n; i++) {
        burst({ type: 'highpass', freq: 5200, q: 0.7, dur: 0.028, vol: rnd(0.035, 0.075), at: at, delay: rnd(0.01, 0.42) });
      }
    },

    /* 售货机：先嗡一下，掉两罐，最后一记闷响 */
    vend: function (at) {
      ping({ freq: 92, dur: 0.55, vol: 0.075, at: at, type: 'sawtooth', filter: 'lowpass', filterFreq: 400 });
      SFX.can(at);
      ping({ freq: 640, dur: 0.22, vol: 0.055, at: at, fm: 1.6, fmDepth: 700, delay: 0.34 });
      burst({ freq: 420, sweep: 160, q: 1.0, dur: 0.22, vol: 0.09, at: at, delay: 0.56 });
    },

    /* 猫：两个共振峰（800 / 2400），基频先扬后落。
       做得很轻很远 —— 一声太像的猫叫反而把人从场景里拽出来。 */
    cat: function (at) {
      var t = ctx.currentTime;
      var o = ctx.createOscillator();
      o.type = 'sawtooth';
      o.frequency.setValueAtTime(540, t);
      o.frequency.linearRampToValueAtTime(720, t + 0.13);
      o.frequency.linearRampToValueAtTime(470, t + 0.46);
      var g = ctx.createGain();
      g.gain.setValueAtTime(0, t);
      g.gain.linearRampToValueAtTime(0.055, t + 0.09);
      g.gain.linearRampToValueAtTime(0.040, t + 0.30);
      g.gain.exponentialRampToValueAtTime(0.0001, t + 0.52);
      var f1 = ctx.createBiquadFilter(); f1.type = 'bandpass'; f1.frequency.value = 820; f1.Q.value = 5;
      var f2 = ctx.createBiquadFilter(); f2.type = 'bandpass'; f2.frequency.value = 2450; f2.Q.value = 7;
      var mix = ctx.createGain(); mix.gain.value = 0.5;
      o.connect(f1); o.connect(f2); f1.connect(mix); f2.connect(mix);
      mix.connect(g);
      var chain = place(at, 1); g.connect(chain.input);
      try { o.start(t); o.stop(t + 0.55); } catch (e) { }
    },

    /* 车过：一整条噪声从远到近再到远。靠带通中心频率的扫动做出来 */
    car: function () {
      var pan = rnd(-0.85, 0.85);
      var dur = rnd(2.2, 3.6);
      var t = ctx.currentTime;
      var src = ctx.createBufferSource();
      src.buffer = NOISE.white; src.loop = true;
      var f = ctx.createBiquadFilter();
      f.type = 'bandpass'; f.Q.value = 0.55;
      f.frequency.setValueAtTime(520, t);
      f.frequency.linearRampToValueAtTime(1500, t + dur * 0.5);
      f.frequency.linearRampToValueAtTime(430, t + dur);
      var g = ctx.createGain();
      g.gain.setValueAtTime(0, t);
      g.gain.linearRampToValueAtTime(rnd(0.035, 0.075), t + dur * 0.5);
      g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
      /* 湿路面被轮胎碾过的那层高频 */
      var f2 = ctx.createBiquadFilter();
      f2.type = 'highpass'; f2.frequency.value = 3800;
      var g2 = ctx.createGain(); g2.gain.value = 0.5;
      src.connect(f); f.connect(g);
      src.connect(f2); f2.connect(g2); g2.connect(g);
      var sp = null;
      if (ctx.createStereoPanner) {
        sp = ctx.createStereoPanner();
        sp.pan.setValueAtTime(-pan, t);
        sp.pan.linearRampToValueAtTime(pan, t + dur);
        g.connect(sp); sp.connect(bedGain);
      } else g.connect(bedGain);
      try { src.start(t); src.stop(t + dur + 0.05); } catch (e) { }
    },

    /* 远雷：低频噪声 + 一次破裂。长到 4 秒，因为雷是「滚」过来的 */
    thunder: function () {
      var t = ctx.currentTime;
      var src = ctx.createBufferSource();
      src.buffer = NOISE.pink; src.loop = true;
      var f = ctx.createBiquadFilter();
      f.type = 'lowpass';
      f.frequency.setValueAtTime(320, t);
      f.frequency.exponentialRampToValueAtTime(90, t + 3.4);
      var g = ctx.createGain();
      g.gain.setValueAtTime(0, t);
      /* 雷原本 0.10。它只有低频，是整套里最像「轰隆」的一声；
         压到 0.055，仍然是远处滚过来的，但不再盖住别的东西。 */
      g.gain.linearRampToValueAtTime(0.055, t + 0.25);
      g.gain.exponentialRampToValueAtTime(0.035, t + 1.3);
      g.gain.exponentialRampToValueAtTime(0.0001, t + 3.6);
      /* 一点点起伏，不然是一坨死的低频 */
      var lfo = ctx.createOscillator(), lg = ctx.createGain();
      lfo.frequency.value = 1.6; lg.gain.value = 0.030;
      lfo.connect(lg); lg.connect(g.gain);
      src.connect(f); f.connect(g); g.connect(bedGain);
      try { src.start(t); src.stop(t + 3.7); lfo.start(t); lfo.stop(t + 3.7); } catch (e) { }
      if (Math.random() < 0.6) {
        burst({ type: 'bandpass', freq: 1400, sweep: 300, q: 0.5, dur: 0.5, vol: 0.05, delay: 0.12 });
      }
    },

    /* 屋檐滴水：一颗。短促、带一点音高，落在湿地上 */
    drip: function (at) {
      ping({ freq: rnd(1500, 2300), to: 700, dur: 0.10, vol: 0.045, at: at, type: 'sine' });
      burst({ freq: 3800, q: 1.4, dur: 0.045, vol: 0.030, at: at, delay: 0.01 });
    },

    /* 汤在底下滚 */
    bubble: function (at) {
      var n = 1 + Math.floor(Math.random() * 3);
      for (var i = 0; i < n; i++) {
        ping({
          freq: rnd(240, 420), to: rnd(120, 200), dur: rnd(0.06, 0.13),
          vol: rnd(0.018, 0.038), at: at, type: 'sine', delay: i * rnd(0.06, 0.18)
        });
      }
    },

    /* 塑料袋 */
    bag: function (at) {
      var n = 4;
      for (var i = 0; i < n; i++) {
        burst({
          type: 'highpass', freq: rnd(3000, 6000), q: 0.6,
          dur: rnd(0.03, 0.07), vol: rnd(0.030, 0.070), at: at, delay: i * rnd(0.03, 0.10)
        });
      }
    }
  };

  /* ---------------- 区域 → 各层音量 ----------------
     这张表是本页唯一需要调参的地方。读法：每一层在五个区域里
     各占多少。屋檐下最吵（雨直接打在雨棚上），店里最闷。 */
  var MIX = {
    '马路上': { rain: 1.00, hiss: 0.75, roof: 0.00, hum: 0.00, fridge: 0.00, wind: 1.00, drip: 0, car: 1.00 },
    '门前人行道': { rain: 0.95, hiss: 1.00, roof: 0.10, hum: 0.15, fridge: 0.05, wind: 0.45, drip: 1, car: 0.70 },
    '小巷口': { rain: 0.90, hiss: 0.85, roof: 0.05, hum: 0.10, fridge: 0.00, wind: 0.70, drip: 0.5, car: 0.45 },
    '自动售货机前': { rain: 0.90, hiss: 0.90, roof: 0.05, hum: 0.12, fridge: 0.10, wind: 0.60, drip: 0.5, car: 0.45 },
    '店西侧': { rain: 0.90, hiss: 0.85, roof: 0.05, hum: 0.10, fridge: 0.00, wind: 0.70, drip: 0.5, car: 0.40 },
    '小巷': { rain: 0.88, hiss: 0.70, roof: 0.15, hum: 0.10, fridge: 0.00, wind: 0.55, drip: 0.8, car: 0.30 },
    '店内 · 前场': { rain: 0.45, hiss: 0.05, roof: 1.00, hum: 1.00, fridge: 0.70, wind: 0.05, drip: 0, car: 0.15 },
    '店内 · 后场': { rain: 0.35, hiss: 0.02, roof: 1.00, hum: 1.00, fridge: 1.00, wind: 0.02, drip: 0, car: 0.05 }
  };

  function applyMix(name, instant) {
    var m = MIX[name] || MIX['门前人行道'];
    var tc = instant ? 0.01 : 0.45;      // 时间常数：走进店门要 0.45 秒才换过来
    function set(layer, v, vol) {
      if (!layer) return;
      /* 同步记下「想要多少」。setTargetAtTime 是渐变的，读 .value 只能拿到
         当前这一刻的值；自检要验的是「区域切换有没有把对的数传下来」，
         所以两个都留。 */
      layer.target = v * vol;
      try { layer.gain.gain.setTargetAtTime(v * vol, ctx.currentTime, tc); } catch (e) { }
    }
    set(L.rain, m.rain, L.rain.vol);
    set(L.hiss, m.hiss, L.hiss.vol);
    set(L.roof, m.roof, L.roof.vol);
    set(L.wind, m.wind, L.wind.vol);
    set(L.hum, m.hum, L.hum.vol);
    set(L.hum2, m.hum, L.hum2.vol);
    set(L.hum3, m.hum, L.hum3.vol);
    set(L.fridge, m.fridge, L.fridge.vol);
    set(L.fridgeAir, m.fridge, L.fridgeAir.vol);
    /* 对话时环境床整体压低 —— 人在读东西的时候，世界的音量会退下去。
       从 0.55 再压到 0.42：现在多了一条主题曲，对话时该让位的是雨，
       雨一退，人才听得见自己在想什么。 */
    var bed = mode === 'dialog' ? 0.42 : 1;
    bedTarget = bed;
    try { bedGain.gain.setTargetAtTime(bed, ctx.currentTime, 0.25); } catch (e) { }
    return m;
  }

  /* ---------------- 对外 ---------------- */
  W.audio = {
    /* 自检用：把内部状态摊开 */
    info: function () {
      return {
        supported: !!(window.AudioContext || window.webkitAudioContext),
        ready: ready,
        started: started,
        muted: muted,
        state: ctx ? ctx.state : 'none',
        layers: Object.keys(L).length,
        sfx: Object.keys(SFX).length
      };
    },

    /* 必须在用户手势里调用。包 W.loop.setMode 让它自动发生：
       mode 一离开 create，说明玩家点了「走进去」。 */
    start: function () {
      if (started) { this.resume(); return; }
      if (!allowed()) return;
      try {
        var AC = window.AudioContext || window.webkitAudioContext;
        if (!AC) return;
        ctx = new AC();
        NOISE.white = whiteBuf(4);
        NOISE.pink = pinkBuf(4);
        NOISE.short = whiteBuf(0.6);
        build();
        started = true;
        this.setRegion(W.regionName ? W.regionName(SB.player.x, SB.player.z) : '门前人行道', true);
        this.resume();
      } catch (e) {
        /* 没有音频设备也照玩。这条不能让页面挂掉。 */
        ready = false; started = false;
        if (window.console) console.warn('[audio] 不可用：' + e.message);
      }
    },

    resume: function () {
      if (ctx && ctx.state === 'suspended') { try { ctx.resume(); } catch (e) { } }
    },

    setMode: function (m) {
      mode = m;
      if (!ready) return;
      applyMix(region, false);
    },

    setRegion: function (name, instant) {
      if (name === region && !instant) return;
      region = name;
      if (!ready) return;
      applyMix(name, instant);
      /* 进店/出门时补一声：这一声是「世界换了一层」的标点 */
      if (!instant && name && name.indexOf('店内') === 0 && region !== name) { }
    },

    play: function (name, at) {
      if (!ready || muted) return;
      try {
        if (SFX[name]) SFX[name](at);
        else this.lastError = '未知音效：' + name;
      } catch (e) {
        /* 记住最后一次错误。自检靠它判断「每个音效都能播」——
           吞掉异常是必要的（不能让声音挂掉页面），但不能吞得无影无踪。 */
        this.lastError = name + ': ' + e.message;
      }
    },

    list: function () { return Object.keys(SFX); },

    /* 主输出的实时 RMS。「不抛错」不等于「有声音」——
       无头环境下 context 常常是 suspended，音频时钟不走，
       这时所有音效都「成功」了但其实一声没响。
       接一个 Analyser 量输出电平，才是真的验到了声音。 */
    meter: function () {
      if (!ready) return -1;
      try {
        if (!analyser) return -1;
        analyser.getFloatTimeDomainData(meterBuf);
        var s = 0;
        for (var i = 0; i < meterBuf.length; i++) s += meterBuf[i] * meterBuf[i];
        return +Math.sqrt(s / meterBuf.length).toFixed(6);
      } catch (e) { return -1; }
    },
    /* 频谱三段的能量占比。「雨太轰隆」是一句听觉描述，落到数上就是
       <250Hz 那段占了多少。改滤波器之前先量一次，改完再量一次，
       才知道到底有没有把它从轰隆变成沙沙 —— 不能凭感觉说改好了。
       注意接在 master 之后，静音时读到的是 0（这是对的）。 */
    spectrum: function (which) {
      /* which='rain' 量雨总线，其余量主输出。默认是主输出。 */
      var an = which === 'rain' ? rainAnalyser : analyser;
      if (!ready || !an) return null;
      try {
        /* 用 float 的 dBFS 再转成线性功率。不能用 getByteFrequencyData
           直接平方 —— 那是 dB 域的归一化值，平方之后响的频段被放大、
           弱的被压没，低频占比会算出一个骗人的小数。 */
        var isRain = which === 'rain';
        if (isRain) { if (!rainBuf) rainBuf = new Float32Array(an.frequencyBinCount); }
        else if (!freqBuf) freqBuf = new Float32Array(an.frequencyBinCount);
        var buf = isRain ? rainBuf : freqBuf;
        an.getFloatFrequencyData(buf);
        var binHz = ctx.sampleRate / an.fftSize;
        var lo = 0, mid = 0, hi = 0, total = 0;
        for (var i = 1; i < buf.length; i++) {
          var db = buf[i];
          if (!(db > an.minDecibels)) continue;   // 底噪以下不算
          var v = Math.pow(10, db / 10);                // dBFS → 线性功率
          total += v;
          var hz = i * binHz;
          if (hz < 250) lo += v; else if (hz < 2000) mid += v; else hi += v;
        }
        if (total <= 0) return null;
        return {
          low: +(lo / total).toFixed(4), mid: +(mid / total).toFixed(4),
          high: +(hi / total).toFixed(4), total: +total.toFixed(6)
        };
      } catch (e) { return null; }
    },

    /* 雨这一组的结构参数。自检用它证明「高通确实在链路上」——
       光看音量调小了不算数，轰隆是低频，得是滤波器把它切掉。 */
    rainSpec: function () {
      if (!ready) return null;
      function spec(l) {
        if (!l) return null;
        return { hp: l.hp ? l.hp.frequency.value : 0, lp: l.filter.frequency.value, vol: l.vol };
      }
      return {
        rain: spec(L.rain), hiss: spec(L.hiss), roof: spec(L.roof), wind: spec(L.wind),
        bus: rainBus ? +rainBus.gain.value.toFixed(4) : -1
      };
    },

    /* 把 master 节点交给 71_music：主题曲要挂在总音量之后，
       不然按 M 静音的时候音乐还在响。给它节点而不是 ctx，
       是为了让两边共用同一个时钟 —— 两个 AudioContext 不会同步。 */
    masterNode: function () { return ready ? master : null; },

    clock: function () { return ctx ? +ctx.currentTime.toFixed(3) : -1; },

    /* 各层的目标音量，自检用它验证「区域切换真的换了声音」。
       取目标值而不是实时值：setTargetAtTime 是渐变的，读 .value
       拿到的是「此刻」，在自检里是个会飘的数。 */
    levels: function () {
      if (!ready) return null;
      var t = function (l) { return l ? +l.target.toFixed(4) : 0; };
      return {
        rain: t(L.rain), hiss: t(L.hiss), roof: t(L.roof), wind: t(L.wind),
        hum: t(L.hum), fridge: t(L.fridge),
        master: +(master ? master.gain.value : -1).toFixed(3),
        bed: bedTarget,
        region: region
      };
    },

    toggleMute: function () {
      muted = !muted;
      if (master) {
        try { master.gain.setTargetAtTime(muted ? 0 : 0.55, ctx.currentTime, 0.08); } catch (e) { }
      }
      return muted;
    },
    muted: function () { return muted; },

    /* 每帧：脚步、偶发事件、区域变化 */
    tick: function (dt) {
      if (!ready || !SB || !SB.player) return;
      var p = SB.player;

      /* 区域 */
      var rn = W.regionName(p.x, p.z);
      if (rn !== region) this.setRegion(rn, false);

      /* 脚步：walkPhase 每跨过 π 就是一步。
         用 bob 判断「真的在走」，否则停下时相位会卡在临界点反复触发。 */
      if (mode === 'scene' && p.bob > 0.45) {
        var n = Math.floor(p.walkPhase / Math.PI);
        if (n !== lastStep) {
          lastStep = n;
          var inside = region.indexOf('店内') === 0;
          this.play(inside ? 'step_tile' : 'step_wet', [p.x, 0.1, p.z]);
        }
      }

      /* 偶发：车、雷、滴水、汤滚、霓虹噼啪、钟 */
      var m = MIX[region] || MIX['门前人行道'];
      var outdoor = region.indexOf('店内') !== 0;

      timers.car -= dt * (m.car > 0 ? 1 : 0.2);
      if (timers.car <= 0) {
        timers.car = rnd(9, 26) / Math.max(0.25, m.car || 0.25);
        if (m.car > 0.2) SFX.car();
      }

      timers.thunder -= dt;
      if (timers.thunder <= 0) { timers.thunder = rnd(55, 140); SFX.thunder(); }

      if (m.drip > 0) {
        timers.drip -= dt * m.drip;
        if (timers.drip <= 0) {
          timers.drip = rnd(0.7, 2.6);
          SFX.drip([p.x + rnd(-2.5, 2.5), 0.1, p.z + rnd(-1.2, 1.2)]);
        }
      }

      /* 汤只在关东煮附近响。写死位置，因为它是场景里的一个东西，
         不是跟着玩家的环境音。 */
      if (!outdoor) {
        var dOden = Math.hypot ? 0 : 0;
        var dx = p.x - (-5.2), dz = p.z - (-4.85);
        var dO = Math.sqrt(dx * dx + dz * dz);
        if (dO < 3.4) {
          timers.bubble -= dt;
          if (timers.bubble <= 0) {
            timers.bubble = rnd(0.5, 1.5);
            SFX.bubble([-5.15, 1.65, -4.85]);
          }
        }
        /* 后场的钟：两秒一声 */
        if (region === '店内 · 后场' || (p.z < -5.2 && p.x < 0)) {
          timers.clock -= dt;
          if (timers.clock <= 0) { timers.clock = 2.0; SFX.clock([-1.40, 2.42, -6.58]); }
        }
        /* 在闪的那根灯管：站近了才听见它噼啪 */
        timers.neon -= dt;
        if (timers.neon <= 0) {
          timers.neon = rnd(4, 11);
          var nx = p.x - (-2.20), nz = p.z - (-3.95);
          if (Math.sqrt(nx * nx + nz * nz) < 5.5) SFX.neon([-2.20, 2.76, -3.95]);
        }
      }
    }
  };

  /* ---------------- 挂钩：不改动旧代码 ---------------- */

  /* 1. mode 一离开 create 就启动（点「走进去」或按 Enter 都会走这里） */
  (function () {
    var orig = W.loop.setMode;
    W.loop.setMode = function (m) {
      orig.call(W.loop, m);
      if (m !== 'create') W.audio.start();
      W.audio.setMode(m);
    };
  })();

  /* 2. 进入热点时播对应的一次性音效 */
  (function () {
    var orig = W.loop.enterDialog;
    W.loop.enterDialog = function (h) {
      /* 感应门：门开着走进去才有那一声，从街上远远点它是没有的 */
      var before = orig.call(W.loop, h);
      var MAP = {
        vend: 'vend', magazine: 'paper', d_mag_cover: 'paper', d_receipt: 'paper',
        bookpile: 'paper', cooler: 'can', d_bottle: 'can', oden: 'steam',
        d_oden_steam: 'steam', cat: 'cat', d_cat_eye: 'cat', sign: 'neon',
        alleyneon: 'neon', d_ceiling_light: 'neon', clock: 'clock',
        counter: 'blip', snack: 'bag', islandA: 'bag', islandB: 'bag',
        hotfood: 'steam', coffee: 'steam'
      };
      W.audio.play(MAP[h && h.id] || 'chime_soft', h ? h.at : null);
      return before;
    };
  })();

  /* 3. 门的叮咚：SB.doorOpen 由 45_walk 每帧驱动，跨过阈值时响一次 */
  var doorArmed = true;
  (function () {
    var origUpdate = W.walk.update;
    W.walk.update = function (dt) {
      origUpdate.call(W.walk, dt);
      var open = SB.doorOpen || 0;
      if (open > 0.35 && doorArmed) {
        doorArmed = false;
        W.audio.play('door', [3.00, 1.4, -1.10]);
      } else if (open < 0.12) doorArmed = true;
    };
  })();

  /* 4. 静音：M。任何模式下都管用（包括建卡界面 —— 有人一进来就想关声音） */
  window.addEventListener('keydown', function (e) {
    if (e.key && e.key.toLowerCase() === 'm') {
      var m = W.audio.toggleMute();
      W.audio.resume();
      var el = document.getElementById('notice');
      if (el) {
        el.textContent = m ? '已静音　（M 恢复）' : '声音已开';
        el.classList.add('show');
        clearTimeout(W.audio._nt);
        W.audio._nt = setTimeout(function () { el.classList.remove('show'); }, 1600);
      }
    }
  });

  /* 5. 任何一次点击/按键都尝试 resume —— 有些浏览器在标签页
        切回来之后会把 context 挂起。 */
  ['pointerdown', 'keydown'].forEach(function (ev) {
    window.addEventListener(ev, function () { W.audio.resume(); }, { passive: true });
  });
})();
