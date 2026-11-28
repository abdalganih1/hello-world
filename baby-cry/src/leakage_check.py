"""Why published Donate-a-Cry accuracies look high: (1) random clip-level CV vs grouped CV, (2) near-duplicate pairs."""
import numpy as np, json, warnings
from sklearn.model_selection import StratifiedKFold, StratifiedGroupKFold, cross_val_predict
from sklearn.linear_model import LogisticRegression
from sklearn.decomposition import PCA
from sklearn.preprocessing import StandardScaler
from sklearn.pipeline import make_pipeline
from sklearn.metrics import f1_score, accuracy_score
from common import *
warnings.filterwarnings('ignore')
df = meta(); cl = (df.source == 'cleaned').values; d = df[cl].reset_index(drop=True); out = {}
for feat in ['panns', 'ast']:
    X = np.load(f'{ROOT}/data/embeddings/{feat}.npy')[cl]
    Xn = X / np.linalg.norm(X, axis=1, keepdims=True); S = Xn @ Xn.T; np.fill_diagonal(S, 0)
    iu = np.triu_indices(len(X), 1); U = np.asarray(d.uuid, dtype=object); same = (U[:, None] == U[None, :])[iu]
    out[f'{feat}_cos_same_uuid_mean'] = float(S[iu][same].mean()); out[f'{feat}_cos_diff_uuid_mean'] = float(S[iu][~same].mean())
    out[f'{feat}_pairs_cos>0.98'] = int((S[iu] > 0.98).sum())
    for name, cv, groups in [('random_clip_split', StratifiedKFold(5, shuffle=True, random_state=0), None),
                             ('grouped_by_uuid', StratifiedGroupKFold(5, shuffle=True, random_state=0), d.uuid)]:
        for bal in ['balanced', None]:
            m = make_pipeline(StandardScaler(), PCA(64, random_state=0), LogisticRegression(C=0.1, class_weight=bal, max_iter=2000))
            p = cross_val_predict(m, X, d.y, cv=cv, groups=groups)
            out[f'{feat}|{name}|cw={bal}'] = dict(macroF1=round(f1_score(d.y, p, average='macro'), 3), acc=round(accuracy_score(d.y, p), 3))
json.dump(out, open(f'{ROOT}/results/leakage_check.json', 'w'), indent=1); print(json.dumps(out, indent=1))
