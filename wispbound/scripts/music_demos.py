"""WISPBOUND V0.2 music sketches: one original demo per map, the menu and a boss theme.
Pure numpy synthesis (plucked kanklės-like strings, bells, pads, voices, folk drums).
Run: python3 scripts/music_demos.py OUT_DIR  -> OUT_DIR/<name>.wav (encode with ffmpeg)
These are mood sketches for choosing a direction, not final mixes.
"""
import sys, wave, pathlib
import numpy as np

SR = 32000
RNG = np.random.default_rng(2026)
def hz(n): return 440 * 2 ** ((n - 69) / 12)
def env_adsr(n, a=.01, d=.1, s=.7, r=.2, dur=None):
    t = np.arange(n) / SR; dur = dur or n / SR
    e = np.where(t < a, t / max(a, 1e-4), np.where(t < a + d, 1 - (1 - s) * (t - a) / d, s))
    return e * np.clip((dur - t) / r, 0, 1)

def pluck(f, dur, bright=.5, decay=.996):
    n = int(dur * SR); p = max(2, int(SR / f))
    buf = RNG.uniform(-1, 1, p) * (0.6 + bright * .4); out = np.empty(n)
    for _ in range(1 + int((1 - bright) * 4)): buf = np.convolve(np.pad(buf, 1, mode='wrap'), [.25, .5, .25], 'valid')  # softer pick
    # Karplus-Strong, vectorised one period at a time.
    for i in range(0, n, p):
        k = min(p, n - i); out[i:i + k] = buf[:k]
        buf = decay * .5 * (buf + np.roll(buf, -1))
    return out * np.minimum(np.arange(n) / (SR * .002), 1)

def bell(f, dur, amp=1.):
    t = np.arange(int(dur * SR)) / SR; x = np.zeros_like(t)
    for ratio, g, d in ((.56, .5, .9), (.92, .35, 1.3), (1, 1, 1.6), (1.19, .45, 2.2), (1.71, .3, 2.8), (2, .35, 3.2), (2.74, .2, 4), (3, .16, 4.6), (4.07, .1, 6)):
        x += g * np.sin(2 * np.pi * f * ratio * t) * np.exp(-t * d)
    return amp * x * np.minimum(t / .003, 1)

def pad(freqs, dur, bright=.35):
    t = np.arange(int(dur * SR)) / SR; x = np.zeros_like(t)
    for f in freqs:
        for det in (-.004, 0, .005):
            ph = 2 * np.pi * f * (1 + det) * t + RNG.uniform(0, 6)
            x += np.sin(ph) + bright * .5 * np.sin(2 * ph) + bright * .25 * np.sin(3 * ph)
    return x / (3 * len(freqs)) * env_adsr(len(t), a=min(1.2, dur * .3), d=.2, s=.9, r=min(1.5, dur * .4))

def lead(f, dur, vib=.006, kind='flute'):
    t = np.arange(int(dur * SR)) / SR
    ph = 2 * np.pi * f * t + vib * f / 5 * np.sin(2 * np.pi * 5 * t) * np.minimum(t / .35, 1) / f * 2 * np.pi
    if kind == 'flute': x = np.sin(ph) + .18 * np.sin(2 * ph) + .06 * np.sin(3 * ph) + .02 * RNG.standard_normal(len(t))
    elif kind == 'fiddle': x = sum(np.sin(k * ph) / k ** 1.1 for k in range(1, 9))
    else: x = np.sin(ph) + .5 * np.sin(2 * ph) * np.exp(-t * 3)  # glass
    a = .06 if kind != 'glass' else .25
    return x * env_adsr(len(t), a=a, d=.15, s=.8, r=min(.25, dur * .4))

def voice(f, dur, vowel='a'):
    # Additive voice: harmonics weighted by formant peaks ("aa" / "oo").
    form = {'a': ((750, 90), (1150, 110), (2600, 160)), 'o': ((450, 80), (800, 100), (2830, 160))}[vowel]
    t = np.arange(int(dur * SR)) / SR; x = np.zeros_like(t)
    vib = 1 + .006 * np.sin(2 * np.pi * 5.2 * t) * np.minimum(t / .5, 1)
    for k in range(1, int(4000 / f)):
        g = sum(np.exp(-((k * f - c) / bw) ** 2) for c, bw in form) + .02
        x += g / k ** .3 * np.sin(2 * np.pi * k * f * np.cumsum(vib) / SR)
    return x / 3 * env_adsr(len(t), a=.18, d=.2, s=.85, r=min(.4, dur * .4))

