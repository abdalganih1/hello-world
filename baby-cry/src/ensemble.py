"""Approach G: average of calibrated OOF probabilities of the leakage-free approaches (excludes contaminated hf_*)."""
import json, sys, numpy as np, pandas as pd
from common import *
members = sys.argv[1:] or ['ast_clean', 'panns_clean', 'clap_clean']
R = {m: {json.loads(l)['clip_id']: json.loads(l) for l in open(f'{ROOT}/results/raw/{m}.jsonl')} for m in members}
ids = list(R[members[0]]); df = meta().set_index('clip_id').loc[ids].reset_index()
P = np.mean([[[R[m][i]['probs'][c] for c in CLASSES] for i in ids] for m in members], 0)
write_raw('ensemble_' + '+'.join(m.replace('_clean', '') for m in members), df, P, extra={'members': members})
