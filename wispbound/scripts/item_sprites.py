"""32x32 icons for V0.2.1 weapons and artifacts. Run: python3 scripts/item_sprites.py"""
import pathlib, sys, math
sys.path.insert(0, str(pathlib.Path(__file__).parent))
from boss_sprites import Canvas
ROOT = pathlib.Path(__file__).resolve().parents[1] / 'dist' / 'assets'
INK = '#101924'
def save(folder, name, draw):
    cv = Canvas(32, 32); draw(cv); cv.outline(INK); runs = []
    for y in range(32):
        x = 0
        while x < 32:
            c = cv.p.get((x, y))
            if c is None: x += 1; continue
            s = x
            while x < 32 and cv.p.get((x, y)) == c: x += 1
            runs.append(f'<rect x="{s}" y="{y}" width="{x - s}" height="1" fill="{c}"/>')
    (ROOT / folder / f'{name}.svg').write_text('<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 32 32" shape-rendering="crispEdges">' + ''.join(runs) + '</svg>')
W = {}
def w(f): W[f.__name__] = f; return f
@w
def smith_cleaver(c):
    c.line(7, 26, 15, 18, '#6a4a2e', 3); c.poly([(13, 20), (24, 5), (29, 9), (19, 24)], '#c9d0d8'); c.poly([(24, 5), (29, 9), (27, 11), (22, 7)], '#ffffff'); c.line(14, 19, 22, 9, '#8a939e'); c.rect(5, 26, 4, 3, '#3a2a1a')
@w
def frost_distaff(c):
    c.line(8, 29, 20, 9, '#7a8aa0', 2); c.poly([(20, 2), (25, 8), (20, 14), (15, 8)], '#a9e6ff'); c.poly([(20, 4), (22, 8), (20, 11), (18, 8)], '#ffffff')
    for a in range(6): c.px(20 + round(math.cos(a) * 8), 8 + round(math.sin(a) * 8), '#d8f6ff')
@w
def viper_censer(c):
    c.line(16, 1, 16, 9, '#8a8a7a'); c.ellipse(16, 17, 9, 7, '#6a7a3a'); c.ellipse(16, 15, 7, 3, '#8a9a4a'); c.rect(9, 16, 14, 2, '#3a4a1a')
    c.line(9, 12, 6, 5, '#4f8a3a', 2); c.px(5, 4, '#ff4a4a'); c.px(7, 4, '#ff4a4a')
    for x, y in ((12, 26), (17, 28), (21, 25), (14, 30)): c.ellipse(x, y, 2, 1, '#8be36a')
@w
def thunder_drum(c):
    c.ellipse(16, 12, 12, 5, '#d8c8a0'); c.rect(4, 12, 25, 12, '#8a3a2a'); c.ellipse(16, 24, 12, 5, '#6a2a1e')
    for x in range(6, 28, 5): c.line(x, 13, x + 3, 22, '#e8d090')
    c.poly([(17, 2), (12, 10), (16, 10), (13, 17), (21, 7), (17, 7)], '#ffe86a')
@w
def rowan_bow(c):
    for i in range(24): c.px(9 + round(4 * math.sin(i / 23 * math.pi)), 4 + i, '#8a5a34'); c.px(10 + round(4 * math.sin(i / 23 * math.pi)), 4 + i, '#6a4224')
    c.line(9, 4, 9, 27, '#e8e2d0'); c.line(6, 16, 28, 16, '#c9a070'); c.poly([(28, 16), (24, 13), (24, 19)], '#c9ced6')
    c.rect(5, 15, 3, 1, '#e05a4a'); c.rect(5, 17, 3, 1, '#e05a4a'); c.px(14, 9, '#e05a4a'); c.px(15, 11, '#e05a4a')
@w
def grave_scythe(c):
    c.line(10, 30, 18, 4, '#5a4430', 2)
    for i in range(16): c.px(18 - i, 4 + round(5 * math.sin(i / 15 * math.pi)), '#c8d0e0'); c.px(18 - i, 5 + round(5 * math.sin(i / 15 * math.pi)), '#8a94a8')
    c.line(3, 6, 5, 9, '#ffffff'); c.ellipse(24, 24, 4, 4, '#e8e2d0'); c.rect(22, 23, 2, 2, '#101924'); c.rect(26, 23, 1, 2, '#101924')
@w
def hail_sling(c):
    c.line(4, 6, 14, 22, '#8a6a46'); c.line(28, 6, 18, 22, '#8a6a46'); c.ellipse(16, 23, 5, 3, '#6a4a2e')
    for x, y, r in ((16, 21, 3), (8, 9, 2), (24, 8, 2), (16, 6, 2)): c.ellipse(x, y, r, r, '#dfe8f0'); c.px(x - 1, y - 1, '#ffffff')
A = {}
def a(f): A[f.__name__] = f; return f
@a
def lodestone(c):
    c.poly([(8, 6), (14, 6), (14, 20), (18, 20), (18, 6), (24, 6), (24, 21), (16, 28), (8, 21)], '#c04a3a'); c.rect(8, 6, 6, 4, '#d8dce4'); c.rect(18, 6, 6, 4, '#d8dce4'); c.px(16, 25, '#ff8a6a')
@a
def fortune_coin(c):
    c.ellipse(16, 16, 11, 11, '#e8b84a'); c.ellipse(16, 16, 8, 8, '#f6d47a'); c.rect(15, 9, 2, 14, '#b8862a'); c.rect(12, 12, 8, 2, '#b8862a'); c.rect(12, 18, 8, 2, '#b8862a'); c.px(11, 8, '#ffffff')
@a
def hare_foot(c):
    c.ellipse(16, 20, 7, 8, '#e8dcc0'); c.ellipse(16, 11, 4, 5, '#d8ccb0'); c.line(16, 6, 13, 2, '#d8ccb0', 2); c.line(16, 6, 19, 2, '#d8ccb0', 2); c.rect(14, 26, 4, 3, '#8a6a46')
    for x in (12, 15, 18): c.px(x, 27, '#c97a5a')
@a
def falcon_feather(c):
    c.line(8, 28, 24, 4, '#6a4a2e'); c.poly([(24, 4), (26, 9), (14, 26), (10, 25)], '#c9a070'); c.poly([(24, 4), (20, 5), (9, 22), (10, 25)], '#8a5a34')
    for i in range(5): c.px(13 + i * 2, 21 - i * 3, '#f2e8d8')
@a
def owl_lens(c):
    c.ellipse(16, 16, 11, 11, '#6a5a3a'); c.ellipse(16, 16, 8, 8, '#9fd8ff'); c.ellipse(13, 13, 3, 3, '#e8f8ff'); c.rect(25, 24, 5, 3, '#6a5a3a'); c.line(22, 22, 29, 29, '#6a5a3a', 2)
@a
def luck_clover(c):
    for dx, dy in ((-5, -4), (5, -4), (-5, 5), (5, 5)): c.ellipse(16 + dx, 14 + dy, 5, 5, '#4f9a4a'); c.ellipse(15 + dx, 13 + dy, 2, 2, '#7ac86a')
    c.line(16, 18, 20, 30, '#3a7a3a', 2); c.px(16, 14, '#e8f070')
for n, f in W.items(): save('weapons', n, f)
for n, f in A.items(): save('artifacts', n, f)
print(len(W), 'weapons', len(A), 'artifacts')
