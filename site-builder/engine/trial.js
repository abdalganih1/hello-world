/* صمّم · شريط التشغيل التجريبي فوق مواقع الزبائن
   بيقرا window.SAMMEM_TRIAL = { until: ms, days: 3, contact: "https://...", slug: "..." }
   شريط رفيع ثابت فوق الهيدر: عدّ تنازلي لتاريخ الإيقاف + زر «تواصل معنا» + X للإخفاء.
   بيزيح الصفحة بقد ارتفاعه بس، وبيرجعها لما يتسكّر. */
(function () {
  const T = window.SAMMEM_TRIAL;
  if (!T || !T.until) return;
  try { if (sessionStorage.getItem("sammem-trial-x") === String(T.until)) return; } catch (e) {}

  const css = `
  .trial{position:fixed;z-index:80;inset:0 0 auto 0;height:var(--trial-h);display:flex;align-items:center;justify-content:center;gap:10px;padding-inline:12px 46px;
    padding-top:env(safe-area-inset-top,0px);box-sizing:content-box;
    background:#14121a;color:#f4f1ea;font:500 13.5px/1.2 Tajawal,"IBM Plex Sans Arabic",system-ui,sans-serif;direction:rtl;
    box-shadow:0 1px 0 rgba(255,255,255,.08),0 8px 24px -12px rgba(0,0,0,.5)}
  .trial b{font-weight:700;font-variant-numeric:tabular-nums;color:#ffd27a;letter-spacing:.02em}
  .trial .tl{white-space:nowrap;overflow:hidden;text-overflow:ellipsis;min-width:0}
  .trial .tl small{opacity:.7;font-size:12.5px}
  .trial a{flex:none;display:inline-flex;align-items:center;height:28px;padding:0 12px;border-radius:999px;background:#ffd27a;color:#14121a;font-weight:700;text-decoration:none;font-size:13px}
  .trial a:hover{background:#fff}
  .trial button{position:absolute;inset-inline-end:8px;top:calc(env(safe-area-inset-top,0px) + (var(--trial-h) - 30px)/2);width:30px;height:30px;border:0;border-radius:50%;background:rgba(255,255,255,.1);color:inherit;cursor:pointer;font-size:16px;line-height:1;display:grid;place-items:center}
  .trial button:hover{background:rgba(255,255,255,.22)}
  html.has-trial body{padding-top:var(--trial-h)}
  html.has-trial .s-nav{top:var(--trial-h)}
  html.has-trial .progress{top:var(--trial-h)}
  .trial .tl i{font-style:normal}
  @media (max-width:560px){.trial{font-size:12.5px;gap:8px;justify-content:space-between}.trial .tl{display:grid;gap:3px}.trial .tl i{display:none}.trial .tl small{font-size:11.5px}.trial a{padding:0 10px;font-size:12px}}
  `;
  const st = document.createElement("style"); st.textContent = css; document.head.appendChild(st);
  document.documentElement.style.setProperty("--trial-h", matchMedia("(max-width:560px)").matches ? "50px" : "40px");
  document.documentElement.classList.add("has-trial");

  const end = new Date(T.until);
  const dateTxt = end.toLocaleDateString("ar-SY-u-nu-latn", { weekday: "long", day: "numeric", month: "long" }) + " " +
    end.toLocaleTimeString("ar-SY-u-nu-latn", { hour: "numeric", minute: "2-digit" });
  const bar = document.createElement("div");
  bar.className = "trial"; bar.setAttribute("role", "region"); bar.setAttribute("aria-label", "تشغيل تجريبي");
  bar.innerHTML = `<span class="tl"><span><i>تجريبي ${T.days || 3} أيام · </i>بيتوقف بعد <b data-left>…</b></span> <small>${dateTxt}</small></span>
    <a href="${T.contact}" target="_blank" rel="noopener">تواصل معنا لاعتماده</a>
    <button type="button" aria-label="إخفاء الشريط">×</button>`;
  document.body.prepend(bar);

  const left = bar.querySelector("[data-left]"), pad = (n) => String(n).padStart(2, "0");
  function tick() {
    let s = Math.max(0, Math.floor((T.until - Date.now()) / 1000));
    if (!s) { left.textContent = "انتهى"; return; }
    const d = Math.floor(s / 86400); s %= 86400;
    left.textContent = (d ? d + "ي " : "") + pad(Math.floor(s / 3600)) + ":" + pad(Math.floor(s % 3600 / 60)) + ":" + pad(s % 60);
    setTimeout(tick, 1000 - (Date.now() % 1000));
  }
  tick();

  bar.querySelector("button").onclick = () => {
    bar.remove(); document.documentElement.classList.remove("has-trial");
    try { sessionStorage.setItem("sammem-trial-x", String(T.until)); } catch (e) {}
    window.ScrollTrigger && window.ScrollTrigger.refresh();
  };
})();
