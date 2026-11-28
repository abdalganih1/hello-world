#!/usr/bin/env python3
"""Baby-cry reason classifier (final CLI). Same model & logic as the web app (webapp/model.onnx).

  python classify.py --input path/to/video_or_audio.(mp4|webm|wav|mp3|m4a) [--json]
  python classify.py --input folder/ [--out predictions.csv]

Pipeline: ffmpeg -> mono -> 8 kHz band-limit (matches the 8 kHz training corpus) -> 32 kHz -> 5 s windows (hop 2.5 s)
-> PANNs MobileNetV1: AudioSet "Baby cry, infant cry" probability (cry detector) + calibrated 5-class reason head
-> reason probabilities averaged over cry windows (weighted by cry probability) -> 'uncertain' if top < threshold.
"""
import argparse, json, os, subprocess, sys, csv
import numpy as np, onnxruntime as ort
HERE = os.path.dirname(os.path.abspath(__file__))
MODEL = os.path.join(HERE, 'webapp', 'model.onnx'); CFG = json.load(open(os.path.join(HERE, 'webapp', 'config.json'), encoding='utf-8'))
SR, WIN, HOP = 32000, 5 * 32000, int(2.5 * 32000)
EXT = ('.wav', '.mp3', '.m4a', '.mp4', '.webm', '.ogg', '.flac', '.aac', '.mkv', '.mov', '.3gp', '.caf', '.opus')

def load(path):
    p1 = subprocess.run(['ffmpeg', '-v', 'error', '-i', path, '-vn', '-ac', '1', '-ar', '8000', '-f', 'f32le', '-'], capture_output=True, check=True).stdout
    p2 = subprocess.run(['ffmpeg', '-v', 'error', '-f', 'f32le', '-ar', '8000', '-ac', '1', '-i', '-', '-ar', str(SR), '-f', 'f32le', '-'], input=p1, capture_output=True, check=True).stdout
    return np.frombuffer(p2, np.float32).copy()

def norm(w):
    w = w - w.mean(); return np.clip(w * 0.1 / (np.sqrt(np.mean(w ** 2)) + 1e-9), -1, 1).astype(np.float32)

def windows(y):
    if len(y) <= WIN: return [(0.0, np.resize(y, WIN))]
    out = [(s / SR, y[s:s + WIN]) for s in range(0, len(y) - WIN + 1, HOP)]
    if (len(y) - WIN) - out[-1][0] * SR > HOP / 2: out.append(((len(y) - WIN) / SR, y[-WIN:]))
    return out

def classify(path, sess):
    y = load(path)
    if len(y) < SR: raise ValueError('audio shorter than 1 s')
    segs = []
    for t, w in windows(y):
        cry, probs = sess.run(None, {'wav': norm(w)[None]})
        segs.append(dict(start=round(t, 2), end=round(t + 5, 2), cry_prob=float(cry[0]), probs=probs[0].tolist()))
    cw = [s for s in segs if s['cry_prob'] >= CFG['cry_threshold']]
    use = cw or segs; wts = np.array([s['cry_prob'] if cw else 1.0 for s in use])
    agg = (np.array([s['probs'] for s in use]) * wts[:, None]).sum(0) / wts.sum()
    k = int(agg.argmax()); top = CFG['classes'][k]
    return dict(file=path, cry_detected=bool(cw), predicted=('no_cry' if not cw else ('uncertain' if agg[k] < CFG['uncertain_threshold'] else top)),
                top_class=top, confidence=round(float(agg[k]), 4), uncertain=bool(agg[k] < CFG['uncertain_threshold']),
                probabilities={c: round(float(p), 4) for c, p in zip(CFG['classes'], agg)},
                segments_analyzed=[(s['start'], s['end']) for s in cw], n_windows=len(segs), duration_sec=round(len(y) / SR, 2),
                model=CFG['model_name'] + ' / ' + CFG['version'])

def main():
    ap = argparse.ArgumentParser(); ap.add_argument('--input', required=True); ap.add_argument('--json', action='store_true')
    ap.add_argument('--out', default='predictions.csv'); a = ap.parse_args()
    sess = ort.InferenceSession(MODEL)
    if os.path.isdir(a.input):
        files = sorted(os.path.join(r, f) for r, _, fs in os.walk(a.input) for f in fs if f.lower().endswith(EXT))
        with open(a.out, 'w', newline='') as fh:
            w = csv.writer(fh); w.writerow(['file', 'predicted', 'top_class', 'confidence', 'cry_detected'] + CFG['classes'])
            for f in files:
                try: r = classify(f, sess)
                except Exception as e: print('skip', f, e, file=sys.stderr); continue
                w.writerow([f, r['predicted'], r['top_class'], r['confidence'], r['cry_detected']] + [r['probabilities'][c] for c in CFG['classes']])
                print(f, '->', r['predicted'], r['confidence'])
        print('wrote', a.out); return
    r = classify(a.input, sess)
    if a.json: print(json.dumps(r, ensure_ascii=False, indent=1)); return
    print(f"file: {r['file']}  ({r['duration_sec']} s, {r['n_windows']} windows, cry windows: {len(r['segments_analyzed'])})")
    if not r['cry_detected']: print('result: NO clear infant cry detected'); 
    else: print(f"result: {r['predicted']}  (top: {r['top_class']} {r['confidence']:.0%}{', below threshold -> uncertain' if r['uncertain'] else ''})")
    for c, p in sorted(r['probabilities'].items(), key=lambda x: -x[1]): print(f'  {c:12s} {p:6.1%}  {CFG["ar"][c]}')
    print('WARNING: experimental research model; cry-reason accuracy was near chance in leakage-free tests (see reports/04_final_report.md).')

if __name__ == '__main__': main()
