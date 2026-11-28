"""Phase 4: identical metrics for every approach from results/raw/*.jsonl (OOF predictions on the 457 cleaned clips)."""
import json, glob, os, sys, numpy as np, pandas as pd
import matplotlib; matplotlib.use('Agg'); import matplotlib.pyplot as plt
from sklearn.metrics import roc_auc_score, f1_score, balanced_accuracy_score, accuracy_score, confusion_matrix, precision_recall_fscore_support
from common import *
rng = np.random.default_rng(0)
os.makedirs(f'{ROOT}/results/confusion_matrices', exist_ok=True)
df = meta(); cl = df[df.source == 'cleaned'].set_index('clip_id')

def load(path):
    R = [json.loads(l) for l in open(path)]
    R = [r for r in R if r['clip_id'] in cl.index]
    y = np.array([CLASSES.index(r['label']) for r in R]); P = np.array([[r['probs'][c] for c in CLASSES] for r in R])
    g = np.array([cl.loc[r['clip_id'], 'uuid'] for r in R])
    return y, P, g

def boot_ci(y, pred, g, n=1000):
    ug = np.unique(g); idx = {u: np.where(g == u)[0] for u in ug}; s = []
    for _ in range(n):
        ii = np.concatenate([idx[u] for u in rng.choice(ug, len(ug))])
        s.append(f1_score(y[ii], pred[ii], average='macro', labels=range(5), zero_division=0))
    return np.percentile(s, [2.5, 97.5])

def metrics(y, P, g, name):
    pred = P.argmax(1); top2 = np.argsort(-P, 1)[:, :2]
    m = dict(approach=name, n=len(y), macroF1=f1_score(y, pred, average='macro', labels=range(5), zero_division=0),
             bal_acc=balanced_accuracy_score(y, pred), acc=accuracy_score(y, pred), top2=np.mean([y[i] in top2[i] for i in range(len(y))]))
    lo, hi = boot_ci(y, pred, g); m['ci_lo'], m['ci_hi'] = lo, hi
    for j, c in enumerate(CLASSES): m[f'AUC_{c}'] = roc_auc_score(y == j, P[:, j]) if P[:, j].std() > 0 else 0.5
    m['macroAUC'] = np.mean([m[f'AUC_{c}'] for c in CLASSES])
    pr, rc, f1, _ = precision_recall_fscore_support(y, pred, labels=range(5), zero_division=0)
    for j, c in enumerate(CLASSES): m[f'P_{c}'], m[f'R_{c}'], m[f'F1_{c}'] = pr[j], rc[j], f1[j]
    conf = P.max(1)
    for thr in (0.5, 0.6, 0.7):
        cov = conf >= thr
        m[f'cov@{thr}'] = cov.mean()
        m[f'acc@{thr}'] = accuracy_score(y[cov], pred[cov]) if cov.any() else np.nan
        m[f'mF1@{thr}'] = f1_score(y[cov], pred[cov], average='macro', labels=range(5), zero_division=0) if cov.any() else np.nan
    cm = confusion_matrix(y, pred, labels=range(5))
    fig, ax = plt.subplots(figsize=(5.2, 4.4)); ax.imshow(cm / np.maximum(cm.sum(1, keepdims=True), 1), cmap='Blues', vmin=0, vmax=1)
    for i in range(5):
        for j in range(5): ax.text(j, i, cm[i, j], ha='center', va='center', color='black' if cm[i, j] < cm[i].sum() * .6 else 'white', fontsize=9)
    ax.set_xticks(range(5), CLASSES, rotation=35, ha='right', fontsize=8); ax.set_yticks(range(5), CLASSES, fontsize=8)
    ax.set_xlabel('predicted'); ax.set_ylabel('true'); ax.set_title(f'{name}\nmacro-F1 {m["macroF1"]:.3f}', fontsize=9)
    fig.tight_layout(); fig.savefig(f'{ROOT}/results/confusion_matrices/{name}.png', dpi=110); plt.close(fig)
    return m

rows = []
files = sorted(glob.glob(f'{ROOT}/results/raw/*.jsonl'))
y0 = None
for f in files:
    name = os.path.basename(f)[:-6]
    y, P, g = load(f)
    if y0 is None:   # majority baseline on the same clips
        Pm = np.zeros_like(P); Pm[:, CLASSES.index('hungry')] = 1; rows.append(metrics(y, Pm, g, 'baseline_majority_hungry'))
        Pr = np.tile(np.bincount(y, minlength=5) / len(y), (len(y), 1)) + rng.random(P.shape) * 1e-3
        y0 = y
    rows.append(metrics(y, P, g, name))
R = pd.DataFrame(rows).sort_values('macroF1', ascending=False)
R.to_csv(f'{ROOT}/results/comparison.csv', index=False)
cols = ['approach', 'n', 'macroF1', 'ci_lo', 'ci_hi', 'macroAUC', 'bal_acc', 'acc', 'top2'] + [f'F1_{c}' for c in CLASSES] + ['cov@0.6', 'acc@0.6']
pd.set_option('display.width', 250); print(R[cols].round(3).to_string(index=False))
