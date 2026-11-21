#!/usr/bin/env python3
"""Synthesised paper-world SFX, designed to sit UNDER a voice-over.
Body energy < ~900 Hz, air/crackle > ~5 kHz, a broad cut at 1-4 kHz (speech intelligibility band),
peaks capped at -6 dBFS. Nothing is downloaded: every sound is generated from noise and sines.
usage (render.py calls this): python3 sfx.py cues.json out/sfx.wav <duration_s>
cue = [t, kind, {opts}]  kinds: whoosh slam pop stamp tear tape marker  (+ bed: room tone)"""
import json, sys, numpy as np
from scipy.signal import butter, sosfilt
SR = 48000
rng = np.random.default_rng(7)
def bp(x, lo, hi, o=2): return sosfilt(butter(o, [lo, hi], 'bandpass', fs=SR, output='sos'), x)
def hp(x, f, o=2): return sosfilt(butter(o, f, 'highpass', fs=SR, output='sos'), x)
def lp(x, f, o=2): return sosfilt(butter(o, f, 'lowpass', fs=SR, output='sos'), x)
def noise(n): return rng.standard_normal(n)
def brown(n): b = np.cumsum(noise(n)); b -= np.linspace(b[0], b[-1], n); return b / (np.abs(b).max() + 1e-9)
def env(n, a, d, shape=3.0):  # attack fraction, then power decay
    t = np.linspace(0, 1, n); e = np.where(t < a, t / max(a, 1e-6), (1 - (t - a) / (1 - a + 1e-9)) ** shape); return e
def db(x): return 10 ** (x / 20)
def norm(x, peak_db): return x / (np.abs(x).max() + 1e-9) * db(peak_db)

def whoosh(dur=.8, pan=1, **k):
    """camera travel: swept low-mid body + airy top, bell envelope, pans across with the move"""
    n = int(SR * dur); t = np.linspace(0, 1, n); bell = np.sin(np.pi * t) ** 1.6
    body = np.zeros(n); src = noise(n); seg = 2048
    for i in range(0, n, seg):  # block-wise sweep 180 -> 850 -> 220 Hz
        f = 180 + 670 * np.sin(np.pi * min(1, i / n)) ; body[i:i+seg] = bp(src[max(0,i-512):i+seg], f*.6, f*1.6)[-len(body[i:i+seg]):]
    air = hp(noise(n), 6000) * .35
    m = norm((body + air) * bell, k.get('db', -15))
    p = np.clip((t - .5) * 2 * pan, -1, 1)               # equal-power pan sweep
    return np.stack([m * np.sqrt((1 - p) / 2), m * np.sqrt((1 + p) / 2)], 1)
def slam(**k):
    """paper slap: soft low thump (65 -> 45 Hz) + short high crackle, nothing in the voice band"""
    n = int(SR * .45); t = np.arange(n) / SR
    thump = np.sin(2 * np.pi * (65 * t - 22 * t * t)) * np.exp(-t * 14)
    crack = hp(noise(n), 5200) * np.exp(-t * 60) * .6
    return norm(thump + crack, k.get('db', -9))
def pop(**k):
    """small piece lands: tiny paper tick"""
    n = int(SR * .12); t = np.arange(n) / SR
    return norm(hp(noise(n), 6500) * np.exp(-t * 90) + .4 * np.sin(2*np.pi*180*t) * np.exp(-t * 50), k.get('db', -18))
def stamp(**k):
    """rubber stamp: dull thud + rubber click"""
    n = int(SR * .35); t = np.arange(n) / SR
    thud = lp(noise(n), 260) * np.exp(-t * 22) * 2 + np.sin(2*np.pi*95*t) * np.exp(-t * 18)
    click = hp(noise(n), 5500) * np.exp(-t * 120) * .5
    return norm(thud + click, k.get('db', -10))
def tear(dur=.5, **k):
    """paper rip: accelerating crackle grains (high) over a low torn body"""
    n = int(SR * dur); out = np.zeros(n); t = np.arange(n) / SR
    pos = 0
    while pos < n:
        g = int(SR * rng.uniform(.004, .012)); g = min(g, n - pos)
        out[pos:pos+g] += hp(noise(g), 4200) * np.hanning(g) * rng.uniform(.4, 1)
        pos += int(SR * rng.uniform(.003, .018) * (1.4 - pos / n))
    body = bp(noise(n), 140, 600) * .5
    return norm((out + body) * env(n, .1, .9, 1.5), k.get('db', -12))
def tape(**k):
    n = int(SR * .4); t = np.linspace(0, 1, n); src = noise(n); out = np.zeros(n); seg = 1024
    for i in range(0, n, seg): f = 3800 + 2600 * (i / n); out[i:i+seg] = bp(src[i:i+seg], f, f * 1.5)
    return norm(out * env(n, .05, .95, 2), k.get('db', -20))
def marker(dur=.6, **k):
    """felt marker on paper: soft high scratch with stroke rhythm"""
    n = int(SR * dur); t = np.arange(n) / SR
    rhythm = .55 + .45 * np.abs(np.sin(2 * np.pi * 7 * t))
    return norm(bp(noise(n), 5000, 9000) * rhythm * env(n, .08, .92, 1), k.get('db', -24))
def bed(n):
    """room tone: very low brown noise + sparse paper rustles, far below any voice"""
    r = lp(hp(brown(n), 40), 350) * db(-46)
    for _ in range(int(n / SR / 2.5)):
        s = rng.integers(0, max(1, n - SR)); g = int(SR * rng.uniform(.15, .4))
        r[s:s+g] += hp(noise(g), 6000) * np.hanning(g) * db(-44)
    return r

KINDS = dict(whoosh=whoosh, slam=slam, pop=pop, stamp=stamp, tear=tear, tape=tape, marker=marker)
def vocal_pocket(x):
    """broad -6 dB dip centred ~2.2 kHz (1-4 kHz) so speech stays on top"""
    X = np.fft.rfft(x, axis=0); f = np.fft.rfftfreq(x.shape[0], 1 / SR)
    g = 1 - (1 - db(-6)) * np.exp(-((np.log2(np.maximum(f, 1) / 2200)) ** 2) / (2 * .55 ** 2))
    return np.fft.irfft(X * g[:, None], n=x.shape[0], axis=0)

def mix(cues, dur, with_bed=True):
    n = int(SR * (dur + .5)); out = np.zeros((n, 2))
    if with_bed: b = bed(n); out += np.stack([b, np.roll(b, 900)], 1)
    for c in cues:
        t, kind = c[0], c[1]; o = c[2] if len(c) > 2 else {}
        if kind not in KINDS: continue
        s = KINDS[kind](**o); s = s if s.ndim == 2 else np.stack([s * np.sqrt((1 - o.get('pan', 0)) / 2) * 1.414, s * np.sqrt((1 + o.get('pan', 0)) / 2) * 1.414], 1)
        i = int(SR * max(0, t)); j = min(n, i + len(s)); out[i:j] += s[:j - i]
    out = vocal_pocket(out)
    out = np.tanh(out * 1.2) / 1.2                                # soft safety limiter
    pk = np.abs(out).max();  out *= db(-6) / pk if pk > db(-6) else 1
    return out[:int(SR * dur)]

if __name__ == '__main__':
    from scipy.io import wavfile
    cues = json.load(open(sys.argv[1])); dur = float(sys.argv[3])
    wavfile.write(sys.argv[2], SR, (mix(cues, dur) * 32767).astype(np.int16))
    print('  sfx', sys.argv[2], f'{len(cues)} cues, {dur:.1f}s')
