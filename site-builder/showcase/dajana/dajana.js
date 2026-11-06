/* دجانة: موقع عرض مبني بقالب البلكسي (templates/plexi.js) ومنتجات المتجر الحقيقية (products.js من sync.py) */
(function () {
  const tpl = window.SAMMEM_TEMPLATES.plexi;
  // معلومات ما عنا ياها ما منخترعها: منشيل العنوان والساعات الافتراضية
  delete tpl.brand.address; delete tpl.brand.hours;

  // المنتجات الحيّة من لوحة إدارة المتجر (/api/products) فوق النسخة المحفوظة، حتى أي منتج جديد يبين فوراً
  const CAT = { plexi: "plexi", "بلكسي": "plexi", mdf: "mdf", MDF: "mdf", uv: "uv", "طباعة UV": "uv", vinyl: "vinyl" };
  const clean = (s) => String(s || "").replace(/\u200b/g, "").trim();
  window.DAJANA_LIVE = function (timeout = 2500) {
    const base = window.DAJANA_ITEMS || [];
    const byId = Object.fromEntries(base.map((x) => [x.id, x]));
    const ctl = new AbortController(); setTimeout(() => ctl.abort(), timeout);
    return fetch("/api/products", { signal: ctl.signal }).then((r) => (r.ok ? r.json() : Promise.reject())).then((live) => {
      if (!Array.isArray(live) || !live.length) return base;
      const out = live.map((p) => {
        const old = byId[p.id] || {}, imgs = old.imgs && old.imgs.length ? old.imgs : (p.images || []).filter(Boolean);
        return Object.assign({}, old, { id: p.id, name: clean(p.name) || old.name, cat: CAT[p.category] || old.cat || "plexi", price: +p.price || 0, desc: clean(p.description) || old.desc || "", details: clean(p.details) || old.details || "", imgs, thumb: old.thumb || imgs[0] || "", url: "https://dojana.technoenjaz.com/product/" + p.id });
      });
      return out.sort((a, b) => !!b.featured - !!a.featured);
    }).catch(() => base);
  };

  window.DAJANA_CFG = (items) => {
  const pick = (k) => (items.find((x) => x.name.includes(k)) || items[0] || {}).imgs?.[0];
  return {
    t: "plexi",
    palette: "crystal",
    name: "دجانة",
    tagline: "ستاندات خطوبة وعقد قران، دروع تخرج، توزيعات مواليد وهدايا بالاسم. بلكسي وخشب وطباعة UV، وكل قطعة منكتب عليها أساميكم.",
    logo: "img/logo.png",
    phone: "0953 305 341",
    whatsapp: "963953305341",
    images: [pick("أجنحة الملاك")],
    content: {
      nav: { links: [{ id: "catalog", label: "المنتجات" }, { id: "studio", label: "جرّب قطعتك" }, { id: "showcase", label: "المختارات" }, { id: "craft", label: "كيف منصنعها" }, { id: "about", label: "عن دجانة" }], cta: "اطلب قطعتك", ctaTarget: "catalog" },
      hero: { lines: { k2: "طبقة فوق طبقة", t2: "مرآة، كريستال، وحروف من دهب", t3: "تفضّلوا لعالم دجانة", t4: "قطعة بتستنّى أساميكم", t5: "اختاروا قطعتكم" }, eyebrow: "بلكسي · خشب MDF · طباعة UV · فينيل", title: "كل فرحة إلها قطعة من دجانة", primary: "تصفّح المنتجات", primaryTarget: "catalog", secondary: "المختارات", secondaryTarget: "showcase",
        badges: [{ k: String(items.length), v: "تصميم بالمتجر" }, { k: "بالاسم", v: "تخصيص كامل" }, { k: "واتساب", v: "طلب مباشر" }] },
      marquee: { items: ["ستاندات خطوبة", "توثيق عقد قران", "دروع تخرج", "مرايا عروس", "توزيعات مواليد", "مسابح وميداليات", "لوحات استقبال", "مصابيح 3D"] },
      catalog: { eyebrow: "المنتجات", title: "اختاري قطعتك، ومنكتبلك عليها أساميكم", lead: "اضغط على أي قطعة لتشوف تفاصيلها، وزر «اطلب» بيفتحلك واتساب مع اسم القطعة وسعرها ورابطها.", currency: "ل.س", pageSize: 12,
        categories: [{ id: "all", label: "الكل" }, { id: "plexi", label: "بلكسي" }, { id: "mdf", label: "خشب MDF" }, { id: "uv", label: "طباعة UV" }, { id: "vinyl", label: "فينيل" }], items },
      studio: { eyebrow: "جرّبي قطعتك", title: "اكتبي أساميكم وشوفي قطعتك قبل ما تنقص", lead: "اختاري الشكل والخامة ولون الحروف، وضيفي صورتك إذا بدك. لفّيها 3D أو شوفيها متل ما بتطلع عالليزر، وبعدين اطلبيها عالواتساب." },
      showcase: { eyebrow: "المختارات", title: "قطع بتخطف القلب", lead: "انزل وتفرّج، واضغط على أي قطعة لتفاصيلها" },
      craft: { eyebrow: "كيف منصنعها", title: "طبقة فوق طبقة، لتطلع قطعتكم", date: "2026 · 11 · 06" },
      about: { eyebrow: "عن دجانة", title: "تفاصيل صغيرة بتعمل الفرحة", paragraphs: ["بدجانة منصمم وننفّذ قطع المناسبات: ستاندات الخطوبة وتوثيق عقد القران، دروع التخرج والتكريم، توزيعات المواليد، والهدايا بالاسم.", "منشتغل بالبلكسي الشفاف والمرآة الذهبية والفضية، بالخشب MDF، وبالطباعة UV والفينيل. وكل قطعة بتنكتب حسب طلبكم."],
        stats: [{ n: String(items.length), label: "تصميم بالمتجر" }, { n: "4", label: "أنواع خامات" }, { n: "100%", label: "بالاسم والتاريخ" }] },
      faq: { eyebrow: "أسئلة", title: "قبل ما تطلبي", items: [
        { q: "كيف بطلب؟", a: "اضغط «اطلب» جنب أي قطعة، بتنفتح محادثة واتساب فيها اسم القطعة وسعرها ورابطها. اكتبيلنا الأسماء والتاريخ ومنكمّل معك." },
        { q: "فيني غيّر الاسم والألوان؟", a: "إي، القطع بتنعمل حسب الطلب. احكيلنا شو بدك ومنقلك إذا في فرق بالسعر." },
        { q: "الأسعار المعروضة نهائية؟", a: "هي أسعار المتجر الحالية، وممكن تتغير حسب القياس والإضافات. منأكدلك السعر على واتساب قبل التنفيذ." },
        { q: "بتوصلوا لمنطقتي؟", a: "اسألينا على واتساب عن التوصيل لمنطقتك ومنرد عليك." },
      ] },
      cta: { title: "عندك مناسبة قريبة؟", lead: "ابعتيلنا الأسماء والتاريخ والقطعة اللي عجبتك، ومنرجعلك على واتساب.", button: "احكينا على واتساب" },
      contact: { eyebrow: "تواصل", title: "احكيلنا عن قطعتك", subjects: ["ستاند خطوبة أو عقد قران", "دروع تخرج أو تكريم", "توزيعات مواليد", "هدايا بالاسم", "طباعة UV", "شي تاني"], subjectLabel: "نوع الطلب", placeholder: "الأسماء، التاريخ، والكمية", button: "أرسل على واتساب" },
      footer: { about: "قطع بلكسي وخشب وطباعة UV لكل المناسبات، بالاسم والتاريخ." },
    },
    off: ["testimonials", "reviews"],
  };
  };
})();
