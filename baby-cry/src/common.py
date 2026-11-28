import os, json, numpy as np, pandas as pd
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
CLASSES = ['belly_pain', 'burping', 'discomfort', 'hungry', 'tired']
AR = {'belly_pain': 'مغص / ألم بطن', 'burping': 'بحاجة للتجشؤ', 'discomfort': 'انزعاج (حفاض/حرارة/وضعية)', 'hungry': 'جوع', 'tired': 'تعب / نعاس'}

def meta():
    df = pd.read_csv(f'{ROOT}/data/splits/metadata.csv')
    df['y'] = df.label.map(CLASSES.index)
    return df

def write_raw(name, df_rows, P, extra=None):
    os.makedirs(f'{ROOT}/results/raw', exist_ok=True)
    with open(f'{ROOT}/results/raw/{name}.jsonl', 'w') as f:
        for k, (_, r) in enumerate(df_rows.iterrows()):
            d = dict(clip_id=r.clip_id, label=r.label, cv5=int(r.cv5), split=r.split,
                     probs={c: round(float(P[k, j]), 5) for j, c in enumerate(CLASSES)},
                     pred=CLASSES[int(np.argmax(P[k]))])
            if extra: d.update(extra[k] if isinstance(extra, list) else extra)
            f.write(json.dumps(d) + '\n')
