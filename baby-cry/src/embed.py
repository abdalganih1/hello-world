"""Extract clip-level embeddings for every processed clip with several pretrained audio models."""
import os, sys, time, json
import numpy as np, pandas as pd, soundfile as sf, torch, librosa
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
torch.set_num_threads(4)
df = pd.read_csv(f'{ROOT}/data/splits/metadata.csv')
os.makedirs(f'{ROOT}/data/embeddings', exist_ok=True)
wavs = [sf.read(f'{ROOT}/{p}')[0].astype(np.float32) for p in df.path]

def run(name, fn):
    out = f'{ROOT}/data/embeddings/{name}.npy'
    if os.path.exists(out): print('have', name); return
    t = time.time(); E = []
    with torch.inference_mode():
        for i, w in enumerate(wavs): E.append(fn(w))
    E = np.stack(E); np.save(out, E)
    print(name, E.shape, f'{(time.time()-t)/len(wavs)*1000:.0f} ms/clip', flush=True)

which = sys.argv[1:]
if 'ast' in which:
    from transformers import ASTFeatureExtractor, ASTForAudioClassification
    fe = ASTFeatureExtractor.from_pretrained('MIT/ast-finetuned-audioset-10-10-0.4593')
    m = ASTForAudioClassification.from_pretrained('MIT/ast-finetuned-audioset-10-10-0.4593').eval()
    cry = [i for i, l in m.config.id2label.items() if 'cry' in l.lower() or 'baby' in l.lower()]
    print({i: m.config.id2label[i] for i in cry})
    ci = [i for i, l in m.config.id2label.items() if l == 'Baby cry, infant cry'][0]
    probs = []
    def f(w):
        x = fe(w, sampling_rate=16000, return_tensors='pt')
        o = m(**x, output_hidden_states=True)
        probs.append(torch.sigmoid(o.logits)[0, ci].item())
        h = o.hidden_states[-1][0]
        return torch.cat([h[:2].mean(0), h[2:].mean(0)]).numpy()
    run('ast', f)
    if probs: np.save(f'{ROOT}/data/embeddings/ast_cryprob.npy', np.array(probs))
if 'clap' in which:
    from transformers import ClapModel, ClapProcessor
    m = ClapModel.from_pretrained('laion/clap-htsat-unfused').eval(); p = ClapProcessor.from_pretrained('laion/clap-htsat-unfused')
    def f(w):
        x = p(audio=librosa.resample(w, orig_sr=16000, target_sr=48000), sampling_rate=48000, return_tensors='pt')
        return m.get_audio_features(**x)[0].numpy()
    run('clap', f)
if 'panns' in which:
    sys.path.insert(0, f'{ROOT}/src'); from panns import Cnn14_16k
    m = Cnn14_16k(); from panns import load_ckpt; m.load_state_dict(load_ckpt(f'{ROOT}/models/pretrained/Cnn14_16k_mAP=0.438.pth')); m.eval()
    run('panns', lambda w: m(torch.from_numpy(w)[None])['embedding'][0].numpy())
if 'hubert' in which:
    from transformers import AutoFeatureExtractor, AutoModel
    fe = AutoFeatureExtractor.from_pretrained('facebook/hubert-base-ls960'); m = AutoModel.from_pretrained('facebook/hubert-base-ls960').eval()
    def f(w):
        hs = m(**fe(w, sampling_rate=16000, return_tensors='pt'), output_hidden_states=True).hidden_states
        return torch.cat([hs[k][0].mean(0) for k in (4, 8, 12)]).numpy()
    run('hubert', f)
if 'mobilenet' in which:
    sys.path.insert(0, f'{ROOT}/src'); from panns import MobileNetV1, load_ckpt
    m = MobileNetV1(); m.load_state_dict(load_ckpt(f'{ROOT}/models/pretrained/MobileNetV1_mAP=0.389.pth')); m.eval()
    run('mobilenet', lambda w: m(torch.from_numpy(librosa.resample(w, orig_sr=16000, target_sr=32000))[None])['embedding'][0].numpy())
if 'hfcry' in which:   # existing HF baby-cry classifiers: store their class-probabilities
    from transformers import pipeline
    for mid in ['jstoone/distil-ast-audioset-finetuned-cry', 'AmeerHesham/distilhubert-finetuned-baby_cry', 'Wiam/distilhubert-finetuned-babycry-v5']:
        name = 'hf_' + mid.split('/')[1]
        if os.path.exists(f'{ROOT}/data/embeddings/{name}.json'): continue
        pipe = pipeline('audio-classification', model=mid, device=-1)
        labs = list(pipe.model.config.id2label.values()); print(mid, labs)
        P = []
        t = time.time()
        for w in wavs:
            r = pipe({'raw': w, 'sampling_rate': 16000}, top_k=None)
            d = {x['label']: x['score'] for x in r}; P.append([d[l] for l in labs])
        json.dump({'labels': labs, 'probs': P, 'ms_per_clip': (time.time()-t)/len(wavs)*1000}, open(f'{ROOT}/data/embeddings/{name}.json', 'w'))
        print(name, 'done', flush=True)
