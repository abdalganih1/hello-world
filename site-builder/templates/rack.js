/* صمّم · قالب «الرف»: بوتيك وألبسة ستريت
   الواجهة رف حديد معلّق عليه القطع، بتتمرجح لما يمرّ عليها الماوس أو الإصبع، وبتنطلب بضغطة (واتساب).
   القطع المعلّقة هي نفسها منتجات قسم products (لوحة الإدارة والذكاء الاصطناعي بيعدّلوها).
   القسم rack ورسم القطع موجودين بـ engine/rack.js و engine/rack.css */
window.SAMMEM_TEMPLATES = window.SAMMEM_TEMPLATES || {};
window.SAMMEM_TEMPLATES.rack = {
  id: "rack",
  label: "بوتيك وألبسة شبابية",
  keywords: ["بوتيك", "ألبسة شبابية", "ستريت", "هودي", "جاكيت", "تيشرتات", "قمصان", "فساتين", "ألبسة نسائية", "ألبسة رجالية", "براند", "موضة", "أزياء", "محل ألبسة"],
  theme: { scene: "none", dark: false, radius: "18px", fonts: { display: '"Changa", "Readex Pro", sans-serif', body: '"Readex Pro", "Tajawal", system-ui, sans-serif' }, colors: {} },
  defaultPalette: "calm",
  palettes: {
    calm: { label: "أبيض نيون", desc: "أبيض مزرق مع أخضر نيون", bg: "#eef1f4", surface: "#ffffff", ink: "#111214", muted: "#666b73", accent: "#2fdc3f", accent2: "#ff4f9a", line: "rgba(17,18,20,.12)", onAccent: "#0b0c0d" },
    luxe: { label: "ليلي", desc: "أسود فحمي مع ليموني", bg: "#0e0f10", surface: "#18191b", ink: "#f2f3f0", muted: "#a2a59f", accent: "#c8ff3a", accent2: "#7aa7ff", line: "rgba(242,243,240,.13)", onAccent: "#0e0f10" },
    bold: { label: "رملي", desc: "بيج دافي مع برتقالي", bg: "#efe7dc", surface: "#fbf6ef", ink: "#1d1712", muted: "#7a6d60", accent: "#ff5a1f", accent2: "#2c5cff", line: "rgba(29,23,18,.12)", onAccent: "#fffaf3" },
  },
  brand: { name: "دولاب", mark: "د", tagline: "ستريت وير من الشام، قطع قليلة وبتخلص بسرعة", phone: "0944 000 000", whatsapp: "0944 000 000", address: "دمشق، الشعلان", hours: "كل يوم من 11 الصبح لـ 10 المسا" },
  sections: [
    { type: "rack", data: { id: "rack", aboutLabel: "عنّا", contactLabel: "تواصل", eyebrow: "وصل جديد · مجموعة الشتوية", title: "مرّق إيدك عالرف، واختار قطعتك", button: "شوف كل القطع", buttonTarget: "products", hint: "مرّر عالقطع لتتمرجح · اضغط لتطلب", hintTouch: "اسحب الرف لتتمرجح القطع · اضغط لتطلب", ticker: ["نحنا، مو غيرنا", "وصل جديد", "دمشق", "قطع محدودة", "توصيل لكل المحافظات", "تبديل خلال 7 أيام"] } },
    { type: "products", data: { id: "products", eyebrow: "كل القطع", title: "المتوفر هلق", lead: "كل قطعة بكمية محدودة. اختار المقاس واللون وابعتلنا طلبك ع واتساب.", addLabel: "اطلب ع واتساب", chooseLabel: "اختار مقاسك",
      items: [
        { name: "تيشرت أوفرسايز أبيض", desc: "قطن ثقيل 240 غرام مع طبعة صغيرة عالصدر.", price: "120,000 ل.س", cat: "تيشرتات", tag: "الأكتر طلباً", options: [{ name: "المقاس", kind: "size", values: ["S", "M", "L", "XL"] }, { name: "اللون", kind: "color", values: ["أبيض", "أسود"] }] },
        { name: "هودي فحمي", desc: "قطن مبطّن بفرو خفيف، قبعة واسعة وجيبة كنغر.", price: "260,000 ل.س", cat: "هوديز", options: [{ name: "المقاس", kind: "size", values: ["M", "L", "XL"] }] },
        { name: "جاكيت فارسيتي أسود", desc: "جوخ أسود مع أكمام بيضا وحرف مطرّز.", price: "450,000 ل.س", cat: "جاكيتات", tag: "جديد", options: [{ name: "المقاس", kind: "size", values: ["M", "L", "XL"] }] },
        { name: "قميص جينز", desc: "جينز خفيف مغسول، بيتلبس مفتوح فوق تيشرت.", price: "210,000 ل.س", cat: "قمصان", options: [{ name: "المقاس", kind: "size", values: ["S", "M", "L"] }] },
        { name: "فانيلة رياضية صفرا", desc: "قماش رياضي بيتنفس، بخطوط خضرا عالجنب.", price: "150,000 ل.س", cat: "تيشرتات", options: [{ name: "المقاس", kind: "size", values: ["S", "M", "L", "XL"] }] },
        { name: "فستان صيفي زيتي", desc: "كتان طبيعي بقصة واسعة وحزام.", price: "320,000 ل.س", cat: "فساتين", options: [{ name: "المقاس", kind: "size", values: ["S", "M", "L"] }] },
        { name: "بنطلون كارغو بيج", desc: "قماش متين بجيوب جانبية وخصر مطاط.", price: "230,000 ل.س", cat: "بناطيل", options: [{ name: "المقاس", kind: "size", values: ["30", "32", "34", "36"] }] },
        { name: "تيشرت نيون أخضر", desc: "قصة عادية، لون فاقع لصيف ما بينتسى.", price: "110,000 ل.س", cat: "تيشرتات", options: [{ name: "المقاس", kind: "size", values: ["S", "M", "L"] }] },
      ] } },
    { type: "about", data: { id: "about", eyebrow: "عنّا", title: "محل صغير بيلبس متل الشارع", paragraphs: ["بلّشنا من غرفة بالبيت وصفحة إنستغرام. كل قطعة منختارها أو منصممها بحالنا، ومنطبعها بكميات قليلة حتى ما حدا يلبس متلك.", "منحب القطن الثقيل، والقصات الواسعة، والألوان اللي بتبيّن من بعيد."], stats: [{ n: "40", label: "قطعة بكل مجموعة" }, { n: "7", label: "أيام للتبديل" }, { n: "14", label: "محافظة منوصّلها" }] } },
    { type: "testimonials", data: { id: "reviews", eyebrow: "شو قالوا", title: "من الزبائن", items: [{ text: "الهودي تقيل ودافي والقصة مزبوطة، رجعت اشتريت التاني بلون تاني.", name: "كرم", meta: "هودي فحمي" }, { text: "طلبت ع واتساب ووصلني تاني يوم لحمص.", name: "لين", meta: "فستان صيفي" }, { text: "الجاكيت عامل ضجة بالجامعة.", name: "يزن", meta: "جاكيت فارسيتي أسود" }] } },
    { type: "faq", data: { id: "faq", eyebrow: "أسئلة", title: "قبل ما تطلب", items: [{ q: "كيف بعرف مقاسي؟", a: "ابعتلنا طولك ووزنك ع واتساب ومنقلك المقاس الأنسب لكل قطعة." }, { q: "بتوصلوا لبرا الشام؟", a: "إي، منوصّل لكل المحافظات خلال يوم لـ 3 أيام، والدفع عند الاستلام." }, { q: "فيني بدّل؟", a: "خلال 7 أيام إذا القطعة ما انلبست وبعدها بكيسها." }] } },
    { type: "contact", data: { id: "contact", eyebrow: "تواصل", title: "احكينا", subjects: ["طلب قطعة", "سؤال عن مقاس", "تبديل", "شي تاني"], subjectLabel: "شو بدك", placeholder: "اسم القطعة والمقاس والمحافظة", button: "أرسل ع واتساب" } },
    { type: "footer", data: {} },
    { type: "whatsapp", data: {} },
  ],
};
