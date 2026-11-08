// All landing copy + content. Edit text here, not in JSX.
// `en` is typed against `mn`, so every new key goes in both.
// "[PLACEHOLDER]" = value owed by the owner (see docs/design/brief.md TODO(owner)).
// Launch gate: `grep -n PLACEHOLDER` must return nothing before deploy.

export type Lang = "mn" | "en";

export const CONTACT = {
  phone: "+976 99976017",
  phoneHref: "tel:+97699976017",
  email: "llcwhitegroup@gmail.com",
  // Google Maps embed of the plant (shown under the address in Contact).
  mapEmbed:
    "https://www.google.com/maps/embed?pb=!1m17!1m12!1m3!1d1465.249245724329!2d114.62791397422468!3d48.059775926678945!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m2!1m1!2s!5e1!3m2!1sen!2smn!4v1794122262401!5m2!1sen!2smn",
};
export const CERTS = ["HACCP", "HALAL", "ISO 9001:2016"];

// Optional video URLs (e.g. "/videos/hero.mp4" in public/). Empty = photo fallback.
export const VIDEOS = { hero: "", slaughter: "", freeze: "" };

// Media per explorer stop (7). `gate` = slaughter stop: blurred until the visitor
// opts in. `video` = looping clip shown instead of the photo when set.
// `map` = region indices highlighted on the schematic map (stops 1 and 7).
export const STEP_MEDIA: {
  img?: string;
  pos?: string;
  gate?: boolean;
  video?: string;
  map?: number[];
}[] = [
  { map: [0, 1] },
  { img: "/photos/intake.jpg" },
  { img: "/photos/cold-room.jpg", gate: true },
  { img: "/photos/cutting-line.jpg" },
  { img: "/photos/cold-room.jpg", video: VIDEOS.freeze },
  { img: "/photos/storage.jpg", pos: "center 35%" },
  { map: [2] },
];

// Schematic map nodes on a 100×70 grid; `region` indexes the region (0 Dornod, 1 Sükhbaatar, 2 UB).
export const MAP_NODES = [
  { x: 78, y: 26, region: 0 },
  { x: 60, y: 52, region: 1 },
  { x: 14, y: 40, region: 2 },
  { x: 86, y: 27, region: 0, factory: true },
];

type Fact = [string, string];
export type Stop = {
  short: string;
  title: string;
  body: string;
  facts: Fact[];
  stockFacts?: { small: Fact[]; large: Fact[] };
  partner?: string;
};
export type ProdItem = {
  name: string;
  body: string;
  stock: "small" | "large";
  export?: true;
};
export type RoadmapItem = { year: string; text: string; planned?: true };
export type StdItem = {
  name: string;
  year: string;
  issuer: string;
  body: string;
  pdf?: string;
};

const mnStops: Stop[] = [
  {
    short: "Бэлчээр",
    title: "Малчдаас шууд",
    body: "Бид малаа Дорнод, Сүхбаатар аймгийн малчдаас шууд бэлтгэдэг тул мах бүрийн гарал үүсэл тодорхой. Махны амт, чанар нь судлаачид, хэрэглэгчдийн үнэлгээг хүртсэн.",
    facts: [
      ["Дорнод аймаг", "Үйлдвэрийн ойр орчмын сумдаас шууд"],
      ["Сүхбаатар аймаг", "Хоёр дахь гол эх үүсвэр"],
    ],
    partner: "Мал нийлүүлэгчид: бид малчидтай зуучлагчгүй ажилладаг.",
  },
  {
    short: "Хүлээн авалт",
    title: "Мал хүлээн авалт",
    body: "Малыг малчдаас шууд худалдан авч, мал эмнэлгийн үзлэг хийн, бичиг баримтаар хүлээн авна.",
    facts: [
      ["Үзлэг", "Мал эмнэлгийн үзлэг"],
      ["Бүртгэл", "Бичиг баримтаар"],
    ],
  },
  {
    short: "Төхөөрөлт",
    title: "Төхөөрөлт",
    body: "142 м шугаман бойны цэгт HALAL журмын дагуу, эрүүл ахуйн хяналттай төхөөрнө.",
    facts: [
      ["Бойны шугам", "142 м"],
      ["Журам", "HALAL"],
    ],
    stockFacts: {
      small: [["Хүчин чадал", "500 бог мал / хоног"]],
      large: [["Хүчин чадал", "300 бод мал / хоног"]],
    },
    partner: "HALAL журмаар төхөөрч, 2023 оноос баталгаажсан.",
  },
  {
    short: "Шулах",
    title: "Шулах",
    body: "12×40 м шулах, нядалгааны хэсэгт туршлагатай ажилчид гулуузыг гараар шулан ангилна.",
    facts: [
      ["Шулах, нядалгааны хэсэг", "12×40 м"],
      ["Шулааны өрөө · 2", "11×20 м"],
    ],
    stockFacts: {
      small: [["Хэлбэр", "Бүхэл, хагас гулууз"]],
      large: [["Хэлбэр", "Хагас, дөрөвний нэг гулууз"]],
    },
  },
  {
    short: "Хөлдөөх",
    title: "Сэврээх, хөлдөөх",
    body: "20 тонны 2 сэврээх талбай, 40 тонны 5 хөлдөөх өрөөнд температурыг тасралтгүй хянана.",
    facts: [
      ["Сэврээх талбай", "2 × 20 т"],
      ["Хөлдөөх өрөө", "5 × 40 т"],
      ["Багтаамж", "800 бод мал"],
    ],
  },
  {
    short: "Агуулах",
    title: "Хадгалалт, ачилт",
    body: "500 тонны агуулахаас дотоодын болон экспортын захиалгад цаг тухайд нь ачилт хийнэ.",
    facts: [
      ["Агуулах", "22×18 м"],
      ["Багтаамж", "500 т"],
    ],
  },
  {
    short: "Худалдан авагч",
    title: "Хэнд нийлүүлдэг вэ",
    body: "Улаанбаатарын 10+ бөөний худалдан авагч, хотын нөөцийн махны тендер, Чойбалсангийн сургууль, цэцэрлэг, эмнэлэг, экспортын эрхтэй үйлдвэрүүд.",
    facts: [],
    partner: "Худалдан авагчид: доорх маягтаар үнийн санал аваарай.",
  },
];

