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

  // شكل المجسم 3D لكل منتج، مصنّف من صوره الحقيقية (المنتجات الجديدة بينخمّن شكلها من اسمها)
  window.DAJANA_SHAPES = {"p_mtjlyvum_0cmadx": "archFrame", "p_mtjmc7ov_geedn5": "award", "p_mtjmnzu3_gch0vh": "arch", "p_mtjmz7f8_g99rk6": "butterfly", "p_mtjnhugq_7xx720": "lamp", "p_mtjnqqb9_cxupvf": "wings", "p_mun5k2hw_h0xijx": "ringStand", "p_mun5olk0_j5t1ro": "tray", "p_mun5onf5_7r0nrv": "trophy", "p_mun5vyen_ozo538": "heart", "p_mv2u0aro_tv3bfd": "crown", "p_mvfff7gq_61gr2p": "butterfly", "p_mvfff9mg_5gs9r6": "handMirror", "p_mvoxzy5y_hs7rn8": "awardArch", "p_mtjm88r1_fg27wb": "handMirror", "p_mtjmj3rc_3kl8p4": "medal", "p_mtjmtnbb_q693w1": "book", "p_mtjn8aeg_azqwc5": "awardArch", "p_mtjndwhx_kqk5zf": "sail", "p_mtjnlkbq_eo7eao": "tray", "p_mtjnyifk_2hfq2y": "badge", "p_mtjo85mt_l83vmv": "arch", "p_mtjobrj0_ge32ld": "heart", "p_mtjog7c7_v654oo": "board", "p_mtjq81i3_1ny4t6": "medal", "p_mtjqdtr1_ddsa72": "medal", "p_mtk026b0_55t4ye": "board", "p_mtk0amcd_qly7rq": "arch", "p_mtk0jz1c_591zfn": "plaque", "p_mtk1ujk8_blmehz": "board", "p_mtla4crd_88okdo": "plaque", "p_mtla66ix_j0z9tt": "bottle", "p_mtla8afx_uqu5rv": "ringFrame", "p_mtlaaegm_6y0bql": "plaque", "p_mtlacjb2_89q76x": "medal", "p_mtlaicxh_9pk6s7": "board", "p_mtmobxew_ihspwq": "ringFrame", "p_mtmoe7u3_9f8048": "board", "p_mtmofxf9_n9jvmn": "awardArch", "p_mtvsr00h_v7p0k1": "gradBox", "p_mtvsso8w_s04w63": "awardArch", "p_mtvstlhj_14g5r8": "gradBox", "p_mtvsvvut_ley3v7": "tallBox", "p_mu81gkzn_kabbar": "ringFrame", "p_mu81mv2m_08oyxd": "ringStand", "p_mu81q528_8amcro": "ringStand", "p_mun55vzq_00vtap": "ringStand", "p_mun5b578_cb0y8w": "arch", "p_mun5dkes_djes2x": "tray", "p_mun5f0pi_sulkaq": "phone", "p_mun5gvok_pyezxi": "board", "p_mun5kthh_qkle3k": "tray", "p_mun5lqfe_787gbu": "bottle", "p_mun5omjw_g2uzy9": "cloud", "p_mun5oo7t_8v7ebm": "sail", "p_mun5vvhy_wmeppg": "sail", "p_mun5vwll_6uwi3v": "award", "p_mun5vxk4_kr6u81": "award", "p_mun5vzz7_gps1nu": "handMirror", "p_mun67wq6_e2r97m": "lampHouse", "p_mun6800a_fd3uii": "award", "p_mun6b5xj_yx5n99": "ringStand", "p_mur55ykk_t0et0c": "circle", "p_muv0v893_bdm9rn": "medal", "p_muv0x3we_yzcj1x": "medal", "p_muv0zy0p_iy0wmg": "ringStand", "p_muvex58y_yypbia": "phone", "p_mv0qeejc_xpbe3o": "book", "p_mv2u30a6_k63o39": "tray", "p_mv2u5f2d_7gepno": "plaque", "p_mvfanmcv_ww68cc": "board", "p_mvqwtaj8_ts2n2m": "handMirror", "p_mvqwufdh_pd6eg9": "board", "p_mvqwz6rh_kjq5o7": "board"};
  window.DAJANA_CFG = (items) => {
  items.forEach((x) => { if (!x.shape && window.DAJANA_SHAPES[x.id]) x.shape = window.DAJANA_SHAPES[x.id]; });
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
