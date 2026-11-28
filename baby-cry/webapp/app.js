'use strict';
const $ = (id) => document.getElementById(id);
const SR = 32000, WIN = 5 * SR, HOP = 2.5 * SR;
let cfg, session, busy = false;
ort.env.wasm.wasmPaths = 'https://cdn.jsdelivr.net/npm/onnxruntime-web@1.20.1/dist/';
ort.env.wasm.numThreads = 1;

const store = {
  get(k, d) { try { const v = localStorage.getItem(k); return v === null ? d : JSON.parse(v); } catch { return d; } },
  set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch {} },
};

function status(t, p) {
  $('status').textContent = t;
  $('prog').style.display = p == null ? 'none' : 'block';
  if (p != null) $('prog').firstElementChild.style.width = Math.round(p * 100) + '%';
}

async function init() {
  try {
    cfg = await (await fetch('config.json')).json();
    $('ver').textContent = `النموذج: ${cfg.model_name} · ${cfg.version}`;
    for (const c of cfg.classes) { const o = document.createElement('option'); o.value = c; o.textContent = cfg.ar[c]; $('truth').appendChild(o); }
    session = await ort.InferenceSession.create('model.onnx', { executionProviders: ['wasm'] });
    status('جاهز. سجّل بكاء أو اختار ملف (يوتيوب منزّل، تسجيل، …).');
  } catch (e) { status('تعذّر تحميل النموذج: ' + e.message); }
  $('gkey').value = store.get('gkey', '');
  $('gkey').addEventListener('change', () => store.set('gkey', $('gkey').value.trim()));
  renderLog();
}

async function decodeToMono(arrayBuffer) {
  const AC = window.AudioContext || window.webkitAudioContext;
  const ac = new AC();
  const buf = await new Promise((res, rej) => { const p = ac.decodeAudioData(arrayBuffer, res, rej); if (p && p.catch) p.catch(rej); });
  ac.close && ac.close();
  // the training corpus (Donate-a-Cry) is 8 kHz telephone-band audio: band-limit the same way (-> 8 kHz -> 32 kHz)
  const render = async (b, rate) => {
    const off = new OfflineAudioContext(1, Math.ceil(b.duration * rate), rate);
    const src = off.createBufferSource(); src.buffer = b; src.connect(off.destination); src.start();
    return off.startRendering();
  };
  const r = await render(await render(buf, 8000), SR);
  return r.getChannelData(0).slice();
}

function rmsNormalize(x) {   // same as training: remove DC, -20 dBFS RMS on the analysed window
  let m = 0; for (const v of x) m += v; m /= x.length;
  let s = 0; for (let i = 0; i < x.length; i++) { x[i] -= m; s += x[i] * x[i]; }
  const g = 0.1 / (Math.sqrt(s / x.length) + 1e-9);
  for (let i = 0; i < x.length; i++) x[i] = Math.max(-1, Math.min(1, x[i] * g));
  return x;
}

function windows(y) {
  const out = [];
  if (y.length <= WIN) { const w = new Float32Array(WIN); for (let i = 0; i < WIN; i++) w[i] = y[i % y.length]; out.push({ t: 0, w }); return out; }
  for (let s = 0; s + WIN <= y.length; s += HOP) out.push({ t: s / SR, w: y.slice(s, s + WIN) });
  const last = y.length - WIN; if (out.length && out[out.length - 1].t * SR < last - HOP / 2) out.push({ t: last / SR, w: y.slice(last) });
  return out;
}

async function analyse(arrayBuffer, sourceName) {
  if (busy || !session) return; busy = true;
  $('result').classList.add('hidden');
  try {
    status('جاري فك الصوت…', 0.05);
    const y = await decodeToMono(arrayBuffer);
    if (y.length < SR) throw new Error('المقطع أقصر من ثانية');
    const maxSec = 600; const yy = y.length > maxSec * SR ? y.slice(0, maxSec * SR) : y;
    const ws = windows(yy); const res = [];
    for (let i = 0; i < ws.length; i++) {
      status(`جاري التحليل… ${i + 1}/${ws.length}`, 0.1 + 0.9 * i / ws.length);
      const w = rmsNormalize(Float32Array.from(ws[i].w));
      const out = await session.run({ wav: new ort.Tensor('float32', w, [1, WIN]) });
      res.push({ t: ws[i].t, cry: out.cry.data[0], probs: Array.from(out.probs.data) });
      await new Promise((r) => setTimeout(r, 0));
    }
    show(res, yy, sourceName);
    status(`تم. مدة المقطع ${(yy.length / SR).toFixed(1)} ثانية.`);
  } catch (e) {
    console.error(e); status('ما قدرت حلّل الملف: ' + (e.message || e) + ' — جرّب صيغة mp3/m4a/wav.');
  } finally { busy = false; }
}