const enStops: Stop[] = [
  {
    short: "Pasture",
    title: "Straight from herders",
    body: "We buy directly from herders in Dornod and Sükhbaatar, so the origin of every carcass is known. Our meat is valued by researchers and customers alike for its taste and quality.",
    facts: [
      ["Dornod Province", "Directly from soums around the plant"],
      ["Sükhbaatar Province", "Our second core source"],
    ],
    partner: "For suppliers: we deal with herders directly, with no middlemen.",
  },
  {
    short: "Intake",
    title: "Livestock intake",
    body: "Bought directly from herders, checked by our veterinarian and documented on arrival.",
    facts: [
      ["Check", "Veterinary inspection"],
      ["Records", "Documented on arrival"],
    ],
  },
  {
    short: "Slaughter",
    title: "Slaughter",
    body: "Performed to HALAL procedure on a 142 m overhead line, under hygiene control.",
    facts: [
      ["Slaughter line", "142 m"],
      ["Procedure", "HALAL"],
    ],
    stockFacts: {
      small: [["Capacity", "500 small stock / day"]],
      large: [["Capacity", "300 large stock / day"]],
    },
    partner: "HALAL slaughter, certified since 2023.",
  },
  {
    short: "Cutting",
    title: "Cutting & dressing",
    body: "Experienced butchers break down carcasses by hand in a 12×40 m dressing hall.",
    facts: [
      ["Cutting & dressing hall", "12×40 m"],
      ["Deboning rooms · 2", "11×20 m"],
    ],
    stockFacts: {
      small: [["Cuts", "Whole and half carcasses"]],
      large: [["Cuts", "Half and quarter carcasses"]],
    },
  },
  {
    short: "Chill & freeze",
    title: "Chilling & freezing",
    body: "Two 20 t chilling halls and five 40 t freezer rooms, temperature-monitored around the clock.",
    facts: [
      ["Chilling halls", "2 × 20 t"],
      ["Freezer rooms", "5 × 40 t"],
      ["Holding capacity", "800 large stock"],
    ],
  },
  {
    short: "Storage",
    title: "Storage & dispatch",
    body: "Orders ship on schedule from a 500 t warehouse to domestic and export buyers.",
    facts: [
      ["Warehouse", "22×18 m"],
      ["Capacity", "500 t"],
    ],
  },
  {
    short: "Buyers",
    title: "Who we supply",
    body: "10+ wholesale buyers in Ulaanbaatar, the city reserve-meat tender, Choibalsan schools, kindergartens and hospital, and export-licensed processors.",
    facts: [],
    partner: "For buyers: request a quote with the form below.",
  },
];

const mnProd: ProdItem[] = [
  {
    name: "Хонины гулууз",
    body: "Бүхэл болон хагас гулууз. Сэрүүн эсвэл хөлдүү хэлбэрээр.",
    stock: "small",
  },
  {
    name: "Ямааны гулууз",
    body: "Бүхэл гулууз. Сэрүүн эсвэл хөлдүү хэлбэрээр.",
    stock: "small",
  },
  {
    name: "Үхрийн гулууз",
    body: "Хагас болон дөрөвний нэг гулууз. Сэрүүн эсвэл хөлдүү.",
    stock: "large",
  },
  {
    name: "Адууны гулууз",
    body: "Хагас болон дөрөвний нэг гулууз. Сэрүүн эсвэл хөлдүү.",
    stock: "large",
  },
  {
    name: "Тэмээний гулууз",
    body: "Захиалгаар бэлтгэнэ. Сэрүүн эсвэл хөлдүү.",
    stock: "large",
  },
  {
    name: "Адууны мах",
    body: "Экспортын эрхтэй үйлдвэрүүдэд зориулсан, HALAL баталгаатай адууны мах.",
    stock: "large",
    export: true,
  },
];

const enProd: ProdItem[] = [
  {
    name: "Sheep carcass",
    body: "Whole and half carcasses, chilled or frozen.",
    stock: "small",
  },
  {
    name: "Goat carcass",
    body: "Whole carcasses, chilled or frozen.",
    stock: "small",
  },
  {
    name: "Cattle carcass",
    body: "Half and quarter carcasses, chilled or frozen.",
    stock: "large",
  },
  {
    name: "Horse carcass",
    body: "Half and quarter carcasses, chilled or frozen.",
    stock: "large",
  },
  {
    name: "Camel carcass",
    body: "Prepared to order, chilled or frozen.",
    stock: "large",
  },
  {
    name: "Horse meat",
    body: "HALAL-certified horse meat for export-licensed processors.",
    stock: "large",
    export: true,
  },
];

