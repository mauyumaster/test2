# -*- coding: utf-8 -*-
"""首页恒星系重构的自检脚本（本地静态断言）。

用法（在 D:\\github\\test2 下）：
    python check_homepage.py            # 只做静态断言
    python check_homepage.py --http     # 额外校验本地服务上的资源（需已起 8765 服务）

不依赖任何第三方库。失败时非零退出。
"""
import os
import re
import sys

BASE = os.path.dirname(os.path.abspath(__file__))
HTML = os.path.join(BASE, 'index.html')

failures = []


def ok(cond, msg):
    if cond:
        print('  ok  %s' % msg)
    else:
        failures.append(msg)
        print('FAIL  %s' % msg)


def main():
    with open(HTML, 'rb') as f:
        raw = f.read()
    text = raw.decode('utf-8')

    print('== 行尾 ==')
    lf = raw.count(b'\n')
    crlf = raw.count(b'\r\n')
    ok(lf == crlf and lf > 0, '纯 CRLF（%d 行，无孤立 LF）' % lf)

    print('== 结构 ==')
    for tag in ('<style', '</style>', '<script', '</script>', '<section', '</section>'):
        ok(text.count('<%s>' % tag) == text.count('</%s>' % tag),
           '%s 配对' % tag)
    ok(text.count('<div') == text.count('</div>'), 'div 配对')
    ok(text.count('<canvas') == text.count('</canvas>'), 'canvas 配对')

    ok('id="sky"' in text, '星场 canvas')
    ok('id="hole"' in text, '黑洞层')
    ok('id="cosmos"' in text, '恒星系交互层')
    planets = re.findall(r'class="planet" data-planet="([a-z]+)"', text)
    ok(planets == ['city', 'rain', 'galaxy'], '三个星球元素（%s）' % planets)
    ok(text.count('class="wlist"') == 1, '作品文字清单')
    ok(text.count('<li class="rv"') + text.count('<li class="rv"') >= 3 or text.count('<li') >= 3,
       '作品清单 3 项')

    print('== 死代码清除 ==')
    for dead in ('.pcard', '.works {', '.arw', '.cap .desc', '.tags {'):
        ok(dead not in text, '无残留 %r' % dead)

    print('== 新物理引擎 ==')
    for ident in ('injectOrbit', 'orbitOf', 'PLANETS', 'drawHole', 'holeGeom',
                  'placeInfo', 'prefers-reduced-motion'):
        ok(ident in text, '含 %s' % ident)
    ok('z-index: 2;' in text, '内容层 z-index: 2')

    print('== 引用资源存在于本地 ==')
    refs = set()
    for m in re.finditer(r'(?:src|href)="([^"#][^"]*)"', text):
        p = m.group(1)
        if p.startswith(('http', '//', '.')) or p in ('#',) or p.startswith('#'):
            continue
        if p.endswith('/'):
            p += 'index.html'
        refs.add(p)
    missing = [p for p in sorted(refs) if not os.path.exists(os.path.join(BASE, p))]
    ok(not missing, '本地文件齐全（%d 个引用）' % len(refs))
    for p in missing:
        print('      缺: %s' % p)

    if '--http' in sys.argv:
        import urllib.request
        from urllib.parse import quote
        print('== 本地服务资源 ==')
        bad = []
        for p in sorted(refs):
            url = 'http://127.0.0.1:8765/' + quote(p.replace('\\', '/'), safe='/')
            try:
                code = urllib.request.urlopen(url, timeout=5).getcode()
            except Exception as e:
                code = getattr(e, 'code', 'ERR')
            if code != 200:
                bad.append('%s -> %s' % (p, code))
        ok(not bad, '服务上全部 200')
        for b in bad:
            print('      坏: %s' % b)

    print('== 结果 ==')
    if failures:
        print('%d 项失败' % len(failures))
        sys.exit(1)
    print('全部通过')


if __name__ == '__main__':
    main()
