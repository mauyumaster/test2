/* ===========================================================
   50_reticle.js  ——  热点：投影、遮挡、标记
   ------------------------------------------------------------
   每帧把一个世界坐标投影到屏幕，做成一个 HTML 标记。三件事决定它显不显：

     1. 看得见吗   —— need 未满足的热点根本不存在（分辨率，不是数值）
     2. 挡着吗     —— 从相机到锚点的线段是否穿过墙或柜子
                      （解析求交，不走射线检测；透明材质不算遮挡，
                        所以站在雨里能透过玻璃看见店内的热点）
     3. 够得着吗   —— 水平距离是否在 reach 内
                      · 够不着：只显示一个小点，不给名字 ——
                        「我知道那边有东西」和「我能碰它」是两回事
                      · 够得着：展开名字，可点

   两种标记长得不一样：
     圆点 = 本来就有的东西；菱形 = 因为你在这项技能上看得多，才多出来的东西。
   =========================================================== */

(function () {
  var THREE = window.THREE, SB = window.SB;

  var layer = null;
  var marks = {};            // hotspot.id -> DOM
  var lastKey = '';
  var cull = { x: 0, z: 0, yaw: 0, t: 0 };

  var MAX_DIST = 19;         // 超过这个距离不显示
  var PULL = 0.42;           // 视线终点向相机收一点，避开物件自身

  function ensureLayer() {
    if (layer) return layer;
    layer = document.getElementById('marks');
    if (!layer) {
      layer = document.createElement('div');
      layer.id = 'marks';
      document.body.appendChild(layer);
    }
    return layer;
  }

  function makeMark(h) {
    var el = document.createElement('div');
    el.className = 'mark ' + (h.kind === 'detail' ? 'mark-detail' : 'mark-main');
    el.innerHTML = '<i class="mk-dot"></i><span class="mk-label"></span><span class="mk-need"></span>';
    el.addEventListener('click', function (ev) {
      ev.stopPropagation();
      if (!el.classList.contains('near')) return;
      if (W.loop) W.loop.enterDialog(h);
    });
    el.addEventListener('pointerenter', function () { el.classList.add('hover'); });
    el.addEventListener('pointerleave', function () { el.classList.remove('hover'); });
    layer.appendChild(el);
    marks[h.id] = el;
    return el;
  }

  /* 视线：终点若落在某个遮挡体内部，说明这个热点就在该物件表面上，
     不该被它自己挡住 —— 跳过那个盒子。
     俯视第三人称下多一类规则：屋顶与吊顶会被收掉（玩家进店时），
     由它们产生的遮挡体（含合成的那块「屋顶盖」）必须一起失效，
     否则进店之后相机的视线仍被看不见的女儿墙/水箱挡住。 */
  function lineClear(cam, h) {
    var bx = h.at[0], by = h.at[1], bz = h.at[2];
    var dx = cam.x - bx, dy = cam.y - by, dz = cam.z - bz;
    var len = Math.sqrt(dx * dx + dy * dy + dz * dz);
    if (len < 0.35) return true;
    var k = (len - PULL) / len;
    var tx = bx + dx * k, ty = by + dy * k, tz = bz + dz * k;
    for (var i = 0; i < W.occluders.length; i++) {
      var b = W.occluders[i];
      if (b.roof && !W.roofShown) continue;
      /* 锚点贴在这个盒子表面上 → 它不是遮挡者 */
      if (bx > b.min.x - 0.12 && bx < b.max.x + 0.12 &&
          by > b.min.y - 0.12 && by < b.max.y + 0.12 &&
          bz > b.min.z - 0.12 && bz < b.max.z + 0.12) continue;
      var ox = cam.x, oy = cam.y, oz = cam.z;
      var ddx = tx - ox, ddy = ty - oy, ddz = tz - oz;
      var t0 = 0, t1 = 1, ok = true;
      var ax = [[ox, ddx, b.min.x, b.max.x], [oy, ddy, b.min.y, b.max.y], [oz, ddz, b.min.z, b.max.z]];
      for (var a = 0; a < 3 && ok; a++) {
        var o = ax[a][0], d = ax[a][1], lo = ax[a][2], hi = ax[a][3];
        if (Math.abs(d) < 1e-8) { if (o < lo || o > hi) ok = false; }
        else {
          var ta = (lo - o) / d, tb = (hi - o) / d;
          if (ta > tb) { var s = ta; ta = tb; tb = s; }
          if (ta > t0) t0 = ta;
          if (tb < t1) t1 = tb;
          if (t0 > t1) ok = false;
        }
      }
      if (ok) return false;
    }
    return true;
  }

  var v3 = new THREE.Vector3();

  function project(h) {
    v3.set(h.at[0], h.at[1], h.at[2]);
    v3.project(SB.camera);
    if (v3.z < -1 || v3.z > 1) return null;             // 在相机背后或超出远裁面
    var rect = SB.renderer.domElement.getBoundingClientRect();
    return {
      x: (v3.x * 0.5 + 0.5) * rect.width,
      y: (-v3.y * 0.5 + 0.5) * rect.height,
      z: v3.z
    };
  }

  W.reticle = {
    marks: marks,

    /* 视野内可见的热点，按远近排序（近的在上） */
    update: function (force) {
      ensureLayer();
      var cam = SB.camera.position, p = SB.player;
      var need = force ||
        Math.abs(p.x - cull.x) + Math.abs(p.z - cull.z) > 0.12 ||
        Math.abs(p.yaw - cull.yaw) > 0.02 ||
        (performance.now() - cull.t) > 420;
      if (!need) return;
      cull.x = p.x; cull.z = p.z; cull.yaw = p.yaw; cull.t = performance.now();

      SB.camera.updateMatrixWorld();
      SB.camera.matrixWorldInverse.copy(SB.camera.matrixWorld).invert();

      var key = [];
      var drawn = [];

      W.HOTSPOTS.forEach(function (h) {
        var el = marks[h.id] || makeMark(h);
        var show = false, near = false, dist = 0;

        if (W.visible(h)) {
          dist = W.distTo(h);
          if (dist <= MAX_DIST) {
            var sc = project(h);
            if (sc) {
              var clear = lineClear(cam, h);
              if (clear) {
                show = true;
                near = W.inReach(h);
                el.style.transform = 'translate(-50%,-50%) translate(' + sc.x.toFixed(1) + 'px,' + sc.y.toFixed(1) + 'px)';
                el.style.zIndex = String(1000 - Math.round(sc.z * 500));
                el._z = sc.z;
              }
            }
          }
        }

        if (show !== el._show || near !== el._near) {
          el._show = show; el._near = near;
          el.classList.toggle('hidden', !show);
          el.classList.toggle('near', show && near);
          el.classList.toggle('far', show && !near);
          if (show) {
            el.querySelector('.mk-label').textContent = h.label;
            el.querySelector('.mk-need').textContent = near ? '' : '走近一点';
          }
        } else if (show) {
          /* 标签可能在状态变化里改过，只在必要时写一次 */
          var lb = el.querySelector('.mk-label');
          if (lb.textContent !== h.label) lb.textContent = h.label;
        }
        if (show) { key.push(h.id); drawn.push({ el: el, z: el._z }); }
      });

      /* 近的后画，压在远的上面 */
      drawn.sort(function (a, b) { return b.z - a.z; });
      drawn.forEach(function (d) { layer.appendChild(d.el); });

      /* 准星指着的那个：即使够不着也报出名字。
         开场站在马路对面时，整条街只有一片无名的小点，
         「那边有东西」和「那是电话亭」之间差的就是这一行字。 */
      var aim = W.reticle.nearest();
      W.HOTSPOTS.forEach(function (h) {
        var el = marks[h.id];
        if (el) el.classList.toggle('aim', h === aim);
      });

      lastKey = key.join(',');
      W.reticle.drawn = drawn.length;
    },

    /* 「按 E 要进哪一样」。
       第一人称时判据是「屏幕中心方向最接近的那个」；俯视第三人称下
       屏幕中心落在角色身前几米的地面上，那个判据会把「只是恰好在正前方、
       其实隔着老远」的东西选走。改成以**角色**为原点的判据：
       够得着 + 看得见，取最近的；距离接近时偏向角色正前方。 */
    nearest: function () {
      var p = SB.player;
      var fx = Math.sin(p.face), fz = Math.cos(p.face);
      var cam = SB.camera.position;
      var best = null, bestScore = 1e9;
      SB.camera.updateMatrixWorld();
      W.active().forEach(function (h) {
        var dx = h.at[0] - p.x, dz = h.at[2] - p.z;
        var d = Math.sqrt(dx * dx + dz * dz);
        if (d < 1e-4) return;
        var dot = (dx * fx + dz * fz) / d;             // -1 背后 … 1 正前
        if (dot < -0.2) return;                        // 在身后就不算「眼前这个」
        if (!lineClear(cam, h)) return;                // 看不见就不能进
        var score = d - dot * 1.2;
        if (score < bestScore) { bestScore = score; best = h; }
      });
      return best;
    },

    setVisible: function (on) {
      ensureLayer();
      layer.classList.toggle('hidden', !on);
    }
  };
})();
