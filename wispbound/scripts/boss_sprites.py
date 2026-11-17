"""Original WISPBOUND boss sprite sheets (4 frames of 48x64), drawn from code as pixel art.
Run: python3 scripts/boss_sprites.py  -> dist/assets/world/<boss>-sheet.svg
"""
import math, pathlib
OUT = pathlib.Path(__file__).resolve().parents[1] / 'dist' / 'assets' / 'world'
INK = '#10121e'

class Canvas:
    def __init__(self, w=48, h=64):
        self.w, self.h, self.p = w, h, {}
    def px(self, x, y, c):
        x, y = int(round(x)), int(round(y))
        if 0 <= x < self.w and 0 <= y < self.h:
            if c is None: self.p.pop((x, y), None)
            else: self.p[(x, y)] = c
    def rect(self, x, y, w, h, c):
        for yy in range(int(y), int(y + h)):
            for xx in range(int(x), int(x + w)): self.px(xx, yy, c)
    def ellipse(self, cx, cy, rx, ry, c):
        for yy in range(int(cy - ry - 1), int(cy + ry + 2)):
            for xx in range(int(cx - rx - 1), int(cx + rx + 2)):
                if ((xx - cx) / max(rx, .1)) ** 2 + ((yy - cy) / max(ry, .1)) ** 2 <= 1: self.px(xx, yy, c)
    def poly(self, pts, c):
        ys = [p[1] for p in pts]
        for yy in range(int(min(ys)), int(max(ys)) + 1):
            xs = []
            for i in range(len(pts)):
                (x0, y0), (x1, y1) = pts[i], pts[(i + 1) % len(pts)]
                if (y0 <= yy + .5 < y1) or (y1 <= yy + .5 < y0):
                    xs.append(x0 + (yy + .5 - y0) * (x1 - x0) / (y1 - y0))
            xs.sort()
            for a, b in zip(xs[::2], xs[1::2]):
                for xx in range(int(math.ceil(a - .5)), int(math.floor(b - .5)) + 1): self.px(xx, yy, c)
    def line(self, x0, y0, x1, y1, c, t=1):
        n = int(max(abs(x1 - x0), abs(y1 - y0))) + 1
        for i in range(n + 1):
            x, y = x0 + (x1 - x0) * i / n, y0 + (y1 - y0) * i / n
            self.rect(round(x - (t - 1) / 2), round(y - (t - 1) / 2), t, t, c)
    def outline(self, c=INK):
        filled = set(self.p)
        for (x, y) in list(filled):
            for dx, dy in ((1, 0), (-1, 0), (0, 1), (0, -1)):
                q = (x + dx, y + dy)
                if q not in filled and 0 <= q[0] < self.w and 0 <= q[1] < self.h: self.p[q] = c

def sheet(name, draw, frames=4, w=48, h=64):
    runs = []
    for f in range(frames):
        cv = Canvas(w, h); draw(cv, f); cv.outline()
        for y in range(h):
            x = 0
            while x < w:
                c = cv.p.get((x, y))
                if c is None: x += 1; continue
                start = x
                while x < w and cv.p.get((x, y)) == c: x += 1
                runs.append(f'<rect x="{start + f * w}" y="{y}" width="{x - start}" height="1" fill="{c}"/>')
    svg = f'<svg xmlns="http://www.w3.org/2000/svg" width="{w * frames}" height="{h}" viewBox="0 0 {w * frames} {h}" shape-rendering="crispEdges">' + ''.join(runs) + '</svg>'
    (OUT / f'{name}-sheet.svg').write_text(svg)
    return len(svg)

