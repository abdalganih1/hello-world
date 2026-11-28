# Baby Cry Classification — graduation project (smart incubator)

**Live web app (works on phones, analysis runs on the device itself):** https://baby-cry-analyzer.pages.dev

> ⚠️ Experimental research tool, not a medical diagnosis. Detecting **that** a baby is crying is reliable (AUC ≈ 0.98).
> Classifying **why** the baby is crying stayed at chance level in leakage-free tests on the only available public data. See `reports/04_final_report.md`.

## Quick start (CLI)
```bash
pip install onnxruntime numpy        # + ffmpeg on PATH
python classify.py --input cry.mp4            # video or audio (mp4/webm/wav/mp3/m4a/…)
python classify.py --input cry.wav --json     # full JSON: class, per-class probabilities, uncertain flag, cry segments
python classify.py --input folder/ --out predictions.csv   # batch mode
```
Output: predicted class (`hungry / belly_pain / tired / discomfort / burping`, or `uncertain` / `no_cry`), per-class confidences,
the 5-second windows in which a cry was detected, and the model version.

## Web app (`webapp/`)
- Record from the microphone (up to 30 s) or upload any audio/video file (e.g. a YouTube clip you downloaded).
- Runs `model.onnx` (24 MB) in the browser via onnxruntime-web. **No audio leaves the phone.**
- 🧪 **Test log:** pick the "true reason" stated by the expert in the video, analyse, and the app keeps a running score. You can export it as CSV.
  This is how to run the plan's external YouTube test (downloading YouTube from the cloud machine was blocked).
- Optional ⚙️: paste your own **Gemini API key** (free in Google AI Studio) to compare with **Gemini Decision 1**.
  Doing so sends the cry clip to Google. This path is experimental and was not validated (see reports/00).
- Deploy: `npx wrangler pages deploy webapp --project-name baby-cry-analyzer --branch main` (env `CLOUDFLARE_API_TOKEN`, `CLOUDFLARE_ACCOUNT_ID`).

## Reproduce the research
```bash
pip install torch torchaudio --index-url https://download.pytorch.org/whl/cpu
pip install librosa scikit-learn soundfile transformers torchlibrosa onnx onnxruntime matplotlib pandas
git clone https://github.com/gveres/donateacry-corpus data/raw/donateacry-corpus
# PANNs weights from https://zenodo.org/record/3987831 -> models/pretrained/
cd src
python prep.py                                   # 16 kHz, trim, normalise, grouped splits
python embed.py ast clap panns mobilenet hubert hfcry
python handcrafted.py
python train_embed.py ast clap panns mobilenet hubert handcrafted
python train_cnn.py                               # approach D
python eval_hf.py                                 # approach E (existing HF models)
python leakage_check.py
python compare.py                                 # -> results/comparison.csv, confusion matrices
FEAT=mobilenet python export_web.py               # -> models/final/model.onnx + config.json (copy to webapp/)
# online approaches (need credit): OPENROUTER_API_KEY=… or GEMINI_API_KEY=… python online_eval.py decision [--fewshot]
#                                   python online_eval.py llm --model google/gemini-4-hydrogen --repeats 3
```

## API keys (env vars only, never hard-coded)
| Var | Used by |
|---|---|
| `GEMINI_API_KEY` | `src/online_eval.py decision` (Gemini Decisions API directly) |
| `OPENROUTER_API_KEY` | `src/online_eval.py` via OpenRouter (Decision 1 + audio LLMs) |
| `CLOUDFLARE_API_TOKEN`, `CLOUDFLARE_ACCOUNT_ID` | deploying the web app |

## Layout
```
classify.py            final CLI (same model/logic as the web app)
webapp/                static site: index.html, app.js, model.onnx, config.json
src/                   pipeline scripts
data/splits/metadata.csv   every clip: label, uuid group, cv5 fold, split
data/youtube_test/manifest.csv   candidate expert videos (needs human review)
results/raw/*.jsonl    out-of-fold predictions per approach   results/comparison.csv   results/confusion_matrices/*.png
reports/00..04         verification, datasets, YouTube set, comparison, final report
```

## Known limitations
- Training labels are parents' guesses (Donate-a-Cry), 84% "hungry"; belly_pain and burping come from only 7 babies each.
- 8 kHz source audio. Inputs are band-limited to match, which discards information above 4 kHz.
- The external YouTube test has **not** been run yet (blocked download). Use the web app's test log.
- Approaches that send audio to third parties: Gemini Decision 1 and audio LLMs (Google / OpenRouter). Offline ones keep the audio on the device or server.
