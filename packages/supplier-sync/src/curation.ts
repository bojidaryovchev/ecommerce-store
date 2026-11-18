/**
 * Our category tree, and which supplier categories feed each of our categories.
 *
 * The supplier's 57 categories are organised around its brands and stock; ours follow what
 * Bulgarians search for (see the SEO plan): ten top-level categories, at most one level below,
 * with keyword-bearing slugs. URLs are /{root}/{sub}, e.g. /peletni-kamini/s-vodna-riza.
 *
 * Several supplier categories may feed one of ours. A supplier category missing from this list
 * gets its own mirrored category on first sight (the default sync behaviour) and shows up in the
 * admin for mapping.
 */
export type CuratedCategory = {
  slug: string;
  name: string;
  /** Slug of the parent curated category. */
  parent?: string;
  /** Supplier category ids (WooCommerce term ids) whose products belong here. */
  supplierCategoryIds?: number[];
  /** The category's picture, served from apps/web/public (see docs/image-credits.md). Set while the
      category has none, or still has a curated one: a picture an admin uploaded is never replaced. */
  image?: string;
  /** A short introduction in our own words, shown on the category page. Set only while it has none. */
  description?: string;
};

export const HYDROTERM_CATEGORY_TREE: readonly CuratedCategory[] = [
  {
    slug: "termopompi",
    name: "Термопомпи",
    supplierCategoryIds: [203],
    image: "/images/categories/termopompi.webp",
    description:
      "Термопомпите въздух-вода вземат топлината от външния въздух и с нея отопляват дома през радиатори или подово отопление, охлаждат го през лятото и затоплят битовата вода. Изберете моноблок или сплит система, а ние ще помогнем с оразмеряването и монтажа.",
  },
  { slug: "monoblok", name: "Термопомпи моноблок", parent: "termopompi", supplierCategoryIds: [500] },
  { slug: "split", name: "Термопомпи сплит", parent: "termopompi", supplierCategoryIds: [501] },

  {
    slug: "klimatitsi",
    name: "Климатици",
    supplierCategoryIds: [205],
    image: "/images/categories/klimatitsi.webp",
    description:
      "Инверторни климатици за отопление и охлаждане на всяка стая. Ще ви помогнем да изберете мощност според площта и изолацията, а монтажът включва оглед, тръбен път и пускане в експлоатация.",
  },

  {
    slug: "peletni-kamini",
    name: "Пелетни камини",
    supplierCategoryIds: [161, 201],
    image: "/images/categories/peletni-kamini.webp",
    description:
      "Пелетни камини с автоматично подаване на горивото. Сухите модели отопляват помещението, в което стоят, а камините с водна риза затоплят радиаторите в целия дом.",
  },
  {
    slug: "s-vodna-riza",
    name: "Пелетни камини с водна риза",
    parent: "peletni-kamini",
    supplierCategoryIds: [252, 175],
  },
  { slug: "suhi", name: "Сухи пелетни камини", parent: "peletni-kamini", supplierCategoryIds: [253, 452] },
  {
    slug: "za-vgrazhdane",
    name: "Пелетни камини за вграждане",
    parent: "peletni-kamini",
    supplierCategoryIds: [251, 470],
  },
  {
    slug: "s-vazduhovod",
    name: "Пелетни камини с въздуховод",
    parent: "peletni-kamini",
    supplierCategoryIds: [184, 183],
  },
  {
    slug: "aksesoari-za-kamini",
    name: "Аксесоари за камини",
    parent: "peletni-kamini",
    supplierCategoryIds: [195, 479],
  },

  {
    slug: "kotli",
    name: "Котли",
    supplierCategoryIds: [160],
    image: "/images/categories/kotli.webp",
    description:
      "Котли на пелети, твърдо гориво, газ и нафта за централно отопление на къщи и вили, с възможност за бойлер за топла вода и буферен съд.",
  },
  {
    slug: "peletni-kotli",
    name: "Пелетни котли",
    parent: "kotli",
    supplierCategoryIds: [165, 465, 466, 192, 170, 169, 171, 190, 187, 172],
  },
  { slug: "na-tvardo-gorivo", name: "Котли на твърдо гориво", parent: "kotli", supplierCategoryIds: [166, 173, 176] },
  { slug: "na-gaz-i-nafta", name: "Котли на газ и нафта", parent: "kotli", supplierCategoryIds: [191, 167] },

  {
    slug: "radiatori-i-konvektori",
    name: "Радиатори и конвектори",
    supplierCategoryIds: [162],
    image: "/images/categories/radiatori-i-konvektori.webp",
    description:
      "Панелни и алуминиеви радиатори и вентилаторни конвектори за всяка отоплителна система, от котел до термопомпа. Размерът се избира според топлинната мощност, от която стаята има нужда.",
  },
  {
    slug: "panelni-radiatori",
    name: "Панелни радиатори",
    parent: "radiatori-i-konvektori",
    supplierCategoryIds: [212],
  },
  {
    slug: "aluminievi-radiatori",
    name: "Алуминиеви радиатори",
    parent: "radiatori-i-konvektori",
    supplierCategoryIds: [181],
  },
  {
    slug: "ventilatorni-konvektori",
    name: "Вентилаторни конвектори",
    parent: "radiatori-i-konvektori",
    supplierCategoryIds: [182, 193],
  },

  {
    slug: "liri-za-banya",
    name: "Лири за баня",
    supplierCategoryIds: [202],
    image: "/images/categories/liri-za-banya.webp",
    description:
      "Лири за баня: алуминиеви, стоманени, дизайнерски и електрически, заедно с нагреватели, кранове и аксесоари. Затоплят банята и подсушават кърпите.",
  },
  { slug: "aluminievi-liri", name: "Алуминиеви лири за баня", parent: "liri-za-banya", supplierCategoryIds: [222] },
  { slug: "dizaynerski-liri", name: "Дизайнерски лири за баня", parent: "liri-za-banya", supplierCategoryIds: [450] },
  {
    slug: "elektricheski-liri",
    name: "Електрически лири за баня",
    parent: "liri-za-banya",
    supplierCategoryIds: [237],
  },
  { slug: "stomaneni-liri", name: "Стоманени лири за баня", parent: "liri-za-banya", supplierCategoryIds: [248] },
  {
    slug: "aksesoari-za-liri",
    name: "Нагреватели, кранове и аксесоари",
    parent: "liri-za-banya",
    supplierCategoryIds: [243],
  },

  {
    slug: "podovo-otoplenie",
    name: "Подово отопление",
    supplierCategoryIds: [189, 199, 197, 198, 200],
    image: "/images/categories/podovo-otoplenie.webp",
    description:
      "Тръби, колектори и всичко нужно за подово отопление: равномерна топлина без радиатори, особено подходяща в комбинация с термопомпа.",
  },
  {
    slug: "solarni-sistemi",
    name: "Соларни системи",
    supplierCategoryIds: [163],
    image: "/images/categories/solarni-sistemi.webp",
    description:
      "Слънчеви системи за топла вода, които поемат голяма част от затоплянето ѝ през по-голямата част от годината.",
  },

  {
    slug: "pompi-i-trabi",
    name: "Помпи и тръби",
    image: "/images/categories/pompi-i-trabi.webp",
    description: "Циркулационни помпи, тръби и фитинги за изграждане и поддръжка на отоплителни инсталации.",
  },
  { slug: "tsirkulatsionni-pompi", name: "Циркулационни помпи", parent: "pompi-i-trabi", supplierCategoryIds: [164] },
  { slug: "trabi-i-fitingi", name: "Тръби и фитинги", parent: "pompi-i-trabi", supplierCategoryIds: [206] },

  {
    slug: "industrialno-otoplenie",
    name: "Индустриално отопление",
    supplierCategoryIds: [177, 178, 180, 185],
    image: "/images/categories/industrialno-otoplenie.webp",
    description: "Отопление на цехове, складове и големи помещения по индивидуален проект и запитване.",
  },
];

/** Curated tree per supplier slug (see SUPPLIERS). */
export const CATEGORY_TREES: Record<string, readonly CuratedCategory[]> = {
  hydroterm: HYDROTERM_CATEGORY_TREE,
};
