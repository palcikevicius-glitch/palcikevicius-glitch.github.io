"""Minimal QR Code encoder (byte mode, versions 1-10, ISO/IEC 18004) with SVG/PNG-free output.
No third-party dependency. Usage: python3 scripts/qr.py URL OUT.svg [--label "text"]
"""
import sys

# (ec codewords per block, [(blocks, data codewords per block), ...]) for versions 1-10
BLOCKS = {
    1: {'L': (7, [(1, 19)]), 'M': (10, [(1, 16)]), 'Q': (13, [(1, 13)]), 'H': (17, [(1, 9)])},
    2: {'L': (10, [(1, 34)]), 'M': (16, [(1, 28)]), 'Q': (22, [(1, 22)]), 'H': (28, [(1, 16)])},
    3: {'L': (15, [(1, 55)]), 'M': (26, [(1, 44)]), 'Q': (18, [(2, 17)]), 'H': (22, [(2, 13)])},
    4: {'L': (20, [(1, 80)]), 'M': (18, [(2, 32)]), 'Q': (26, [(2, 24)]), 'H': (16, [(4, 9)])},
    5: {'L': (26, [(1, 108)]), 'M': (24, [(2, 43)]), 'Q': (18, [(2, 15), (2, 16)]), 'H': (22, [(2, 11), (2, 12)])},
    6: {'L': (18, [(2, 68)]), 'M': (16, [(4, 27)]), 'Q': (24, [(4, 19)]), 'H': (28, [(4, 15)])},
    7: {'L': (20, [(2, 78)]), 'M': (18, [(4, 31)]), 'Q': (18, [(2, 14), (4, 15)]), 'H': (26, [(4, 13), (1, 14)])},
    8: {'L': (24, [(2, 97)]), 'M': (22, [(2, 38), (2, 39)]), 'Q': (22, [(4, 18), (2, 19)]), 'H': (26, [(4, 14), (2, 15)])},
    9: {'L': (30, [(2, 116)]), 'M': (22, [(3, 36), (2, 37)]), 'Q': (20, [(4, 16), (4, 17)]), 'H': (24, [(4, 12), (4, 13)])},
    10: {'L': (18, [(2, 68), (2, 69)]), 'M': (26, [(4, 43), (1, 44)]), 'Q': (24, [(6, 19), (2, 20)]), 'H': (28, [(6, 15), (2, 16)])},
}
ALIGN = {1: [], 2: [6, 18], 3: [6, 22], 4: [6, 26], 5: [6, 30], 6: [6, 34], 7: [6, 22, 38], 8: [6, 24, 42], 9: [6, 26, 46], 10: [6, 28, 50]}
REMAINDER = {1: 0, 2: 7, 3: 7, 4: 7, 5: 7, 6: 7, 7: 0, 8: 0, 9: 0, 10: 0}
ECC_BITS = {'L': 1, 'M': 0, 'Q': 3, 'H': 2}

EXP = [0] * 512; LOG = [0] * 256
x = 1
for i in range(255):
    EXP[i] = x; LOG[x] = i; x <<= 1
    if x & 0x100: x ^= 0x11d
for i in range(255, 512): EXP[i] = EXP[i - 255]
def gmul(a, b): return 0 if a == 0 or b == 0 else EXP[LOG[a] + LOG[b]]
def rs_ecc(data, n):
    gen = [1]
    for i in range(n):
        nxt = [0] * (len(gen) + 1)
        for j, g in enumerate(gen): nxt[j] ^= g; nxt[j + 1] ^= gmul(g, EXP[i])
        gen = nxt
    rem = list(data) + [0] * n
    for i in range(len(data)):
        c = rem[i]
        if c:
            for j in range(1, len(gen)): rem[i + j] ^= gmul(gen[j], c)
    return rem[len(data):]

def codewords(data, version, level):
    ec, groups = BLOCKS[version][level]
    capacity = sum(b * d for b, d in groups)
    bits = '0100' + format(len(data), '08b' if version < 10 else '016b') + ''.join(format(b, '08b') for b in data)
    if len(bits) > capacity * 8: return None
    bits += '0' * min(4, capacity * 8 - len(bits)); bits += '0' * (-len(bits) % 8)
    out = [int(bits[i:i + 8], 2) for i in range(0, len(bits), 8)]
    pad = [0xEC, 0x11]; i = 0
    while len(out) < capacity: out.append(pad[i % 2]); i += 1
    blocks, pos = [], 0
    for count, size in groups:
        for _ in range(count): blocks.append(out[pos:pos + size]); pos += size
    eccs = [rs_ecc(b, ec) for b in blocks]
    result = []
    for i in range(max(len(b) for b in blocks)):
        for b in blocks:
            if i < len(b): result.append(b[i])
    for i in range(ec):
        for e in eccs: result.append(e[i])
    return result

def bch(value, poly, bits):
    v = value << bits
    while v.bit_length() > bits: v ^= poly << (v.bit_length() - poly.bit_length())
    return (value << bits) | v

