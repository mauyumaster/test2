// 首页恒星系交互的自动化验证：用 Chrome DevTools Protocol 直接驱动无头 Chrome。
// 用法：node shot_homepage.mjs [调试端口] [URL]  （默认 9222 / http://127.0.0.1:8765/）
// 报告：打印各检查项 PASS/FAIL，失败时非零退出。
// 关键：每段交互前重载页面，重置 CDP 鼠标状态机（无头 Chrome 的输入状态不随导航重置）；
//       断言基于页面内部状态（class / __planet），不依赖注入监听器。
import { spawn } from 'node:child_process';
import { mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const PORT = process.argv[2] || '9222';
const URL = process.argv[3] || 'http://127.0.0.1:8765/';
const CHROME = 'C:/Program Files/Google/Chrome/Application/chrome.exe';

const userData = mkdtempSync(join(tmpdir(), 'hp-cdp-'));
const chrome = spawn(CHROME, [
  '--headless=new', '--disable-gpu', '--no-first-run', '--no-default-browser-check',
  '--remote-debugging-port=' + PORT, '--user-data-dir=' + userData,
  '--disable-background-networking', '--disable-component-update',
  'about:blank'
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
  await send('Emulation.setDeviceMetricsOverride', { width: 1440, height: 900, deviceScaleFactor: 1, mobile: false });

  async function load() {
    await send('Page.navigate', { url: URL });
    await waitFor(() => evaluate('document.readyState === "complete"'), 20000, '页面加载');
    await sleep(800);
  }

  // 找一颗中心在视口内的星球（重载后星球从远点附近出发，位置较稳定）
  async function pickPlanet() {
    for (let tries = 0; tries < 30; tries++) {
      const list = await evaluate(`[...document.querySelectorAll('#cosmos .planet')].map(p => {
        const r = p.getBoundingClientRect();
        return { x: r.x, y: r.y, w: r.width, h: r.height };
      })`);
      const vw = await evaluate('innerWidth');
      let i = list.findIndex((p) => {
        const cx = p.x + p.w / 2;
        return cx > 20 && cx < vw - 20;
      });
      if (i >= 0) return { idx: i, t: list[i], vw };
      await sleep(200);
    }
    return null;
  }
  const center = (t, vw) => [
    Math.min(Math.max(t.x + t.w / 2, 6), vw - 6),
    Math.min(Math.max(t.y + t.h / 2, 6), 893),
  ];
  const moved = (x, y, buttons = 0) => send('Input.dispatchMouseEvent', { type: 'mouseMoved', x, y, buttons });
  const pressed = (x, y) => send('Input.dispatchMouseEvent', { type: 'mousePressed', x, y, button: 'left', buttons: 1, clickCount: 1 });
  const released = (x, y) => send('Input.dispatchMouseEvent', { type: 'mouseReleased', x, y, button: 'left', buttons: 0, clickCount: 1 });

  console.log('== 渲染 ==');
  await load();
  await sleep(2500); // 让星球转几帧
  const n = await evaluate(`document.querySelectorAll('#cosmos .planet').length`);
  ok(n === 3, '星球元素数量 = 3', String(n));
  ok(await evaluate(`!!document.querySelector('#hole canvas')`), '黑洞 canvas 存在');
  ok(await evaluate(`!!document.getElementById('sky')`), '星场 canvas 存在');

  const planets = await evaluate(`[...document.querySelectorAll('#cosmos .planet')].map(p => {
    const c = p.querySelector('canvas'); const g = c.getContext('2d');
    const r = p.getBoundingClientRect();
    const px = g.getImageData(Math.floor(c.width/2), Math.floor(c.height/2), 1, 1).data;
    return { x: Math.round(r.x), y: Math.round(r.y), w: Math.round(r.width), h: Math.round(r.height),
             centerA: px[3], visible: r.width > 0 && r.height > 0 && getComputedStyle(p).opacity > 0.1 };
  })`);
  for (const [i, pl] of planets.entries()) {
    ok(pl.visible && pl.centerA > 0,
      `星球${i + 1} 画布有内容且可见`, `pos=(${pl.x},${pl.y}) size=${pl.w}x${pl.h} centerA=${pl.centerA}`);
  }
  const viewW = await evaluate('innerWidth');
  const onScreen = planets.filter((p) => p.x < viewW && p.x + p.w > 0);
  ok(onScreen.length >= 1, '至少 1 颗星球与视口相交', `${onScreen.length}/3`);
  // 轨道要素应非退化：RH>0 时 a 至少 ~170
  const orbitA = await evaluate(`[...document.querySelectorAll('#cosmos .planet')].map(p => Math.round(p.__planet.orbit.a))`);
  ok(orbitA.every((a) => a > 160), '轨道半长轴正常（非 RH=0 塌缩）', orbitA.join(','));

  console.log('== 悬停 ==');
  await load();
  const hv = await pickPlanet();
  ok(!!hv, '星球在视口内可供交互', hv ? `planet${hv.idx + 1}` : '');
  if (hv) {
    const [hx, hy] = center(hv.t, hv.vw);
    await moved(hx, hy);
    const hover = await waitFor(async () => {
      const cls = await evaluate(`document.querySelectorAll('#cosmos .planet')[${hv.idx}].className`);
      return cls.includes('show-info') ? cls : null;
    }, 4000, '悬停显示信息卡');
    ok(!!hover, '悬停显示信息卡', hover);
    await moved(40, 40);
    await sleep(300);
    const unhover = await evaluate(`document.querySelectorAll('#cosmos .planet')[${hv.idx}].className`);
    ok(!unhover.includes('show-info'), '移开后卡片隐藏', unhover);
  }

  console.log('== 拖拽（改变轨道） ==');
  await load();
  const dv = await pickPlanet();
  ok(!!dv, '星球在视口内可供拖拽', dv ? `planet${dv.idx + 1}` : '');
  if (dv) {
    const orb0 = await evaluate(`(() => {
      const o = document.querySelectorAll('#cosmos .planet')[${dv.idx}].__planet.orbit;
      return o.a.toFixed(1) + ',' + o.e.toFixed(3) + ',' + o.w.toFixed(3);
    })()`);
    const [sx, sy] = center(dv.t, dv.vw);
    await moved(sx, sy);
    await sleep(50);
    await pressed(sx, sy);
    for (let i = 1; i <= 8; i++) { await moved(sx + i * 16, sy - i * 6, 1); await sleep(22); }
    const during = await evaluate(`document.querySelectorAll('#cosmos .planet')[${dv.idx}].className`);
    ok(during.includes('dragging'), '拖动中带 .dragging', during);
    await released(sx + 128, sy - 48);
    await sleep(250);
    const afterUp = await evaluate(`(() => {
      const c = document.querySelectorAll('#cosmos .planet')[${dv.idx}].__planet;
      return 'down=' + c.down + ' dragging=' + c.dragging + ' sup=' + c.sup;
    })()`);
    console.log('  [诊断] released 后内部状态:', afterUp);
    const pos1 = await evaluate(`(() => { const r = document.querySelectorAll('#cosmos .planet')[${dv.idx}].getBoundingClientRect(); return r.x + ',' + r.y; })()`);
    await sleep(700);
    const pos2 = await evaluate(`(() => { const r = document.querySelectorAll('#cosmos .planet')[${dv.idx}].getBoundingClientRect(); return r.x + ',' + r.y; })()`);
    ok(pos1 !== pos2, '松手后沿新轨道继续运动', `${pos1} -> ${pos2}`);
    const orb1 = await evaluate(`(() => {
      const o = document.querySelectorAll('#cosmos .planet')[${dv.idx}].__planet.orbit;
      return o.a.toFixed(1) + ',' + o.e.toFixed(3) + ',' + o.w.toFixed(3);
    })()`);
    ok(orb0 !== orb1, '轨道要素已注入', `${orb0} -> ${orb1}`);
  }

  console.log('== 点击（不拖动） ==');
  await load();
  const cv = await pickPlanet();
  ok(!!cv, '重载后星球进入视口', cv ? `planet${cv.idx + 1}` : '');
  if (cv) {
    const [cx2, cy2] = center(cv.t, cv.vw);
    await moved(cx2, cy2);
    await sleep(50);
    await pressed(cx2, cy2);
    await sleep(50);
    await released(cx2, cy2);
    await waitFor(async () => {
      const href = await evaluate('location.href');
      return /midnight-store|rainy-store|indexdemo/.test(href) ? href : null;
    }, 8000, '点击跳转');
    const href = await evaluate('location.href');
    ok(/midnight-store|rainy-store|indexdemo/.test(href), '点击星球跳转到对应作品', href);
  }

  console.log('== console ==');
  ok(exceptions.length === 0, '无未捕获异常', exceptions.join(' | ') || 'none');

  console.log(fail === 0 ? '全部通过' : `${fail} 项失败`);
  chrome.kill();
  process.exit(fail === 0 ? 0 : 1);
}

main().catch((e) => { console.error('ERR', e.message); chrome.kill(); process.exit(2); });