def drum(kind, amp=1.):
    if kind == 'kick':
        t = np.arange(int(.45 * SR)) / SR; f = 45 + 90 * np.exp(-t * 30)
        return amp * np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * 7)
    if kind == 'frame':
        t = np.arange(int(.5 * SR)) / SR
        return amp * (np.sin(2 * np.pi * 95 * t) * np.exp(-t * 9) + .25 * lowpass(RNG.standard_normal(len(t)), 1800) * np.exp(-t * 35))
    if kind == 'shaker':
        t = np.arange(int(.09 * SR)) / SR; n = RNG.standard_normal(len(t)); n = np.diff(n, prepend=0)
        return amp * .25 * n * np.exp(-t * 50)
    if kind == 'anvil':
        t = np.arange(int(.7 * SR)) / SR
        return amp * sum(g * np.sin(2 * np.pi * f * t) * np.exp(-t * d) for f, g, d in ((1180, .5, 9), (2655, .35, 12), (3920, .2, 16), (5210, .1, 20)))
    if kind == 'taiko':
        t = np.arange(int(.8 * SR)) / SR; f = 60 + 40 * np.exp(-t * 18)
        return amp * (np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * 5) + .3 * RNG.standard_normal(len(t)) * np.exp(-t * 40))
    if kind == 'drip':
        t = np.arange(int(.25 * SR)) / SR; f = 900 + 1400 * np.exp(-t * 25)
        return amp * .4 * np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * 18)
    raise ValueError(kind)

def lowpass(x, cutoff):
    X = np.fft.rfft(x); f = np.fft.rfftfreq(len(x), 1 / SR)
    return np.fft.irfft(X / np.sqrt(1 + (f / cutoff) ** 4), len(x))

def reverb(x, seconds=2.2, mix=.3, dark=3500):
    n = int(seconds * SR); t = np.arange(n) / SR
    ir = RNG.standard_normal(n) * np.exp(-t * 6.9 / seconds); ir = lowpass(ir, dark); ir /= np.sqrt(np.sum(ir ** 2))
    size = 1 << int(np.ceil(np.log2(len(x) + n)))
    wet = np.fft.irfft(np.fft.rfft(x, size) * np.fft.rfft(ir, size), size)[:len(x)]
    return (1 - mix) * x + mix * wet * .6

class Track:
    def __init__(self, seconds, bpm):
        self.L = np.zeros(int(seconds * SR) + SR * 3); self.R = np.zeros_like(self.L); self.beat = 60 / bpm
    def add(self, sig, at_beats, gain=1., pan=0.):
        i = int(at_beats * self.beat * SR); j = min(len(self.L), i + len(sig))
        if i >= len(self.L): return
        s = sig[:j - i] * gain
        self.L[i:j] += s * np.sqrt((1 - pan) / 2) * 1.414; self.R[i:j] += s * np.sqrt((1 + pan) / 2) * 1.414
    def render(self, rev=.3, seconds=2.2, dark=3500):
        L, R = reverb(self.L, seconds, rev, dark), reverb(self.R, seconds, rev, dark)
        L, R = lowpass(L, 8000), lowpass(R, 8000)  # warm master
        peak = max(np.abs(L).max(), np.abs(R).max()) or 1
        L, R = L / peak * .89, R / peak * .89
        fade = int(SR * 2.5); ramp = np.linspace(1, 0, fade)
        L[-fade:] *= ramp; R[-fade:] *= ramp
        return np.stack([L, R], 1)

def chord(root, kind='m'): return [root, root + (3 if kind == 'm' else 4), root + 7]

def menu():
    tr = Track(40, 70); prog = [(50, 'm'), (46, ''), (53, ''), (48, '')]  # D dorian-ish: Dm Bb F C
    for bar in range(10):
        r, k = prog[bar % 4]; c = chord(r, k)
        tr.add(pad([hz(n) for n in [c[0] - 12] + c], tr.beat * 4.2), bar * 4, .5)
        for i, n in enumerate([c[0], c[1], c[2], c[0] + 12, c[2], c[1], c[0] + 12, c[2]]):
            tr.add(pluck(hz(n + 12), 1.8, .35, .997), bar * 4 + i * .5, .28, pan=-.3 + .6 * (i % 2))
    mel = [(74, 2), (72, 1), (69, 1), (70, 3), (69, 1), (65, 2), (67, 2), (69, 4), (74, 2), (76, 1), (77, 1), (76, 2), (72, 2), (74, 6)]
    pos = 8
    for n, d in mel: tr.add(lead(hz(n), d * tr.beat * .98), pos, .32, .1); pos += d
    return tr.render(.38, 3)

