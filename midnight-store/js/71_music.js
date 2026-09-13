/* ===========================================================
   71_music.js  ——  主题曲《两点零七分》
   ------------------------------------------------------------
   和 70_audio.js 一样的理由：不用音频文件。版权、离线、双击即开，
   三条都得守住。所以这首曲子是现场合成、现场演奏的 —— 它没有一个
   「播放」按钮，只有一套一直在往下走的调度器。

   要的是极乐迪斯科那种东西：
     · 极慢。46 BPM，一个和弦撑两小节（约 10 秒）。慢到你不注意它，
       但它一直在推着你走。
     · 小调，但不绝望。A 小调，四和弦循环 Am – F – C – Em7。
       大三和弦出现在 III 级和 VI 级上，是「还有一点光」的意思。
     · 留白。旋律八个音铺满 42 秒，剩下的全是呼吸和雨。
     · 大量混响。混响不是装饰，是「这个房间很大、你很小」。

   三个声部：
     pad   三个锯齿波互相失谐 → 低通，2 秒的起音。弦乐的廉价近似，
           但在慢速和大混响下，听感和真弦乐的差别小到不重要。
     bass  正弦，根音。只负责把和弦钉在地上。
     lead  三角波 + 八度泛音 + 颤音。这是「人声」——整首曲子里
           唯一会呼吸的部分。
   外加一层偶发的高音铃，很轻，像街对面某个地方的钟。

   一条空间规则：进店之后整条音乐过一个 1900Hz 的低通。
   隔着玻璃和雨听自己的主题曲，这是场景该有的样子。
   =========================================================== */

