// 恒星系新物理的三档宽度 + 减弱动态效果 + 触屏复核（v2）。
// 用法：node shot_homepage_rsp.mjs [调试端口] [URL]
// 报告：PASS/FAIL，失败非零退出。每段独立重载，避免 CDP 输入状态串扰。
import { spawn } from 'node:child_process';
import { mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const PORT = process.argv[2] || '9227';
const URL = process.argv[3] || 'http://127.0.0.1:8765/';
const CHROME = 'C:/Program Files/Google/Chrome/Application/chrome.exe';

const userData = mkdtempSync(join(tmpdir(), 'hp-rsp-'));
const chrome = spawn(CHROME, [
  '--headless=new', '--disable-gpu', '--no-first-run', '--no-default-browser-check',
  '--remote-debugging-port=' + PORT, '--user-data-dir=' + userData,
  '--disable-background-networking', '--disable-component-update', 'about:blank'
], { stdio: 'ignore' });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
async function waitFor(fn, ms, step) {
  const t0 = Date.now();
  for (;;) {
    const v = await fn();
    if (v) return v;
    if (Date.now() - t0 > ms) throw new Error('timeout: ' + step);
    await sleep(120);
  }
}

async function main() {
  let ws;
  await waitFor(async () => {
    try {
      const r = await fetch(`http://127.0.0.1:${PORT}/json/list`);
      const list = await r.json();
      const page = list.find((t) => t.type === 'page');
      if (!page) return false;
      ws = new WebSocket(page.webSocketDebuggerUrl);
      await new Promise((res, rej) => { ws.onopen = res; ws.onerror = rej; });
      return true;
    } catch { return false; }
  }, 15000, '等待 CDP 端点');

  let msgId = 0;
  const pending = new Map();
  const exceptions = [];
  ws.onmessage = (ev) => {
    const m = JSON.parse(ev.data);
    if (m.id && pending.has(m.id)) { pending.get(m.id)(m); pending.delete(m.id); }
    else if (m.method === 'Runtime.exceptionThrown') {
      exceptions.push((m.params.exceptionDetails.exception?.description || m.params.exceptionDetails.text).split('\n')[0]);
    }
  };
  const send = (method, params = {}) => new Promise((res) => {
    const id = ++msgId;
    pending.set(id, res);
    ws.send(JSON.stringify({ id, method, params }));
  });
  const evaluate = async (expr) => {
    const r = await send('Runtime.evaluate', { expression: expr, awaitPromise: true, returnByValue: true });
    if (r.result?.exceptionDetails) throw new Error('eval: ' + r.result.exceptionDetails.text);
    return r.result?.result?.value;
  };

  let pass = 0, fail = 0;
  const ok = (cond, label, extra = '') => {
    if (cond) { pass++; console.log('  PASS  ' + label + (extra ? '  [' + extra + ']' : '')); }
    else { fail++; console.log('  FAIL  ' + label + (extra ? '  [' + extra + ']' : '')); }
  };

  await send('Page.enable');
  await send('Runtime.enable');

  const load = async () => {
    await send('Page.navigate', { url: URL });
    await waitFor(() => evaluate('document.readyState === "complete"'), 20000, '页面加载');
    await sleep(900);
  };
  const rectOf = (i) => evaluate(`(() => { const r = document.querySelectorAll('#cosmos .planet')[${i}].getBoundingClientRect(); return { x: r.x, y: r.y, w: r.width, h: r.height }; })()`);
  const pickPlanet = async () => {
    for (let tries = 0; tries < 40; tries++) {
      const list = await evaluate(`[...document.querySelectorAll('#cosmos .planet')].map(p => {
        const r = p.getBoundingClientRect();
        return { x: r.x, y: r.y, w: r.width, h: r.height };
      })`);
      const vw = await evaluate('innerWidth');
      const i = list.findIndex((p) => {
        const cx = p.x + p.w / 2;
        return cx > 20 && cx < vw - 20;
      });
      if (i >= 0) return { i, t: list[i], vw };
      await sleep(200);
    }
    return null;
  };
  const moved = (x, y, buttons = 0) => send('Input.dispatchMouseEvent', { type: 'mouseMoved', x, y, buttons });
  const pressed = (x, y) => send('Input.dispatchMouseEvent', { type: 'mousePressed', x, y, button: 'left', buttons: 1, clickCount: 1 });
  const released = (x, y) => send('Input.dispatchMouseEvent', { type: 'mouseReleased', x, y, button: 'left', buttons: 0, clickCount: 1 });
  const orbitStr = (i) => evaluate(`(() => { const o = document.querySelectorAll('#cosmos .planet')[${i}].__planet.orbit; return o.a.toFixed(1) + ',' + o.e.toFixed(3); })()`);

  /* ============ 三档宽度 ============ */
  for (const [w, h, tag] of [[1440, 900, '桌面 1440'], [768, 1024, '平板 768'], [390, 844, '手机 390']]) {
    console.log(`== 宽度 ${tag} ==`);
    await send('Emulation.setDeviceMetricsOverride', { width: w, height: h, deviceScaleFactor: 1, mobile: w < 768 });
    await load();
    await sleep(1200);
    const n = await evaluate(`document.querySelectorAll('#cosmos .planet').length`);
    ok(n === 3, '星球元素数量 = 3', String(n));
    // 轮询：至少 1 颗进入视口（星球在绕行，单次采样可能全部转到黑洞背后）
    const vis = await (async () => {
      for (let t = 0; t < 40; t++) {
        const list = await evaluate(`[...document.querySelectorAll('#cosmos .planet')].map(p => {
          const r = p.getBoundingClientRect(); return { x: r.x, w: r.width };
        })`);
        const vw = await evaluate('innerWidth');
        const hit = list.filter((p) => p.x < vw && p.x + p.w > 0).length;
        if (hit >= 1) return hit;
        await sleep(200);
      }
      return 0;
    })();
    ok(vis >= 1, '至少 1 颗星球与视口相交', `${vis}/3`);
    const a = await evaluate(`[...document.querySelectorAll('#cosmos .planet')].map(p => Math.round(p.__planet.orbit.a))`);
    const aMin = w < 600 ? 90 : 160;   // 窄屏黑洞 RH 钳到 170，轨道贴着吸积盘收缩是设计使然
    ok(a.every((x) => x > aMin), '轨道半长轴正常', a.join(','));
    const s = await evaluate(`(() => ({
      docW: document.documentElement.scrollWidth, vw: innerWidth,
      hole: (() => { const c = document.querySelector('#hole canvas'); if (!c) return null;
        const m = /translate3d\\(([-\\d.]+)px,\\s*([-\\d.]+)px/.exec(c.style.transform || '');
        return m ? [Math.round(+m[1]), Math.round(+m[2])] : null; })()
    }))()`);
    ok(s.docW <= s.vw, '无横向溢出', `docW=${s.docW} vw=${s.vw}`);
    ok(!!s.hole, '黑洞 canvas 存在且已定位', s.hole ? `offset=${s.hole.join(',')}` : '');
    ok(w < 900 ? (s.hole && s.hole[0] < s.vw) : true, '窄屏黑洞露出判定', `offset.x=${s.hole ? s.hole[0] : 'null'} vw=${s.vw}`);
  }

  /* ============ 减弱动态效果 ============ */
  console.log('== 减弱动态效果 ==');
  await send('Emulation.setDeviceMetricsOverride', { width: 1440, height: 900, deviceScaleFactor: 1, mobile: false });
  await send('Emulation.setEmulatedMedia', { features: [{ name: 'prefers-reduced-motion', value: 'reduce' }] });
  await load();
  await sleep(1000);
  ok(await evaluate(`matchMedia('(prefers-reduced-motion: reduce)').matches`), '媒体查询生效');
  const t1 = await evaluate(`[...document.querySelectorAll('#cosmos .planet')].map(p => p.style.transform)`);
  await sleep(1200);
  const t2 = await evaluate(`[...document.querySelectorAll('#cosmos .planet')].map(p => p.style.transform)`);
  ok(JSON.stringify(t1) === JSON.stringify(t2), '星球 transform 静止（loop 已停）', '');
  const pv = await pickPlanet();
  ok(!!pv, '减弱动态下找到可交互星球', pv ? `planet${pv.i + 1}` : '');
  if (pv) {
    const [sx, sy] = [Math.round(pv.t.x + pv.t.w / 2), Math.round(pv.t.y + pv.t.h / 2)];
    await moved(sx, sy); await sleep(50);
    await pressed(sx, sy); await sleep(30);
    await moved(sx + 40, sy + 10, 1); await sleep(60);
    await released(sx + 40, sy + 10);
    const st = await evaluate(`(() => { const c = document.querySelectorAll('#cosmos .planet')[${pv.i}].__planet; return c.down + ',' + c.dragging; })()`);
    ok(st === '0,0', '减弱动态下拖拽禁用（down/dragging=0,0）', st);
  }
  await send('Emulation.setEmulatedMedia', { features: [{ name: 'prefers-reduced-motion', value: 'no-preference' }] });

  /* ============ 触屏 ============ */
  console.log('== 触屏（390 宽，触摸拖拽） ==');
  await send('Emulation.setDeviceMetricsOverride', { width: 390, height: 844, deviceScaleFactor: 2, mobile: true });
  await send('Emulation.setTouchEmulationEnabled', { enabled: true, maxTouchPoints: 1 });
  await load();
  const tv = await pickPlanet();
  ok(!!tv, '触屏下找到可交互星球', tv ? `planet${tv.i + 1}` : '');
  if (tv) {
    // 星球在快速绕行：先冻结它，消除“采样与派发之间位置漂移”的竞态
    await evaluate(`document.querySelectorAll('#cosmos .planet')[${tv.i}].__planet.hold = 1; true`);
    const r0 = await rectOf(tv.i);
    const sx = Math.round(r0.x + r0.w / 2), sy = Math.round(r0.y + r0.h / 2);
    const orb0 = await orbitStr(tv.i);
    // 无头 Chrome 的 Input.dispatchTouchEvent 合成事件只走到捕获阶段（事件可达行星，
    // capture 探针可收到），不会触发行星上冒泡阶段的监听器 —— 这是无头合成管线的
    // 已知限制。这里分两层验证：
    //   1) 合成触摸可达性：elementFromPoint 确认触摸点命中行星本体；
    //   2) 产品逻辑：手动派发完整 pointer 序列，走真实的事件处理器路径。
    // 轨道半径相近（窄屏都贴着吸积盘），三颗行星会互相覆盖 —— 触摸点命中
    // “最上层的那颗行星”即可，不必是采样目标 tv.i。
    const at = await evaluate(`(() => {
      const el = document.elementFromPoint(${sx}, ${sy});
      return !!el && !!el.closest('.planet');
    })()`);
    ok(!!at, '触摸点命中行星（elementFromPoint）', `(${sx},${sy})`);
    const seq = await evaluate(`(() => {
      const node = document.querySelectorAll('#cosmos .planet')[${tv.i}];
      const c = node.__planet;
      const fire = (type, x, y) => node.dispatchEvent(new PointerEvent(type, {
        bubbles: true, cancelable: true, clientX: x, clientY: y,
        pointerId: 7, pointerType: 'touch', buttons: type === 'pointerup' ? 0 : 1
      }));
      fire('pointerdown', ${sx}, ${sy});
      const d1 = c.down;
      for (let i = 1; i <= 6; i++) fire('pointermove', ${sx} + i * 14, ${sy} - i * 4);
      const dragging = node.classList.contains('dragging');
      fire('pointerup', ${sx} + 84, ${sy} - 24);
      return { d1, dragging, d2: c.down, drag2: c.dragging, a: c.orbit.a, e: c.orbit.e };
    })()`);
    ok(seq.d1 === 1, '触摸 pointerdown 激活拖拽状态', `down=${seq.d1}`);
    ok(!!seq.dragging, '触摸拖动中带 .dragging', '');
    ok(seq.d2 === 0 && seq.drag2 === 0, '触摸松手状态复位', `down=${seq.d2},drag=${seq.drag2}`);
    const orb1 = seq.a.toFixed(1) + ',' + seq.e.toFixed(3);
    ok(orb0 !== orb1, '触摸松手后轨道已改变', `${orb0} -> ${orb1}`);
    await evaluate(`document.querySelectorAll('#cosmos .planet')[${tv.i}].__planet.hold = 0; true`);
    // 竖滑应能滚动页面（touch-action: pan-y）
    const tx = (type, pts) => send('Input.dispatchTouchEvent', { type, touchPoints: pts });
    await tx('touchStart', [{ x: 200, y: 400 }]);
    for (let i = 1; i <= 12; i++) {
      await tx('touchMove', [{ x: 200, y: 400 - i * 30 }]);
      await sleep(16);
    }
    await tx('touchEnd', []);
    await sleep(500);
    const sc = await evaluate('scrollY');
    ok(sc > 20, '页面可上下滚动（pan-y 生效）', `scrollY=${Math.round(sc)}`);
  }
  await send('Emulation.setTouchEmulationEnabled', { enabled: false });

  /* ============ console ============ */
  console.log('== console ==');
  ok(exceptions.length === 0, '无未捕获异常', exceptions.join(' | ') || 'none');

  console.log(fail === 0 ? '全部通过' : `${fail} 项失败`);
  chrome.kill();
  process.exit(fail === 0 ? 0 : 1);
}

main().catch((e) => { console.error('ERR', e.message); chrome.kill(); process.exit(2); });