def scarecrow(c, f):
    sway = [0, 1, 0, -1][f]; flick = f % 2
    # pole and straw base
    c.rect(22, 40, 4, 22, '#6a4a2f'); c.rect(23, 40, 1, 22, '#8a6440')
    for i, x in enumerate(range(15, 34, 3)): c.line(x, 63, x + (i % 3 - 1) * 2, 57, '#d9b864')
    # crossbar arms with sleeves and straw hands
    c.rect(3, 23 + sway, 42, 3, '#5a3f2a')
    c.poly([(8, 21 + sway), (20, 21), (20, 28), (6, 29 + sway)], '#56603a')
    c.poly([(28, 21), (40, 21 - sway), (42, 29 - sway), (28, 28)], '#56603a')
    for x0, dy in ((3, sway), (41, -sway)):
        for k in range(4): c.line(x0 + 2, 25 + dy, x0 - 2 + k * 2, 31 + dy + (k % 2), '#e3c46c')
    # tattered coat
    hem = [46, 49, 45, 48, 44, 49, 46][f % 2:] + [47]
    pts = [(14, 21), (34, 21), (36, 44)]
    for i, x in enumerate(range(35, 12, -3)): pts.append((x, hem[i % len(hem)] + (1 if (i + f) % 2 else 0)))
    pts.append((12, 44)); c.poly(pts, '#4b5631')
    c.poly([(17, 22), (24, 30), (31, 22)], '#3a4426')  # collar shade
    c.rect(17, 31, 2, 2, '#7b5b33'); c.rect(29, 36, 3, 2, '#7b5b33')  # patches
    c.rect(23, 32, 2, 1, '#d8c493'); c.rect(23, 37, 2, 1, '#d8c493')  # buttons
    # neck straw
    for k in range(5): c.line(20 + k * 2, 22, 19 + k * 2 + (k % 2) * 2, 26, '#e3c46c')
    # sack head
    c.ellipse(24, 15, 8, 8, '#c4a46b'); c.ellipse(26, 13, 4, 4, '#d4b67e')
    c.line(19, 19, 29, 19, '#5b3b28');
    for x in range(19, 30, 2): c.px(x, 18, '#5b3b28'); c.px(x, 20, '#5b3b28')
    eye = '#ff9d3b' if flick else '#ffcf6b'
    c.rect(19, 13, 3, 2, '#1c1310'); c.rect(26, 13, 3, 2, '#1c1310'); c.px(20, 13, eye); c.px(27, 13, eye)
    # hat
    c.rect(9, 8, 30, 3, '#3a2c2a'); c.poly([(16, 8), (31, 8), (29, 1), (21, 0), (17, 2)], '#46352f')
    c.rect(17, 6, 14, 2, '#8a3b2c')
    # crow on the right arm
    cx, cy = 37, 19 - sway
    c.ellipse(cx, cy, 3, 2, '#23202b'); c.ellipse(cx + 2, cy - 2, 2, 2, '#23202b'); c.px(cx + 4, cy - 2, '#e6a64a'); c.px(cx + 2, cy - 3, '#ff5a4a')
    c.line(cx - 3, cy, cx - 5, cy + 1 + flick, '#23202b')

def werewolf(c, f):
    step = [0, 1, 0, -1][f]
    fur, dark, light = '#6f6a7c', '#4b4757', '#a7a2b4'
    # legs
    c.poly([(14, 46), (21, 46), (20, 56 + step), (17, 62), (12, 62), (15, 55)], dark)
    c.poly([(27, 46), (34, 46), (33, 55), (36, 62), (31, 62), (28, 56 - step)], dark)
    for x in (12, 14, 16, 31, 33, 35): c.px(x, 63, '#e8e2d0')
    # torso
    c.ellipse(24, 36, 13, 12, fur); c.ellipse(24, 38, 7, 8, light); c.ellipse(24, 30, 15, 5, fur)
    for x in range(12, 37, 3): c.line(x, 26, x + 1, 22 + (x % 2), fur)  # mane spikes
    # arms
    for side in (-1, 1):
        sx = 24 + side * 13; sw = step * side
        c.poly([(sx - 3, 28), (sx + 3, 28), (sx + side * 4 + 2, 50 + sw), (sx + side * 4 - 3, 50 + sw)], fur)
        for k in range(3): c.line(sx + side * 4 - 2 + k * 2, 50 + sw, sx + side * 4 - 3 + k * 2 + side, 55 + sw, '#e8e2d0')
    # chain collar
    for x in range(16, 33, 2): c.px(x, 28, '#b9bccb'); c.px(x + 1, 29, '#7d8091')
    # head and snout
    c.ellipse(24, 17, 9, 8, fur)
    c.poly([(16, 12), (14, 2), (20, 8)], fur); c.poly([(32, 12), (34, 2), (28, 8)], fur)
    c.px(15, 5, '#c98d9a'); c.px(33, 5, '#c98d9a')
    c.poly([(19, 19), (29, 19), (28, 27), (20, 27)], light)
    c.rect(21, 25, 7, 2, '#2a1820'); c.px(21, 24, '#f4efe0'); c.px(27, 24, '#f4efe0'); c.px(22, 27, '#f4efe0'); c.px(26, 27, '#f4efe0')
    c.rect(23, 19, 3, 2, '#1c1418')
    eye = '#ff4a4a' if f % 2 else '#ff8a6a'
    c.rect(18, 14, 3, 2, eye); c.rect(27, 14, 3, 2, eye)

