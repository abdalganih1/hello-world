# 00 — Verifying the candidates (Phase 0)

Verified on **2026-11-28** against official pages and with real calls from the work environment. Each claim has a source or a test result.

| Candidate | Exists? | Accepts audio? | Access method | Cost | License | Sources / evidence |
|---|---|---|---|---|---|---|
| **Gemini Decision 1** (Decisions API) | ✅ Yes, `gemini-decision-1`, launched 2026-11-11 | ✅ Per the official docs (wav, mp3, flac, ogg, m4a, webm, opus…); inline up to 100 MB. **No maximum audio duration** is stated in the docs | Gemini API: `POST https://generativelanguage.googleapis.com/v1beta/decisions` (`model`, `input`, `questions`); Python SDK `client.decisions.create` (google-genai ≥ 3.2). OpenRouter: `POST https://openrouter.ai/api/alpha/decisions` (`model`, `state`, `questions`) | $0.10 / 1M input tokens, output free. Free tier: 200 RPM / 10k RPD (free-tier data is used to improve products) | Google API ToS | [Google blog](https://blog.google/innovation-and-ai/technology/developers-tools/gemini-decisions-api/) · [Docs](https://aistudio.google.com/docs/decisions-api) · [Model page/pricing](https://aistudio.google.com/docs/models/gemini-decision-1) · [Rate limits](https://aistudio.google.com/docs/rate-limits) · [OpenRouter](https://openrouter.ai/google/gemini-decision-1) |
| ↳ per-class confidences | ✅ A `choice` question returns `probabilities` for each option plus `confidence` | — | `criteria` = {hungry, belly_pain, tired, discomfort, burping} | — | — | Live test (below) |
| ↳ few-shot in the same request | ⚠️ Possible by schema (`input` is `Content[]`, so several audio clips plus text fit), but no official guidance on it | — | — | Every example clip adds input tokens | — | Docs |
| **HeAR** (`google/hear`) | ✅ | ✅ 2-second clips at 16 kHz → embedding | Hugging Face **gated** (`gated: auto`): you must sign in and accept the HAI-DEF terms, then use an `HF_TOKEN` | Free (local compute; ViT-L ≈ 300M params) | Health AI Developer Foundations terms | `https://huggingface.co/api/models/google/hear` → `gated: "auto"` |
| **YAMNet** | ✅ (TF Hub / Kaggle Models) | ✅ 16 kHz | tfhub.dev and kaggle.com do not respond from the work environment (404) | Free | Apache-2.0 | Network test. **Replaced** with PANNs, the same family of AudioSet CNNs |
| **PANNs** Cnn14-16k & MobileNetV1 | ✅ | ✅ 16 kHz / 32 kHz | Zenodo record 3987831 (downloaded) | Free | MIT (code), CC-BY (weights) | Both models load and correctly output the "Baby cry, infant cry" class on a Donate-a-Cry clip |
| **AST** (MIT/ast-finetuned-audioset) | ✅ | ✅ 16 kHz | Hugging Face, open | Free | BSD-3 | Used |
| **CLAP** (laion/clap-htsat-unfused) | ✅ | ✅ 48 kHz | Hugging Face, open | Free | Apache-2.0 | Used |
| **HuBERT-base** | ✅ | ✅ 16 kHz | Hugging Face, open | Free | Apache-2.0 | Used |
| **BEATs** | ✅ (Microsoft unilm) | ✅ | The weights are on OneDrive/GitHub releases, which do not work from the work environment | — | MIT | Not tested |
| HF: `jstoone/distil-ast-audioset-finetuned-cry` | ✅ | ✅ | Open | Free | Apache-2.0 | **Trained on Nooon/Donate_a_cry**, a copy of our own data, so any evaluation on Donate-a-Cry is **contaminated** |
| HF: `AmeerHesham/distilhubert-finetuned-baby_cry` | ✅ | ✅ | Open | Free | Apache-2.0 | Same: trained on Nooon/Donate_a_cry |
| HF: `Wiam/distilhubert-finetuned-babycry-v5` | ✅ | ✅ | Open | Free | Apache-2.0 | Trained on an unnamed "audiofolder", most likely Donate-a-Cry |
| HF: `foduucom/baby-cry-classification` | ✅ (joblib + hand-crafted librosa features) | ✅ | Open | Free | Apache-2.0 | The feature parameters (n_fft/hop…) are not fully specified in the card, so it cannot be reproduced reliably |
| HF: `dontcryai/dontcry` | ✅ (gated) | ✅ | Requires sign-in | — | MIT | Not tested (gated) |
| HF: `Nerdy37/baby-cry-analyzer` | ✅ (11 classes, F1 85% self-reported + SMOTE) | ✅ | Open | — | MIT | The reported number is likely inflated (SMOTE before the split) — not adopted |
| **General audio LLM** (Gemini 3.x / 4 via OpenRouter) | ✅ Several models accept audio: `google/gemini-4-hydrogen`, `gemini-3.5-flash`, `gpt-audio`, … | ✅ | OpenRouter (key provided by the environment proxy) | e.g. Gemini 4 Hydrogen $1.5/M audio tokens | — | `GET /api/v1/models` |

## Live API tests (2026-11-28)

1. **Decision 1 via OpenRouter, audio format `input_audio`** → `402: This request requires at least $0.50 in balance for audio`.
2. **Decision 1, with an audio part in the Gemini format (`{"type":"audio","data":…}`)** → the request passed, but the audio was **not recognized as audio**. OpenRouter treated the base64 as text (95,348 input tokens for a 7-second clip, cost $0.0095), and the probabilities came back almost uniform (0.26/0.23/0.24/0.23/0.04). This result is invalid and was not used.
3. **Credit balance**: `total_credits 10.2 / total_usage 10.2017`, which is **zero**. Every audio request (Decision 1, Gemini 4, even the free Nemotron-omni) is refused with 402.

**Conclusion:** approaches A / A2 / F (online) are **blocked by the credit balance, not by a technical limit**. The script `src/online_eval.py` is ready to run on all clips once at least $3 is added to OpenRouter (estimated full cost < $1 for Decision 1 at about 220 audio tokens per 7-second clip).
Total cost incurred in this research: **$0.0095** (the one invalid request).
