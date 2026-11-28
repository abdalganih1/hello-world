"""Final model for the web app / CLI: PANNs MobileNetV1 (AudioSet cry detector + embedding) + calibrated reason head -> ONNX."""
import json, os, numpy as np, torch, torch.nn as nn, warnings, soundfile as sf, librosa
from sklearn.linear_model import LogisticRegression
from sklearn.decomposition import PCA
from sklearn.preprocessing import StandardScaler
from sklearn.pipeline import make_pipeline
from sklearn.metrics import f1_score, roc_auc_score
from common import *
from panns import MobileNetV1, load_ckpt
from train_embed import inner_oof, fit_T, models
warnings.filterwarnings('ignore')
FEAT = os.environ.get('FEAT', 'mobilenet')
df = meta(); cl = (df.source == 'cleaned').values
X = np.load(f'{ROOT}/data/embeddings/{FEAT}.npy')[cl]; y = df.y.values[cl]; g = df.uuid.values[cl]
best = None
for name, make in models():
    P = inner_oof(make, X, y, g); s = f1_score(y, P.argmax(1), average='macro')
    if best is None or s > best[0]: best = (s, name, make, P)
s, name, make, P = best; T = float(fit_T(np.log(P + 1e-9), y))
pipe = make().fit(X, y)
sc, pca, lr = pipe.steps[0][1], pipe.steps[1][1], pipe.steps[2][1]
print('head', name, 'grouped-CV macroF1', round(s, 3), 'T', round(T, 3))

class Web(nn.Module):
    def __init__(s):
        super().__init__()
        s.net = MobileNetV1(); s.net.load_state_dict(load_ckpt(f'{ROOT}/models/pretrained/MobileNetV1_mAP=0.389.pth')); s.net.eval()
        f = lambda a: nn.Parameter(torch.tensor(np.asarray(a), dtype=torch.float32), requires_grad=False)
        s.mu, s.sd = f(sc.mean_), f(sc.scale_); s.pm, s.pc = f(pca.mean_), f(pca.components_)
        s.W, s.b, s.T = f(lr.coef_), f(lr.intercept_), f([T])
    def forward(s, wav):
        o = s.net(wav); e = (o['embedding'] - s.mu) / s.sd
        z = (e - s.pm) @ s.pc.T
        return o['clipwise_output'][:, 23], torch.softmax((z @ s.W.T + s.b) / s.T, -1)
m = Web().eval()
os.makedirs(f'{ROOT}/models/final', exist_ok=True)
onnx_path = f'{ROOT}/models/final/model.onnx'
torch.onnx.export(m, torch.zeros(1, 160000), onnx_path, input_names=['wav'], output_names=['cry', 'probs'],
                  dynamic_axes={'wav': {0: 'b'}, 'cry': {0: 'b'}, 'probs': {0: 'b'}}, opset_version=17, dynamo=False)
import onnxruntime as ort
sess = ort.InferenceSession(onnx_path)
# parity + cry-detector threshold: 5 s windows of cleaned cries vs. raw-bucket clips that AST says are NOT cries
cryp = np.load(f'{ROOT}/data/embeddings/ast_cryprob.npy')
def win5(p):
    w = librosa.resample(librosa.resample(sf.read(f'{ROOT}/{p}')[0].astype(np.float32), orig_sr=16000, target_sr=8000), orig_sr=8000, target_sr=32000)
    w = np.pad(w, (0, max(0, 160000 - len(w))), mode='wrap')[:160000]; w = w - w.mean(); return (w * 0.1 / (np.sqrt(np.mean(w**2)) + 1e-9)).clip(-1, 1).astype(np.float32)
pos = [win5(p) for p in df.path[cl].values[::4]]; neg = [win5(p) for p, c, s_ in zip(df.path, cryp, df.source) if s_ != 'cleaned' and c < 0.05]
cp = np.array([sess.run(None, {'wav': w[None]})[0][0] for w in pos]); cn = np.array([sess.run(None, {'wav': w[None]})[0][0] for w in neg])
with torch.no_grad(): pt = m(torch.from_numpy(pos[0])[None])
on = sess.run(None, {'wav': pos[0][None]})
print('parity max abs diff', float(np.abs(pt[1].numpy() - on[1]).max()), float(abs(pt[0].item() - on[0][0])))
thr_grid = np.r_[np.linspace(0.002, 0.02, 10), np.linspace(0.03, 0.6, 58)]
j = [((cp >= t).mean() - (cn >= t).mean()) for t in thr_grid]; thr = float(thr_grid[int(np.argmax(j))])
auc = roc_auc_score(np.r_[np.ones(len(cp)), np.zeros(len(cn))], np.r_[cp, cn])
print(f'cry detector: AUC {auc:.3f}, thr {thr:.2f}, TPR {(cp>=thr).mean():.3f}, FPR {(cn>=thr).mean():.3f}  (pos {len(cp)}, neg {len(cn)})')
# abstention threshold on the grouped OOF (calibrated) probabilities: keep the top-confidence predictions whose accuracy beats majority
Pc = np.exp(np.log(P + 1e-9) / T); Pc /= Pc.sum(1, keepdims=True)
cfg = dict(model_name=f'PANNs MobileNetV1 + {name}', version='v1-2026-11-28', classes=CLASSES, ar=AR,
           en={'hungry': 'hunger cry', 'belly_pain': 'colic / belly pain cry', 'tired': 'tired / sleepy cry',
               'discomfort': 'discomfort (wet diaper, too hot or cold, bad position)', 'burping': 'needs to burp / trapped air'},
           cry_threshold=round(thr, 2), uncertain_threshold=0.5, sample_rate=32000, window_sec=5,
           eval=dict(reason_grouped_cv_macroF1=round(s, 3), cry_detector_auc=round(auc, 3)))
json.dump(cfg, open(f'{ROOT}/models/final/config.json', 'w'), ensure_ascii=False, indent=1)
print('onnx size MB', os.path.getsize(onnx_path) / 1e6)