const mnRoadmap: RoadmapItem[] = [
  { year: "2008", text: "Түүхий эд бэлтгэж эхэлсэн." },
  {
    year: "2010",
    text: "Мал, мах, махан бүтээгдэхүүнийг дотоодын зах зээлд тогтвортой нийлүүлж эхэлсэн.",
  },
  {
    year: "2014",
    text: "Траст трейд, Мах импекс болон УБ-ын 10 орчим компанид мах нийлүүлж эхэлсэн.",
  },
  {
    year: "2017",
    text: "Чойбалсангийн сургууль, цэцэрлэг, Зүүн бүсийн оношилгоо эмчилгээний төвд нийлүүлэлт хийж эхэлсэн.",
  },
  {
    year: "2020",
    text: "Хоногт 500 бог, 300 бод төхөөрөх шинэ үйлдвэрээ ашиглалтад оруулсан.",
  },
  {
    year: "2021",
    text: "Улаанбаатар хотын “Нөөцийн мах” бэлтгэх тендерт шалгарсан.",
  },
  {
    year: "2022",
    text: "Дулааны аргаар мах боловсруулах жижиг цех байгуулсан.",
  },
  { year: "2023", text: "HACCP, HALAL стандартуудыг нэвтрүүлсэн." },
  {
    year: "2024",
    text: "Дайвар бүтээгдэхүүн боловсруулах жижиг үйлдвэр ашиглалтад орсон.",
  },
  {
    year: "2025",
    text: "ISO 9001:2016 чанарын менежментийн тогтолцоогоор баталгаажсан.",
  },
  {
    year: "[PLACEHOLDER]",
    text: "[PLACEHOLDER: төлөвлөсөн ажил]",
    planned: true,
  },
  {
    year: "[PLACEHOLDER]",
    text: "[PLACEHOLDER: төлөвлөсөн ажил]",
    planned: true,
  },
  {
    year: "[PLACEHOLDER]",
    text: "[PLACEHOLDER: төлөвлөсөн ажил]",
    planned: true,
  },
];

const enRoadmap: RoadmapItem[] = [
  { year: "2008", text: "Began sourcing raw materials." },
  {
    year: "2010",
    text: "Began steady supply of livestock and meat to the domestic market.",
  },
  {
    year: "2014",
    text: "Began supplying Trust Trade, Makh Impex and around ten Ulaanbaatar companies.",
  },
  {
    year: "2017",
    text: "Began supplying Choibalsan schools, kindergartens and the Eastern Region Diagnostic Center.",
  },
  {
    year: "2020",
    text: "Opened a new factory processing 500 small and 300 large stock per day.",
  },
  { year: "2021", text: "Won the Ulaanbaatar city reserve-meat tender." },
  { year: "2022", text: "Opened a small heat-processing workshop." },
  { year: "2023", text: "Implemented HACCP and HALAL standards." },
  { year: "2024", text: "Opened a by-products processing plant." },
  { year: "2025", text: "Certified to ISO 9001:2016." },
  {
    year: "[PLACEHOLDER]",
    text: "[PLACEHOLDER: planned milestone]",
    planned: true,
  },
  {
    year: "[PLACEHOLDER]",
    text: "[PLACEHOLDER: planned milestone]",
    planned: true,
  },
  {
    year: "[PLACEHOLDER]",
    text: "[PLACEHOLDER: planned milestone]",
    planned: true,
  },
];