def village():
    tr = Track(42, 92); prog = [(45, 'm'), (41, ''), (43, ''), (45, 'm')]
    for bar in range(16):
        r, k = prog[bar % 4]; c = chord(r, k)
        if bar % 2 == 0: tr.add(bell(hz(c[0] + 12), 4), bar * 4, .35, -.2)
        tr.add(pad([hz(n) for n in c], tr.beat * 4.1, .2), bar * 4, .25)
        tr.add(pluck(hz(r - 12), 1.2, .6, .995), bar * 4, .5); tr.add(pluck(hz(r - 12), .8, .6, .995), bar * 4 + 2.5, .35)
        for b in range(4): tr.add(drum('frame', .9 if b % 2 == 0 else .45), bar * 4 + b, .5)
        for i in range(8):
            if (i + bar) % 3 != 1: tr.add(pluck(hz(c[i % 3] + 24), .9, .5, .996), bar * 4 + i * .5, .17, .35)
    mel = [(69, 1), (72, 1), (74, 2), (72, 1), (71, 1), (69, 2), (67, 1), (69, 1), (71, 2), (64, 4), (69, 1), (72, 1), (76, 2), (74, 1), (72, 1), (71, 2), (72, 1), (71, 1), (67, 2), (69, 4)]
    pos = 16
    for rep in range(2):
        for n, d in mel: tr.add(lead(hz(n), d * tr.beat * .95, kind='fiddle'), pos, .22, .1); pos += d
    return tr.render(.3, 2.4)

def quarry():
    tr = Track(40, 104); ost = [40, 41, 40, 43, 40, 41, 38, 40]
    for bar in range(17):
        for i, n in enumerate(ost): tr.add(pluck(hz(n), .5, .8, .99), bar * 4 + i * .5, .45)
        tr.add(drum('taiko'), bar * 4, .9); tr.add(drum('taiko', .6), bar * 4 + 1.5, .8); tr.add(drum('taiko', .7), bar * 4 + 2.75, .8)
        tr.add(drum('anvil'), bar * 4 + 3, .22, .4)
        for b in range(8): tr.add(drum('shaker'), bar * 4 + b * .5, .5, -.4)
        if bar >= 4: tr.add(pad([hz(52), hz(55), hz(59)], tr.beat * 4, .5), bar * 4, .22)
    mel = [(64, 3), (65, 1), (67, 2), (65, 2), (64, 4), (62, 2), (64, 2), (65, 3), (64, 1), (60, 4)]
    pos = 32
    for n, d in mel * 2: tr.add(lead(hz(n), d * tr.beat * .9, kind='fiddle'), pos, .2, .15); pos += d
    return tr.render(.22, 1.6, 2600)

