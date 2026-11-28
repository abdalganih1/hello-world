"""Positive control: is the pipeline able to learn *anything* across babies? (a) cry vs non-cry, (b) baby age group 0-4 wk vs >=7 mo."""
import numpy as np, json, warnings
from sklearn.model_selection import StratifiedGroupKFold, cross_val_predict
from sklearn.linear_model import LogisticRegression
from sklearn.decomposition import PCA
from sklearn.preprocessing import StandardScaler
from sklearn.pipeline import make_pipeline
from sklearn.metrics import roc_auc_score
from common import *
warnings.filterwarnings('ignore'); df = meta(); out = {}
cryp = np.load(f'{ROOT}/data/embeddings/ast_cryprob.npy')
for feat in ['panns', 'ast', 'mobilenet']:
    X = np.load(f'{ROOT}/data/embeddings/{feat}.npy')
    mk = lambda: make_pipeline(StandardScaler(), PCA(32, random_state=0), LogisticRegression(C=0.1, class_weight='balanced', max_iter=2000))
    cv = StratifiedGroupKFold(5, shuffle=True, random_state=0)
    # (b) age
    m = (df.source == 'cleaned') & df.age.astype(str).isin(['4', '04', '72', '22'])
    yb = df.age[m].astype(str).isin(['72', '22']).values.astype(int)
    p = cross_val_predict(mk(), X[m.values], yb, cv=cv, groups=df.uuid[m], method='predict_proba')[:, 1]
    out[f'{feat}|age_0-4wk_vs_7mo+|AUC'] = round(roc_auc_score(yb, p), 3)
    # (a) hungry vs rest (the most-populated reason) for comparison
    c = (df.source == 'cleaned').values; yh = (df.label[c] == 'hungry').values.astype(int)
    p = cross_val_predict(mk(), X[c], yh, cv=cv, groups=df.uuid[c], method='predict_proba')[:, 1]
    out[f'{feat}|hungry_vs_rest|AUC'] = round(roc_auc_score(yh, p), 3)
print(json.dumps(out, indent=1)); json.dump(out, open(f'{ROOT}/results/positive_control.json', 'w'), indent=1)