def kaukas(c, f):
    glow = f % 2; bob = [0, -1, 0, 1][f]
    # boots and legs
    c.rect(17, 57, 5, 5, '#2d2420'); c.rect(26, 57, 5, 5, '#2d2420')
    # cloak
    c.poly([(14, 32 + bob), (34, 32 + bob), (37, 57), (11, 57)], '#6b4f35')
    c.rect(15, 46, 4, 3, '#8a6a42'); c.rect(29, 51, 4, 3, '#4f6b3a')
    # beard
    c.poly([(16, 30 + bob), (32, 30 + bob), (27, 47 + bob), (24, 50 + bob), (21, 47 + bob)], '#ded6bc')
    c.line(24, 33 + bob, 24, 47 + bob, '#bfb69a')
    # hood
    c.poly([(24, 3 + bob), (37, 32 + bob), (11, 32 + bob)], '#4f6b3a'); c.poly([(24, 3 + bob), (28, 14 + bob), (22, 20 + bob)], '#668a4b')
    c.ellipse(24, 26 + bob, 8, 5, '#1b211c')
    eye = '#ffe27a' if glow else '#ffc84a'
    c.rect(20, 25 + bob, 2, 2, eye); c.rect(26, 25 + bob, 2, 2, eye)
    c.rect(23, 28 + bob, 2, 1, '#c98d6a')
    # raised arm with the stolen lantern
    c.line(33, 36 + bob, 39, 27 + bob, '#6b4f35', 2)
    lx, ly = 40, 20 + bob
    c.rect(lx - 3, ly - 1, 7, 1, '#2b2b2b'); c.rect(lx - 3, ly, 1, 9, '#2b2b2b'); c.rect(lx + 3, ly, 1, 9, '#2b2b2b'); c.rect(lx - 3, ly + 9, 7, 1, '#2b2b2b')
    c.rect(lx - 2, ly, 5, 9, '#ffd36b'); c.rect(lx - 1, ly + 2, 3, 5, '#fff3c0')
    c.line(lx, ly - 4, lx, ly - 2, '#2b2b2b')
    for i in range(6):
        a = i * math.pi / 3 + glow * .5
        c.px(lx + math.cos(a) * (8 + glow), ly + 4 + math.sin(a) * (8 + glow), '#ffe9a0')

