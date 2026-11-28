# 01 — Training data (Phase 1)

## Sources checked

| Source | Classes | Size | License | Used? |
|---|---|---|---|---|
| **Donate-a-Cry** — `gveres/donateacry-corpus`, cleaned folder `donateacry_corpus_cleaned_and_updated_data` (KTH) | hungry, belly_pain, tired, discomfort (+ cold/hot merged in), burping | 457 clips · ~7 s · **8 kHz** | ODbL 1.0 / DbCL 1.0 | ✅ main set |
| Donate-a-Cry raw uploads (android/ios buckets) | the same tags plus lonely/scared/don't-know | 1,128 files | ODbL | ⚠️ tested 75 extra clips of the rare classes → **73 are not crying** per AST (dog, cat, explosion, adult speech). **Excluded** |
| HF mirrors: `Nooon/Donate_a_cry`, `MennaHalim/donate_a_cry`… | — | — | — | ❌ copies of the same corpus, and they would **contaminate** the test |
| Baby2020 (hungry/sleepy/awake, 2,190 clips) | different classes | — | not public / access unclear | ❌ not available |
| Baby Chillanto | asphyxia/deaf/normal | — | restricted (requires a request from the owners) | ❌ we did not try to get around this |
| ICSD (cry vs snoring), AudioSet "Baby cry" | cry / no cry | — | CC | ↪ used indirectly: the cry detector is an AudioSet model (PANNs) |
| ESC-50 "crying baby" | cry / no cry | 40 | CC-BY-NC | ❌ not needed |

**There is no second public labelled dataset of cry reasons** with clear access and a different source. This is the biggest limitation of the whole project.

## Preparation (`src/prep.py`)
- Decode with ffmpeg → 16 kHz mono → remove DC → trim silence (`top_db=40`) → normalise to −20 dBFS RMS.
- **Important:** the source audio is 8 kHz (telephone band, < 4 kHz), so the CLI and the web app filter input to 8 kHz the same way before the model, so phone audio matches the training audio.
- Duplicates: a hash of the quantised audio found **0** exact duplicates. Embedding similarity: 20 pairs (PANNs) / 33 pairs (AST) with cosine > 0.98, and the average similarity within the same app install is higher than between installs (0.83 vs 0.77) → this is why splitting by baby is mandatory.

## Class counts (cleaned set, after preparation)

| Class | Clips | Distinct installs ("babies") |
|---|---|---|
| hungry | 382 (83.6%) | 205 |
| discomfort | 27 | 16 |
| tired | 24 | 16 |
| belly_pain | 16 | **7** |
| burping | 8 | **7** |
| **Total** | **457** | **221** |

The labels were entered **by the parents themselves** in the app (their guess of the reason), not by a specialist.

## Splitting (no leakage)
- **Group = app install uuid** (the closest available proxy for the baby or family). All clips from one install are in the same split.
- **Main evaluation: 5-fold Stratified-Group cross-validation (`cv5`)** over all 457 clips, giving out-of-fold predictions for every clip. Why? A fixed 70/15/15 split leaves 1 to 3 clips of some classes in the test set (burping: 1), which cannot be measured.
- Hyperparameters and calibration (temperature scaling) are tuned with an **inner** 4-fold grouped CV inside the training part of each fold only.
- The fixed 70/15/15 split is also saved (`split` column in `data/splits/metadata.csv`) for reference.
- Augmentation (±2 semitones, time stretch, gain ±6 dB, white/brown noise at SNR 5–25 dB, SpecAugment) is applied **to training only** (CNN approach).