(function () {
  var W = window.W;

  var ctx = null, bus = null, tone = null, wet = null, conv = null;
  var ready = false, playing = false, enabled = true, failed = false;
  var timer = null;

  /* ---------------- 乐谱 ---------------- */
  var BPM = 46;
  var STEP = 0.5;                    // 调度网格：半拍
  var TOTAL = 64;                    // 8 小节 = 32 拍 = 64 步
  var CHORD_BEATS = 8;               // 每 8 拍换一次和弦

  /* 和弦：根音 + pad 的三个音（MIDI）。
     Am9 加了九音 B，F 是大三，C 是大三 —— 小调里放进两个大三和弦，
     是「悲伤但不下沉」的关键。换成 Dm 和 Em 就只剩丧了。 */
  var CHORDS = [
    { root: 45, pad: [57, 60, 64], color: 71 },   // Am9   A2 / A3 C4 E4 (+B4)
    { root: 41, pad: [53, 57, 60], color: 69 },   // Fmaj7 F2 / F3 A3 C4
    { root: 48, pad: [55, 60, 64], color: 67 },   // C     C3 / G3 C4 E4
    { root: 40, pad: [59, 62, 67], color: 71 }    // Em7   E2 / B3 D4 G4
  ];

  /* 旋律：[起始拍, MIDI, 时值(拍)]。八個音，铺满 32 拍。
     留白比音符重要 —— 没有一个音是「填」上去的。 */
  var MEL = [
    [0.0, 64, 3.2],    // E4
    [4.0, 60, 2.0],    // C4
    [7.0, 62, 1.6],    // D4
    [10.0, 57, 3.4],   // A3
    [16.0, 69, 3.2],   // A4   F 和弦的三音，落在上面是暖的
    [20.5, 72, 2.4],   // C5
    [24.0, 67, 3.0],   // G4
    [28.0, 71, 2.8]    // B4   Em7 的七音，悬着，不解决
  ];

  var idx = 0, loops = 0, notes = 0, nextAt = 0, cutoffTarget = 5200;
  var meterNode = null, meterBuf = null;
  var beatDur = 60 / BPM;

  function mtof(m) { return 440 * Math.pow(2, (m - 69) / 12); }
  function rnd(a, b) { return a + Math.random() * (b - a); }

  /* ---------------- 混响 ---------------- */
  /* 脉冲响应当场算：一段指数衰减的噪声。
     文件素材能给出更真的房间，但代价是一个二进制依赖，不值。
     3.6 秒的尾巴对这个速度刚好 —— 前一个和弦还没散，后一个已经起来。 */
  function impulse(sec, decay) {
    var n = Math.floor(ctx.sampleRate * sec);
    var b = ctx.createBuffer(2, n, ctx.sampleRate);
    for (var c = 0; c < 2; c++) {
      var d = b.getChannelData(c);
      for (var i = 0; i < n; i++) {
        d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / n, decay);
      }
    }
    return b;
  }

  /* ---------------- 建图 ---------------- */
  function build() {
    var mn = W.audio.masterNode();
    if (!mn) return false;
    ctx = mn.context;

    bus = ctx.createGain(); bus.gain.value = 0;      // 淡入用
    /* 空间低通：街上开阔 5200Hz，店里隔玻璃 1900Hz */
    tone = ctx.createBiquadFilter();
    tone.type = 'lowpass'; tone.frequency.value = 5200; tone.Q.value = 0.4;
    bus.connect(tone); tone.connect(mn);

    /* 音乐自己的电平表。挂在总线上而不是主输出上：
       主输出里还有雨、冷柜、偶尔一辆车，拿它判断「音乐在不在响」
       等于在嘈杂的房间听有没有人说话。要量就直接量这一个声部。 */
    try {
      meterNode = ctx.createAnalyser();
      meterNode.fftSize = 2048;
      bus.connect(meterNode);
      meterBuf = new Float32Array(meterNode.fftSize);
    } catch (e) { }

    conv = ctx.createConvolver();
    conv.buffer = impulse(3.6, 2.4);
    wet = ctx.createGain(); wet.gain.value = 0.55;
    var wlp = ctx.createBiquadFilter();
    wlp.type = 'lowpass'; wlp.frequency.value = 3200;
    conv.connect(wlp); wlp.connect(wet); wet.connect(bus);

    ready = true;
    return true;
  }

  /* 送一份到干声，一份到混响 */
  function send(node, dryVol, wetVol) {
    var d = ctx.createGain(); d.gain.value = dryVol;
    node.connect(d); d.connect(bus);
    if (wetVol > 0) {
      var w = ctx.createGain(); w.gain.value = wetVol;
      node.connect(w); w.connect(conv);
    }
  }

  /* ---------------- 声部 ---------------- */
  /* pad：三个锯齿互相失谐。失谐是「一群人」和「一个人」的区别，
     7 音分刚好能听出厚度又不至于打架。 */
  function padVoice(midi, t, dur) {
    var f = mtof(midi);
    var lp = ctx.createBiquadFilter();
    lp.type = 'lowpass'; lp.Q.value = 0.7;
    lp.frequency.setValueAtTime(340, t);
    lp.frequency.linearRampToValueAtTime(980, t + dur * 0.45);
    lp.frequency.linearRampToValueAtTime(430, t + dur);

    var g = ctx.createGain();
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(0.055, t + 2.0);       // 两秒才起得来
    g.gain.setValueAtTime(0.055, t + Math.max(2.0, dur - 2.6));
    g.gain.linearRampToValueAtTime(0.0001, t + dur + 2.6);

    [[-7, 'sawtooth'], [7, 'sawtooth'], [0, 'triangle']].forEach(function (v) {
      var o = ctx.createOscillator();
      o.type = v[1]; o.frequency.value = f; o.detune.value = v[0];
      o.connect(lp);
      try { o.start(t); o.stop(t + dur + 2.8); } catch (e) { }
    });
    /* 极慢的滤波呼吸：0.05Hz，一轮 20 秒，让长音不是一个静止的块 */
    var lfo = ctx.createOscillator(), lg = ctx.createGain();
    lfo.frequency.value = 0.05; lg.gain.value = 130;
    lfo.connect(lg); lg.connect(lp.frequency);
    try { lfo.start(t); lfo.stop(t + dur + 2.8); } catch (e) { }

    lp.connect(g);
    send(g, 0.7, 0.85);
  }

  /* bass：根音，正弦。它的作用是让和弦有底，不是被听见 */
  function bassVoice(midi, t, dur) {
    var o = ctx.createOscillator();
    o.type = 'sine'; o.frequency.value = mtof(midi);
    var lp = ctx.createBiquadFilter();
    lp.type = 'lowpass'; lp.frequency.value = 300;
    var g = ctx.createGain();
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(0.075, t + 0.8);
    g.gain.setValueAtTime(0.075, t + Math.max(0.8, dur - 1.6));
    g.gain.linearRampToValueAtTime(0.0001, t + dur + 1.6);
    o.connect(lp); lp.connect(g);
    send(g, 0.9, 0.25);
    try { o.start(t); o.stop(t + dur + 1.8); } catch (e) { }
  }

  /* lead：三角波 + 上方八度的一点点正弦，颤音延迟半秒才进来
     —— 一上来就抖的电子音很廉价，人是要吸一口气才开始抖的。 */
  function leadVoice(midi, t, dur) {
    var f = mtof(midi);
    var g = ctx.createGain();
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(0.10, t + 0.55);
    g.gain.setValueAtTime(0.10, t + Math.max(0.55, dur * 0.6));
    g.gain.linearRampToValueAtTime(0.0001, t + dur + 1.9);

    var lp = ctx.createBiquadFilter();
    lp.type = 'lowpass'; lp.frequency.value = 2600;

    var o = ctx.createOscillator(); o.type = 'triangle'; o.frequency.value = f;
    var o2 = ctx.createOscillator(); o2.type = 'sine'; o2.frequency.value = f * 2;
    var g2 = ctx.createGain(); g2.gain.value = 0.22;
    o2.connect(g2); g2.connect(lp);
    o.connect(lp); lp.connect(g);

    var lfo = ctx.createOscillator(), lg = ctx.createGain();
    lfo.frequency.value = 4.6;
    lg.gain.setValueAtTime(0, t);
    lg.gain.setValueAtTime(0, t + 0.5);
    lg.gain.linearRampToValueAtTime(3.5, t + 1.1);      // 颤音渐入
    lfo.connect(lg); lg.connect(o.detune); lg.connect(o2.detune);
    try {
      o.start(t); o.stop(t + dur + 2.0);
      o2.start(t); o2.stop(t + dur + 2.0);
      lfo.start(t); lfo.stop(t + dur + 2.0);
    } catch (e) { }
    send(g, 0.75, 1.0);
  }

  /* 铃：偶发的一记高音，很远。FM 给金属感，剩下的交给混响 */
  function bellVoice(midi, t) {
    var f = mtof(midi);
    var o = ctx.createOscillator(); o.type = 'sine'; o.frequency.value = f;
    var m = ctx.createOscillator(), mg = ctx.createGain();
    m.type = 'sine'; m.frequency.value = f * 2.76; mg.gain.value = f * 0.9;
    m.connect(mg); mg.connect(o.frequency);
    var g = ctx.createGain();
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(0.026, t + 0.02);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 3.2);
    o.connect(g);
    send(g, 0.25, 1.2);
    try { o.start(t); o.stop(t + 3.3); m.start(t); m.stop(t + 3.3); } catch (e) { }
  }

  /* ---------------- 调度 ---------------- */
  /* 提前量调度：定时器每 60ms 醒一次，把未来 0.4 秒内的音符排好。
     不能用 setTimeout 直接排 —— 定时器抖动会让节奏听起来是醉的。 */
  var AHEAD = 0.4;

  function scheduleStep(i, t) {
    var beat = i * STEP;
    if (i % (CHORD_BEATS * 2) === 0) {
      var c = CHORDS[(i / (CHORD_BEATS * 2)) % CHORDS.length];
      var dur = CHORD_BEATS * beatDur;
      bassVoice(c.root, t, dur);
      c.pad.forEach(function (m) { padVoice(m, t, dur); });
      /* 色彩音：九音/七音只在偶数轮出现，免得每次都一样 */
      if (c.color && loops % 2 === 0) padVoice(c.color, t + 0.6, dur * 0.7);
      notes++;
    }
    MEL.forEach(function (n) {
      if (Math.abs(n[0] - beat) < 1e-6) {
        /* 每隔几轮随机省掉一个不是句首的音。完全一样的循环会让人
           在第四分钟开始讨厌它，一点点不确定性就够。 */
        if (loops > 0 && n[0] !== 0 && n[0] !== 16 && Math.random() < 0.22) return;
        leadVoice(n[1], t, n[2] * beatDur);
        notes++;
      }
    });
    /* 铃：每 12 拍看一次运气 */
    if (i % 24 === 8 && Math.random() < 0.45) {
      bellVoice(loops % 2 ? 84 : 88, t + rnd(0, 1.2));
    }
  }

  function tick() {
    if (!playing || !ready) return;
    try {
      var now = ctx.currentTime;
      /* 时钟对齐保护。两个方向都要管：
         落后（drift < 0）：切到别的标签页再回来，或者无头环境把时间快进，
           now 一下跑到 nextAt 前面很远。这时千万别想把落下的补回来 ——
           那会在几十毫秒里排出上百个和弦、几万个振荡器，整页卡死。
         超前（drift 太大）：反过来，若音频时钟走得比调度器慢，nextAt 会
           被一路推到几分钟之后，音符全排在听不见的未来——调度器显示正在
           播放，主输出却是一片静音。自检抓到的就是这一种。
         两种情况的处置一样：丢掉欠账，就地重新对齐。
         音乐断一拍，好过浏览器崩掉，也好过「在放却没声」。 */
      var drift = nextAt - now;
      if (drift < -0.5 || drift > AHEAD + 1.5) nextAt = now + 0.05;
      var guard = 0;
      while (nextAt < now + AHEAD && guard++ < 8) {
        scheduleStep(idx, Math.max(nextAt, now + 0.02));
        idx++;
        if (idx >= TOTAL) { idx = 0; loops++; }
        nextAt += STEP * beatDur;
      }
    } catch (e) {
      /* 音乐挂了不能让页面挂掉。记下来，停掉调度器。 */
      W.music.lastError = e.message;
      W.music.stop();
    }
  }

  /* ---------------- 对外 ---------------- */
  W.music = {
    lastError: null,

    start: function () {
      if (failed) return;
      if (!ready) {
        try { if (!build()) { failed = true; return; } }
        catch (e) { failed = true; this.lastError = e.message; return; }
      }
      if (playing) return;
      try {
        var t = ctx.currentTime;
        idx = 0; loops = 0;
        nextAt = t + 0.15;
        playing = true;
        /* 八秒淡入。主题曲不该在玩家点下「走进去」的那一刻砸过来，
           它应该像是已经在那里响着，只是你刚刚才听见。 */
        bus.gain.cancelScheduledValues(t);
        bus.gain.setValueAtTime(0, t);
        bus.gain.linearRampToValueAtTime(enabled ? 0.22 : 0, t + 8);
        if (!timer) timer = setInterval(tick, 60);
        tick();
      } catch (e) { this.lastError = e.message; }
    },

    stop: function () {
      playing = false;
      if (timer) { clearInterval(timer); timer = null; }
      if (bus && ctx) {
        try {
          bus.gain.cancelScheduledValues(ctx.currentTime);
          bus.gain.setTargetAtTime(0, ctx.currentTime, 0.4);
        } catch (e) { }
      }
    },

    /* N 键：不想听就关掉。有人喜欢静音浏览，这不该是二选一
       （关掉主题曲 ≠ 关掉整个世界的声音）。 */
    toggle: function () {
      enabled = !enabled;
      if (!ready) return enabled;
      try {
        bus.gain.cancelScheduledValues(ctx.currentTime);
        /* 0.3 秒而不是 0.5：关掉主题曲是一件干脆的事，拖半秒像卡住了。
           自检也靠这个数 —— 淡出留得越久，「关掉音乐单独量雨」越不干净。 */
        bus.gain.setTargetAtTime(enabled ? 0.22 : 0, ctx.currentTime, 0.3);
      } catch (e) { }
      return enabled;
    },

    setRegion: function (name) {
      if (!ready) return;
      /* 店内：隔着玻璃和雨；街上：开阔 */
      var inside = name && name.indexOf('店内') === 0;
      cutoffTarget = inside ? 1900 : 5200;
      try {
        tone.frequency.setTargetAtTime(cutoffTarget, ctx.currentTime, 0.9);
      } catch (e) { }
    },

    /* 音乐总线的实时 RMS。「调度器没抛错」不等于「有声音」——
       这条和 70_audio 的 meter() 是同一个教训：要量输出，不要量调用。 */
    meter: function () {
      if (!ready || !meterNode) return -1;
      try {
        meterNode.getFloatTimeDomainData(meterBuf);
        var s = 0;
        for (var i = 0; i < meterBuf.length; i++) s += meterBuf[i] * meterBuf[i];
        return +Math.sqrt(s / meterBuf.length).toFixed(6);
      } catch (e) { return -1; }
    },

    info: function () {
      return {
        ready: ready, playing: playing, enabled: enabled, failed: failed,
        gain: bus ? +bus.gain.value.toFixed(4) : -1,
        cutoff: tone ? Math.round(tone.frequency.value) : -1,
        cutoffTarget: cutoffTarget,
        notes: notes, idx: idx, loops: loops,
        next: +nextAt.toFixed(3), clock: ctx ? +ctx.currentTime.toFixed(3) : -1,
        bpm: BPM
      };
    }
  };

  /* ---------------- 挂钩 ---------------- */

  /* 1. 音频一建好就把主题曲接上去。必须在 W.audio.start 之后 ——
        音乐要接到 audio 的 master 上，否则 M 键静音管不到它。 */
  (function () {
    var orig = W.audio.start;
    W.audio.start = function () {
      orig.call(W.audio);
      if (W.audio.info().ready) W.music.start();
    };
  })();

  /* 2. 区域变化时音乐跟着变闷/变开 */
  (function () {
    var orig = W.audio.setRegion;
    W.audio.setRegion = function (name, instant) {
      orig.call(W.audio, name, instant);
      W.music.setRegion(name);
    };
  })();

  /* 3. N 键 */
  window.addEventListener('keydown', function (e) {
    if (e.key && e.key.toLowerCase() === 'n') {
      var on = W.music.toggle();
      W.audio.resume();
      var el = document.getElementById('notice');
      if (el) {
        el.textContent = on ? '主题曲：开　（N 关闭）' : '主题曲：关　（N 打开）';
        el.classList.add('show');
        clearTimeout(W.music._nt);
        W.music._nt = setTimeout(function () { el.classList.remove('show'); }, 1600);
      }
    }
  });
})();
