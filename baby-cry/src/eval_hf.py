"""Approach E: existing Hugging Face baby-cry classifiers used as-is. CAUTION: they were trained on Donate-a-Cry copies,
so our clips are (partly) in their training data -> scores are optimistic upper bounds, not a fair test."""
import json, glob, os, numpy as np
from common import *
MAP = {'belly_pain': 'belly_pain', 'bellypain': 'belly_pain', 'belly pain': 'belly_pain', 'burping': 'burping', 'discomfort': 'discomfort',
       'hungry': 'hungry', 'hunger': 'hungry', 'tired': 'tired', 'cold_hot': 'discomfort', 'cold/hot': 'discomfort'}
df = meta(); cl = (df.source == 'cleaned').values; dcl = df[cl].reset_index(drop=True)
for f in glob.glob(f'{ROOT}/data/embeddings/hf_*.json'):
    d = json.load(open(f)); labs = [l.lower().replace('-', '_') for l in d['labels']]
    P0 = np.array(d['probs'])[cl]; P = np.zeros((len(P0), 5))
    unk = [l for l in labs if l not in MAP]
    for j, l in enumerate(labs):
        if l in MAP: P[:, CLASSES.index(MAP[l])] += P0[:, j]
    P = P / np.maximum(P.sum(1, keepdims=True), 1e-9)
    name = os.path.basename(f)[:-5]
    write_raw(name, dcl, P, extra={'note': 'contaminated: model trained on Donate-a-Cry', 'unmapped_labels': unk, 'ms_per_clip': round(d['ms_per_clip'])})
    print(name, labs, 'unmapped:', unk, 'ms/clip', round(d['ms_per_clip']))