def matrix(version, level, cw, mask):
    n = 17 + 4 * version
    m = [[None] * n for _ in range(n)]
    def finder(r, c):
        for dr in range(-1, 8):
            for dc in range(-1, 8):
                rr, cc = r + dr, c + dc
                if 0 <= rr < n and 0 <= cc < n:
                    m[rr][cc] = (0 <= dr <= 6 and 0 <= dc <= 6) and (dr in (0, 6) or dc in (0, 6) or (2 <= dr <= 4 and 2 <= dc <= 4))
    finder(0, 0); finder(0, n - 7); finder(n - 7, 0)
    for i in range(8, n - 8): m[6][i] = m[i][6] = i % 2 == 0
    pts = ALIGN[version]
    for r in pts:
        for c in pts:
            if m[r][c] is not None: continue
            for dr in range(-2, 3):
                for dc in range(-2, 3): m[r + dr][c + dc] = max(abs(dr), abs(dc)) != 1
    m[4 * version + 9][8] = True
    reserved = [[v is not None for v in row] for row in m]
    for i in range(9):
        reserved[8][i] = reserved[i][8] = True
    for i in range(8): reserved[8][n - 1 - i] = reserved[n - 1 - i][8] = True
    if version >= 7:
        for i in range(6):
            for j in range(3): reserved[i][n - 11 + j] = reserved[n - 11 + j][i] = True
    bits = ''.join(format(b, '08b') for b in cw) + '0' * REMAINDER[version]
    idx = 0; up = True; col = n - 1
    while col > 0:
        if col == 6: col -= 1
        rows = range(n - 1, -1, -1) if up else range(n)
        for r in rows:
            for c in (col, col - 1):
                if reserved[r][c]: continue
                bit = idx < len(bits) and bits[idx] == '1'; idx += 1
                masks = [(r + c) % 2 == 0, r % 2 == 0, c % 3 == 0, (r + c) % 3 == 0, (r // 2 + c // 3) % 2 == 0,
                         (r * c) % 2 + (r * c) % 3 == 0, ((r * c) % 2 + (r * c) % 3) % 2 == 0, ((r + c) % 2 + (r * c) % 3) % 2 == 0]
                m[r][c] = bit ^ masks[mask]
        up = not up; col -= 2
    fmt = bch((ECC_BITS[level] << 3) | mask, 0x537, 10) ^ 0x5412
    fb = [(fmt >> i) & 1 == 1 for i in range(15)]
    for i in range(6): m[i][8] = fb[i]
    m[7][8] = fb[6]; m[8][8] = fb[7]; m[8][7] = fb[8]
    for i in range(9, 15): m[8][14 - i] = fb[i]
    for i in range(8): m[8][n - 1 - i] = fb[i]
    for i in range(8, 15): m[n - 15 + i][8] = fb[i]
    if version >= 7:
        vb = bch(version, 0x1F25, 12)
        for i in range(18):
            bit = (vb >> i) & 1 == 1
            m[i // 3][n - 11 + i % 3] = bit; m[n - 11 + i % 3][i // 3] = bit
    return [[bool(v) for v in row] for row in m]

def penalty(m):
    n = len(m); score = 0
    for grid in (m, [list(col) for col in zip(*m)]):
        for row in grid:
            run = 1
            for i in range(1, n):
                if row[i] == row[i - 1]: run += 1
                else:
                    if run >= 5: score += run - 2
                    run = 1
            if run >= 5: score += run - 2
            for i in range(n - 10):
                seg = row[i:i + 11]
                if seg == [True, False, True, True, True, False, True, False, False, False, False] or seg == [False, False, False, False, True, False, True, True, True, False, True]: score += 40
    for r in range(n - 1):
        for c in range(n - 1):
            if m[r][c] == m[r][c + 1] == m[r + 1][c] == m[r + 1][c + 1]: score += 3
    dark = sum(map(sum, m)); k = abs(dark * 20 - n * n * 10) // (n * n)
    return score + k * 10

def encode(text, level='M', version=None, mask=None):
    data = text.encode('utf-8')
    for v in ([version] if version else range(1, 11)):
        cw = codewords(data, v, level)
        if cw is None: continue
        options = [matrix(v, level, cw, k) for k in range(8)]
        if mask is not None: return options[mask]
        return min(options, key=penalty)
    raise ValueError('Text too long for version 1-10')

def svg(m, border=4):
    n = len(m) + 2 * border
    rects = ''.join(f'<rect x="{c + border}" y="{r + border}" width="1" height="1"/>' for r, row in enumerate(m) for c, v in enumerate(row) if v)
    return f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {n} {n}" shape-rendering="crispEdges"><rect width="{n}" height="{n}" fill="#fff"/><g fill="#000">{rects}</g></svg>'

if __name__ == '__main__':
    url, out = sys.argv[1], sys.argv[2]
    open(out, 'w').write(svg(encode(url)))
    print('QR written', out)
