"""Phase 1: convert Donate-a-Cry to 16 kHz mono, normalise, trim, dedupe-hash, grouped split."""
import os, subprocess, hashlib, json, collections
import numpy as np, pandas as pd, soundfile as sf, librosa
from sklearn.model_selection import StratifiedGroupKFold

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
RAW = f'{ROOT}/data/raw/donateacry-corpus'
CLEAN = f'{RAW}/donateacry_corpus_cleaned_and_updated_data'
OUT = f'{ROOT}/data/processed'
TAG = {'hu': 'hungry', 'bp': 'belly_pain', 'ti': 'tired', 'dc': 'discomfort', 'ch': 'discomfort', 'bu': 'burping'}
SR = 16000
SEED = 1234

def load(path):
    pcm = subprocess.run(['ffmpeg', '-v', 'error', '-i', path, '-ac', '1', '-ar', str(SR), '-f', 'f32le', '-'],
                         capture_output=True, check=True).stdout
    return np.frombuffer(pcm, np.float32).copy()

def clean(y):
    y = y - y.mean()
    yt, _ = librosa.effects.trim(y, top_db=40)
    if len(yt) > SR // 2: y = yt
    rms = np.sqrt(np.mean(y ** 2)) + 1e-9
    y = y * (10 ** (-20 / 20) / rms)          # -20 dBFS RMS
    return np.clip(y, -1, 1).astype(np.float32)

def parse(fname):
    s = fname.rsplit('.', 1)[0]
    p = s.split('-')
    return dict(uuid=s[:36].lower(), gender=p[-3], age=p[-2], tag=p[-1])

rows = []
os.makedirs(f'{OUT}/clean', exist_ok=True); os.makedirs(f'{OUT}/extra', exist_ok=True)
cleaned = set()
for lab in sorted(os.listdir(CLEAN)):
    if not os.path.isdir(f'{CLEAN}/{lab}'): continue
    for f in sorted(os.listdir(f'{CLEAN}/{lab}')):
        cleaned.add(f.rsplit('.', 1)[0])
        y = clean(load(f'{CLEAN}/{lab}/{f}'))
        cid = f.rsplit('.', 1)[0]
        out = f'{OUT}/clean/{cid}.wav'; sf.write(out, y, SR)
        rows.append(dict(clip_id=cid, path=os.path.relpath(out, ROOT), label=lab, source='cleaned',
                         dur=len(y) / SR, **parse(f)))
# extra (unverified) minority-class files from the raw upload buckets, not in the cleaned set
for b in ['donateacry-android-upload-bucket', 'donateacry-ios-upload-bucket']:
    for f in sorted(os.listdir(f'{RAW}/{b}')):
        cid = f.rsplit('.', 1)[0]; meta = parse(f); tag = meta['tag'].split('.')[0]
        if cid in cleaned or tag not in TAG or tag == 'hu': continue
        try: y = clean(load(f'{RAW}/{b}/{f}'))
        except Exception as e: print('skip', f, e); continue
        if len(y) < SR: continue
        out = f'{OUT}/extra/{cid}.wav'; sf.write(out, y, SR)
        meta['tag'] = tag
        rows.append(dict(clip_id=cid, path=os.path.relpath(out, ROOT), label=TAG[tag], source='raw_unverified',
                         dur=len(y) / SR, **meta))
df = pd.DataFrame(rows)
# exact / near-exact duplicates: hash of coarsely-quantised audio
def fp(p):
    y, _ = sf.read(f'{ROOT}/{p}')
    return hashlib.md5(np.round(y[:SR * 3] * 50).astype(np.int8).tobytes()).hexdigest()
df['hash'] = df.path.map(fp)
dups = df[df.duplicated('hash', keep='first')]
print('exact duplicates removed:', len(dups)); df = df.drop(dups.index)

# grouped split on the CLEANED set (group = app-install uuid), 70/15/15
c = df[df.source == 'cleaned'].reset_index(drop=True)
sgk = StratifiedGroupKFold(n_splits=7, shuffle=True, random_state=SEED)
folds = np.zeros(len(c), int)
for k, (_, te) in enumerate(sgk.split(c, c.label, c.uuid)): folds[te] = k
c['fold7'] = folds
c['split'] = np.where(folds == 0, 'test', np.where(folds == 1, 'val', 'train'))
e = df[df.source != 'cleaned'].copy()
# extra clips: keep only if their uuid is not in val/test (avoid leakage)
held = set(c[c.split != 'train'].uuid)
e['split'] = np.where(e.uuid.isin(held), 'drop_leak', 'train_extra'); e['fold7'] = -1
df = pd.concat([c, e], ignore_index=True)
# 5-fold grouped CV over the whole cleaned set (secondary, more stable estimate)
cc = df.source == 'cleaned'
sgk5 = StratifiedGroupKFold(n_splits=5, shuffle=True, random_state=SEED)
df['cv5'] = -1
idx = df.index[cc]
for k, (_, te) in enumerate(sgk5.split(df.loc[idx], df.loc[idx, 'label'], df.loc[idx, 'uuid'])): df.loc[idx[te], 'cv5'] = k
os.makedirs(f'{ROOT}/data/splits', exist_ok=True)
df.to_csv(f'{ROOT}/data/splits/metadata.csv', index=False)
print(pd.crosstab(df.label, df.split))
print('durations', df.dur.describe())
