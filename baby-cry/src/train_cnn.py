"""Approach D: small CNN on log-mel trained from scratch, grouped 5-fold CV, augmentation on train only."""
import sys, json, time, numpy as np, torch, torch.nn.functional as F, soundfile as sf, librosa
from sklearn.model_selection import GroupShuffleSplit
from sklearn.metrics import f1_score
from common import *
from cnn import TinyCryCNN
from train_embed import fit_T, soft
torch.set_num_threads(4)
SR, CROP = 16000, 4 * 16000
USE_EXTRA = '--extra' in sys.argv
df = meta(); W = [sf.read(f'{ROOT}/{p}')[0].astype(np.float32) for p in df.path]
rng = np.random.default_rng(0)
NOISE = [w for w, s in zip(W, df.source) if False]  # (no separate noise corpus available offline; synthetic noise below)

def crop(w, n=CROP, rand=True):
    if len(w) < n: w = np.pad(w, (0, n - len(w)), mode='wrap')
    s = rng.integers(0, len(w) - n + 1) if rand else (len(w) - n) // 2
    return w[s:s + n]

def augment(w):
    if rng.random() < 0.5:                                   # pitch shift +-2 semitones via resampling (also slight stretch)
        r = 2 ** (rng.uniform(-2, 2) / 12); w = np.interp(np.arange(0, len(w) - 1, r), np.arange(len(w)), w).astype(np.float32)
    w = crop(w)
    w = w * 10 ** (rng.uniform(-6, 6) / 20)
    if rng.random() < 0.5:                                   # coloured background noise (incubator fan / room hum proxy)
        n = rng.standard_normal(len(w)).astype(np.float32); n = np.cumsum(n) if rng.random() < 0.5 else n
        n = n / (np.abs(n).max() + 1e-9); snr = rng.uniform(5, 25)
        w = w + n * np.sqrt(np.mean(w ** 2)) / 10 ** (snr / 20)
    return w.astype(np.float32)

def windows(w, n=CROP, hop=SR):
    if len(w) <= n: return [crop(w, n, False)]
    return [w[s:s + n] for s in range(0, len(w) - n + 1, hop)]

def predict(m, idx):
    m.eval(); out = []
    with torch.no_grad():
        for i in idx:
            x = torch.from_numpy(np.stack(windows(W[i])))
            out.append(F.log_softmax(m(x), 1).exp().mean(0).numpy())   # mean of window probabilities
    return np.log(np.stack(out) + 1e-9)

MEL = None
def build_mels(n_aug=4):
    global MEL
    fe = TinyCryCNN(); MEL = []
    with torch.no_grad():
        for i, w in enumerate(W):
            vs = [w] + [augment_full(w) for _ in range(n_aug)]
            MEL.append([fe.raw_mel(torch.from_numpy(v)[None])[0] for v in vs])
    print('mels ready', flush=True)

def augment_full(w):   # waveform-domain augmentation precomputed once per clip (pitch/stretch, gain, coloured noise)
    if rng.random() < 0.7:
        r = 2 ** (rng.uniform(-2, 2) / 12); w = np.interp(np.arange(0, len(w) - 1, r), np.arange(len(w)), w).astype(np.float32)
    w = w * 10 ** (rng.uniform(-6, 6) / 20)
    if rng.random() < 0.6:
        n = rng.standard_normal(len(w)).astype(np.float32); n = np.cumsum(n) if rng.random() < 0.5 else n
        n = n / (np.abs(n).max() + 1e-9); snr = rng.uniform(5, 25); w = w + n * np.sqrt(np.mean(w ** 2)) / 10 ** (snr / 20)
    return w.astype(np.float32)

def mel_crop(i, frames=301):
    m = MEL[i][rng.integers(len(MEL[i]))]
    if m.shape[1] < frames: m = m.repeat(1, frames // m.shape[1] + 1, 1)
    s = rng.integers(0, m.shape[1] - frames + 1); return m[:, s:s + frames]

def train(tr_idx, va_idx, epochs=40, seed=0):
    torch.manual_seed(seed)
    m = TinyCryCNN(); opt = torch.optim.AdamW(m.parameters(), 2e-3, weight_decay=1e-3)
    y = df.y.values; cnt = np.bincount(y[tr_idx], minlength=5)
    wts = 1.0 / cnt[y[tr_idx]]; wts /= wts.sum()                        # class-balanced sampling
    best = (-1, None, 0)
    for ep in range(epochs):
        m.train()
        batch_idx = rng.choice(tr_idx, size=256, p=wts)
        for b in range(0, 256, 32):
            ii = batch_idx[b:b + 32]
            x = torch.stack([mel_crop(i) for i in ii]); t = torch.from_numpy(y[ii])
            loss = F.cross_entropy(m.forward_mel(x, specaug=True), t, label_smoothing=0.05)
            opt.zero_grad(); loss.backward(); opt.step()
        if ep % 4 == 3:
            lp = predict(m, va_idx); s = f1_score(y[va_idx], lp.argmax(1), average='macro')
            if s > best[0]: best = (s, {k: v.clone() for k, v in m.state_dict().items()}, ep)
    m.load_state_dict(best[1]); return m, best[0], best[2]

if __name__ == '__main__':
    name = 'cnn_' + ('ext' if USE_EXTRA else 'clean')
    cl = np.where(df.source == 'cleaned')[0]; ex = np.where(df.source != 'cleaned')[0]
    build_mels(); P = np.zeros((len(cl), 5)); info = []; t0 = time.time()
    for k in range(5):
        te = cl[df.cv5.values[cl] == k]; trv = cl[df.cv5.values[cl] != k]
        gs = GroupShuffleSplit(1, test_size=0.2, random_state=k)
        a, b = next(gs.split(trv, groups=df.uuid.values[trv])); tr, va = trv[a], trv[b]
        if USE_EXTRA:
            bad = set(df.uuid.values[te]) | set(df.uuid.values[va])
            tr = np.concatenate([tr, [i for i in ex if df.uuid.values[i] not in bad]])
        m, s, ep = train(tr, va)
        lpv = predict(m, va); T = fit_T(lpv, df.y.values[va])
        pos = np.searchsorted(cl, te); P[pos] = soft(predict(m, te), T)
        info.append(dict(fold=k, val_macroF1=round(s, 4), best_epoch=ep, T=round(T, 3))); print(name, info[-1], flush=True)
    dcl = df.iloc[cl].reset_index(drop=True)
    write_raw(name, dcl, P); json.dump(info, open(f'{ROOT}/results/raw/{name}.info.json', 'w'), indent=1)
    print(name, 'OOF macroF1', f1_score(dcl.y, P.argmax(1), average='macro'), f'{time.time()-t0:.0f}s')
