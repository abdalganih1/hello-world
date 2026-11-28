"""Approaches B/C/E-style: pretrained embeddings + small classifier, grouped 5-fold CV (outer) with inner tuning."""
import sys, json, time, warnings, numpy as np
from sklearn.linear_model import LogisticRegression
from sklearn.svm import SVC
from sklearn.preprocessing import StandardScaler
from sklearn.pipeline import make_pipeline
from sklearn.decomposition import PCA
from sklearn.metrics import f1_score
from sklearn.model_selection import StratifiedGroupKFold
from scipy.optimize import minimize_scalar
from common import *
warnings.filterwarnings('ignore')

def models():
    for nc in [16, 64]:
        for C in [0.01, 0.1, 1]:
            yield f'pca{nc}_lr_C{C}', lambda C=C, nc=nc: make_pipeline(StandardScaler(), PCA(nc, random_state=0), LogisticRegression(C=C, class_weight='balanced', max_iter=2000))

def fit_T(logp, y):
    def nll(T):
        z = logp / T; z = z - z.max(1, keepdims=True); p = np.exp(z); p /= p.sum(1, keepdims=True)
        return -np.mean(np.log(p[np.arange(len(y)), y] + 1e-12))
    return minimize_scalar(nll, bounds=(0.2, 10), method='bounded').x

def soft(logp, T):
    z = logp / T; z = z - z.max(1, keepdims=True); p = np.exp(z); return p / p.sum(1, keepdims=True)

def full_probs(m, X):
    P = np.full((len(X), len(CLASSES)), 1e-6); P[:, m.classes_] = m.predict_proba(X); return P / P.sum(1, keepdims=True)

def inner_oof(make, X, y, g):
    sk = StratifiedGroupKFold(n_splits=4, shuffle=True, random_state=7)
    P = np.zeros((len(y), len(CLASSES)))
    for tr, te in sk.split(X, y, g):
        m = make().fit(X[tr], y[tr]); P[te] = full_probs(m, X[te])
    return P

def run(feat, use_extra):
    df = meta()
    X_all = np.load(f'{ROOT}/data/embeddings/{feat}.npy') if not isinstance(feat, np.ndarray) else feat
    cl = (df.source == 'cleaned').values
    name = f'{feat}_{"ext" if use_extra else "clean"}'
    P_out = np.zeros((cl.sum(), len(CLASSES))); info = []
    dcl = df[cl].reset_index(drop=True); Xcl = X_all[cl]
    ext = df[~cl]; Xext = X_all[~cl]
    for k in range(5):
        te = (dcl.cv5 == k).values; tr = ~te
        Xtr, ytr, gtr = Xcl[tr], dcl.y.values[tr], dcl.uuid.values[tr]
        if use_extra:
            ok = ~ext.uuid.isin(set(dcl.uuid[te])).values
            Xtr = np.vstack([Xtr, Xext[ok]]); ytr = np.concatenate([ytr, ext.y.values[ok]]); gtr = np.concatenate([gtr, ext.uuid.values[ok]])
        best = None
        for mname, make in models():
            Pi = inner_oof(make, Xtr, ytr, gtr)
            s = f1_score(ytr, Pi.argmax(1), average='macro')
            if best is None or s > best[0]: best = (s, mname, make, Pi)
        s, mname, make, Pi = best
        T = fit_T(np.log(Pi + 1e-9), ytr)
        m = make().fit(Xtr, ytr)
        P_out[te] = soft(np.log(full_probs(m, Xcl[te]) + 1e-9), T)
        info.append(dict(fold=k, model=mname, inner_macroF1=round(s, 4), T=round(T, 3)))
        print(name, info[-1], flush=True)
    write_raw(name, dcl, P_out)
    json.dump(info, open(f'{ROOT}/results/raw/{name}.info.json', 'w'), indent=1)
    print(name, 'OOF macroF1', f1_score(dcl.y, P_out.argmax(1), average='macro'))

if __name__ == '__main__':
    for feat in sys.argv[1:]:
        run(feat, False)
