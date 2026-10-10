// All landing copy + content. Edit text here, not in JSX.

export type Lang = "mn" | "en";

export const CONTACT = {
  phone: "+976 9185 3040",
  phoneHref: "tel:+97691853040",
  email: "info@whitegroup.mn",
};

export const CERTS = ["HACCP", "HALAL", "ISO 9001:2016"];

// Optional video URLs (e.g. "/videos/hero.mp4" in public/). Empty = photo fallback.
export const VIDEOS = { hero: "", slaughter: "", freeze: "" };

// Photo per process step. `gate` = slaughter step: blurred until the visitor
// opts in. `video` = looping clip shown instead of the photo when set.
export const STEP_MEDIA: { img: string; pos?: string; gate?: boolean; video?: string }[] = [
  { img: "/photos/intake.jpg" },
  { img: "/photos/cold-room.jpg", gate: true },
  { img: "/photos/cutting-line.jpg" },
  { img: "/photos/cold-room.jpg", video: VIDEOS.freeze },
  { img: "/photos/storage.jpg", pos: "center 35%" },
];

// Schematic map nodes on a 100×70 grid; `region` indexes about.regions.
export const MAP_NODES = [
  { x: 78, y: 26, region: 0 },
  { x: 60, y: 52, region: 1 },
  { x: 14, y: 40, region: 2 },
  { x: 86, y: 27, region: 0, factory: true },
];

