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
};

export const HYDROTERM_CATEGORY_TREE: readonly CuratedCategory[] = [
  { slug: "termopompi", name: "Термопомпи", supplierCategoryIds: [203] },
  { slug: "monoblok", name: "Термопомпи моноблок", parent: "termopompi", supplierCategoryIds: [500] },
  { slug: "split", name: "Термопомпи сплит", parent: "termopompi", supplierCategoryIds: [501] },

  { slug: "klimatitsi", name: "Климатици", supplierCategoryIds: [205] },

  { slug: "peletni-kamini", name: "Пелетни камини", supplierCategoryIds: [161, 201] },
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

  { slug: "kotli", name: "Котли", supplierCategoryIds: [160] },
  {
    slug: "peletni-kotli",
    name: "Пелетни котли",
    parent: "kotli",
    supplierCategoryIds: [165, 465, 466, 192, 170, 169, 171, 190, 187, 172],
  },
  { slug: "na-tvardo-gorivo", name: "Котли на твърдо гориво", parent: "kotli", supplierCategoryIds: [166, 173, 176] },
  { slug: "na-gaz-i-nafta", name: "Котли на газ и нафта", parent: "kotli", supplierCategoryIds: [191, 167] },

  { slug: "radiatori-i-konvektori", name: "Радиатори и конвектори", supplierCategoryIds: [162] },
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

  { slug: "liri-za-banya", name: "Лири за баня", supplierCategoryIds: [202] },
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

  { slug: "podovo-otoplenie", name: "Подово отопление", supplierCategoryIds: [189, 199, 197, 198, 200] },
  { slug: "solarni-sistemi", name: "Соларни системи", supplierCategoryIds: [163] },

  { slug: "pompi-i-trabi", name: "Помпи и тръби" },
  { slug: "tsirkulatsionni-pompi", name: "Циркулационни помпи", parent: "pompi-i-trabi", supplierCategoryIds: [164] },
  { slug: "trabi-i-fitingi", name: "Тръби и фитинги", parent: "pompi-i-trabi", supplierCategoryIds: [206] },

  { slug: "industrialno-otoplenie", name: "Индустриално отопление", supplierCategoryIds: [177, 178, 180, 185] },
];

/** Curated tree per supplier slug (see SUPPLIERS). */
export const CATEGORY_TREES: Record<string, readonly CuratedCategory[]> = {
  hydroterm: HYDROTERM_CATEGORY_TREE,
};