function show(res, y, sourceName) {
  const thr = cfg.cry_threshold;
  let cryW = res.filter((r) => r.cry >= thr);
  const noCry = cryW.length === 0;
  const agg = new Array(cfg.classes.length).fill(0); let wsum = 0;
  for (const r of (noCry ? res : cryW)) { const w = noCry ? 1 : r.cry; r.probs.forEach((p, j) => agg[j] += w * p); wsum += w; }
  agg.forEach((_, j) => agg[j] /= wsum);
  const order = agg.map((p, j) => [p, j]).sort((a, b) => b[0] - a[0]);
  const top = order[0], cls = cfg.classes[top[1]];
  const uncertain = top[0] < cfg.uncertain_threshold;
  $('result').classList.remove('hidden');
  if (noCry) {
    $('rTitle').textContent = 'النتيجة';
    $('rLabel').textContent = 'ما في بكاء رضيع واضح 🤔';
    $('rConf').innerHTML = `أعلى احتمال بكاء بالمقطع ${(Math.max(...res.map((r) => r.cry)) * 100).toFixed(0)}% (العتبة ${(thr * 100).toFixed(0)}%). الأعمدة تحت للمقطع كامل للاطلاع بس.`;
  } else {
    $('rTitle').textContent = 'السبب المرجّح';
    $('rLabel').innerHTML = (uncertain ? 'غير متأكد' : cfg.ar[cls]) + (uncertain ? `<span class="tag unc">أقرب احتمال: ${cfg.ar[cls]}</span>` : `<span class="tag ok">ثقة ${(top[0] * 100).toFixed(0)}%</span>`);
    $('rConf').textContent = uncertain ? `أعلى ثقة ${(top[0] * 100).toFixed(0)}% أقل من عتبة ${(cfg.uncertain_threshold * 100).toFixed(0)}% — النموذج ما بيقدر يحسم.` :
      `الاحتمال الثاني: ${cfg.ar[cfg.classes[order[1][1]]]} (${(order[1][0] * 100).toFixed(0)}%)`;
  }
  $('bars').innerHTML = order.map(([p, j]) => `<div class="row"><span>${cfg.ar[cfg.classes[j]]}</span><span class="track"><i style="width:${(p * 100).toFixed(1)}%"></i></span><span class="v">${(p * 100).toFixed(0)}%</span></div>`).join('');
  $('timeline').innerHTML = res.map((r) => `<i class="${r.cry >= thr ? '' : 'no'}" title="${r.t.toFixed(1)}s: ${(r.cry * 100).toFixed(0)}%" style="height:${Math.max(6, r.cry * 100)}%"></i>`).join('');
  $('segInfo').textContent = noCry ? '' : `تحلّلت ${cryW.length} من ${res.length} نوافذ فيها بكاء.`;
  const truth = $('truth').value;
  if (truth) {
    const log = store.get('log', []);
    log.unshift({ date: new Date().toISOString().slice(0, 16).replace('T', ' '), src: $('src').value.trim() || sourceName || '', truth,
      pred: noCry ? 'no_cry' : (uncertain ? 'uncertain' : cls), top: cls, conf: +top[0].toFixed(3), cry_windows: cryW.length, windows: res.length, model: cfg.version });
    store.set('log', log); renderLog();
  }
  const key = store.get('gkey', '');
  if (key && !noCry) geminiDecision(key, y, cryW.length ? cryW : res);
  else $('gemini').classList.add('hidden');
}

function renderLog() {
  const log = store.get('log', []);
  const name = (c) => (cfg && cfg.ar[c]) || ({ no_cry: 'ما في بكاء', uncertain: 'غير متأكد' })[c] || c;
  const scored = log.filter((r) => r.pred !== 'no_cry');
  const hit = scored.filter((r) => r.top === r.truth).length;
  $('tally').textContent = log.length ? `عدد الاختبارات ${log.length} · صح (أعلى احتمال) ${hit}/${scored.length}` + (scored.length ? ` = ${(100 * hit / scored.length).toFixed(0)}% (التخمين العشوائي ≈ 20%)` : '') : 'ما في اختبارات محفوظة بعد.';
  $('log').innerHTML = log.length ? '<tr><th>المصدر</th><th>الحقيقي</th><th>المتوقع</th><th></th></tr>' + log.slice(0, 50).map((r) =>
    `<tr><td>${esc(r.src).slice(0, 28)}</td><td>${name(r.truth)}</td><td>${name(r.top)} ${(r.conf * 100).toFixed(0)}%</td><td class="${r.top === r.truth ? 'yes' : 'no'}">${r.top === r.truth ? '✓' : '✗'}</td></tr>`).join('') : '';
}
const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);

$('exportBtn').onclick = () => {
  const log = store.get('log', []); if (!log.length) return;
  const keys = Object.keys(log[0]);
  const csv = [keys.join(','), ...log.map((r) => keys.map((k) => `"${String(r[k]).replace(/"/g, '""')}"`).join(','))].join('\n');
  const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob(['﻿' + csv], { type: 'text/csv' })); a.download = 'cry_tests.csv'; a.click();
};
$('clearBtn').onclick = () => { if (confirm('مسح كل الاختبارات المحفوظة؟')) { store.set('log', []); renderLog(); } };

