"""Approaches A / A2 / F: online models. Ready to run; was BLOCKED on 2026-11-28 (OpenRouter balance = 0 -> HTTP 402 for audio).
Usage:
  python online_eval.py decision   [--fewshot]   # Gemini Decision 1 via Gemini API (GEMINI_API_KEY) or OpenRouter (OPENROUTER_API_KEY)
  python online_eval.py llm --model google/gemini-4-hydrogen --repeats 3
Writes results/raw/<approach>.jsonl with the raw response for every clip + cost log."""
import os, sys, json, time, base64, argparse, urllib.request, numpy as np
from common import *
ap = argparse.ArgumentParser(); ap.add_argument('mode'); ap.add_argument('--fewshot', action='store_true')
ap.add_argument('--model', default='google/gemini-4-hydrogen'); ap.add_argument('--repeats', type=int, default=1)
ap.add_argument('--limit', type=int, default=0); a = ap.parse_args()
DESC = {'hungry': 'hunger cry', 'belly_pain': 'colic / belly pain cry', 'tired': 'tired / sleepy cry',
        'discomfort': 'discomfort (wet diaper, too hot or cold, bad position)', 'burping': 'needs to burp / trapped air'}
INSTR = 'The audio is an infant crying. Based only on the acoustic characteristics of the cry, what is the most likely reason the baby is crying?'

def post(url, body, headers):
    r = urllib.request.Request(url, data=json.dumps(body).encode(), headers={'Content-Type': 'application/json', **headers})
    t = time.time(); d = json.loads(urllib.request.urlopen(r, timeout=120).read()); return d, (time.time() - t) * 1000

def b64(path): return base64.b64encode(open(f'{ROOT}/{path}', 'rb').read()).decode()

def decision(path, shots):
    q = {'reason': {'type': 'choice', 'instructions': INSTR, 'criteria': DESC}}
    if os.environ.get('GEMINI_API_KEY'):
        parts = []
        for lab, p in shots: parts += [{'type': 'text', 'text': f'\nExample of a {lab} cry:\n'}, {'type': 'audio', 'data': b64(p), 'mime_type': 'audio/wav'}]
        parts += [{'type': 'text', 'text': '\nCry to classify:\n'}, {'type': 'audio', 'data': b64(path), 'mime_type': 'audio/wav'}]
        d, ms = post('https://generativelanguage.googleapis.com/v1beta/decisions', {'model': 'gemini-decision-1', 'input': parts, 'questions': q},
                     {'x-goog-api-key': os.environ['GEMINI_API_KEY']})
    else:
        parts = []
        for lab, p in shots: parts += [{'type': 'text', 'text': f'\nExample of a {lab} cry:\n'}, {'type': 'input_audio', 'input_audio': {'data': b64(p), 'format': 'wav'}}]
        parts += [{'type': 'text', 'text': '\nCry to classify:\n'}, {'type': 'input_audio', 'input_audio': {'data': b64(path), 'format': 'wav'}}]
        d, ms = post('https://openrouter.ai/api/alpha/decisions', {'model': 'google/gemini-decision-1', 'state': parts, 'questions': q},
                     {'Authorization': f'Bearer {os.environ.get("OPENROUTER_API_KEY", "x")}'})
    pr = d['answers']['reason']['probabilities']
    return np.array([pr.get(c, 0) for c in CLASSES]), d, ms

def llm(path):
    prompt = INSTR + ' Options: ' + '; '.join(f'{c} = {v}' for c, v in DESC.items()) + \
        '. Reply ONLY with JSON: {"probs": {"hungry":p,"belly_pain":p,"tired":p,"discomfort":p,"burping":p}} (probabilities sum to 1).'
    body = {'model': a.model, 'temperature': 0.7, 'response_format': {'type': 'json_object'},
            'messages': [{'role': 'user', 'content': [{'type': 'text', 'text': prompt}, {'type': 'input_audio', 'input_audio': {'data': b64(path), 'format': 'wav'}}]}]}
    d, ms = post('https://openrouter.ai/api/v1/chat/completions', body, {'Authorization': f'Bearer {os.environ.get("OPENROUTER_API_KEY", "x")}'})
    pr = json.loads(d['choices'][0]['message']['content'])['probs']
    v = np.array([float(pr.get(c, 0)) for c in CLASSES]); return v / max(v.sum(), 1e-9), d, ms

df = meta(); cl = df[df.source == 'cleaned'].reset_index(drop=True)
if a.limit: cl = cl.groupby('label').head(a.limit).reset_index(drop=True)
name = ('decision1' + ('_fewshot' if a.fewshot else '')) if a.mode == 'decision' else 'llm_' + a.model.split('/')[-1]
P = np.zeros((len(cl), 5)); extra = []; cost = 0
for i, r in cl.iterrows():
    shots = []
    if a.fewshot:   # 1 example per class from OTHER folds / other babies
        pool = cl[(cl.cv5 != r.cv5) & (cl.uuid != r.uuid)]
        shots = [(c, pool[pool.label == c].sample(1, random_state=i).path.iloc[0]) for c in CLASSES]
    runs = []
    for k in range(a.repeats if a.mode == 'llm' else 1):
        p, d, ms = decision(r.path, shots) if a.mode == 'decision' else llm(r.path)
        runs.append(p); cost += float(d.get('usage', {}).get('cost', 0) or 0)
    P[i] = np.mean(runs, 0)
    extra.append(dict(latency_ms=round(ms), raw=d, agreement=float(np.mean([np.argmax(x) == np.argmax(runs[0]) for x in runs]))))
    print(i, r.label, CLASSES[P[i].argmax()], f'${cost:.4f}', flush=True)
write_raw(name, cl, P, extra)
json.dump({'approach': name, 'date': time.strftime('%F'), 'total_cost_usd': cost, 'clips': len(cl)}, open(f'{ROOT}/results/raw/{name}.cost.json', 'w'))
