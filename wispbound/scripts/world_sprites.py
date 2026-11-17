"""Per-map tree and rock sprites for V0.2.1 (48x64 trees, 32x32 rocks). Run: python3 scripts/world_sprites.py"""
import math, pathlib, sys
sys.path.insert(0, str(pathlib.Path(__file__).parent))
from boss_sprites import Canvas, OUT, INK

def save(name, draw, w, h):
    cv = Canvas(w, h); draw(cv); cv.outline()
    runs = []
    for y in range(h):
        x = 0
        while x < w:
            c = cv.p.get((x, y))
            if c is None: x += 1; continue
            s = x
            while x < w and cv.p.get((x, y)) == c: x += 1
            runs.append(f'<rect x="{s}" y="{y}" width="{x - s}" height="1" fill="{c}"/>')
    (OUT / f'{name}.svg').write_text(f'<svg xmlns="http://www.w3.org/2000/svg" width="{w}" height="{h}" viewBox="0 0 {w} {h}" shape-rendering="crispEdges">' + ''.join(runs) + '</svg>')

def pine(c):
    c.rect(22, 50, 4, 12, '#4a3424'); c.rect(23, 50, 1, 12, '#6a4a30')
    for i, (y, w) in enumerate(((4, 4), (10, 8), (17, 12), (25, 16), (33, 20), (41, 23))):
        c.poly([(24, y - 4), (24 + w, y + 9), (24 - w, y + 9)], ['#1f4a33', '#245439', '#295e3f', '#2c6643', '#2f6d47', '#2c6643'][i])
        c.poly([(24, y - 2), (24 + w * .5, y + 7), (24, y + 7)], '#3f7f52')
        for k in range(-w + 3, w - 2, 5): c.px(24 + k, y + 9, '#163626')
    c.px(24, 1, '#e8f0d8')

def birch(c):
    c.rect(21, 26, 6, 36, '#e6e2d4'); c.rect(25, 26, 2, 36, '#c4c0b2')
    for y in (30, 36, 41, 47, 52, 57): c.rect(21 + (y % 3), y, 3, 1, '#2a2a2a')
    c.line(24, 34, 33, 26, '#d8d4c6', 2); c.line(24, 40, 14, 32, '#d8d4c6', 2)
    for cx, cy, rx, ry, col in ((24, 16, 15, 12, '#8a9a3a'), (13, 26, 9, 8, '#9aaa42'), (35, 24, 10, 8, '#7e8e34'), (24, 10, 9, 7, '#b0b84a')):
        c.ellipse(cx, cy, rx, ry, col)
    for i in range(16): c.px(10 + (i * 7) % 28, 6 + (i * 11) % 24, '#d8c860' if i % 3 else '#c47a30')

def dead(c):
    c.poly([(21, 62), (27, 62), (26, 30), (22, 30)], '#3a3040')
    c.line(24, 34, 12, 22, '#3a3040', 3); c.line(13, 23, 8, 12, '#3a3040', 2); c.line(24, 30, 36, 16, '#3a3040', 3); c.line(35, 17, 42, 10, '#3a3040', 2)
    c.line(24, 30, 25, 8, '#3a3040', 2); c.line(30, 23, 34, 28, '#3a3040', 1); c.line(16, 27, 14, 31, '#3a3040', 1)
    c.rect(23, 40, 1, 14, '#52485a'); c.ellipse(24, 61, 8, 2, '#2a2433')
    for x, y in ((12, 11), (40, 9), (25, 7)): c.px(x, y, '#9fe8ff')

def willow(c):
    c.rect(21, 40, 6, 22, '#4f3a28'); c.rect(25, 40, 2, 22, '#6a4f36')
    c.ellipse(24, 20, 18, 14, '#2d5a3e'); c.ellipse(24, 16, 13, 9, '#386b49')
    for i in range(12):
        x = 8 + i * 3
        c.line(x, 24, x + (1 if i % 2 else -1), 44 + (i * 5) % 9, '#3f7a50' if i % 2 else '#2f6342')

def oak_autumn(c):
    c.rect(21, 40, 6, 22, '#4a3424'); c.rect(25, 40, 2, 22, '#6a4a30'); c.line(24, 44, 15, 36, '#4a3424', 2)
    for cx, cy, rx, ry, col in ((24, 24, 19, 15, '#9a4a26'), (15, 30, 9, 7, '#b8642c'), (33, 30, 10, 7, '#8a3a20'), (24, 16, 12, 8, '#d08a3a')):
        c.ellipse(cx, cy, rx, ry, col)
    for i in range(14): c.px(8 + (i * 9) % 32, 12 + (i * 7) % 26, '#e8b050')

def crystal_rock(c):
    c.ellipse(16, 22, 12, 8, '#4d535c'); c.ellipse(13, 19, 6, 4, '#68707b')
    c.poly([(14, 20), (17, 4), (20, 20)], '#8fd6ff'); c.poly([(17, 6), (18, 18), (16, 18)], '#e8f8ff')
    c.poly([(20, 21), (26, 9), (27, 21)], '#a98ef0'); c.poly([(8, 21), (9, 12), (13, 21)], '#7cc4ef')

for name, fn, w, h in (('tree-pine', pine, 48, 64), ('tree-birch', birch, 48, 64), ('tree-dead', dead, 48, 64), ('tree-willow', willow, 48, 64), ('tree-autumn', oak_autumn, 48, 64), ('rock-crystal', crystal_rock, 32, 32)):
    save(name, fn, w, h); print(name)