$('file').addEventListener('change', async (e) => {
  const f = e.target.files[0]; if (!f) return;
  analyse(await f.arrayBuffer(), f.name); e.target.value = '';
});

let rec = null, recTimer = null;
$('recBtn').onclick = async () => {
  if (rec) { rec.stop(); return; }
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: false, noiseSuppression: false, autoGainControl: false } });
    const chunks = []; rec = new MediaRecorder(stream);
    rec.ondataavailable = (e) => e.data.size && chunks.push(e.data);
    rec.onstop = async () => {
      stream.getTracks().forEach((t) => t.stop()); clearInterval(recTimer);
      $('recBtn').className = 'primary'; $('recBtn').textContent = '🎙️ سجّل من المايك'; rec = null;
      analyse(await new Blob(chunks, { type: chunks[0] && chunks[0].type }).arrayBuffer(), 'تسجيل مايك');
    };
    rec.start(); let s = 0;
    $('recBtn').className = 'rec'; $('recBtn').textContent = '⏹️ وقّف (0 ث)';
    recTimer = setInterval(() => { s++; $('recBtn').textContent = `⏹️ وقّف (${s} ث)`; if (s >= 30) rec && rec.stop(); }, 1000);
  } catch (e) { status('ما في صلاحية للمايك: ' + e.message); }
};

// ---- optional: Gemini Decision 1 (user's own key, audio goes to Google) ----
function wav16k(y32, segs) {
  const parts = []; let total = 0;
  for (const s of segs) { const a = Math.floor(s.t * SR), b = Math.min(y32.length, a + WIN); if (total + (b - a) > 30 * SR) break; parts.push(y32.subarray(a, b)); total += b - a; }
  const n = Math.floor(total / 2), buf = new ArrayBuffer(44 + n * 2), v = new DataView(buf);
  const W = (o, s) => [...s].forEach((c, i) => v.setUint8(o + i, c.charCodeAt(0)));
  W(0, 'RIFF'); v.setUint32(4, 36 + n * 2, true); W(8, 'WAVEfmt '); v.setUint32(16, 16, true); v.setUint16(20, 1, true); v.setUint16(22, 1, true);
  v.setUint32(24, 16000, true); v.setUint32(28, 32000, true); v.setUint16(32, 2, true); v.setUint16(34, 16, true); W(36, 'data'); v.setUint32(40, n * 2, true);
  let k = 0; const flat = new Float32Array(total); let o = 0; for (const p of parts) { flat.set(p, o); o += p.length; }
  for (let i = 0; i < n; i++) { const x = Math.max(-1, Math.min(1, flat[i * 2])); v.setInt16(44 + i * 2, x * 32767, true); }
  let bin = ''; const bytes = new Uint8Array(buf); for (let i = 0; i < bytes.length; i += 0x8000) bin += String.fromCharCode.apply(null, bytes.subarray(i, i + 0x8000));
  return btoa(bin);
}

async function geminiDecision(key, y, segs) {
  const box = $('gemini'); box.classList.remove('hidden'); box.innerHTML = '<div class="small">Gemini Decision 1: جاري الإرسال…</div>';
  const criteria = {}; cfg.classes.forEach((c) => criteria[c] = cfg.en[c]);
  try {
    const t0 = performance.now();
    const r = await fetch('https://generativelanguage.googleapis.com/v1beta/decisions', {
      method: 'POST', headers: { 'Content-Type': 'application/json', 'x-goog-api-key': key },
      body: JSON.stringify({ model: 'gemini-decision-1', input: [{ type: 'audio', data: wav16k(y, segs), mime_type: 'audio/wav' }],
        questions: { reason: { type: 'choice', instructions: 'The audio is an infant crying. Based only on the acoustic characteristics of the cry, what is the most likely reason the baby is crying?', criteria } } }),
    });
    const d = await r.json(); if (!r.ok) throw new Error((d.error && d.error.message) || r.status);
    const pr = d.answers.reason.probabilities; const ms = Math.round(performance.now() - t0);
    const ord = cfg.classes.map((c) => [pr[c] || 0, c]).sort((a, b) => b[0] - a[0]);
    box.innerHTML = `<h2 style="font-size:.95rem;margin:0 0 6px">Gemini Decision 1 (أونلاين · ${ms}ms)</h2><div class="bars">` +
      ord.map(([p, c]) => `<div class="row"><span>${cfg.ar[c]}</span><span class="track"><i style="width:${(p * 100).toFixed(1)}%;background:var(--warn)"></i></span><span class="v">${(p * 100).toFixed(0)}%</span></div>`).join('') + '</div>';
  } catch (e) { box.innerHTML = `<div class="small">Gemini Decision 1: فشل الطلب — ${esc(e.message || e)}</div>`; }
}

init();
