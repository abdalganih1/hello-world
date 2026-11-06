/* صمّم · قالب البلكسي والأكريليك (محلات قص وحفر ليزر، دروع، ستاندات أعراس، هدايا بالاسم)
   ملف مستقل حتى ما يتعارض مع templates.js. بيضيف نفسه لـ SAMMEM_TEMPLATES.
   الأقسام الخاصة فيه (catalog, craft, showcase) والمشهد acrylic موجودين بـ engine/plexi.js */
window.SAMMEM_TEMPLATES = window.SAMMEM_TEMPLATES || {};
window.SAMMEM_TEMPLATES.plexi = {
  id: "plexi",
  label: "بلكسي وهدايا ليزر",
  keywords: ["بلكسي", "بليكسي", "بلاكسي", "أكريليك", "اكريليك", "ليزر", "حفر", "دروع", "درع", "ستاند", "هدايا", "توزيعات", "روماك", "طباعة uv", "تخرج", "خطوبة", "عقد قران", "مناسبات"],
  theme: { scene: "acrylic", dark: false, radius: "26px", fonts: { display: '"Aref Ruqaa", "El Messiri", serif', body: '"Tajawal", system-ui, sans-serif' }, colors: {} },
  defaultPalette: "crystal",
  palettes: {
    crystal: { label: "كريستال", desc: "عاجي فاتح مع ذهبي ووردي", bg: "#f7f1ea", surface: "#fffaf5", ink: "#2c1a22", muted: "#7d6870", accent: "#b8893b", accent2: "#c23d6e", line: "rgba(44,26,34,.12)", onAccent: "#fffaf5" },
    noir: { label: "أسود ذهبي", desc: "أسود لامع مع ذهب مرآة", bg: "#0c0a0b", surface: "#171315", ink: "#f8efe4", muted: "#b5a497", accent: "#e0b55c", accent2: "#f2d7a6", line: "rgba(248,239,228,.13)", onAccent: "#140f08" },
    blush: { label: "وردي", desc: "وردي ناعم مع فضي", bg: "#fbf0f2", surface: "#ffffff", ink: "#3b1b2a", muted: "#8a6676", accent: "#c23d6e", accent2: "#9aa6c4", line: "rgba(59,27,42,.11)", onAccent: "#ffffff" },
  },
  brand: { name: "لمسة كريستال", mark: "ل", tagline: "قطع بلكسي وأكريليك بالاسم، لكل فرحة عندكم", phone: "0944 000 000", whatsapp: "0944 000 000", address: "دمشق", hours: "كل يوم من 10 الصبح لـ 9 المسا" },
  sections: [
    { type: "nav", data: { links: [{ id: "catalog", label: "المنتجات" }, { id: "craft", label: "كيف منصنعها" }, { id: "showcase", label: "مختارات" }, { id: "faq", label: "أسئلة" }], cta: "اطلب قطعتك", ctaTarget: "catalog" } },
    { type: "hero", variant: "split", data: { eyebrow: "قص وحفر ليزر · بلكسي · طباعة UV", title: "قطعة شفافة بتحكي فرحتكم", lead: "ستاندات خطوبة وعقد قران، دروع تخرج، وهدايا بالاسم. منصممها إلكم ومنقصها بالليزر قطعة قطعة.", primary: "شوف المنتجات", primaryTarget: "catalog", secondary: "كيف منصنعها", secondaryTarget: "craft", badges: [{ k: "بالاسم", v: "تخصيص كامل" }, { k: "ليزر", v: "قص وحفر دقيق" }, { k: "UV", v: "طباعة ملونة" }] } },
    { type: "marquee", data: { items: ["ستاندات خطوبة", "عقد قران", "دروع تخرج", "مرايا عروس", "توزيعات مواليد", "ميداليات بالاسم", "لوحات استقبال", "طباعة UV"] } },
    { type: "catalog", data: { id: "catalog", eyebrow: "المنتجات", title: "اختار قطعتك ومنكتبلك عليها اسمك", lead: "كل قطعة بتنعمل حسب الطلب: الاسم، التاريخ، الألوان، والقياس.", currency: "ل.س", pageSize: 12,
      categories: [{ id: "all", label: "الكل" }, { id: "plexi", label: "بلكسي" }, { id: "mdf", label: "خشب MDF" }, { id: "uv", label: "طباعة UV" }, { id: "vinyl", label: "فينيل" }],
      items: [
        { name: "ستاند عقد قران مقوّس", cat: "plexi", price: 650000, desc: "قوس بلكسي شفاف مع حروف مرآة ذهبية وأسماء العروسين.", featured: true },
        { name: "درع تخرج بالاسم", cat: "plexi", price: 450000, desc: "بلكسي سميك مع قبعة تخرج وكتابة بالاسم والسنة.", featured: true },
        { name: "مراية عروس باللؤلؤ", cat: "plexi", price: 250000, desc: "مراية يد مزينة باللؤلؤ واسم العروس بخط ديواني.", featured: true },
        { name: "صينية مولود بالاسم", cat: "mdf", price: 300000, desc: "صينية خشب مع اسم المولود ومكان للتوزيعات.", featured: true },
        { name: "لوحة استقبال UV", cat: "uv", price: 800000, desc: "لوحة ترحيب بالضيوف مطبوعة بألوان ثابتة.", featured: true },
        { name: "ميدالية بالاسم", cat: "plexi", price: 30000, desc: "ميدالية مرآة ذهبي أو فضي باسمك." },
        { name: "توزيعات مناسبات", cat: "plexi", price: 15000, desc: "توزيعات صغيرة بالاسم والتاريخ لكل الضيوف." },
        { name: "عبارات فينيل", cat: "vinyl", price: 40000, desc: "عبارات للزجاج والجدران بأي خط بدك ياه." },
      ] } },
    { type: "craft", data: { id: "craft", eyebrow: "كيف منصنعها", title: "أربع طبقات بتعمل قطعة وحدة", steps: [
      { title: "منصمم معكم", text: "بتبعتولنا الأسماء والتاريخ والفكرة، ومنرجعلكم تصميم تشوفوه قبل القص." },
      { title: "قص بالليزر", text: "لوح البلكسي بينقص بالليزر بدقة أجزاء من المليمتر، وحوافه بتطلع لامعة متل الكريستال." },
      { title: "حفر وطباعة", text: "الأسماء بتنحفر أو بتنطبع UV، والحروف المرآة الذهبية بتنقص لحالها." },
      { title: "تجميع وتغليف", text: "منركّب الطبقات واللؤلؤ والقاعدة، ومنغلّفها لتوصلكم سليمة." },
    ] } },
    { type: "showcase", data: { id: "showcase", eyebrow: "مختارات", title: "قطع حبّها زبائننا", lead: "اسحب لتشوف أكتر" } },
    { type: "about", data: { id: "about", eyebrow: "مين نحنا", title: "ورشة صغيرة بتشتغل بإيدها", paragraphs: ["كل قطعة عنا بتبلش من فكرة صغيرة: اسم، تاريخ، أو عبارة بتحبوها. منصممها، منقصها، ومنركبها بإيدينا.", "منشتغل للأعراس والخطوبات والتخرج والمواليد، وللشركات اللي بدها دروع وهدايا بشعارها."], stats: [{ n: "500+", label: "قطعة سلّمناها" }, { n: "24", label: "ساعة للتصميم" }, { n: "100%", label: "تخصيص" }] } },
    { type: "testimonials", data: { id: "reviews", eyebrow: "آراء الزبائن", title: "شو قالوا عن قطعهم", items: [{ text: "الستاند كان أحلى شي بالخطبة، الكل سألني من وين.", name: "سلمى", meta: "ستاند خطوبة" }, { text: "دروع التخرج وصلت بالوقت والكتابة كانت دقيقة كتير.", name: "أحمد", meta: "دروع تخرج لدفعة كاملة" }, { text: "التوزيعات بالاسم خلّت المولود يكون مميز.", name: "ريم", meta: "توزيعات مولود" }] } },
    { type: "faq", data: { id: "faq", eyebrow: "أسئلة", title: "قبل ما تطلب", items: [{ q: "قديش بياخد الطلب؟", a: "التصميم خلال يوم، والتنفيذ من 2 لـ 5 أيام حسب القطعة والكمية." }, { q: "فيني غيّر الألوان والقياس؟", a: "إي، كل قطعة بتنعمل حسب الطلب. احكيلنا شو بدك ومنقلك السعر." }, { q: "بتوصلوا؟", a: "منوصّل ومنشحن، والتغليف بيحمي القطعة من الخدش والكسر." }, { q: "كيف بدفع؟", a: "عربون عند تأكيد التصميم، والباقي عند الاستلام." }] } },
    { type: "cta", data: { title: "عندك مناسبة قريبة؟", lead: "ابعتلنا الأسماء والتاريخ على واتساب، ومنرجعلك بتصميم خلال يوم.", button: "اطلب على واتساب" } },
    { type: "contact", data: { eyebrow: "تواصل", title: "احكيلنا عن قطعتك", subjects: ["ستاند خطوبة أو عرس", "دروع تخرج", "توزيعات", "هدايا بالاسم", "طلب شركة", "شي تاني"], subjectLabel: "نوع الطلب", placeholder: "الأسماء، التاريخ، والكمية", button: "أرسل على واتساب" } },
    { type: "footer", data: {} },
    { type: "whatsapp", data: {} },
  ],
};