const mn = {
  nav: [
    { href: "#about", label: "Бидний тухай" },
    { href: "#process", label: "Үйл явц" },
    { href: "#capacity", label: "Чадамж" },
    { href: "#products", label: "Бүтээгдэхүүн" },
    { href: "#history", label: "Түүх" },
    { href: "#contact", label: "Холбогдох" },
  ],
  cta: "Захиалга өгөх",
  menu: "Цэс",
  hero: {
    kicker: "Дорнод аймаг · 2008 оноос",
    l1: "Зүүн талын бэлчээрээс",
    l2: "таны агуулах хүртэл.",
    sub: "“Вайт грүпп” ХХК нь Дорнод, Сүхбаатар нутгийн бэлчээрийн малыг HACCP, HALAL, ISO 9001 стандартын дагуу төхөөрч, сэврээн хөлдөөж, дотоодын зах зээл болон экспортын үйлдвэрүүдэд нийлүүлдэг.",
    cta2: "Үйлдвэрийг үзэх",
  },
  stats: [
    { n: "17", l: "жил салбартаа" },
    { n: "500", l: "бог мал · хоногт" },
    { n: "300", l: "бод мал · хоногт" },
    { n: "500 т", l: "хадгалах агуулах" },
  ],
  about: {
    kicker: "Гарал үүсэл",
    title: "Бэлчээр нь мэдэгдэх мах",
    p1: "“Вайт грүпп” ХХК нь 2008 оноос түүхий эд, 2010 оноос мал, мах, малын гаралтай бүтээгдэхүүн бэлтгэн дотоодын зах зээлд тогтвортой нийлүүлж байна.",
    p2: "Бид малаа Дорнод, Сүхбаатар аймгийн малчдаас шууд бэлтгэдэг тул мах бүрийн гарал үүсэл тодорхой. Махны амт, чанар нь судлаачид, хэрэглэгчдийн үнэлгээг хүртсэн.",
    mapNote: "Схем — масштабгүй",
    legend1: "Мал бэлтгэл",
    legend2: "Нийлүүлэлт",
    regions: [
      { name: "Дорнод аймаг", desc: "Үйлдвэр Чойбалсангаас зүүн 12 км-т. Ойр орчмын сумдаас малыг шууд хүлээн авна." },
      { name: "Сүхбаатар аймаг", desc: "Тал хээрийн бэлчээрийн бог, бод мал — бидний хоёр дахь гол эх үүсвэр." },
      { name: "Улаанбаатар", desc: "10+ бөөний худалдан авагч, хотын нөөцийн махны тендер, экспортын үйлдвэрүүд." },
    ],
    mapLabels: ["Дорнод", "Сүхбаатар", "Улаанбаатар", "Үйлдвэр"],
  },
  process: {
    kicker: "Үйл явц",
    title: "Бэлчээрээс хөлдөөлт хүртэл таван алхам",
    videoTag: "Видео",
    gateTitle: "Төхөөрөлтийн бичлэг",
    gateBody: "Энэ бичлэгт төхөөрөх үйл явц бодитоор харагдана. Үзэх эсэхээ та өөрөө сонгоно уу.",
    gateBtn: "Бичлэгийг үзэх",
    pending: "Бичлэг удахгүй нэмэгдэнэ",
    stepWord: "Алхам",
    prev: "Өмнөх",
    next: "Дараах",
    steps: [
      { title: "Мал хүлээн авалт", body: "Малыг малчдаас шууд худалдан авч, мал эмнэлгийн үзлэг хийн, бичиг баримтаар хүлээн авна." },
      { title: "Төхөөрөлт", body: "142 м шугаман бойны цэгт HALAL журмын дагуу, эрүүл ахуйн хяналттай төхөөрнө." },
      { title: "Задлан ангилах", body: "12×40 м задлан, нядалгааны хэсэгт туршлагатай ажилчид гулуузыг гараар задлан ангилна." },
      { title: "Сэврээх, хөлдөөх", body: "20 тонны 2 сэврээх талбай, 40 тонны 5 хөлдөөх өрөөнд температурыг тасралтгүй хянана." },
      { title: "Хадгалалт, ачилт", body: "500 тонны агуулахаас дотоодын болон экспортын захиалгад цаг тухайд нь ачилт хийнэ." },
    ],
  },
  cap: {
    kicker: "Үйлдвэрийн чадамж",
    title: "Бойноос хадгалалт хүртэл нэг дээвэр дор",
    sub: "2020 онд Чойбалсангаас зүүн 12 км-т ашиглалтад орсон, 2312 м² талбай бүхий орчин үеийн үйлдвэр. Төхөөрөх, задлах, сэврээх, хөлдөөх, хадгалах бүх шат нэг дор.",
    big: [
      { n: "2312", l: "м² үйлдвэрийн талбай" },
      { n: "142", l: "м бойны шугам" },
      { n: "800", l: "бод · сэврээх, хадгалах багтаамж" },
    ],
    th: ["Хэсэг", "Хэмжээ", "Хүчин чадал"],
    rows: [
      ["Хөлдөөх өрөө · 5", "11×5, 8×5 м", "40 т"],
      ["Хадгалах агуулах", "22×18 м", "500 т"],
      ["Бойны шугам", "142 м", "500 бог · 300 бод / хоног"],
      ["Мах сэврээх талбай · 2", "—", "20 т"],
      ["Шулааны өрөө · 2", "11×20 м", "—"],
      ["Задлан, нядалгааны хэсэг", "12×40 м", "—"],
    ],
  },
  prod: {
    kicker: "Бүтээгдэхүүн",
    title: "Бүхэл гулууз, сэрүүн болон хөлдүү",
    exportTag: "Экспорт",
    items: [
      { kicker: "Бог мал", name: "Хонины гулууз", body: "Бүхэл болон хагас гулууз. Сэрүүн эсвэл хөлдүү хэлбэрээр." },
      { kicker: "Бог мал", name: "Ямааны гулууз", body: "Бүхэл гулууз. Сэрүүн эсвэл хөлдүү хэлбэрээр." },
      { kicker: "Бод мал", name: "Үхрийн гулууз", body: "Хагас болон дөрөвний нэг гулууз. Сэрүүн эсвэл хөлдүү." },
      { kicker: "Бод мал", name: "Адууны гулууз", body: "Хагас болон дөрөвний нэг гулууз. Сэрүүн эсвэл хөлдүү." },
      { kicker: "Бод мал", name: "Тэмээний гулууз", body: "Захиалгаар бэлтгэнэ. Сэрүүн эсвэл хөлдүү." },
      { kicker: "Экспорт", name: "Адууны мах", body: "Экспортын эрхтэй үйлдвэрүүдэд зориулсан, HALAL баталгаатай адууны мах.", export: true },
    ],
  },
  // TODO(client): founder quote, name and story are placeholders from the design.
  founder: {
    kicker: "Үүсгэн байгуулагчийн үг",
    quote: "“[Үүсгэн байгуулагчийн ишлэл энд байрлана — удахгүй нэмэгдэнэ.]”",
    name: "[Нэр Овог]",
    role: "Үүсгэн байгуулагч, Гүйцэтгэх захирал",
    body: "[Үүсгэн байгуулагчийн товч түүх: компанийг хэрхэн эхлүүлсэн, Дорнодын малчидтай тогтоосон харилцаа, ирээдүйн зорилго.]",
  },
  std: {
    kicker: "Чанарын стандарт",
    title: "Олон улсын стандартаар баталгаажсан",
    items: [
      { name: "HACCP", year: "2023", body: "Хүнсний аюулгүй байдлын эрсдэлийн дүн шинжилгээ, эгзэгтэй цэгийн хяналтын тогтолцоо." },
      { name: "HALAL", year: "2023", body: "Шашин, ёс заншлын дагуу боловсруулсан халал баталгаатай бүтээгдэхүүн." },
      { name: "ISO 9001", year: "2025", body: "MNS ISO 9001:2016 чанарын менежментийн тогтолцоо нэвтрүүлж баталгаажсан." },
    ],
  },
  hist: {
    kicker: "17 жилийн замнал",
    title: "Бидний түүх · 2008–2025",
    years: [
      { year: "2008", text: "Түүхий эд бэлтгэж эхэлсэн." },
      { year: "2010", text: "Мал, мах, махан бүтээгдэхүүнийг дотоодын зах зээлд тогтвортой нийлүүлж эхэлсэн." },
      { year: "2014", text: "Траст трейд, Мах импекс болон УБ-ын 10 орчим компанид мах нийлүүлж эхэлсэн." },
      { year: "2017", text: "Чойбалсангийн сургууль, цэцэрлэг, Зүүн бүсийн оношилгоо эмчилгээний төвд нийлүүлэлт хийж эхэлсэн." },
      { year: "2020", text: "Хоногт 500 бог, 300 бод төхөөрөх шинэ үйлдвэрээ ашиглалтад оруулсан." },
      { year: "2021", text: "Улаанбаатар хотын “Нөөцийн мах” бэлтгэх тендерт шалгарсан." },
      { year: "2022", text: "Дулааны аргаар мах боловсруулах жижиг цех байгуулсан." },
      { year: "2023", text: "HACCP, HALAL стандартуудыг нэвтрүүлсэн." },
      { year: "2024", text: "Дайвар бүтээгдэхүүн боловсруулах жижиг үйлдвэр ашиглалтад орсон." },
      { year: "2025", text: "ISO 9001:2016 чанарын менежментийн тогтолцоогоор баталгаажсан." },
    ],
  },
  partners: {
    kicker: "Хамтрагчид ба хүмүүс",
    title: "Итгэлээ хүлээлгэсэн түншүүд",
    items: [
      { name: "Траст трейд", note: "2014 оноос" },
      { name: "Мах импекс", note: "2014 оноос" },
      { name: "УБ хотын 10+ компани", note: "Тогтмол нийлүүлэлт" },
      { name: "Сургууль, цэцэрлэг", note: "Чойбалсан хот" },
      { name: "Зүүн бүсийн оношилгоо эмчилгээний төв", note: "2017 оноос" },
      { name: "Экспортын эрхтэй үйлдвэрүүд", note: "Адууны мах" },
    ],
    jobs: [
      { n: "30", l: "үндсэн ажлын байр" },
      { n: "20–30", l: "улирлын ажлын байр" },
    ],
    csr: "Бид орон нутагтаа ажлын байр бий болгож, Дорнодын хөгжилд хувь нэмрээ оруулсаар байна.",
  },
  contact: {
    kicker: "Холбоо барих",
    title: "Хамтран ажиллахад бэлэн",
    sub: "Захиалга, нийлүүлэлт, хамтын ажиллагааны талаар бидэнтэй холбогдоорой. Ажлын нэг өдрийн дотор хариу өгнө.",
    phoneL: "Утас",
    emailL: "И-мэйл",
    addrL: "Хаяг",
    addr: "Дорнод аймаг, Чойбалсан хотоос зүүн 12 км",
    formTitle: "Хүсэлт илгээх",
    fName: "Нэр / Байгууллага",
    fContact: "Утас эсвэл и-мэйл",
    fBuyer: "Та хэн бэ?",
    fMsg: "Захиалга / зурвас",
    send: "Илгээх",
    buyers: ["Экспортын үйлдвэр", "Бөөний худалдан авагч", "Байгууллага", "Хөрөнгө оруулагч"],
    thanks: "Баярлалаа",
    thanksBody: "Таны хүсэлтийг хүлээн авлаа. Бид удахгүй холбогдоно.",
    again: "Дахин илгээх",
  },
  footer: {
    blurb: "2008 оноос хойш мал, мах, малын гаралтай бүтээгдэхүүнийг дотоодын зах зээл болон экспортын үйлдвэрүүдэд нийлүүлж буй найдвартай түнш.",
    copy: "© 2026 “Вайт грүпп” ХХК. Бүх эрх хуулиар хамгаалагдсан.",
    places: "Дорнод · Сүхбаатар · Улаанбаатар",
  },
};

