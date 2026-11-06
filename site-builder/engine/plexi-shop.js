/* صمّم · ميزات المتجر لقالب البلكسي (مأخوذة من متجر دجانة القديم)
   - سلة بكميات وملاحظة لكل قطعة (اللون، الأسماء)، والطلب كله برسالة واتساب وحدة
   - «طلباتي»: سجل الطلبات على هالجهاز مع «اطلب مرة تانية»
   - عرض الريلز: المنتجات شاشة كاملة وحدة ورا التانية بالسحب
   - عرض شبكة / قائمة للكتالوج، مشاركة المنتج، شريط سفلي ثابت، وإشعارات صغيرة (toast)
   الشراء = تحويل للواتساب، ما في دفع بالموقع. */
(function () {
  const SM = (window.SAMMEM = window.SAMMEM || {});
  const esc = SM.esc, icon = SM.icon;
  if (!SM.sections) return;

  const I = {
    bag: '<path d="M6 7h12l1 13H5z"/><path d="M9 7a3 3 0 0 1 6 0"/>',
    reels: '<rect x="5" y="2" width="14" height="20" rx="3"/><path d="m10 9 5 3-5 3z"/>',
    grid: '<rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/>',
    list: '<rect x="3" y="4" width="6" height="6" rx="1.5"/><rect x="3" y="14" width="6" height="6" rx="1.5"/><path d="M12 6h9M12 9h6M12 16h9M12 19h6"/>',
    home: '<path d="m3 11 9-8 9 8"/><path d="M5 10v10h14V10"/>',
    pen: '<path d="M12 19l7-7 3 3-7 7-3-3z"/><path d="M18 13l-1.5-7.5L2 2l3.5 14.5L13 18l5-5z"/>',
    share: '<circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><path d="m8.6 13.5 6.8 4M15.4 6.5l-6.8 4"/>',
    x: '<path d="M18 6 6 18M6 6l12 12"/>',
    plus: '<path d="M12 5v14M5 12h14"/>',
    minus: '<path d="M5 12h14"/>',
    clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
  };
  const ic = (n) => I[n] ? `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${I[n]}</svg>` : icon(n);
  const fmt = (n) => Number(n || 0).toLocaleString("en-US");
  const lsGet = (k, d) => { try { return JSON.parse(localStorage.getItem(k)) ?? d; } catch (e) { return d; } };
  const lsSet = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} };

  function toast(msg) {
    let t = document.querySelector(".px-toast");
    if (!t) { t = document.createElement("div"); t.className = "px-toast"; t.setAttribute("role", "status"); document.body.appendChild(t); }
    t.textContent = msg; t.classList.add("on"); clearTimeout(t._h); t._h = setTimeout(() => t.classList.remove("on"), 2200);
  }
  SM.pxToast = toast;

  function init(root, site) {
    const catSec = root.querySelector("[data-px-catalog]");
    if (!catSec) return;
    const catData = (site.sections.find((s) => s.type === "catalog") || {}).data || {};
    const items = catData.items || [], cur = catData.currency || "";
    const key = "px_" + (site.brand.name || "shop");
    const wa = String(site.brand.whatsapp || "").replace(/\D/g, "").replace(/^00/, "").replace(/^0/, "963");
    const waUrl = (t) => (wa ? `https://wa.me/${wa}?text=${encodeURIComponent(t)}` : "#contact");
    let cart = lsGet(key + "_cart", []);
    const save = () => { lsSet(key + "_cart", cart); paint(); };

    /* ---------- السلة ---------- */
    const add = (it, extra = {}) => {
      const k = (it.url || it.name) + "|" + (extra.names || "") + "|" + (extra.color || "");
      const ex = cart.find((x) => x.k === k);
      if (ex) ex.qty++; else cart.push({ k, name: it.name, price: +it.price || 0, img: it.img || (it.imgs && it.imgs[0]) || "", url: it.url || "", qty: 1, color: extra.color || "", names: extra.names || "", design: extra.design || "" });
      save(); toast("انضافت للسلة ✓"); bump(); document.dispatchEvent(new Event("px:added"));
    };
    SM.pxCart = { add, open: () => openDrawer("cart") };

    const drawer = document.createElement("aside");
    drawer.className = "px-drawer"; drawer.setAttribute("aria-label", "السلة"); drawer.hidden = true;
    drawer.innerHTML = `<div class="px-dr-shade" data-close></div><div class="px-dr-in" role="dialog" aria-modal="true">
      <header><div class="px-dr-tabs" role="tablist"><button type="button" role="tab" data-tab="cart" aria-selected="true">${ic("bag")} السلة <b class="px-dr-n"></b></button><button type="button" role="tab" data-tab="orders" aria-selected="false">${ic("clock")} طلباتي</button></div><button type="button" class="px-dr-x" data-close aria-label="إغلاق">${ic("x")}</button></header>
      <div class="px-dr-body"></div><footer></footer></div>`;
    document.body.appendChild(drawer);
    let tab = "cart";
    const body = drawer.querySelector(".px-dr-body"), foot = drawer.querySelector("footer");
    const orderMsg = () => {
      let m = `🔷 *${site.brand.name}*\n\n*طلب جديد:*\n\n`;
      cart.forEach((i) => {
        m += `• ${i.name} ×${i.qty}${i.price ? " = " + fmt(i.price * i.qty) + " " + cur : ""}\n`;
        if (i.url) m += `   🔗 ${i.url}\n`;
        if (i.design) m += `   📐 ${i.design}\n`;
        if (i.color) m += `   🎨 اللون: ${i.color}\n`;
        if (i.names) m += `   ✍️ الأسماء/البيانات: ${i.names}\n`;
      });
      const total = cart.reduce((s, i) => s + i.qty * i.price, 0);
      if (total) m += `\n*المجموع: ${fmt(total)} ${cur}*\n`;
      return m + "\nالاسم: \nالعنوان: \nالهاتف: ";
    };
    function paint() {
      const n = cart.reduce((s, i) => s + i.qty, 0);
      document.querySelectorAll(".px-cart-n").forEach((b) => { b.textContent = n; b.hidden = !n; });
      drawer.querySelector(".px-dr-n").textContent = n || "";
      drawer.querySelectorAll("[data-tab]").forEach((b) => b.setAttribute("aria-selected", b.dataset.tab === tab));
      if (tab === "cart") {
        body.innerHTML = cart.length ? cart.map((i, idx) => `<div class="px-ci">
          ${i.img ? `<img src="${esc(i.img)}" alt="">` : `<span class="px-ci-ph">${icon("spark")}</span>`}
          <div class="px-ci-main"><b>${esc(i.name)}</b>${i.design ? `<small>${esc(i.design)}</small>` : ""}${i.price ? `<span>${fmt(i.price * i.qty)} ${esc(cur)}</span>` : ""}
            <div class="px-qty"><button type="button" data-q="${idx}" data-d="1" aria-label="زيد">${ic("plus")}</button><b>${i.qty}</b><button type="button" data-q="${idx}" data-d="-1" aria-label="نقّص">${ic("minus")}</button></div>
            <details class="px-note"${i.names || i.color ? " open" : ""}><summary>${i.names || i.color ? "ملاحظتك ✓" : "ضيف الأسماء أو اللون"}</summary>
              <input data-n="${idx}" data-f="names" placeholder="الأسماء أو التاريخ" value="${esc(i.names)}" enterkeyhint="done">
              <input data-n="${idx}" data-f="color" placeholder="اللون المطلوب (ذهبي، فضي...)" value="${esc(i.color)}" enterkeyhint="done"></details>
          </div></div>`).join("") : `<div class="px-empty">${ic("bag")}<p>السلة فاضية</p><button type="button" class="btn ghost" data-close data-go="#catalog">تصفّح المنتجات</button></div>`;
        const total = cart.reduce((s, i) => s + i.qty * i.price, 0);
        foot.innerHTML = cart.length ? `<div class="px-total"><span>المجموع</span><b>${fmt(total)} <small>${esc(cur)}</small></b></div>
          <a class="btn px-send" href="${esc(waUrl(orderMsg()))}" target="_blank" rel="noopener">${icon("wa")} أرسل الطلب على واتساب</a>
          <p class="px-fine">بتنفتح محادثة واتساب فيها كل القطع، ومنأكدلك السعر والتفاصيل هنيك.</p>` : "";
      } else {
        const orders = lsGet(key + "_orders", []);
        body.innerHTML = orders.length ? orders.slice().reverse().map((o, i) => `<div class="px-order-h"><div><b>${new Date(o.t).toLocaleDateString("ar-SY", { day: "numeric", month: "long" })}</b><small>${o.items.reduce((s, x) => s + x.qty, 0)} قطعة · ${fmt(o.total)} ${esc(cur)}</small></div>
          <p>${o.items.map((x) => esc(x.name) + " ×" + x.qty).join("، ")}</p><button type="button" class="btn ghost" data-re="${orders.length - 1 - i}">اطلب مرة تانية</button></div>`).join("") : `<div class="px-empty">${ic("clock")}<p>لسا ما بعتّ طلبات من هالجهاز</p></div>`;
        foot.innerHTML = "";
      }
    }
    drawer.addEventListener("click", (e) => {
      const c = e.target.closest("[data-close]"); if (c) { closeDrawer(); if (c.dataset.go) document.querySelector(c.dataset.go)?.scrollIntoView({ behavior: "smooth" }); return; }
      const t = e.target.closest("[data-tab]"); if (t) { tab = t.dataset.tab; paint(); return; }
      const q = e.target.closest("[data-q]"); if (q) { const it = cart[+q.dataset.q]; it.qty += +q.dataset.d; if (it.qty <= 0) cart.splice(+q.dataset.q, 1); save(); return; }
      const r = e.target.closest("[data-re]"); if (r) { const o = lsGet(key + "_orders", [])[+r.dataset.re]; if (o) { cart = o.items.map((x) => Object.assign({}, x)); tab = "cart"; save(); toast("رجعنا القطع للسلة"); } return; }
      if (e.target.closest(".px-send")) {
        const orders = lsGet(key + "_orders", []); orders.push({ t: Date.now(), items: cart, total: cart.reduce((s, i) => s + i.qty * i.price, 0) }); lsSet(key + "_orders", orders.slice(-30));
        setTimeout(() => { cart = []; save(); tab = "orders"; paint(); toast("انبعت طلبك ✓ تلاقيه بطلباتي"); }, 400);
      }
    });
    drawer.addEventListener("change", (e) => { const n = e.target.closest("[data-n]"); if (n) { cart[+n.dataset.n][n.dataset.f] = n.value.trim(); lsSet(key + "_cart", cart); foot.querySelector(".px-send") && (foot.querySelector(".px-send").href = waUrl(orderMsg())); } });
    drawer.addEventListener("keydown", (e) => { if (e.key === "Escape") closeDrawer(); if (e.key === "Enter" && e.target.matches("input")) e.target.blur(); });
    function openDrawer(t) { tab = t || "cart"; paint(); drawer.hidden = false; requestAnimationFrame(() => drawer.classList.add("on")); document.documentElement.classList.add("px-lock"); drawer.querySelector(".px-dr-x").focus({ preventScroll: true }); }
    function closeDrawer() { drawer.classList.remove("on"); document.documentElement.classList.remove("px-lock"); setTimeout(() => (drawer.hidden = true), 350); }

    /* ---------- أزرار «أضف للسلة» بالبطاقات ---------- */
    catSec.querySelectorAll(".px-card").forEach((c) => {
      const it = items[+c.dataset.i], row = c.querySelector(".px-row"); if (!it || !row) return;
      const b = document.createElement("button"); b.type = "button"; b.className = "px-add"; b.setAttribute("aria-label", "أضف " + it.name + " للسلة"); b.innerHTML = ic("bag") + ic("plus");
      b.addEventListener("click", (e) => { e.stopPropagation(); add(it); });
      row.appendChild(b);
    });

    /* ---------- عرض شبكة / قائمة / ريلز ---------- */
    const filters = catSec.querySelector(".px-filters") || catSec.querySelector(".sec-head");
    const views = document.createElement("div"); views.className = "px-views"; views.setAttribute("role", "group"); views.setAttribute("aria-label", "طريقة العرض");
    views.innerHTML = `<button type="button" data-v="grid" aria-pressed="true">${ic("grid")}<span>شبكة</span></button><button type="button" data-v="list" aria-pressed="false">${ic("list")}<span>قائمة</span></button><button type="button" data-v="reels" aria-pressed="false">${ic("reels")}<span>ريلز</span></button>`;
    filters.after(views);
    const grid = catSec.querySelector(".px-grid");
    const setView = (v) => {
      if (v === "reels") { openReels(0); return; }
      grid.classList.toggle("px-list", v === "list");
      views.querySelectorAll("[data-v]").forEach((b) => b.setAttribute("aria-pressed", b.dataset.v === v));
      lsSet(key + "_view", v); window.ScrollTrigger && window.ScrollTrigger.refresh();
    };
    views.addEventListener("click", (e) => { const b = e.target.closest("[data-v]"); if (b) setView(b.dataset.v); });
    if (lsGet(key + "_view", "grid") === "list") setView("list");

    /* ---------- الريلز ---------- */
    function openReels(start) {
      const list = items.map((it, i) => Object.assign({ i }, it)).filter((x) => x.img || (x.imgs && x.imgs[0]));
      const host = document.createElement("div"); host.className = "px-reels"; host.setAttribute("role", "dialog"); host.setAttribute("aria-label", "ريلز المنتجات");
      host.innerHTML = `<button type="button" class="px-reels-x" aria-label="إغلاق">${ic("x")}</button><div class="px-reels-track">${list.map((it, k) => { const src = it.img || it.imgs[0], th = it.thumb || src; return `<section class="px-reel" data-k="${k}">
        <div class="px-reel-bg" style="background-image:url('${esc(th)}')"></div><img src="${esc(src)}" alt="${esc(it.name)}" loading="${k < 2 ? "eager" : "lazy"}" decoding="async">
        <div class="px-reel-info"><b>${esc(it.name)}</b>${it.price ? `<span>${fmt(it.price)} ${esc(cur)}</span>` : ""}${it.desc ? `<p>${esc(it.desc)}</p>` : ""}</div>
        <div class="px-reel-acts"><a href="${esc(waUrl(`مرحبا ${site.brand.name}، بدي اطلب:\n• ${it.name}${it.price ? " = " + fmt(it.price) + " " + cur : ""}${it.url ? "\n🔗 " + it.url : ""}\n\nالأسماء والتاريخ: `))}" target="_blank" rel="noopener" class="wa-a">${icon("wa")}<span>اطلب</span></a>
          <button type="button" data-add="${it.i}">${ic("bag")}<span>للسلة</span></button>
          <button type="button" data-det="${it.i}">${ic("plus")}<span>تفاصيل</span></button>
          <button type="button" data-share="${it.i}">${ic("share")}<span>شارك</span></button></div>
      </section>`; }).join("")}</div><div class="px-reels-hint">اسحب لفوق للقطعة الجاية</div>`;
      document.body.appendChild(host); document.documentElement.classList.add("px-lock");
      const close = () => { host.remove(); document.documentElement.classList.remove("px-lock"); views.querySelectorAll("[data-v]").forEach((b) => b.setAttribute("aria-pressed", b.dataset.v === (grid.classList.contains("px-list") ? "list" : "grid"))); };
      host.querySelector(".px-reels-x").addEventListener("click", close);
      host.addEventListener("keydown", (e) => e.key === "Escape" && close());
      host.addEventListener("click", (e) => {
        const a = e.target.closest("[data-add]"); if (a) { add(items[+a.dataset.add]); return; }
        const d = e.target.closest("[data-det]"); if (d) { close(); document.querySelector(`[data-px-open="${d.dataset.det}"]`)?.click(); return; }
        const s = e.target.closest("[data-share]"); if (s) share(items[+s.dataset.share]);
      });
      const track = host.querySelector(".px-reels-track");
      const idx = Math.max(0, list.findIndex((x) => x.i === start));
      track.scrollTop = idx * innerHeight;
      host.querySelector(".px-reels-x").focus({ preventScroll: true });
      setTimeout(() => host.querySelector(".px-reels-hint")?.classList.add("off"), 2600);
    }
    SM.pxReels = openReels;

    function share(it) {
      const url = it.url || location.href, text = `${it.name} من ${site.brand.name}`;
      if (navigator.share) navigator.share({ title: it.name, text, url }).catch(() => {});
      else if (navigator.clipboard) navigator.clipboard.writeText(url).then(() => toast("نسخنا الرابط ✓"));
    }
    SM.pxShare = share;

    /* ---------- الشريط السفلي ---------- */
    const bar = document.createElement("nav"); bar.className = "px-bar"; bar.setAttribute("aria-label", "تنقّل سريع");
    const hasStudio = !!root.querySelector("[data-px-studio]");
    bar.innerHTML = `<a href="#top" data-top>${ic("home")}<span>الرئيسية</span></a><a href="#catalog">${ic("grid")}<span>المنتجات</span></a><button type="button" data-reels>${ic("reels")}<span>ريلز</span></button>${hasStudio ? `<a href="#studio">${ic("pen")}<span>جرّب</span></a>` : ""}<button type="button" data-cart>${ic("bag")}<span>السلة</span><b class="px-cart-n" hidden></b></button>`;
    document.body.appendChild(bar);
    bar.addEventListener("click", (e) => {
      if (e.target.closest("[data-cart]")) openDrawer("cart");
      if (e.target.closest("[data-reels]")) openReels(0);
      const a = e.target.closest("a[href^='#']"); if (a) { e.preventDefault(); const t = a.hasAttribute("data-top") ? document.body : document.querySelector(a.getAttribute("href")); if (a.hasAttribute("data-top")) scrollTo({ top: 0, behavior: "smooth" }); else t && t.scrollIntoView({ behavior: "smooth", block: "start" }); }
    });
    const bump = () => { const b = bar.querySelector("[data-cart]"); b.classList.remove("bump"); void b.offsetWidth; b.classList.add("bump"); };
    // زر السلة بالقائمة العلوية
    const navCta = root.querySelector(".s-nav .bar .btn");
    if (navCta) { const nb = document.createElement("button"); nb.type = "button"; nb.className = "px-navcart"; nb.setAttribute("aria-label", "السلة"); nb.innerHTML = ic("bag") + '<b class="px-cart-n" hidden></b>'; nb.addEventListener("click", () => openDrawer("cart")); navCta.before(nb); }
    paint();
    installTip(site, key);
  }

  /* ---------- التثبيت كتطبيق: اقتراح ناعم ----------
     بيطلع مرة وحدة بس بعد ما الزائر يتفاعل (يضيف للسلة أو يقضي 40 ثانية)، وما بيرجع قبل أسبوعين إذا سكّره.
     أندرويد: زر «ثبّت» حقيقي. آيفون: شرح قصير (مشاركة ← إضافة للشاشة الرئيسية). */
  function installTip(site, key) {
    if (!document.querySelector('link[rel="manifest"]')) return;
    if ("serviceWorker" in navigator) navigator.serviceWorker.register("sw.js").catch(() => {});
    const standalone = matchMedia("(display-mode: standalone)").matches || navigator.standalone;
    if (standalone || Date.now() - lsGet(key + "_install_no", 0) < 14 * 864e5) return;
    const ios = /iphone|ipad|ipod/i.test(navigator.userAgent);
    let deferred = null, shown = false;
    addEventListener("beforeinstallprompt", (e) => { e.preventDefault(); deferred = e; });
    const show = () => {
      if (shown || (!deferred && !ios)) return; shown = true;
      const el = document.createElement("div"); el.className = "px-install"; el.setAttribute("role", "dialog"); el.setAttribute("aria-label", "ثبّت التطبيق");
      el.innerHTML = `${site.brand.logo ? `<img src="${esc(site.brand.logo)}" alt="">` : ""}<div><b>${esc(site.brand.name)} على شاشتك</b><small>${ios ? "اضغط زر المشاركة ⎋ وبعدين «إضافة إلى الشاشة الرئيسية»" : "افتح المتجر بلمسة، وبيشتغل أسرع"}</small></div>
        ${ios ? "" : `<button type="button" class="px-in-ok">ثبّت</button>`}<button type="button" class="px-in-no" aria-label="مو هلق">${ic("x")}</button>`;
      document.body.appendChild(el); requestAnimationFrame(() => el.classList.add("on"));
      const close = () => { el.classList.remove("on"); setTimeout(() => el.remove(), 400); };
      el.querySelector(".px-in-no").addEventListener("click", () => { lsSet(key + "_install_no", Date.now()); close(); });
      const ok = el.querySelector(".px-in-ok"); if (ok) ok.addEventListener("click", async () => { close(); if (deferred) { deferred.prompt(); const r = await deferred.userChoice.catch(() => ({})); if (r.outcome !== "accepted") lsSet(key + "_install_no", Date.now()); deferred = null; } });
      setTimeout(close, 15000);
    };
    setTimeout(show, 40000);
    document.addEventListener("px:added", () => setTimeout(show, 1500), { once: true });
  }

  const baseRender = SM.render;
  if (baseRender) SM.render = function (cfg, mount) { const site = baseRender.call(this, cfg, mount); init(mount || document.getElementById("site"), site); return site; };
})();
