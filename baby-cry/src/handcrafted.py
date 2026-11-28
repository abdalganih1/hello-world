"""Hand-crafted acoustic features (MFCC/delta stats, F0 / voicing stats, spectral stats, cry-burst rhythm)."""
import numpy as np, soundfile as sf, librosa
from common import *
df = meta(); F = []
for p in df.path:
    y, sr = sf.read(f'{ROOT}/{p}'); y = y.astype(np.float32)
    mf = librosa.feature.mfcc(y=y, sr=sr, n_mfcc=20); d = librosa.feature.delta(mf)
    f0, vflag, vprob = librosa.pyin(y, fmin=150, fmax=1000, sr=sr, frame_length=1024)
    f0v = f0[~np.isnan(f0)] if np.any(~np.isnan(f0)) else np.array([0.])
    rms = librosa.feature.rms(y=y)[0]; on = (rms > rms.mean()).astype(int)
    bursts = max(1, np.sum(np.diff(on) == 1)) / (len(y) / sr)
    sc = librosa.feature.spectral_centroid(y=y, sr=sr)[0]; fl = librosa.feature.spectral_flatness(y=y)[0]
    zc = librosa.feature.zero_crossing_rate(y)[0]
    F.append(np.concatenate([mf.mean(1), mf.std(1), d.std(1),
        [f0v.mean(), f0v.std(), np.percentile(f0v, 90), np.mean(vflag), bursts, on.mean(), rms.std() / (rms.mean() + 1e-9),
         sc.mean(), sc.std(), fl.mean(), zc.mean()]]))
np.save(f'{ROOT}/data/embeddings/handcrafted.npy', np.nan_to_num(np.array(F, np.float32)))
print('done', np.array(F).shape)