def stonebreather(c, f):
    breathe = [0, 1, 2, 1][f]
    rock, dark, light, glow = '#6f7e88', '#47535c', '#9bb6c9', '#8fe3ff' if f % 2 else '#c2f2ff'
    # legs
    c.ellipse(15, 58, 6, 5, dark); c.ellipse(33, 58, 6, 5, dark)
    # body
    c.ellipse(24, 38, 17, 17, rock); c.ellipse(19, 32, 9, 7, light); c.ellipse(30, 46, 9, 6, dark)
    # moss
    for x, y in ((10, 30), (12, 29), (35, 27), (37, 28), (22, 23), (24, 22)): c.rect(x, y, 2, 1, '#5f8a4a')
    # glowing cracks
    for pts in (((16, 40), (20, 44), (19, 50)), ((30, 34), (34, 38), (38, 37)), ((24, 46), (26, 52))):
        for a, b in zip(pts, pts[1:]): c.line(*a, *b, glow)
    # fists
    c.ellipse(6, 41 - breathe // 2, 5, 6, rock); c.ellipse(41, 41 - breathe // 2, 5, 6, rock)
    c.ellipse(5, 39 - breathe // 2, 2, 2, light); c.ellipse(40, 39 - breathe // 2, 2, 2, light)
    # head
    c.ellipse(24, 15, 11, 9, rock); c.ellipse(21, 12, 5, 4, light)
    c.rect(17, 13, 4, 2, glow); c.rect(27, 13, 4, 2, glow)
    c.ellipse(24, 20 + breathe // 2, 4, 1 + breathe, '#151a20')
    if breathe:
        for i in range(breathe + 2): c.px(22 + i * 2, 24 + breathe + (i % 2), '#c9c1ad')

def miller(c, f):
    sway = [0, 1, 0, -1][f]; skin, coat = '#9fb8b0', '#3e5a5a'
    c.rect(16, 56, 6, 6, '#2a2420'); c.rect(27, 56, 6, 6, '#2a2420')
    c.poly([(11, 28), (37, 28), (39, 57), (9, 57)], coat); c.rect(22, 30, 4, 26, '#2e4646')
    for x in (12, 18, 30, 35): c.line(x, 50, x + (1 if x % 2 else -1), 58 + sway, '#3f7a50')
    c.poly([(36, 30 + sway), (46, 34 + sway), (44, 50 + sway), (34, 46 + sway)], '#d8d0b8'); c.rect(38, 38 + sway, 5, 1, '#8a7a5a')
    c.ellipse(24, 18, 9, 9, skin); c.rect(15, 9, 18, 4, '#5a5048'); c.rect(18, 4, 12, 6, '#5a5048')
    c.rect(19, 17, 3, 2, '#e8f8ff' if f % 2 else '#bfe8ff'); c.rect(26, 17, 3, 2, '#e8f8ff' if f % 2 else '#bfe8ff')
    c.poly([(18, 22), (30, 22), (27, 30), (21, 30)], '#c8d0c8'); c.px(24, 32 + sway, '#7ac8e8'); c.px(14, 30 - sway, '#7ac8e8')

def laume(c, f):
    flow = [0, 1, 2, 1][f]; hair, dress = '#3fb8b0', '#d8eef0'
    c.poly([(16, 26), (32, 26), (38, 60), (10, 60)], dress); c.poly([(18, 30), (30, 30), (34, 60), (14, 60)], '#bfe0e8')
    for x in range(11, 38, 4): c.line(x, 58, x + flow - 1, 63, '#8fd8e8')
    c.poly([(12, 12), (36, 12), (40 + flow, 46), (34, 40), (14, 40), (8 - flow, 46)], hair)
    c.ellipse(24, 16, 7, 8, '#e8f4f0'); c.rect(20, 15, 2, 2, '#4ae0ff'); c.rect(26, 15, 2, 2, '#4ae0ff'); c.rect(23, 20, 2, 1, '#8ab0b8')
    for x, y in ((10, 20), (38, 24), (8, 34)): c.rect(x, y + flow, 2, 3, '#6ad8ff')
    c.line(16, 32, 8, 26 - flow, '#e8f4f0', 2); c.line(32, 32, 40, 26 + flow, '#e8f4f0', 2)

def witch(c, f):
    glow = f % 2
    c.poly([(12, 30), (36, 30), (40, 60), (8, 60)], '#4a2a5a'); c.poly([(14, 34), (24, 30), (22, 60), (10, 60)], '#5a3a6a')
    c.ellipse(24, 22, 8, 8, '#a8b89a'); c.poly([(10, 16), (38, 16), (30, 12), (26, 0), (20, 8)], '#2a1a34'); c.rect(8, 15, 32, 3, '#2a1a34')
    c.rect(19, 21, 3, 2, '#e07aff' if glow else '#b04ae0'); c.rect(26, 21, 3, 2, '#e07aff' if glow else '#b04ae0'); c.poly([(23, 24), (27, 24), (24, 29)], '#8a9a7a')
    c.line(34, 36, 42, 28, '#4a2a5a', 2); c.ellipse(43, 25, 4, 5, '#c8d8f0'); c.ellipse(43, 25, 2, 3, '#ffffff' if glow else '#e8f0ff')
    for x in range(12, 37, 6): c.px(x, 46 + (x % 4), '#c49bff')

def heron(c, f):
    step = [0, 1, 0, -1][f]; glass, shade = '#bfe8ff', '#7ab8e0'
    c.line(20, 44, 18 + step, 63, '#5a7a9a'); c.line(28, 44, 30 - step, 63, '#5a7a9a')
    c.ellipse(24, 38, 11, 8, glass); c.poly([(14, 36), (6, 30 + step), (10, 42)], shade); c.poly([(34, 36), (42, 30 - step), (38, 42)], shade)
    c.line(24, 31, 22, 16, glass, 3); c.ellipse(22, 13, 4, 4, glass); c.poly([(25, 12), (36, 15), (25, 15)], '#f0e0a0')
    c.px(21, 12, '#2a3a5a'); c.line(18, 10, 13, 6, '#e8f8ff')
    for x, y in ((18, 36), (28, 40), (24, 34)): c.px(x, y, '#ffffff')

def antlerking(c, f):
    sway = [0, 1, 0, -1][f]; bark, moss = '#5a4430', '#5f8a4a'
    c.rect(17, 52, 5, 10, bark); c.rect(27, 52, 5, 10, bark)
    c.poly([(13, 26), (35, 26), (37, 54), (11, 54)], bark); c.poly([(9, 28), (13, 26), (11, 58), (5, 56)], moss); c.poly([(39, 28), (35, 26), (37, 58), (43, 56)], moss)
    c.ellipse(24, 18, 7, 8, '#6a5038'); c.rect(20, 17, 2, 2, '#9fff7a'); c.rect(26, 17, 2, 2, '#9fff7a')
    for side in (-1, 1):
        x0 = 24 + side * 5; c.line(x0, 11, x0 + side * 10, 1 + sway, '#d8c8a0', 2); c.line(x0 + side * 5, 6, x0 + side * 12, 8, '#d8c8a0'); c.line(x0 + side * 8, 3, x0 + side * 9, -1, '#d8c8a0')
    for y in (32, 40, 48): c.line(16, y, 32, y + 1, '#4a3424')

def serpentking(c, f):
    roll = [0, 1, 2, 1][f]; scale, belly = '#3f7a3a', '#c8d890'
    c.ellipse(24, 54, 18, 7, scale); c.ellipse(24, 46, 15, 6, '#4a8a42'); c.ellipse(24, 39, 12, 5, scale)
    for x in range(10, 39, 4): c.px(x, 54 + (x % 3) - 1, '#2a5a2a')
    c.line(24, 36, 22 + roll, 20, scale, 6); c.ellipse(22 + roll, 16, 7, 6, '#4a8a42'); c.rect(18 + roll, 15, 2, 2, '#ffe86a'); c.rect(25 + roll, 15, 2, 2, '#ffe86a')
    c.line(22 + roll, 21, 22 + roll, 24, '#e04a4a'); c.px(21 + roll, 25, '#e04a4a'); c.px(23 + roll, 25, '#e04a4a')
    c.rect(17 + roll, 7, 11, 3, '#e8b84a'); c.px(17 + roll, 5, '#e8b84a'); c.px(22 + roll, 4, '#e8b84a'); c.px(27 + roll, 5, '#e8b84a'); c.px(22 + roll, 8, '#e04a4a')
    c.line(24, 30, 24, 50, belly)

if __name__ == '__main__':
    for name, draw in (('scarecrow', scarecrow), ('werewolf', werewolf), ('kaukas', kaukas), ('stonebreather', stonebreather), ('miller', miller), ('laume', laume), ('witch', witch), ('heron', heron), ('antlerking', antlerking), ('serpentking', serpentking)):
        print(name, sheet(name, draw), 'bytes')