def mill():
    tr = Track(42, 80); prog = [(42, 'm'), (38, ''), (45, ''), (40, '')]  # 3/4 waltz of the wheel
    for bar in range(18):
        r, k = prog[(bar // 2) % 4]; c = chord(r, k); start = bar * 3
        tr.add(pluck(hz(r - 12), 1.6, .3, .997), start, .5)
        for b in (1, 2): tr.add(pad([hz(n) for n in c], tr.beat * .9, .1), start + b, .18)
        for i, n in enumerate([c[0] + 24, c[2] + 12, c[1] + 24, c[2] + 24, c[1] + 24, c[2] + 12]):
            tr.add(lead(hz(n), tr.beat * .7, kind='glass'), start + i * .5, .1, -.5 + .2 * i)
        if RNG.random() < .7: tr.add(drum('drip'), start + RNG.uniform(0, 3), .5, RNG.uniform(-.8, .8))
    mel = [(73, 3), (71, 1.5), (69, 1.5), (71, 3), (66, 3), (69, 2), (68, 1), (66, 3), (64, 6)]
    pos = 12
    for n, d in mel * 2: tr.add(voice(hz(n - 12), d * tr.beat * .97, 'o'), pos, .2, .2); pos += d
    return tr.render(.45, 3.5, 3000)

def marsh():
    tr = Track(40, 66); roots = [48, 50, 52, 54]  # whole-tone shimmer
    for bar in range(11):
        r = roots[bar % 4]
        tr.add(pad([hz(r), hz(r + 4), hz(r + 8), hz(r + 14)], tr.beat * 4.4, .15), bar * 4, .35)
        for i in range(6):
            n = r + 24 + [0, 4, 8, 10, 14, 8][i]
            tr.add(lead(hz(n), tr.beat * 1.2, kind='glass'), bar * 4 + i * .66, .12, RNG.uniform(-.9, .9))
        tr.add(pluck(hz(r + 12), 2.4, .2, .998), bar * 4 + 2, .25, -.3)
    mel = [(76, 2), (78, 2), (80, 4), (82, 2), (80, 2), (76, 4), (74, 2), (76, 6)]
    pos = 12
    for n, d in mel: tr.add(lead(hz(n), d * tr.beat * .97, kind='flute'), pos, .18, .2); pos += d
    return tr.render(.55, 4.5, 4200)

def bellwood():
    tr = Track(40, 112); drone = [50, 57]
    for bar in range(19):
        tr.add(pad([hz(n) for n in drone], tr.beat * 4.05, .3), bar * 4, .25)
        for i, n in enumerate([62, 65, 64, 62, 60, 62, 57, 60]):
            tr.add(pluck(hz(n + (12 if bar % 4 == 3 else 0)), 1.1, .45, .996), bar * 4 + i * .5, .26, -.4 + .1 * i)
        for b in range(4): tr.add(drum('frame', 1 if b == 0 else .55), bar * 4 + b, .45)
        tr.add(drum('kick', .6), bar * 4, .5)
        if bar % 2: tr.add(bell(hz(74), 2.5, .5), bar * 4 + 3.5, .12, .5)
    # Two voices a second apart, in the spirit of polyphonic folk singing.
    pos = 16
    for rep in range(3):
        for (a, b, d) in ((62, 64, 2), (62, 64, 2), (60, 62, 2), (62, 64, 2), (57, 59, 4)):
            tr.add(voice(hz(a), d * tr.beat * .96, 'a'), pos, .16, -.35); tr.add(voice(hz(b), d * tr.beat * .96, 'a'), pos + .5, .14, .35); pos += d
    return tr.render(.3, 2.2)

def boss():
    tr = Track(36, 140); ost = [45, 45, 48, 45, 50, 45, 48, 47]
    for bar in range(21):
        for i, n in enumerate(ost): tr.add(pluck(hz(n - 12), .4, .9, .985), bar * 4 + i * .5, .5)
        for b in range(4): tr.add(drum('kick'), bar * 4 + b, .7)
        tr.add(drum('taiko', .8), bar * 4 + 1.5, .7); tr.add(drum('taiko'), bar * 4 + 3.5, .7)
        for b in range(8): tr.add(drum('shaker'), bar * 4 + b * .5, .6)
        if bar % 2 == 0: tr.add(bell(hz(57), 3, .8), bar * 4, .3)
        if bar >= 4: tr.add(pad([hz(n) for n in (57, 60, 64)] if bar % 4 < 2 else [hz(n) for n in (56, 59, 64)], tr.beat * 4, .6), bar * 4, .3)
    mel = [(69, 1.5), (72, .5), (71, 1), (69, 1), (76, 2), (74, 1), (72, 1), (71, 2), (68, 2), (69, 4)]
    pos = 16
    for n, d in mel * 3: tr.add(lead(hz(n), d * tr.beat * .92, kind='fiddle'), pos, .24, .1); pos += d
    return tr.render(.18, 1.4)

def write(path, data):
    pcm = (np.clip(data, -1, 1) * 32767).astype('<i2')
    with wave.open(str(path), 'wb') as w: w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR); w.writeframes(pcm.tobytes())

if __name__ == '__main__':
    out = pathlib.Path(sys.argv[1]); out.mkdir(parents=True, exist_ok=True)
    for name, fn in (('01-meniu', menu), ('02-pamirstas-kaimas', village), ('03-zibintu-karjeras', quarry), ('04-paskendes-malunas', mill), ('05-stiklo-pelke', marsh), ('06-varpu-giria', bellwood), ('07-bosas', boss)):
        write(out / f'{name}.wav', fn()); print('wrote', name)
