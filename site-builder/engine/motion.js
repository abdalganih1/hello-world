/* صمّم · الحركة عند الانزلاق (GSAP + ScrollTrigger)
   كل حركة بتنتهي بموضع ثابت، والمحتوى ظاهر بالكامل لو الحركة متوقفة. */
(function () {
  function splitWords(el) {
    if (el.dataset.splitDone) return;
    const words = el.textContent.trim().split(/\s+/);
    el.innerHTML = words.map((w) => `<span class="w"><span>${w}</span></span>`).join(" ");
    el.dataset.splitDone = "1";
  }

  function init(root = document) {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const g = window.gsap, ST = window.ScrollTrigger;
    initInteractive(root, reduce);
    if (!g || !ST || reduce) return;
    g.registerPlugin(ST);

    root.querySelectorAll("[data-split]").forEach(splitWords);

    // دخول البطل
    const heroH = root.querySelector('[data-split="hero"]');
    const tl = g.timeline({ defaults: { ease: "expo.out" } });
    if (heroH) tl.from(heroH.querySelectorAll(".w > span"), { yPercent: 110, rotate: 4, duration: 1.3, stagger: 0.07 }, 0.15);
    tl.from(root.querySelectorAll("[data-hero-in]"), { y: 30, opacity: 0, duration: 1.1, stagger: 0.1 }, 0.45);
    tl.from(root.querySelectorAll(".s-nav .bar"), { y: -40, opacity: 0, duration: 1 }, 0.2);

    // عناوين الأقسام كلمة كلمة
    root.querySelectorAll("[data-split]:not([data-split='hero'])").forEach((h) => {
      g.from(h.querySelectorAll(".w > span"), { yPercent: 105, duration: 1.1, ease: "expo.out", stagger: 0.05, scrollTrigger: { trigger: h, start: "top 88%" } });
    });

    root.querySelectorAll("[data-reveal]").forEach((el) => {
      const scale = el.dataset.reveal === "scale";
      g.from(el, { y: scale ? 0 : 50, scale: scale ? 0.92 : 1, opacity: 0, duration: 1.2, ease: "expo.out", scrollTrigger: { trigger: el, start: "top 90%" } });
    });

    root.querySelectorAll("[data-stagger]").forEach((wrap) => {
      g.from(wrap.children, { y: 60, opacity: 0, rotateX: -12, transformOrigin: "50% 100%", duration: 1.1, ease: "expo.out", stagger: 0.09, scrollTrigger: { trigger: wrap, start: "top 85%" } });
    });

    root.querySelectorAll("[data-parallax]").forEach((el) => {
      const k = parseFloat(el.dataset.parallax) || 0.1;
      g.fromTo(el, { yPercent: -k * 100 }, { yPercent: k * 100, ease: "none", scrollTrigger: { trigger: el.parentElement, start: "top bottom", end: "bottom top", scrub: true } });
    });

    root.querySelectorAll("[data-count]").forEach((el) => {
      const raw = el.dataset.count, m = raw.match(/^([^\d]*)([\d,.]+)(.*)$/);
      if (!m) return;
      const end = parseFloat(m[2].replace(/,/g, "")), dec = (m[2].split(".")[1] || "").length, o = { v: 0 };
      g.to(o, { v: end, duration: 2, ease: "power3.out", scrollTrigger: { trigger: el, start: "top 90%" },
        onUpdate: () => { el.textContent = m[1] + o.v.toLocaleString("en-US", { minimumFractionDigits: dec, maximumFractionDigits: dec }) + m[3]; } });
    });

    // قسم الخطوات: تثبيت وانزلاق أفقي (باتجاه RTL)
    root.querySelectorAll("[data-hscroll]").forEach((sec) => {
      const rail = sec.querySelector("[data-rail]");
      const dist = () => Math.max(0, rail.scrollWidth - window.innerWidth + 40);
      if (dist() < 40) return;
      g.to(rail, { x: () => dist(), ease: "none", scrollTrigger: { trigger: sec, start: "top top", end: () => "+=" + dist(), pin: true, scrub: 0.6, invalidateOnRefresh: true } });
    });

    // شريط الكلمات بيتسارع مع سرعة الانزلاق
    root.querySelectorAll("[data-marquee]").forEach((tr) => {
      const loop = g.to(tr, { xPercent: 33.333, duration: 30, ease: "none", repeat: -1 });
      ST.create({ onUpdate: (s) => { const v = Math.min(5, Math.abs(s.getVelocity()) / 300); g.to(loop, { timeScale: 1 + v, duration: 0.3, overwrite: true }); g.to(loop, { timeScale: 1, duration: 1.2, delay: 0.3 }); } });
    });

    const bar = root.querySelector(".progress");
    if (bar) g.to(bar, { scaleX: 1, ease: "none", scrollTrigger: { start: 0, end: "max", scrub: 0.3 } });

    // إخفاء القائمة عند النزول وإظهارها عند الصعود
    const nav = root.querySelector(".s-nav");
    if (nav) ST.create({ start: 120, end: "max", onUpdate: (s) => nav.classList.toggle("hide", s.direction === 1) });

    window.addEventListener("load", () => ST.refresh());
  }

  function initInteractive(root, reduce) {
    // تبويبات قائمة الطعام
    root.querySelectorAll(".s-menu").forEach((sec) => {
      sec.querySelectorAll("[data-tab]").forEach((b) => b.addEventListener("click", () => {
        sec.querySelectorAll("[data-tab]").forEach((x) => x.setAttribute("aria-selected", x === b));
        sec.querySelectorAll("[data-panel]").forEach((p) => {
          p.hidden = p.dataset.panel !== b.dataset.tab;
          if (!p.hidden && window.gsap && !reduce) window.gsap.from(p.children, { y: 20, opacity: 0, duration: 0.6, stagger: 0.05, ease: "power3.out" });
        });
        window.ScrollTrigger && window.ScrollTrigger.refresh();
      }));
    });
    // النموذج: بيمنع الإرسال الحقيقي بالمعاينة
    root.querySelectorAll("[data-form]").forEach((f) => f.addEventListener("submit", (e) => { e.preventDefault(); f.classList.add("sent"); }));
    if (reduce || !window.matchMedia("(hover: hover)").matches) return;

    // ميلان ثلاثي الأبعاد للبطاقات + ضوء يلحق الماوس
    root.querySelectorAll("[data-tilt]").forEach((c) => {
      c.addEventListener("pointermove", (e) => {
        const r = c.getBoundingClientRect(), x = (e.clientX - r.left) / r.width, y = (e.clientY - r.top) / r.height;
        c.style.setProperty("--mx", x * 100 + "%"); c.style.setProperty("--my", y * 100 + "%");
        c.style.transform = `perspective(900px) rotateY(${(x - 0.5) * 10}deg) rotateX(${(0.5 - y) * 10}deg) translateZ(0)`;
      });
      c.addEventListener("pointerleave", () => { c.style.transition = "transform .7s cubic-bezier(.2,.7,.1,1)"; c.style.transform = ""; setTimeout(() => (c.style.transition = ""), 700); });
    });
    // أزرار مغناطيسية
    root.querySelectorAll("[data-magnetic], .btn").forEach((b) => {
      b.addEventListener("pointermove", (e) => {
        const r = b.getBoundingClientRect(), x = e.clientX - r.left, y = e.clientY - r.top;
        b.style.setProperty("--mx", x + "px"); b.style.setProperty("--my", y + "px");
        if (b.hasAttribute("data-magnetic")) b.style.transform = `translate(${(x - r.width / 2) * 0.18}px, ${(y - r.height / 2) * 0.25}px)`;
      });
      b.addEventListener("pointerleave", () => (b.style.transform = ""));
    });
    // مؤشر
    const cur = document.createElement("div"); cur.className = "cursor"; document.body.appendChild(cur);
    let cx = innerWidth / 2, cy = innerHeight / 2, tx = cx, ty = cy;
    addEventListener("pointermove", (e) => { tx = e.clientX; ty = e.clientY; }, { passive: true });
    (function f() { cx += (tx - cx) * 0.2; cy += (ty - cy) * 0.2; cur.style.transform = `translate(${cx}px, ${cy}px)`; requestAnimationFrame(f); })();
    root.querySelectorAll("a, button, [data-tilt], summary").forEach((el) => { el.addEventListener("pointerenter", () => cur.classList.add("big")); el.addEventListener("pointerleave", () => cur.classList.remove("big")); });
  }

  window.SAMMEM = window.SAMMEM || {};
  window.SAMMEM.motion = { init };
})();
