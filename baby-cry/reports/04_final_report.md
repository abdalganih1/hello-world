# 04 — Final report: classifying the reason for a baby's cry

**Date:** 2026-11-28 · **For:** Eng. Abdalgani Al-Hamdi (Techno Enjaz) · the smart-incubator graduation project
**Web app for testing from phones:** https://baby-cry-analyzer.pages.dev

## Executive summary (in brief)

1. **No model succeeded at classifying the cry reason** on the only public data (Donate-a-Cry) once it was tested honestly (each baby is evaluated by a model that never heard them).
   The best result was macro-F1 **0.21** [0.17–0.25] against **0.18** for the baseline that always says "hungry". That difference is not statistically significant, and AUC ≈ 0.50 (chance).
2. This is **not a code bug**: the same pipeline learns the baby's age (AUC 0.70) from the same recordings. The problem is in the **data**. The labels are parents' guesses, 84% of them "hungry", and belly_pain and burping each come from only 7 babies.
3. The high numbers circulating online (60–90%) come from **leakage** (the same baby in train and test) and from accuracy being dominated by the "hungry" class. The one public model with a high number here (distil-AST, AUC 0.92) **was trained on these same clips**.
4. **Detecting whether a baby is crying** is reliable (AUC **0.98**, 7 ms per 5-second window). That part is ready for the incubator now.
5. The **YouTube** test and **Gemini Decision 1** were **not run**, for documented reasons (YouTube's bot block, a zero OpenRouter balance). Both are ready to run, and the web app makes the YouTube test possible from your phones today.

## Answers to the plan's questions

### 1) Which approach won, and by how much?
No approach clearly beat the baseline. In numbers: the AST+PANNs+CLAP ensemble at 0.206 [0.170–0.250] versus the baseline at 0.182 [0.175–0.189]; the intervals overlap.
**The model chosen for deployment:** PANNs MobileNetV1 + logistic regression. The choice was **practical, not on accuracy**, since everything is equally weak. It gives the best cry detector, it is small (24 MB, 7 ms) and it runs on the phone without sending audio. The reason head is kept as an "experimental" label, shown with `uncertain` whenever its confidence is low.
The YouTube external test, which is meant to decide the final model, has not happened yet. It will happen through the app.

### 2) Gemini Decision 1 vs HeAR + classifier?
**Neither one was measured**, and I won't make up a number:
- **Decision 1:** verified from official sources (it exists, `gemini-decision-1`, it accepts audio, and returns a probability for each option). The one real call that went through was invalid: OpenRouter did not treat the audio as audio. Every proper audio call was refused for lack of balance (`402`).
  To run it: add about **$3** to OpenRouter, or use a free **Gemini API** key (free tier: 10,000 requests a day) → `GEMINI_API_KEY=… python src/online_eval.py decision` and then `--fewshot`.
  You can also try it now from the web app (⚙️ Advanced), but that path is experimental and untested.
- **HeAR:** gated on Hugging Face. It needs an `HF_TOKEN` from an account that has accepted the HAI-DEF terms. The 8 general-purpose embeddings we did test (AST, PANNs×2, CLAP, HuBERT…) all came out at chance, so there is no reason to expect HeAR to be very different **on the same labels**.
  HeAR could still help with more reliable labels (e.g. pain vs non-pain).

### 3) Which classes are reliable?
None of the 5 reasons is reliable. "hungry" gets a high F1 (0.80) only because it is the majority class; its AUC is 0.53.
"discomfort" showed a weak hint (AUC ≈ 0.65 in three models), but on 27 clips from 16 babies.
**What is reliable:** detecting a cry at all (AUC 0.98).

### 4) Cost and latency per 1,000 cries
| Setup | Latency | Cost per 1,000 |
|---|---|---|
| MobileNet ONNX (the final setup, phone or server) | ~7 ms per 5-second window on a server CPU; a few hundred ms on a phone | $0 |
| AST on a server CPU | ~0.6 s/clip | $0 (compute only) |
| Gemini Decision 1 (estimate, not measured) | 150–250 ms per Google's claim | ≈ 220 audio tokens × $0.10/M ≈ **$0.02 per 1,000** (+ few-shot clips) |

### 5) Does a lightweight version run on the device?
- **Raspberry Pi 4/5:** yes. The MobileNet ONNX model (24 MB) runs with onnxruntime at full speed, and the small CNN (160k params) is lighter still.
- **ESP32-S3:** the small CNN can run with Edge Impulse / TFLite-Micro after int8 quantisation, but its accuracy (0.115) is **below** the baseline. So there is no "accuracy cost" to discuss: there is no accuracy to begin with.
  The ESP32-S3 can host the **cry detector** (a simple version) and send the audio to the server for analysis.

### 6) Limitations and next steps (the most important section)
1. **Data, not models.** The highest-value step is to **collect labelled recordings from the incubator itself**: each cry plus what the nurse or mother did and what calmed the baby (fed → calmed = hungry). These labels are **verified by the outcome**, not guessed. Even 30–50 babies would change the picture.
2. **Sensor fusion** is where the real answer comes from: time since the last feed (the strongest predictor of hunger), temperature and humidity (heat/cold), diaper/movement sensors, and time of day (tiredness). A good audio cry detector plus these sensors plus an LLM to explain will beat any audio-only classifier.
3. Run the **YouTube** test through the app (📋 `reports/02_youtube_set_for_review.md`), ideally with a specialist confirming the labels.
4. Run **Decision 1** (zero and few-shot) and an **audio LLM** once a key or balance is available. Everything is scripted.
5. Get **HeAR** (an HF token) and try it on a more meaningful binary question (pain vs non-pain), if a dataset with clinical labels exists.
6. "Illness": not claimed at all. It needs clinical data and sensor fusion.

### Privacy
The deployed web app analyses **on the phone**, and no audio leaves it. The only exception is the optional Gemini option, which sends the clip to Google, and the app says so clearly.
For the incubator server, offline models (MobileNet/AST) keep the audio inside the hospital. Gemini/OpenRouter means audio goes to a third party.

## Costs incurred in this phase
| Item | Cost |
|---|---|
| OpenRouter (one Decision 1 request, invalid) | $0.0095 |
| Cloudflare Pages | $0 (free tier) |
| **Total** | **≈ $0.01** |

## Reproducibility
Seeds: split 1234, inner CV 7, CNN 0. Versions: torch 2.15.0+cpu, transformers (HF), librosa 1.0.1, onnxruntime-web 1.20.1. Date: 2026-11-28. Everything is in `src/`, and `README.md` gives the order.