const mn = {
  nav: [
    { href: "#model", label: "Бизнес загвар" },
    { href: "#order", label: "Захиалга" },
    { href: "#market", label: "Зах зээл" },
    { href: "#roadmap", label: "Замнал" },
    { href: "#partner", label: "Хамтын ажиллагаа" },
    { href: "#team", label: "Баг" },
    { href: "#faq", label: "Асуулт" },
  ],
  cta: "Хамтарч ажиллах",
  menu: "Цэс",
  langLabel: "Хэл сонгох",
  hero: {
    kicker: "Дорнод аймаг · 2008 оноос",
    l1: "Зүүн талын бэлчээрээс",
    l2: "таны агуулах хүртэл.",
    ctaDeck: "Хөрөнгө оруулагчийн танилцуулга хүсэх",
    sub: "“Вайт грүпп” ХХК нь Дорнод, Сүхбаатар нутгийн бэлчээрийн малыг HACCP, HALAL, ISO 9001 стандартын дагуу төхөөрч, дотоодын зах зээл болон экспортын үйлдвэрүүдэд нийлүүлдэг. Бидэнтэй хамтран өсөх түнш, хөрөнгө оруулагчдыг урьж байна.",
  },
  numbers: {
    title: "Гол үзүүлэлтүүд",
    items: [
      { n: String(new Date().getFullYear() - 2008), l: "жил салбартаа" },
      { n: "500", l: "бог мал хоногт төхөөрөх" },
      { n: "300", l: "бод мал хоногт төхөөрөх" },
      { n: "500 т", l: "хөлдүү махны агуулах" },
      { n: "2312 м²", l: "үйлдвэрийн талбай · 2020" },
      { n: "10+", l: "Улаанбаатарын бөөний худалдан авагч" },
      // { n: "[PLACEHOLDER]", l: "тонн мах, жилд" },
      // { n: "[PLACEHOLDER]", l: "жилийн борлуулалт, ₮" },
    ],
    // note: "Хоногийн тоо — үйлдвэрийн хүчин чадал. Бусад тоо [PLACEHOLDER] оны байдлаар.",
  },
  model: {
    kicker: "Бизнес загвар",
    title: "Бэлчээрээс худалдан авагч хүртэл",
    sub: "2020 онд ашиглалтад орсон 2312 м² үйлдвэрт төхөөрөх, Шулах, сэврээх, хөлдөөх, хадгалах бүх шат нэг дор. Шат бүрийг сонгож үзнэ үү.",
    stockLabel: "Малын төрөл",
    stocks: ["Бог мал", "Бод мал"],
    groups: ["Эх үүсвэр", "Үйлдвэр", "Зах зээл"],
    productsL: "Бүтээгдэхүүн",
    exportTag: "Экспорт",
    specs: "Үйлдвэрийн бүх үзүүлэлт",
    stepWord: "Алхам",
    prev: "Өмнөх",
    next: "Дараах",
    videoTag: "Видео",
    gateTitle: "Төхөөрөлтийн бичлэг",
    gateBody:
      "Энэ бичлэгт төхөөрөх үйл явц бодитоор харагдана. Үзэх эсэхээ та өөрөө сонгоно уу.",
    gateBtn: "Бичлэгийг үзэх",
    pending: "Бичлэг удахгүй нэмэгдэнэ",
    map: {
      note: "Схем — масштабгүй",
      labels: ["Дорнод", "Сүхбаатар", "Улаанбаатар", "Үйлдвэр"],
      legend1: "Мал бэлтгэл",
      legend2: "Нийлүүлэлт",
    },
    stops: mnStops,
  },
  cap: {
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
  prod: { items: mnProd },
  market: {
    title: "Зах зээлийн боломж",
    sub: "Монголын мал аж ахуй, махны экспортын гол үзүүлэлтүүд.",
    stats: [
      {
        n: "[PLACEHOLDER]",
        l: "сая толгой мал, Монгол улс",
        src: "Эх сурвалж: [PLACEHOLDER — ҮСХ, он]",
      },
      {
        n: "[PLACEHOLDER]",
        l: "сая толгой мал, Дорнод ба Сүхбаатар аймаг",
        src: "Эх сурвалж: [PLACEHOLDER]",
      },
      {
        n: "[PLACEHOLDER]",
        l: "мян. тонн мах экспортолсон, жилд",
        src: "Эх сурвалж: [PLACEHOLDER]",
      },
    ],
    whyTitle: "Бидний давуу тал",
    why: [
      {
        title: "Гарал үүсэл тодорхой",
        body: "Малаа Дорнод, Сүхбаатарын малчдаас шууд бэлтгэдэг.",
      },
      {
        title: "Олон улсын стандарт",
        body: "HACCP, HALAL (2023), ISO 9001:2016 (2025) стандартаар баталгаажсан.",
      },
      {
        title: "Нэг дээвэр дор",
        body: "Төхөөрөхөөс хадгалах хүртэл бүх шат 2020 онд ашиглалтад орсон нэг үйлдвэрт.",
      },
    ],
  },
  roadmap: {
    title: "Замнал ба төлөвлөгөө",
    sub: "2008 оноос хийж ирсэн ажил, цаашдын төлөвлөгөө.",
    today: "Өнөөдөр",
    status: { done: "Хэрэгжсэн", planned: "Төлөвлөсөн" },
    items: mnRoadmap,
  },
  partner: {
    title: "Хамтран ажиллах гурван зам",
    sub: "Өөрт тохирохыг сонгоод хүсэлтээ илгээнэ үү.",
    offerL: "Бид санал болгоно",
    needL: "Нөхцөл",
    options: [
      {
        title: "Хөрөнгө оруулагч",
        who: "Монголын махны салбарт урт хугацаанд хөрөнгө оруулах сонирхолтой байгууллага, хувь хүн.",
        offer: [
          "2010 оноос тогтвортой нийлүүлэлт",
          "2020 онд ашиглалтад орсон 2312 м² үйлдвэр",
          "HACCP, HALAL, ISO 9001 баталгаа",
        ],
        need: [
          "Хөрөнгө оруулалтын хэмжээ: [PLACEHOLDER]",
          "Зориулалт: [PLACEHOLDER]",
          "Хэлбэр: [PLACEHOLDER — хувьцаа, зээл, хамтарсан төсөл]",
        ],
        cta: "Танилцуулга хүсэх",
      },
      {
        title: "Худалдан авагч, түгээгч",
        who: "Бөөний худалдаа эрхлэгч, экспортын эрхтэй үйлдвэр, байгууллагын худалдан авагч.",
        offer: [
          "Хонь, ямаа, үхэр, адуу, тэмээний гулууз — сэрүүн, хөлдүү",
          "Экспортын үйлдвэрт зориулсан HALAL адууны мах",
          "500 тонны агуулахаас хуваарьт ачилт",
        ],
        need: [
          "Доод захиалга: [PLACEHOLDER]",
          "Төлбөр, хүргэлтийн нөхцөл: [PLACEHOLDER]",
        ],
        cta: "Үнийн санал авах",
      },
      {
        title: "Мал нийлүүлэгч",
        who: "Дорнод, Сүхбаатар аймгийн малчид, хоршоо.",
        offer: [
          "Малчдаас шууд худалдан авалт",
          "Хүлээн авахдаа мал эмнэлгийн үзлэг, бичиг баримт",
        ],
        need: [
          "Нийлүүлэх улирал, тоо толгой: [PLACEHOLDER]",
          "Төлбөрийн нөхцөл: [PLACEHOLDER]",
        ],
        cta: "Мал нийлүүлэх",
      },
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
  team: {
    title: "Баг, баталгаа, түншүүд",
    peopleTitle: "Удирдлагын баг",
    people: [
      {
        name: "[PLACEHOLDER]",
        role: "[PLACEHOLDER]",
        bio: "[PLACEHOLDER: нэг өгүүлбэр]",
      },
      {
        name: "[PLACEHOLDER]",
        role: "[PLACEHOLDER]",
        bio: "[PLACEHOLDER: нэг өгүүлбэр]",
      },
      {
        name: "[PLACEHOLDER]",
        role: "[PLACEHOLDER]",
        bio: "[PLACEHOLDER: нэг өгүүлбэр]",
      },
    ],
    certsTitle: "Баталгаажуулалт",
    pdf: "PDF",
  },
  std: {
    items: [
      {
        name: "HACCP",
        year: "2023",
        issuer: "Олгосон: [PLACEHOLDER]",
        body: "Хүнсний аюулгүй байдлын эрсдэлийн дүн шинжилгээ, эгзэгтэй цэгийн хяналтын тогтолцоо.",
      },
      {
        name: "HALAL",
        year: "2023",
        issuer: "Олгосон: [PLACEHOLDER]",
        body: "Шашин, ёс заншлын дагуу боловсруулсан халал баталгаатай бүтээгдэхүүн.",
      },
      {
        name: "ISO 9001",
        year: "2025",
        issuer: "Олгосон: [PLACEHOLDER]",
        body: "MNS ISO 9001:2016 чанарын менежментийн тогтолцоо нэвтрүүлж баталгаажсан.",
      },
    ] as StdItem[],
  },
  partners: {
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
  faq: {
    title: "Түгээмэл асуулт",
    more: "Хариултаа олсонгүй юу?",
    moreLink: "Бидэнтэй холбогдоорой",
    items: [
      {
        q: "Үйлдвэр хаана байрладаг вэ?",
        a: "Дорнод аймагт, Чойбалсан хотоос зүүн тийш 12 км-т. 2312 м² талбай бүхий үйлдвэр 2020 онд ашиглалтад орсон.",
      },
      {
        q: "Хэр хэмжээний мах нийлүүлэх боломжтой вэ?",
        a: "Үйлдвэр хоногт 500 бог, 300 бод мал төхөөрөх хүчин чадалтай, 500 тонны агуулахтай. Шинэ худалдан авагчид сард нийлүүлэх боломжит хэмжээ: [PLACEHOLDER].",
      },
      {
        q: "Бүтээгдэхүүн тань HALAL, экспортод тохирох уу?",
        a: "HACCP, HALAL (2023), ISO 9001:2016 (2025) стандартаар баталгаажсан. Экспортын эрхтэй үйлдвэрүүдэд HALAL адууны мах нийлүүлдэг. Шууд экспортын эрх: [PLACEHOLDER].",
      },
      {
        q: "Ямар бүтээгдэхүүн нийлүүлдэг вэ?",
        a: "Хонины бүхэл, хагас гулууз, ямааны бүхэл гулууз, үхэр, адууны хагас болон дөрөвний нэг гулууз, тэмээний гулууз (захиалгаар). Бүгд сэрүүн эсвэл хөлдүү.",
      },
      {
        q: "Хөрөнгө оруулагчийн танилцуулгыг хэрхэн авах вэ?",
        a: "Доорх маягтад “Хөрөнгө оруулагч” гэж сонгоод хүсэлтээ илгээнэ үү. Ажлын нэг өдрийн дотор хариу өгнө. [PLACEHOLDER: нууцын гэрээ шаардлагатай эсэх]",
      },
      {
        q: "Би малчин. Танайд мал хэрхэн нийлүүлэх вэ?",
        a: "Бид Дорнод, Сүхбаатар аймгийн малчдаас малыг шууд худалдан авдаг. Хүлээн авахдаа мал эмнэлгийн үзлэг хийж, бичиг баримт бүрдүүлнэ. Маягтад “Мал нийлүүлэгч” гэж сонгох эсвэл {phone} дугаарт залгана уу.",
      },
      { q: "Үйлдвэртэй биечлэн танилцаж болох уу?", a: "[PLACEHOLDER]" },
      {
        q: "Доод захиалга, төлбөр, хүргэлтийн нөхцөл ямар вэ?",
        a: "[PLACEHOLDER]",
      },
    ],
  },
  order: {
    title: "Өвлийн идэшээ захиалаарай",
    strip: "Өвлийн идэшний захиалга нээлттэй — багц, үнийг үзэх",
    facts: [
      ["Гарал үүсэл", "Дорнод, Сүхбаатарын малчдаас шууд"],
      ["Боловсруулалт", "Өөрийн үйлдвэрт · HALAL, HACCP, ISO 9001"],
      ["Хүргэлт", "[PLACEHOLDER: бүс, хугацаа, үнэ]"],
      ["Төлбөр", "QPay, банкны аппаараа"],
    ],
    totalKg: "Нийт {kg} кг",
    select: "Сонгох",
    selected: "Сонгосон",
    moreItems: "Бусад {n} зүйл",
    details: "Дэлгэрэнгүй",
    close: "Хаах",
    photo: "Зураг {n}",
    barCount: "Багц: {n}",
    barCta: "Захиалах",
    phoneAlt: "Утсаар захиалах: {phone}",
    // TODO(owner 23): proposed, not approved: "Таны нэр, утас, хаягийг зөвхөн энэ захиалгыг хүргэхэд ашиглана."
    privacy: "",
    qa: [
      {
        q: "Хүргэлт хэзээ, хаана хийгдэх вэ?",
        a: "[PLACEHOLDER: хүргэлтийн бүс, хугацаа, төлбөр]. Төлбөр орсны дараа хүргэлтийн цагаа тохирохоор бид тантай утсаар холбогдоно.",
      },
      {
        q: "Захиалгаа цуцалж, төлбөрөө буцааж авч болох уу?",
        a: "[PLACEHOLDER]",
      },
    ],
    sub: "Малчдаас шууд бэлтгэж, стандартын дагуу төхөөрсөн махыг багцаар нь гэрт тань хүргэнэ. Төлбөрөө QPay-ээр төлнө.",
    less: "Хасах",
    more: "Нэмэх",
    kg: "кг",
    summary: "Таны захиалга",
    pickFirst: "Дээрээс багцаа сонгоно уу.",
    total: "Нийт",
    fName: "Нэр",
    fPhone: "Утас",
    fAddress: "Хүргэлтийн хаяг",
    addressHint: "Дүүрэг, хороо, байр, орц, тоот",
    fNote: "Нэмэлт тайлбар",
    optional: "заавал биш",
    errName: "Нэрээ оруулна уу.",
    errPhone: "8 оронтой утасны дугаар оруулна уу.",
    errAddress: "Хүргэлтийн хаягаа дэлгэрэнгүй оруулна уу.",
    submit: "QPay-ээр төлөх",
    submitting: "Нэхэмжлэх үүсгэж байна…",
    payTitle: "QPay-ээр төлнө үү",
    payBody:
      "Банкны аппаараа QR кодыг уншуулна уу. Утаснаасаа үзэж байгаа бол доороос банкаа сонгоно уу.",
    orderNo: "Захиалгын дугаар",
    waiting: "Төлбөр хүлээж байна…",
    check: "Төлбөр шалгах",
    notYet: "Төлбөр хараахан ороогүй байна.",
    paidTitle: "Төлбөр амжилттай",
    paidBody:
      "{code} дугаартай захиалга баталгаажлаа. Хүргэлтийн цагаа тохирохоор бид {phone} дугаарт тань холбогдоно.",
    again: "Шинэ захиалга",
    back: "Буцах",
  },
  contact: {
    title: "Хамтран ажиллахад бэлэн",
    sub: "Хамтын ажиллагаа, хөрөнгө оруулалт, нийлүүлэлтийн талаар бидэнтэй холбогдоорой. Ажлын нэг өдрийн дотор хариу өгнө.",
    phoneL: "Утас",
    emailL: "И-мэйл",
    addrL: "Хаяг",
    addr: "Дорнод аймаг, Чойбалсан хотоос зүүн 12 км",
    formTitle: "Хүсэлт илгээх",
    fType: "Та хэн бэ?",
    types: [
      "Хөрөнгө оруулагч",
      "Худалдан авагч, түгээгч",
      "Мал нийлүүлэгч",
      "Бусад",
    ],
    fName: "Нэр",
    fCompany: "Байгууллага",
    optional: "заавал биш",
    requiredSr: "заавал бөглөнө",
    fContact: "Утас эсвэл и-мэйл",
    fBudget: "Төсөв / захиалгын хэмжээ",
    budgets: [
      "Сонгоогүй",
      "[PLACEHOLDER]",
      "[PLACEHOLDER]",
      "[PLACEHOLDER]",
      "Хэлэхийг хүсэхгүй",
    ],
    fMsg: "Захиалга / зурвас",
    msgHint: "Жишээ нь: сонирхож буй бүтээгдэхүүн, хэмжээ, хугацаа",
    send: "Илгээх",
    sendNote: "“Илгээх” дарахад таны и-мэйл программ бэлэн зурвастай нээгдэнэ.",
    errType: "Та хэн болохоо сонгоно уу.",
    errName: "Нэрээ оруулна уу.",
    errContact: "Зөв и-мэйл хаяг эсвэл утасны дугаар оруулна уу.",
    openedTitle: "И-мэйл программ нээгдлээ",
    openedBody:
      "Зурвасаа тэндээс илгээнэ үү. Программ нээгдээгүй бол {email} хаягаар шууд бичих эсвэл {phone} дугаарт залгана уу.",
    back: "Маягт руу буцах",
    mailSubject: "Хамтын ажиллагааны хүсэлт — {type}",
  },
  footer: {
    blurb:
      "2008 оноос хойш мал, мах, малын гаралтай бүтээгдэхүүнийг дотоодын зах зээл болон экспортын үйлдвэрүүдэд нийлүүлж буй найдвартай түнш.",
    copy: "© 2026 “Вайт грүпп” ХХК. Бүх эрх хуулиар хамгаалагдсан.",
    regNo: "Улсын бүртгэлийн дугаар: [PLACEHOLDER]",
    places: "Дорнод · Сүхбаатар · Улаанбаатар",
  },
};

export type Copy = typeof mn;

const en: Copy = {
  nav: [
    { href: "#model", label: "Business model" },
    { href: "#order", label: "Order" },
    { href: "#market", label: "Market" },
    { href: "#roadmap", label: "Roadmap" },
    { href: "#partner", label: "Partnership" },
    { href: "#team", label: "Team" },
    { href: "#faq", label: "FAQ" },
  ],
  cta: "Become a partner",
  menu: "Menu",
  langLabel: "Language",
  hero: {
    kicker: "Dornod, Mongolia · Since 2008",
    ctaDeck: "Request the investor deck",
    l1: "From the eastern steppe",
    l2: "to your cold store.",
    sub: "White Group LLC slaughters and processes pasture-raised livestock from Dornod and Sükhbaatar to HACCP, HALAL and ISO 9001 standards, supplying domestic buyers and export-licensed processors. We welcome partners and investors to grow with us.",
  },
  numbers: {
    title: "Key figures",
    items: [
      { n: String(new Date().getFullYear() - 2008), l: "years in the trade" },
      { n: "500", l: "sheep & goats slaughtered per day" },
      { n: "300", l: "cattle & horses slaughtered per day" },
      { n: "500 t", l: "cold storage" },
      { n: "2,312 m²", l: "plant · opened 2020" },
      { n: "10+", l: "wholesale buyers in Ulaanbaatar" },
      { n: "[PLACEHOLDER]", l: "tonnes of meat per year" },
      { n: "[PLACEHOLDER]", l: "annual revenue, MNT" },
    ],
    // note: "Per-day figures are plant capacity. Other figures as of [PLACEHOLDER].",
  },
  model: {
    kicker: "Business model",
    title: "From pasture to buyer",
    sub: "Slaughter, cutting, chilling, freezing and storage all happen in one 2,312 m² plant opened in 2020. Select a stage to see how it works.",
    stockLabel: "Livestock",
    stocks: ["Small stock", "Large stock"],
    groups: ["Source", "Plant", "Market"],
    productsL: "Products",
    exportTag: "Export",
    specs: "Full plant specifications",
    stepWord: "Step",
    prev: "Previous",
    next: "Next",
    videoTag: "Video",
    gateTitle: "Slaughter footage",
    gateBody:
      "This video shows the slaughter process as it is. Choose whether to watch.",
    gateBtn: "Play video",
    pending: "Video coming soon",
    map: {
      note: "Schematic — not to scale",
      labels: ["Dornod", "Sükhbaatar", "Ulaanbaatar", "Factory"],
      legend1: "Livestock sourcing",
      legend2: "Supply",
    },
    stops: enStops,
  },
  cap: {
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
  prod: { items: enProd },
  market: {
    title: "The market opportunity",
    sub: "Key figures for Mongolian livestock and meat exports.",
    stats: [
      {
        n: "[PLACEHOLDER]",
        l: "million head of livestock in Mongolia",
        src: "Source: [PLACEHOLDER — NSO, year]",
      },
      {
        n: "[PLACEHOLDER]",
        l: "million head in Dornod and Sükhbaatar",
        src: "Source: [PLACEHOLDER]",
      },
      {
        n: "[PLACEHOLDER]",
        l: "thousand tonnes of meat exported per year",
        src: "Source: [PLACEHOLDER]",
      },
    ],
    whyTitle: "Where we stand",
    why: [
      {
        title: "Known origin",
        body: "Livestock bought directly from Dornod and Sükhbaatar herders.",
      },
      {
        title: "International standards",
        body: "Certified HACCP and HALAL (2023) and ISO 9001:2016 (2025).",
      },
      {
        title: "Under one roof",
        body: "Every stage from slaughter to storage in one plant, opened in 2020.",
      },
    ],
  },
  roadmap: {
    title: "Track record and roadmap",
    sub: "What we have done since 2008, and what comes next.",
    today: "Today",
    status: { done: "Done", planned: "Planned" },
    items: enRoadmap,
  },
  partner: {
    title: "Three ways to work with us",
    sub: "Pick the one that fits you and send us a request.",
    offerL: "What we offer",
    needL: "Terms",
    options: [
      {
        title: "Investors",
        who: "Organisations and individuals looking for a long-term stake in Mongolian meat processing.",
        offer: [
          "Steady supply since 2010",
          "A 2,312 m² plant opened in 2020",
          "HACCP, HALAL and ISO 9001 certified",
        ],
        need: [
          "Ticket size: [PLACEHOLDER]",
          "Use of funds: [PLACEHOLDER]",
          "Structure: [PLACEHOLDER — equity, debt, joint venture]",
        ],
        cta: "Request the deck",
      },
      {
        title: "Buyers & distributors",
        who: "Wholesalers, export-licensed processors and institutional buyers.",
        offer: [
          "Sheep, goat, cattle, horse and camel carcasses, chilled or frozen",
          "HALAL horse meat for export processors",
          "Scheduled dispatch from a 500 t cold store",
        ],
        need: [
          "Minimum order: [PLACEHOLDER]",
          "Payment and delivery: [PLACEHOLDER]",
        ],
        cta: "Request a quote",
      },
      {
        title: "Livestock suppliers",
        who: "Herders and cooperatives in Dornod and Sükhbaatar.",
        offer: [
          "Direct purchase from herders",
          "Veterinary check and paperwork on intake",
        ],
        need: [
          "Season and head count: [PLACEHOLDER]",
          "Payment terms: [PLACEHOLDER]",
        ],
        cta: "Offer livestock",
      },
    ],
  },
  founder: {
    kicker: "From the founder",
    quote: "“[Founder’s quote goes here — to be supplied.]”",
    name: "[Full name]",
    role: "Founder & CEO",
    body: "[A short founder story: how the company started, the relationship with Dornod herders, and where it is heading.]",
  },
  team: {
    title: "Team, certifications and partners",
    peopleTitle: "Leadership team",
    people: [
      {
        name: "[PLACEHOLDER]",
        role: "[PLACEHOLDER]",
        bio: "[PLACEHOLDER: one sentence]",
      },
      {
        name: "[PLACEHOLDER]",
        role: "[PLACEHOLDER]",
        bio: "[PLACEHOLDER: one sentence]",
      },
      {
        name: "[PLACEHOLDER]",
        role: "[PLACEHOLDER]",
        bio: "[PLACEHOLDER: one sentence]",
      },
    ],
    certsTitle: "Certifications",
    pdf: "PDF",
  },
  std: {
    items: [
      {
        name: "HACCP",
        year: "2023",
        issuer: "Issued by: [PLACEHOLDER]",
        body: "Hazard analysis and critical control point system for food safety.",
      },
      {
        name: "HALAL",
        year: "2023",
        issuer: "Issued by: [PLACEHOLDER]",
        body: "Products processed in accordance with halal requirements.",
      },
      {
        name: "ISO 9001",
        year: "2025",
        issuer: "Issued by: [PLACEHOLDER]",
        body: "Certified to MNS ISO 9001:2016 quality management.",
      },
    ] as StdItem[],
  },
  partners: {
    title: "Partners who trust us",
    items: [
      { name: "Trust Trade", note: "Since 2014" },
      { name: "Makh Impex", note: "Since 2014" },
      { name: "10+ Ulaanbaatar companies", note: "Regular supply" },
      { name: "Schools & kindergartens", note: "Choibalsan" },
      {
        name: "Eastern Region Diagnostic & Treatment Center",
        note: "Since 2017",
      },
      { name: "Export-licensed processors", note: "Horse meat" },
    ],
    jobs: [
      { n: "30", l: "permanent jobs" },
      { n: "20–30", l: "seasonal jobs" },
    ],
    csr: "We create local jobs and invest in the development of Dornod.",
  },
  faq: {
    title: "Frequently asked questions",
    more: "Can't find your answer?",
    moreLink: "Contact us",
    items: [
      {
        q: "Where is the plant?",
        a: "In Dornod Province, 12 km east of Choibalsan. The 2,312 m² plant opened in 2020.",
      },
      {
        q: "How much can you supply?",
        a: "The plant can slaughter 500 small and 300 large stock a day and holds 500 t in cold storage. Monthly volume available to a new buyer: [PLACEHOLDER].",
      },
      {
        q: "Is your meat HALAL and export-ready?",
        a: "We are certified HACCP and HALAL (2023) and ISO 9001:2016 (2025), and we supply HALAL horse meat to export-licensed processors. Direct export licence: [PLACEHOLDER].",
      },
      {
        q: "What products do you supply?",
        a: "Whole and half sheep carcasses, whole goat carcasses, half and quarter cattle and horse carcasses, and camel to order — all chilled or frozen.",
      },
      {
        q: "How do I get the investor deck?",
        a: "Choose “Investor” in the form below and send your request. We reply within one business day. [PLACEHOLDER: whether an NDA is required]",
      },
      {
        q: "I'm a herder. How can I sell livestock to you?",
        a: "We buy directly from herders in Dornod and Sükhbaatar. Animals get a veterinary check and paperwork on intake. Choose “Livestock supplier” in the form or call {phone}.",
      },
      { q: "Can I visit the plant?", a: "[PLACEHOLDER]" },
      {
        q: "What are your minimum order, payment and delivery terms?",
        a: "[PLACEHOLDER]",
      },
    ],
  },
  order: {
    title: "Order your winter meat",
    strip: "Winter meat orders are open — see packages and prices",
    facts: [
      ["Origin", "Straight from herders in Dornod and Sükhbaatar"],
      ["Processing", "In our own plant · HALAL, HACCP, ISO 9001"],
      ["Delivery", "[PLACEHOLDER: area, timing, fee]"],
      ["Payment", "QPay, from your bank app"],
    ],
    totalKg: "{kg} kg in total",
    select: "Select",
    selected: "Selected",
    moreItems: "{n} more items",
    details: "Details",
    close: "Close",
    photo: "Photo {n}",
    barCount: "Packages: {n}",
    barCta: "Checkout",
    phoneAlt: "Order by phone: {phone}",
    // TODO(owner 23): proposed, not approved: "We use your name, phone and address only to deliver this order."
    privacy: "",
    qa: [
      {
        q: "When and where do you deliver?",
        a: "[PLACEHOLDER: delivery area, timing and fee]. Once payment arrives we call you to arrange the delivery time.",
      },
      { q: "Can I cancel and get a refund?", a: "[PLACEHOLDER]" },
    ],
    sub: "Meat sourced straight from herders and processed to standard, delivered to your door in ready packages. Pay with QPay.",
    less: "Less",
    more: "More",
    kg: "kg",
    summary: "Your order",
    pickFirst: "Pick a package above.",
    total: "Total",
    fName: "Name",
    fPhone: "Phone",
    fAddress: "Delivery address",
    addressHint: "District, khoroo, building, entrance, apartment",
    fNote: "Note",
    optional: "optional",
    errName: "Please enter your name.",
    errPhone: "Enter an 8-digit phone number.",
    errAddress: "Please enter a full delivery address.",
    submit: "Pay with QPay",
    submitting: "Creating invoice…",
    payTitle: "Pay with QPay",
    payBody:
      "Scan the QR code with your bank app. On a phone, pick your bank below.",
    orderNo: "Order number",
    waiting: "Waiting for payment…",
    check: "Check payment",
    notYet: "Payment hasn't arrived yet.",
    paidTitle: "Payment received",
    paidBody:
      "Order {code} is confirmed. We'll call {phone} to arrange the delivery time.",
    again: "New order",
    back: "Back",
  },
  contact: {
    title: "Ready to work together",
    sub: "Get in touch about partnership, investment or supply. We reply within one business day.",
    phoneL: "Phone",
    emailL: "Email",
    addrL: "Address",
    addr: "Dornod Province, 12 km east of Choibalsan, Mongolia",
    formTitle: "Send a request",
    fType: "You are",
    types: ["Investor", "Buyer or distributor", "Livestock supplier", "Other"],
    fName: "Name",
    fCompany: "Company",
    optional: "optional",
    requiredSr: "required",
    fContact: "Phone or email",
    fBudget: "Budget or order size",
    budgets: [
      "Not selected",
      "[PLACEHOLDER]",
      "[PLACEHOLDER]",
      "[PLACEHOLDER]",
      "Prefer not to say",
    ],
    fMsg: "Order / message",
    msgHint: "For example: products, volumes and timing you have in mind",
    send: "Send",
    sendNote: "“Send” opens your email app with the message ready to go.",
    errType: "Please choose who you are.",
    errName: "Please enter your name.",
    errContact: "Enter a valid email address or phone number.",
    openedTitle: "Your email app should now be open",
    openedBody:
      "Send the message from there. If nothing opened, write to {email} or call {phone}.",
    back: "Back to the form",
    mailSubject: "Partnership inquiry — {type}",
  },
  footer: {
    blurb:
      "A reliable partner supplying livestock, meat and animal products to domestic and export markets since 2008.",
    copy: "© 2026 White Group LLC. All rights reserved.",
    regNo: "Company registration no.: [PLACEHOLDER]",
    places: "Dornod · Sükhbaatar · Ulaanbaatar",
  },
};

export const COPY: Record<Lang, Copy> = { mn, en };
