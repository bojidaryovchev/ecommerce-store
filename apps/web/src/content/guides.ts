import type { InstallationSystemSlug } from "@/lib/installation-systems";

/**
 * Buying guides (/saveti/{slug}): our own writing, in Bulgarian first. Long-form content lives here
 * rather than in messages/*.json, which hold interface text.
 *
 * Figures are rules of thumb and are said to be: the exact sizing is done at the site visit.
 */
export type GuideSection = {
  heading: string;
  paragraphs: string[];
  /** A short list after the paragraphs. */
  list?: string[];
};

export type GuideText = {
  title: string;
  /** One or two sentences: the card, the meta description, the lead. */
  excerpt: string;
  sections: GuideSection[];
};

export type Guide = {
  slug: string;
  image: string;
  readingMinutes: number;
  /** Category the guide leads into (its products). */
  categorySlug?: string;
  installation?: InstallationSystemSlug;
  /** A calculator that answers the guide's question. */
  calculator?: string;
  /** ISO dates: when it was first published and last changed in substance (shown, and in the Article markup). */
  published: string;
  updated: string;
  bg: GuideText;
  en: GuideText;
};

export const GUIDES: Guide[] = [
  {
    slug: "kakva-termopompa-mi-tryabva",
    image: "/images/categories/termopompi.webp",
    readingMinutes: 6,
    published: "2026-11-18",
    updated: "2026-11-18",
    categorySlug: "termopompi",
    installation: "termopompa",
    calculator: "termopompa",
    bg: {
      title: "Каква термопомпа въздух-вода ми трябва?",
      excerpt:
        "Моноблок или сплит, каква мощност, с радиатори или подово отопление: какво да прецените, преди да изберете термопомпа за дома.",
      sections: [
        {
          heading: "Как работи термопомпата въздух-вода",
          paragraphs: [
            "Термопомпата взема топлина от външния въздух, дори когато навън е студено, и я предава на водата в отоплителната система. С тази вода се затоплят радиаторите или подовото отопление, а през лятото повечето модели могат и да охлаждат.",
            "За всеки киловатчас ток тя дава между 3 и 5 киловатчаса топлина, според външната температура и температурата на водата. Колкото по-ниска е температурата, до която трябва да загрее водата, толкова по-икономично работи.",
          ],
        },
        {
          heading: "Моноблок или сплит",
          paragraphs: [
            "При моноблока целият хладилен кръг е във външното тяло, а към къщата вървят само тръби с вода. Монтажът е по-прост, но тръбите навън трябва да са добре изолирани и защитени от замръзване.",
            "При сплит системата външното тяло е свързано с вътрешен хидравличен модул чрез тръби с хладилен агент. Тя е удобна, когато разстоянието до къщата е по-голямо или мястото навън е малко. Работата по хладилния кръг се извършва само от техници със сертификат за флуорирани газове.",
          ],
        },
        {
          heading: "Каква мощност ми трябва",
          paragraphs: [
            "Мощността зависи от топлинните загуби на сградата. За ориентир на квадратен метър отопляема площ:",
            "Пример: къща от 120 m² с добра изолация при 50 W/m² има нужда от около 6 kW, затова се избира уред от 7 до 8 kW. Ако термопомпата ще затопля и битовата вода, се добавя резерв. Точната мощност определяме при огледа, с изчисление на топлинните загуби.",
          ],
          list: [
            "нова къща с много добра изолация: 30–40 W/m²",
            "изолирана по-стара къща: 50–70 W/m²",
            "къща без изолация: 80–120 W/m²",
          ],
        },
        {
          heading: "С радиатори или с подово отопление",
          paragraphs: [
            "Подовото отопление работи с вода от 30 до 40 °C и е идеалният партньор на термопомпата. Радиаторите обикновено искат 45–55 °C, което намалява ефективността. Със съществуващи радиатори системата работи, но често се налага някои от тях да се сменят с по-големи, особено в стаите с много прозорци.",
          ],
        },
        {
          heading: "Топла вода и буферен съд",
          paragraphs: [
            "За семейство от четирима души обикновено е достатъчен бойлер от 200 до 300 литра със серпентина за термопомпа. Буферен съд се добавя, когато системата има малко вода или няколко отделни зони, за да работи уредът по-равномерно и с по-малко включвания.",
          ],
        },
        {
          heading: "Къде се поставя външното тяло",
          paragraphs: [
            "Външното тяло има нужда от свободно пространство отпред и отстрани, за да засмуква и издухва въздух. Поставя се на стойка над нивото на снега, с отвеждане на конденза, и по-далеч от прозорците на спалните и на съседите заради шума.",
          ],
        },
      ],
    },
    en: {
      title: "Which air-to-water heat pump do I need?",
      excerpt:
        "Monoblock or split, what power, radiators or underfloor heating: what to weigh up before choosing a heat pump for your home.",
      sections: [
        {
          heading: "How an air-to-water heat pump works",
          paragraphs: [
            "A heat pump takes heat from the outdoor air, even when it is cold outside, and passes it to the water in the heating system. That water warms the radiators or the underfloor heating, and in summer most models can also cool.",
            "For every kilowatt-hour of electricity it delivers between 3 and 5 kilowatt-hours of heat, depending on the outdoor temperature and the water temperature. The lower the water temperature it has to reach, the more economical it is.",
          ],
        },
        {
          heading: "Monoblock or split",
          paragraphs: [
            "In a monoblock the whole refrigerant circuit is in the outdoor unit, and only water pipes run into the house. Installation is simpler, but the outdoor pipes must be well insulated and protected from freezing.",
            "In a split system the outdoor unit connects to an indoor hydraulic module through refrigerant lines. It suits longer distances to the house or little space outside. Work on the refrigerant circuit is done only by technicians certified for fluorinated gases.",
          ],
        },
        {
          heading: "What power do I need",
          paragraphs: [
            "The power depends on the building's heat loss. As a guide, per square metre of heated floor:",
            "Example: a well-insulated 120 m² house at 50 W/m² needs about 6 kW, so a 7 to 8 kW unit is chosen. If the heat pump also heats the domestic water, add a margin. We set the exact power at the site visit, from a heat-loss calculation.",
          ],
          list: [
            "new, very well insulated house: 30–40 W/m²",
            "insulated older house: 50–70 W/m²",
            "uninsulated house: 80–120 W/m²",
          ],
        },
        {
          heading: "Radiators or underfloor heating",
          paragraphs: [
            "Underfloor heating runs on water at 30 to 40 °C and is the ideal partner for a heat pump. Radiators usually want 45–55 °C, which lowers the efficiency. The system works with existing radiators, but some often need replacing with larger ones, especially in rooms with many windows.",
          ],
        },
        {
          heading: "Hot water and a buffer tank",
          paragraphs: [
            "For a family of four, a 200 to 300 litre cylinder with a heat-pump coil is usually enough. A buffer tank is added when the system holds little water or has several separate zones, so the unit runs more steadily and switches on less often.",
          ],
        },
        {
          heading: "Where the outdoor unit goes",
          paragraphs: [
            "The outdoor unit needs free space in front and at the sides to draw and blow air. It sits on a stand above snow level, with a drain for the condensate, and away from bedroom windows and the neighbours because of the noise.",
          ],
        },
      ],
    },
  },
  {
    slug: "peletna-kamina-ili-kotel",
    image: "/images/categories/peletni-kamini.webp",
    readingMinutes: 5,
    published: "2026-11-18",
    updated: "2026-11-18",
    categorySlug: "peletni-kamini",
    installation: "peletno-otoplenie",
    bg: {
      title: "Пелетна камина или пелетен котел?",
      excerpt:
        "Суха камина, камина с водна риза или котел в техническо помещение: кое решение за коя къща е подходящо и какво трябва да има комина.",
      sections: [
        {
          heading: "Каква е разликата",
          paragraphs: [
            "И камината, и котелът горят пелети автоматично: шнек ги подава от бункер в горелката, запалването е електрическо, а температурата се управлява с термостат. Разликата е къде стоят и къде отива топлината.",
            "Камината стои в дневната и се вижда пламъкът. Котелът е в техническо помещение или мазе, с по-голям бункер, и е създаден да отоплява цялата къща.",
          ],
        },
        {
          heading: "Суха камина или с водна риза",
          paragraphs: [
            "Сухата камина топли въздуха в помещението, в което е, а някои модели имат въздуховоди към съседни стаи. Подходяща е за отворени пространства и вили.",
            "Камината с водна риза отдава по-голямата част от топлината си на вода, която обикаля радиаторите в цялата къща. За нея са нужни помпа, разширителен съд и предпазна група, а често и буферен съд.",
          ],
        },
        {
          heading: "Кога да изберете котел",
          paragraphs: [
            "Котелът е по-доброто решение за по-големи къщи, когато искате няколко дни автономия без зареждане или ще затопляте и битова вода чрез бойлер. Лесно се комбинира със соларна система или с термопомпа.",
          ],
        },
        {
          heading: "Комин и безопасност",
          paragraphs: [
            "Пелетните уреди изискват херметичен комин с подходящ диаметър, обикновено 80–100 mm за камините, с ревизионен отвор и събиране на конденза. Помещението трябва да има приток на въздух за горенето. Преди монтажа проверяваме комина при огледа.",
          ],
        },
        {
          heading: "Колко пелети се изгарят",
          paragraphs: [
            "Един килограм пелети дава около 4,8 kWh топлина. Котел от 10 kW на пълна мощност изгаря около 2,3 kg на час. За къща от 100 m² разходът за сезон обикновено е между 2 и 3,5 тона, според изолацията и климата.",
          ],
        },
      ],
    },
    en: {
      title: "Pellet stove or pellet boiler?",
      excerpt:
        "A dry stove, a water-jacket stove or a boiler in a utility room: which solution suits which house, and what the chimney needs.",
      sections: [
        {
          heading: "What the difference is",
          paragraphs: [
            "Both burn pellets automatically: an auger feeds them from a hopper into the burner, ignition is electric and a thermostat controls the temperature. The difference is where they stand and where the heat goes.",
            "A stove stands in the living room with a visible flame. A boiler sits in a utility room or basement, has a larger hopper, and is made to heat the whole house.",
          ],
        },
        {
          heading: "Dry stove or water jacket",
          paragraphs: [
            "A dry stove heats the air of the room it is in, and some models have ducts to the neighbouring rooms. It suits open spaces and holiday homes.",
            "A water-jacket stove passes most of its heat to water that circulates through the radiators of the whole house. It needs a pump, an expansion vessel and a safety group, and often a buffer tank.",
          ],
        },
        {
          heading: "When to choose a boiler",
          paragraphs: [
            "A boiler is the better choice for larger houses, when you want several days without refilling, or when it will also heat domestic water through a cylinder. It combines easily with a solar system or a heat pump.",
          ],
        },
        {
          heading: "Chimney and safety",
          paragraphs: [
            "Pellet appliances need a sealed chimney of the right diameter, usually 80–100 mm for stoves, with an inspection opening and a condensate trap. The room needs fresh air for combustion. We check the chimney at the site visit, before the installation.",
          ],
        },
        {
          heading: "How many pellets it burns",
          paragraphs: [
            "A kilogram of pellets gives about 4.8 kWh of heat. A 10 kW boiler at full power burns about 2.3 kg an hour. A 100 m² house usually uses 2 to 3.5 tonnes a season, depending on insulation and climate.",
          ],
        },
      ],
    },
  },
  {
    slug: "kolko-btu-klimatik",
    image: "/images/categories/klimatitsi.webp",
    readingMinutes: 4,
    published: "2026-11-18",
    updated: "2026-11-18",
    categorySlug: "klimatitsi",
    installation: "klimatik",
    calculator: "klimatik",
    bg: {
      title: "Колко BTU климатик ми трябва?",
      excerpt:
        "Какво означават 9000, 12000 и 18000 BTU, коя мощност за каква стая и кое увеличава нуждата от охлаждане.",
      sections: [
        {
          heading: "BTU и киловати",
          paragraphs: [
            "BTU е мярка за мощността на охлаждане: 1 kW е около 3412 BTU в час. Климатик от 9000 BTU има около 2,6 kW, от 12000 BTU около 3,5 kW, от 18000 BTU около 5,3 kW, а от 24000 BTU около 7 kW.",
          ],
        },
        {
          heading: "Ориентир по площ",
          paragraphs: ["За стая с височина около 2,6 m и средна изолация:"],
          list: ["до 25 m²: 9000 BTU", "25–35 m²: 12000 BTU", "35–50 m²: 18000 BTU", "50–70 m²: 24000 BTU"],
        },
        {
          heading: "Кое увеличава нуждата",
          paragraphs: [
            "Добавете 10 до 30 % при големи прозорци на юг или запад, при последен етаж под покрива, слаба изолация, висок таван, кухня или много хора и уреди в помещението. Прекалено мощният климатик също не е добър избор: той се включва и изключва често и изсушава въздуха.",
          ],
        },
        {
          heading: "Отопление с климатик",
          paragraphs: [
            "Съвременните инверторни климатици отопляват икономично и при минусови температури, а много модели работят до −15 °C и по-ниско. Ако климатикът ще бъде основно отопление, мощността се избира и по топлинните загуби на стаята.",
          ],
        },
        {
          heading: "Монтажът",
          paragraphs: [
            "Мястото на вътрешното и външното тяло, дължината на тръбния път и отвеждането на конденза уточняваме при огледа. Монтажът включва вакуумиране и проверка за течове, и се извършва от техници със сертификат за флуорирани газове.",
          ],
        },
      ],
    },
    en: {
      title: "How many BTU does my air conditioner need?",
      excerpt: "What 9000, 12000 and 18000 BTU mean, which power suits which room, and what raises the cooling need.",
      sections: [
        {
          heading: "BTU and kilowatts",
          paragraphs: [
            "BTU measures cooling power: 1 kW is about 3412 BTU per hour. A 9000 BTU unit has about 2.6 kW, 12000 BTU about 3.5 kW, 18000 BTU about 5.3 kW and 24000 BTU about 7 kW.",
          ],
        },
        {
          heading: "A guide by floor area",
          paragraphs: ["For a room about 2.6 m high with average insulation:"],
          list: ["up to 25 m²: 9000 BTU", "25–35 m²: 12000 BTU", "35–50 m²: 18000 BTU", "50–70 m²: 24000 BTU"],
        },
        {
          heading: "What raises the need",
          paragraphs: [
            "Add 10 to 30 % for large south- or west-facing windows, a top floor under the roof, poor insulation, a high ceiling, a kitchen, or many people and appliances in the room. An oversized unit is no better: it switches on and off often and dries the air.",
          ],
        },
        {
          heading: "Heating with an air conditioner",
          paragraphs: [
            "Modern inverter air conditioners heat economically even below freezing, and many models run down to −15 °C and lower. If it will be the main heating, choose the power by the room's heat loss as well.",
          ],
        },
        {
          heading: "The installation",
          paragraphs: [
            "We settle the position of the indoor and outdoor units, the length of the piping and the condensate drain at the site visit. Installation includes vacuuming and a leak test, and is done by technicians certified for fluorinated gases.",
          ],
        },
      ],
    },
  },
  {
    slug: "podovo-otoplenie",
    image: "/images/categories/podovo-otoplenie.webp",
    readingMinutes: 5,
    published: "2026-11-18",
    updated: "2026-11-18",
    categorySlug: "podovo-otoplenie",
    installation: "podovo-otoplenie",
    bg: {
      title: "Подово отопление: как работи и кога си струва",
      excerpt:
        "Защо подовото отопление и термопомпата си пасват, как се изгражда системата и какво да имате предвид за настилката.",
      sections: [
        {
          heading: "Как работи",
          paragraphs: [
            "В замазката на пода се полагат тръби, през които минава топла вода. Целият под става отоплително тяло и топлината идва равномерно отдолу, без радиатори по стените и без силно движение на въздуха.",
          ],
        },
        {
          heading: "Защо с термопомпа",
          paragraphs: [
            "Подовото отопление работи с вода от 30 до 40 °C. При толкова ниска температура термопомпата постига най-високата си ефективност, затова двете заедно са най-икономичното отопление за нова или основно ремонтирана къща.",
          ],
        },
        {
          heading: "Как се изгражда",
          paragraphs: ["Системата се изгражда на слоеве, отдолу нагоре:"],
          list: [
            "топлоизолационни плочи и периметрова лента по стените",
            "тръби PEX с кислородна бариера, обикновено 16 mm, през 10–20 cm",
            "кръгове с дължина до около 100 m, всеки свързан към колектор с дебитомери",
            "замазка около 5–6 cm над тръбите",
          ],
        },
        {
          heading: "Настилката",
          paragraphs: [
            "Най-добре предават топлината плочките и камъкът. Ламинат и паркет също са подходящи, ако са обозначени за подово отопление. Дебелите килими намаляват отдаването на топлина. Преди полагане на настилката замазката се оставя да изсъхне и се загрява по протокол.",
          ],
        },
        {
          heading: "Управление",
          paragraphs: [
            "Всяка стая може да има свой термостат, който управлява задвижки на колектора. Така спалните могат да са по-хладни от дневната, без да се губи енергия.",
          ],
        },
      ],
    },
    en: {
      title: "Underfloor heating: how it works and when it pays off",
      excerpt:
        "Why underfloor heating and heat pumps go together, how the system is built, and what to consider for the floor covering.",
      sections: [
        {
          heading: "How it works",
          paragraphs: [
            "Pipes carrying warm water are laid in the floor screed. The whole floor becomes the heat emitter, and the warmth comes evenly from below, with no radiators on the walls and little air movement.",
          ],
        },
        {
          heading: "Why with a heat pump",
          paragraphs: [
            "Underfloor heating runs on water at 30 to 40 °C. At such a low temperature a heat pump reaches its best efficiency, so together they are the most economical heating for a new or fully renovated house.",
          ],
        },
        {
          heading: "How it is built",
          paragraphs: ["The system is built in layers, from the bottom up:"],
          list: [
            "insulation boards and an edge strip along the walls",
            "PEX pipes with an oxygen barrier, usually 16 mm, 10–20 cm apart",
            "loops of up to about 100 m, each connected to a manifold with flow meters",
            "screed about 5–6 cm above the pipes",
          ],
        },
        {
          heading: "The floor covering",
          paragraphs: [
            "Tiles and stone pass heat best. Laminate and parquet are suitable too if they are rated for underfloor heating. Thick carpets reduce the heat output. Before the covering goes down, the screed is left to dry and is heated up following a protocol.",
          ],
        },
        {
          heading: "Controls",
          paragraphs: [
            "Each room can have its own thermostat that drives actuators on the manifold. Bedrooms can then stay cooler than the living room without wasting energy.",
          ],
        },
      ],
    },
  },
  {
    slug: "kak-da-izberem-radiator",
    image: "/images/categories/radiatori-i-konvektori.webp",
    readingMinutes: 4,
    published: "2026-11-18",
    updated: "2026-11-18",
    categorySlug: "radiatori-i-konvektori",
    calculator: "radiatori",
    bg: {
      title: "Как да изберем радиатор",
      excerpt:
        "Колко топлина трябва на стаята, как да прочетете мощността в каталога и защо с термопомпа радиаторът трябва да е по-голям.",
      sections: [
        {
          heading: "Колко топлина трябва на стаята",
          paragraphs: [
            "За стая с височина около 2,6 m се смятат ориентировъчно 60 W/m² при добра изолация, 80 W/m² при средна и 100 W/m² и повече при слаба. Спалня от 15 m² в къща със средна изолация има нужда от около 1200 W.",
          ],
        },
        {
          heading: "Какво пише в каталога",
          paragraphs: [
            "Мощността на радиаторите се дава при температура на водата 75/65 °C и 20 °C в стаята (ΔT 50). При по-хладна вода радиаторът отдава по-малко: около 75 % при ΔT 40 и около 52 % при ΔT 30. Затова при термопомпа, която работи с по-ниска температура, се избира по-голям радиатор или подово отопление.",
          ],
        },
        {
          heading: "Видове радиатори",
          paragraphs: ["Изборът зависи от системата и от мястото:"],
          list: [
            "панелни (тип 11, 21, 22, 33): повече панели означават повече мощност при същия размер",
            "алуминиеви на секции: бързо се затоплят, мощността се променя с броя секции",
            "вентилаторни конвектори: компактни, отопляват и охлаждат с термопомпа",
          ],
        },
        {
          heading: "Размер и място",
          paragraphs: [
            "Най-добре е радиаторът да е под прозореца, за да спира студения въздух от стъклото. Съобразете височината с перваза и вида на връзката: странична или долна.",
          ],
        },
        {
          heading: "Регулиране",
          paragraphs: [
            "Термостатичните вентили поддържат зададената температура във всяка стая, а балансирането на системата осигурява всеки радиатор да получава нужната му вода.",
          ],
        },
      ],
    },
    en: {
      title: "How to choose a radiator",
      excerpt:
        "How much heat a room needs, how to read the output in the catalogue, and why a radiator must be larger with a heat pump.",
      sections: [
        {
          heading: "How much heat the room needs",
          paragraphs: [
            "For a room about 2.6 m high, count roughly 60 W/m² with good insulation, 80 W/m² with average and 100 W/m² or more with poor insulation. A 15 m² bedroom in an averagely insulated house needs about 1200 W.",
          ],
        },
        {
          heading: "What the catalogue says",
          paragraphs: [
            "Radiator output is given for water at 75/65 °C and a room at 20 °C (ΔT 50). With cooler water a radiator gives less: about 75 % at ΔT 40 and about 52 % at ΔT 30. That is why, with a heat pump running at a lower temperature, you choose a larger radiator or underfloor heating.",
          ],
        },
        {
          heading: "Types of radiator",
          paragraphs: ["The choice depends on the system and the space:"],
          list: [
            "panel radiators (types 11, 21, 22, 33): more panels give more output at the same size",
            "aluminium sections: heat up quickly, output changes with the number of sections",
            "fan coil units: compact, they heat and cool with a heat pump",
          ],
        },
        {
          heading: "Size and position",
          paragraphs: [
            "A radiator works best under the window, where it stops the cold air from the glass. Match the height to the sill and the type of connection: side or bottom.",
          ],
        },
        {
          heading: "Control",
          paragraphs: [
            "Thermostatic valves hold the set temperature in each room, and balancing the system makes sure every radiator gets the water it needs.",
          ],
        },
      ],
    },
  },
];

export const guideHref = (slug?: string) => (slug ? `/saveti/${slug}` : "/saveti");

export function findGuide(slug: string): Guide | undefined {
  return GUIDES.find((guide) => guide.slug === slug);
}

export function guideText(guide: Guide, locale: string): GuideText {
  return locale === "en" ? guide.en : guide.bg;
}