export type Copy = typeof mn;

const en: Copy = {
  nav: [
    { href: "#about", label: "About" },
    { href: "#process", label: "Process" },
    { href: "#capacity", label: "Capacity" },
    { href: "#products", label: "Products" },
    { href: "#history", label: "History" },
    { href: "#contact", label: "Contact" },
  ],
  cta: "Request a quote",
  menu: "Menu",
  hero: {
    kicker: "Dornod, Mongolia · Since 2008",
    l1: "From the eastern steppe",
    l2: "to your cold store.",
    sub: "White Group LLC slaughters, chills and freezes pasture-raised livestock from Dornod and Sükhbaatar to HACCP, HALAL and ISO 9001 standards, supplying domestic buyers and export-licensed processors.",
    cta2: "See the factory",
  },
  stats: [
    { n: "17", l: "years in the trade" },
    { n: "500", l: "sheep & goats · per day" },
    { n: "300", l: "cattle & horses · per day" },
    { n: "500 t", l: "cold storage" },
  ],
  about: {
    kicker: "Origin",
    title: "Meat with a known pasture",
    p1: "White Group has sourced raw materials since 2008, and since 2010 has supplied livestock, meat and animal products to the domestic market without interruption.",
    p2: "We buy directly from herders in Dornod and Sükhbaatar, so the origin of every carcass is known. Our meat is valued by researchers and customers alike for its taste and quality.",
    mapNote: "Schematic — not to scale",
    legend1: "Livestock sourcing",
    legend2: "Supply",
    regions: [
      { name: "Dornod Province", desc: "Factory 12 km east of Choibalsan. Livestock received directly from surrounding soums." },
      { name: "Sükhbaatar Province", desc: "Open-steppe sheep, goats, cattle and horses: our second core source." },
      { name: "Ulaanbaatar", desc: "10+ wholesale buyers, the city reserve-meat tender, and export processors." },
    ],
    mapLabels: ["Dornod", "Sükhbaatar", "Ulaanbaatar", "Factory"],
  },
  process: {
    kicker: "Process",
    title: "Pasture to freezer in five steps",
    videoTag: "Video",
    gateTitle: "Slaughter footage",
    gateBody: "This video shows the slaughter process as it is. Choose whether to watch.",
    gateBtn: "Play video",
    pending: "Video coming soon",
    stepWord: "Step",
    prev: "Previous",
    next: "Next",
    steps: [
      { title: "Livestock intake", body: "Bought directly from herders, checked by our veterinarian and documented on arrival." },
      { title: "Slaughter", body: "Performed to HALAL procedure on a 142 m overhead line, under hygiene control." },
      { title: "Cutting & dressing", body: "Experienced butchers break down carcasses by hand in a 12×40 m dressing hall." },
      { title: "Chilling & freezing", body: "Two 20 t chilling halls and five 40 t freezer rooms, temperature-monitored around the clock." },
      { title: "Storage & dispatch", body: "Orders ship on schedule from a 500 t warehouse to domestic and export buyers." },
    ],
  },
  cap: {
    kicker: "Capacity",
    title: "Slaughter to storage under one roof",
    sub: "Opened in 2020, 12 km east of Choibalsan: a 2,312 m² facility where slaughter, cutting, chilling, freezing and storage all happen on site.",
    big: [
      { n: "2312", l: "m² facility" },
      { n: "142", l: "m slaughter line" },
      { n: "800", l: "head · chilling & storage" },
    ],
    th: ["Area", "Size", "Capacity"],
    rows: [
      ["Freezer rooms · 5", "11×5, 8×5 m", "40 t"],
      ["Cold storage warehouse", "22×18 m", "500 t"],
      ["Slaughter line", "142 m", "500 small · 300 large / day"],
      ["Chilling halls · 2", "—", "20 t"],
      ["Deboning rooms · 2", "11×20 m", "—"],
      ["Cutting & dressing hall", "12×40 m", "—"],
    ],
  },
  prod: {
    kicker: "Products",
    title: "Whole carcasses, chilled or frozen",
    exportTag: "Export",
    items: [
      { kicker: "Small stock", name: "Sheep carcass", body: "Whole and half carcasses, chilled or frozen." },
      { kicker: "Small stock", name: "Goat carcass", body: "Whole carcasses, chilled or frozen." },
      { kicker: "Large stock", name: "Cattle carcass", body: "Half and quarter carcasses, chilled or frozen." },
      { kicker: "Large stock", name: "Horse carcass", body: "Half and quarter carcasses, chilled or frozen." },
      { kicker: "Large stock", name: "Camel carcass", body: "Prepared to order, chilled or frozen." },
      { kicker: "Export", name: "Horse meat", body: "HALAL-certified horse meat for export-licensed processors.", export: true },
    ],
  },
  founder: {
    kicker: "From the founder",
    quote: "“[Founder’s quote goes here — to be supplied.]”",
    name: "[Full name]",
    role: "Founder & CEO",
    body: "[A short founder story: how the company started, the relationship with Dornod herders, and where it is heading.]",
  },
  std: {
    kicker: "Quality standards",
    title: "Certified to international standards",
    items: [
      { name: "HACCP", year: "2023", body: "Hazard analysis and critical control point system for food safety." },
      { name: "HALAL", year: "2023", body: "Products processed in accordance with halal requirements." },
      { name: "ISO 9001", year: "2025", body: "Certified to MNS ISO 9001:2016 quality management." },
    ],
  },
  hist: {
    kicker: "Seventeen years",
    title: "Our history · 2008–2025",
    years: [
      { year: "2008", text: "Began sourcing raw materials." },
      { year: "2010", text: "Began steady supply of livestock and meat to the domestic market." },
      { year: "2014", text: "Began supplying Trust Trade, Makh Impex and around ten Ulaanbaatar companies." },
      { year: "2017", text: "Began supplying Choibalsan schools, kindergartens and the Eastern Region Diagnostic Center." },
      { year: "2020", text: "Opened a new factory processing 500 small and 300 large stock per day." },
      { year: "2021", text: "Won the Ulaanbaatar city reserve-meat tender." },
      { year: "2022", text: "Opened a small heat-processing workshop." },
      { year: "2023", text: "Implemented HACCP and HALAL standards." },
      { year: "2024", text: "Opened a by-products processing plant." },
      { year: "2025", text: "Certified to ISO 9001:2016." },
    ],
  },
  partners: {
    kicker: "Partners & people",
    title: "Partners who trust us",
    items: [
      { name: "Trust Trade", note: "Since 2014" },
      { name: "Makh Impex", note: "Since 2014" },
      { name: "10+ Ulaanbaatar companies", note: "Regular supply" },
      { name: "Schools & kindergartens", note: "Choibalsan" },
      { name: "Eastern Region Diagnostic & Treatment Center", note: "Since 2017" },
      { name: "Export-licensed processors", note: "Horse meat" },
    ],
    jobs: [
      { n: "30", l: "permanent jobs" },
      { n: "20–30", l: "seasonal jobs" },
    ],
    csr: "We create local jobs and invest in the development of Dornod.",
  },
  contact: {
    kicker: "Contact",
    title: "Ready to work together",
    sub: "Get in touch about orders, supply contracts or partnership. We reply within one business day.",
    phoneL: "Phone",
    emailL: "Email",
    addrL: "Address",
    addr: "Dornod Province, 12 km east of Choibalsan, Mongolia",
    formTitle: "Send a request",
    fName: "Name / Company",
    fContact: "Phone or email",
    fBuyer: "You are",
    fMsg: "Order / message",
    send: "Send",
    buyers: ["Export processor", "Wholesale buyer", "Institution", "Investor"],
    thanks: "Thank you",
    thanksBody: "We’ve received your request and will be in touch shortly.",
    again: "Send another",
  },
  footer: {
    blurb: "A reliable partner supplying livestock, meat and animal products to domestic and export markets since 2008.",
    copy: "© 2026 White Group LLC. All rights reserved.",
    places: "Dornod · Sükhbaatar · Ulaanbaatar",
  },
};

export const COPY: Record<Lang, Copy> = { mn, en };
