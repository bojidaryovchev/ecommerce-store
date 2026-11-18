import type { InstallationSystemSlug } from "@/lib/installation-systems";

/**
 * The installation pages (/montazh/{system}): what the visitor reads beside the illustrated story.
 * Each beat names the parts of the scene it lights up (`layers`) and where the camera looks (`view`,
 * an SVG viewBox in the scene's 1000 × 700 units). The scenes live in components/installation/scenes.
 *
 * Scope is described as it usually is and settled at the site visit; no prices are promised here.
 */
export type Beat = {
  title: string;
  text: string;
};

export type BeatStage = {
  /** Scene layers lit during this beat; the rest dim. Empty = everything lit. */
  layers: string[];
  /** Camera: x y width height in scene units. */
  view: [number, number, number, number];
};

export type InstallationText = {
  title: string;
  lead: string;
  metaDescription: string;
  storyEyebrow: string;
  storyTitle: string;
  beats: Beat[];
  included: string[];
  need: string[];
  faq: Array<{ q: string; a: string }>;
};

export type InstallationContent = {
  slug: InstallationSystemSlug;
  /** One stage per beat, in the same order as `bg.beats` / `en.beats`. */
  stages: BeatStage[];
  /** The guide that goes deeper. */
  guide?: string;
  calculator?: string;
  bg: InstallationText;
  en: InstallationText;
};

const FULL: BeatStage["view"] = [0, 0, 1000, 700];

export const INSTALLATIONS: Record<InstallationSystemSlug, InstallationContent> = {
  termopompa: {
    slug: "termopompa",
    guide: "kakva-termopompa-mi-tryabva",
    calculator: "termopompa",
    stages: [
      { layers: [], view: FULL },
      { layers: ["outdoor", "clearance"], view: [600, 360, 400, 280] },
      { layers: ["outdoor", "pipes"], view: [440, 360, 520, 364] },
      { layers: ["module", "pipes"], view: [360, 380, 420, 294] },
      { layers: ["tank", "valve"], view: [420, 380, 300, 210] },
      { layers: ["floor", "radiators", "flow"], view: [50, 280, 640, 448] },
      { layers: ["control", "flow", "outdoor", "module", "tank", "floor", "radiators"], view: FULL },
    ],
    bg: {
      title: "Монтаж на термопомпа въздух-вода",
      lead: "Термопомпата отоплява, охлажда и затопля водата за целия дом. Ето как изглежда монтажът стъпка по стъпка, от огледа до пускането.",
      metaDescription:
        "Монтаж на термопомпа въздух-вода до ключ: оглед, оразмеряване, външно тяло, хидравлика, бойлер, подово отопление и радиатори, пускане.",
      storyEyebrow: "Как протича монтажът",
      storyTitle: "От огледа до топлия дом",
      beats: [
        {
          title: "Огледът",
          text: "Идваме на място, измерваме, преценяваме изолацията, прозорците и съществуващата инсталация и изчисляваме топлинните загуби. Оттук излиза мощността на термопомпата и мястото на всяка част.",
        },
        {
          title: "Външното тяло",
          text: "Поставяме външното тяло на стойка над нивото на снега, със свободно пространство отпред и отстрани и с отвеждане на конденза. Избираме място далеч от спалните и от съседите заради шума.",
        },
        {
          title: "Връзката с къщата",
          text: "Свързваме външното тяло с къщата с изолирани тръби през стената. При сплит системите това са тръби с хладилен агент към вътрешния модул, които полагат сертифицирани техници.",
        },
        {
          title: "Хидравликата",
          text: "В техническото помещение монтираме хидравличния модул с циркулационна помпа, разширителен съд и предпазна група, а когато системата има нужда, и буферен съд.",
        },
        {
          title: "Топлата вода",
          text: "Трипътен вентил превключва термопомпата между отоплението и бойлера за битова вода. Бойлерът се затопля отдолу нагоре през серпентината си.",
        },
        {
          title: "Отоплението",
          text: "Подовото отопление и радиаторите получават вода с ниска температура, при която термопомпата работи най-икономично. Ако съществуващите радиатори са малки, ще ви кажем кои да се сменят.",
        },
        {
          title: "Пускането",
          text: "Пълним и обезвъздушаваме системата, проверяваме налягането, настройваме кривата на отопление и графика за топла вода и ви показваме как се управлява всичко от уреда и от телефона.",
        },
      ],
      included: [
        "Оглед на място и изчисление на топлинните загуби",
        "Избор на мощност и разположение на частите",
        "Монтаж на външното тяло на стойка с отвеждане на конденза",
        "Тръбни връзки между външното тяло и къщата",
        "Хидравличен модул, помпа, разширителен съд и предпазна група",
        "Свързване на бойлер и буферен съд, когато ги има",
        "Пълнене, обезвъздушаване, настройка и пускане",
        "Обяснение как се управлява системата",
      ],
      need: [
        "Достъп до мястото за външното тяло и до техническото помещение",
        "Електрозахранване по изискванията на уреда (уточняваме при огледа)",
        "Информация за съществуващата инсталация, ако има такава",
      ],
      faq: [
        {
          q: "Колко време отнема монтажът?",
          a: "Зависи от обема: смяна на котел с термопомпа в къща с готова инсталация обикновено отнема няколко дни, а нова инсталация с подово отопление се прави заедно с ремонта. Точния срок даваме след огледа.",
        },
        {
          q: "Може ли термопомпа със съществуващите радиатори?",
          a: "Обикновено да. При огледа проверяваме дали радиаторите отдават достатъчно топлина при по-ниската температура на водата и ако някой е малък, предлагаме по-голям.",
        },
        {
          q: "Шумна ли е термопомпата?",
          a: "Вътрешната част е тиха. Външното тяло се чува отблизо, затова му избираме място далеч от спалните и от съседите и го монтираме на антивибрационни опори.",
        },
      ],
    },
    en: {
      title: "Air-to-water heat pump installation",
      lead: "A heat pump heats, cools and warms the water for the whole home. Here is how the installation goes step by step, from the site visit to commissioning.",
      metaDescription:
        "Turnkey air-to-water heat pump installation: site visit, sizing, outdoor unit, hydraulics, hot water cylinder, underfloor heating and radiators, commissioning.",
      storyEyebrow: "How the installation goes",
      storyTitle: "From the site visit to a warm home",
      beats: [
        {
          title: "The site visit",
          text: "We come over, measure, assess the insulation, the windows and any existing system, and calculate the heat loss. That gives the heat pump's power and the place for every part.",
        },
        {
          title: "The outdoor unit",
          text: "We set the outdoor unit on a stand above snow level, with free space in front and at the sides and a condensate drain, away from bedrooms and neighbours because of the noise.",
        },
        {
          title: "Connecting the house",
          text: "Insulated pipes through the wall connect the outdoor unit to the house. In split systems these are refrigerant lines to the indoor module, laid by certified technicians.",
        },
        {
          title: "The hydraulics",
          text: "In the utility room we install the hydraulic module with a circulation pump, expansion vessel and safety group, and a buffer tank when the system needs one.",
        },
        {
          title: "Hot water",
          text: "A three-way valve switches the heat pump between the heating and the hot water cylinder, which heats from the bottom up through its coil.",
        },
        {
          title: "The heating",
          text: "Underfloor heating and radiators receive water at a low temperature, where the heat pump is most economical. If existing radiators are small, we tell you which to replace.",
        },
        {
          title: "Commissioning",
          text: "We fill and bleed the system, check the pressure, set the heating curve and the hot water schedule, and show you how to control everything from the unit and your phone.",
        },
      ],
      included: [
        "A site visit and a heat-loss calculation",
        "Choosing the power and where each part goes",
        "Mounting the outdoor unit on a stand with a condensate drain",
        "Pipe connections between the outdoor unit and the house",
        "Hydraulic module, pump, expansion vessel and safety group",
        "Connecting a hot water cylinder and buffer tank where present",
        "Filling, bleeding, setting up and commissioning",
        "An explanation of how to control the system",
      ],
      need: [
        "Access to the spot for the outdoor unit and to the utility room",
        "A power supply to the unit's requirements (we check at the site visit)",
        "Information about any existing system",
      ],
      faq: [
        {
          q: "How long does the installation take?",
          a: "It depends on the scope: replacing a boiler with a heat pump in a house with a working system usually takes a few days, while a new system with underfloor heating is done with the renovation. We give the exact time after the site visit.",
        },
        {
          q: "Can a heat pump work with my existing radiators?",
          a: "Usually yes. At the site visit we check whether the radiators give enough heat at the lower water temperature, and where one is too small we suggest a larger one.",
        },
        {
          q: "Is a heat pump noisy?",
          a: "The indoor part is quiet. The outdoor unit can be heard up close, so we place it away from bedrooms and neighbours and mount it on anti-vibration feet.",
        },
      ],
    },
  },
  "peletno-otoplenie": {
    slug: "peletno-otoplenie",
    guide: "peletna-kamina-ili-kotel",
    stages: [
      { layers: [], view: FULL },
      { layers: ["stove"], view: [100, 390, 330, 231] },
      { layers: ["flue", "stove"], view: [20, 80, 520, 540] },
      { layers: ["safety", "stove", "pipes"], view: [140, 400, 300, 210] },
      { layers: ["radiators", "pipes", "flow"], view: [50, 190, 640, 448] },
      { layers: ["tank", "pipes"], view: [400, 390, 300, 210] },
      { layers: ["stove", "radiators", "tank", "flow", "pipes", "control"], view: FULL },
    ],
    bg: {
      title: "Монтаж на пелетно отопление",
      lead: "Камина с водна риза или пелетен котел, свързани с радиаторите в целия дом. Ето какво включва монтажът и как работи системата.",
      metaDescription:
        "Монтаж на пелетна камина с водна риза или пелетен котел: оглед на комина, предпазна група, радиатори, буферен съд и бойлер, пускане.",
      storyEyebrow: "Как протича монтажът",
      storyTitle: "Огън в дневната, топлина във всяка стая",
      beats: [
        {
          title: "Огледът",
          text: "Започваме с оглед на къщата, комина и съществуващата инсталация. Изчисляваме нужната мощност и решаваме дали камина с водна риза или котел е по-доброто решение.",
        },
        {
          title: "Камината",
          text: "Камината стои в дневната. Шнек подава пелетите от бункера в горелката, запалването е електрическо, а водната риза около горивната камера поема по-голямата част от топлината.",
        },
        {
          title: "Комин и димоотвод",
          text: "Свързваме камината с херметичен димоотвод с подходящ диаметър, ревизионен отвор и събиране на конденза. Ако съществуващият комин не отговаря на изискванията, предлагаме решение.",
        },
        {
          title: "Предпазната група",
          text: "Монтираме циркулационна помпа, разширителен съд и предпазна група с вентил и обезвъздушител, за да работи системата безопасно при всякакви условия.",
        },
        {
          title: "Радиаторите",
          text: "Топлата вода от водната риза обикаля радиаторите във всички стаи. Термостатичните вентили държат зададената температура във всяка стая поотделно.",
        },
        {
          title: "Буфер и топла вода",
          text: "Буферният съд натрупва топлина и прави работата по-равномерна, а бойлер със серпентина позволява камината да затопля и битовата вода.",
        },
        {
          title: "Пускането",
          text: "Пълним системата, проверяваме налягането и тягата на комина, настройваме горенето за вашите пелети и ви показваме зареждането, почистването и управлението.",
        },
      ],
      included: [
        "Оглед на къщата, комина и инсталацията",
        "Избор на камина или котел с подходяща мощност",
        "Монтаж и свързване към димоотвода",
        "Помпа, разширителен съд и предпазна група",
        "Свързване към радиаторите, буферния съд и бойлера, когато ги има",
        "Пълнене, проверка, настройка на горенето и пускане",
        "Обяснение за зареждане, почистване и управление",
      ],
      need: [
        "Комин или място за изграждане на димоотвод",
        "Електрическо захранване за камината и помпата",
        "Място за съхранение на пелетите на сухо",
      ],
      faq: [
        {
          q: "Камина с водна риза или котел?",
          a: "Камината топли дневната с видим огън и разпределя останалата топлина към радиаторите. Котелът е за по-големи къщи и стои в техническо помещение, с по-голям бункер за повече дни без зареждане.",
        },
        {
          q: "Колко често се зарежда и почиства?",
          a: "Зависи от бункера и студа: камината обикновено се зарежда веднъж-два пъти на ден в най-студените дни, а горелката се почиства на няколко дни. Котлите с голям бункер издържат по-дълго.",
        },
        {
          q: "Става ли със съществуващия комин?",
          a: "Често да, но коминът трябва да е херметичен и с подходящ диаметър. Проверяваме го при огледа и ако не става, предлагаме изолиран метален димоотвод.",
        },
      ],
    },
    en: {
      title: "Pellet heating installation",
      lead: "A water-jacket stove or a pellet boiler connected to the radiators of the whole house. Here is what the installation includes and how the system works.",
      metaDescription:
        "Installing a water-jacket pellet stove or pellet boiler: chimney check, safety group, radiators, buffer tank and hot water cylinder, commissioning.",
      storyEyebrow: "How the installation goes",
      storyTitle: "A fire in the living room, warmth in every room",
      beats: [
        {
          title: "The site visit",
          text: "We start with a visit to see the house, the chimney and any existing system, calculate the power needed and decide whether a water-jacket stove or a boiler suits better.",
        },
        {
          title: "The stove",
          text: "The stove stands in the living room. An auger feeds pellets from the hopper into the burner, ignition is electric, and the water jacket around the firebox takes most of the heat.",
        },
        {
          title: "Chimney and flue",
          text: "We connect the stove to a sealed flue of the right diameter, with an inspection opening and a condensate trap. If the existing chimney does not meet the requirements, we propose a solution.",
        },
        {
          title: "The safety group",
          text: "We install a circulation pump, an expansion vessel and a safety group with a relief valve and an air vent, so the system runs safely in every condition.",
        },
        {
          title: "The radiators",
          text: "Hot water from the jacket circulates through the radiators in every room, and thermostatic valves hold the set temperature in each room separately.",
        },
        {
          title: "Buffer and hot water",
          text: "A buffer tank stores heat and evens out the operation, and a cylinder with a coil lets the stove heat the domestic water too.",
        },
        {
          title: "Commissioning",
          text: "We fill the system, check the pressure and the chimney draught, tune the combustion to your pellets, and show you refilling, cleaning and the controls.",
        },
      ],
      included: [
        "A visit to the house, the chimney and the system",
        "Choosing a stove or boiler of the right power",
        "Installation and connection to the flue",
        "Pump, expansion vessel and safety group",
        "Connecting radiators, buffer tank and cylinder where present",
        "Filling, testing, tuning the combustion and commissioning",
        "An explanation of refilling, cleaning and the controls",
      ],
      need: [
        "A chimney or a place to build a flue",
        "A power supply for the stove and the pump",
        "A dry place to store the pellets",
      ],
      faq: [
        {
          q: "Water-jacket stove or boiler?",
          a: "A stove warms the living room with a visible fire and sends the rest of its heat to the radiators. A boiler is for larger houses, sits in a utility room and has a bigger hopper for more days without refilling.",
        },
        {
          q: "How often does it need refilling and cleaning?",
          a: "It depends on the hopper and the cold: a stove is usually refilled once or twice a day in the coldest days and its burner cleaned every few days. Boilers with a large hopper last longer.",
        },
        {
          q: "Will it work with my existing chimney?",
          a: "Often yes, but the chimney must be sealed and of the right diameter. We check it at the site visit, and if it is unsuitable we propose an insulated steel flue.",
        },
      ],
    },
  },
  klimatik: {
    slug: "klimatik",
    guide: "kolko-btu-klimatik",
    calculator: "klimatik",
    stages: [
      { layers: ["indoor"], view: [200, 40, 460, 322] },
      { layers: ["outdoor", "bracket"], view: [630, 290, 370, 259] },
      { layers: ["pipes", "drain", "wall"], view: [470, 90, 420, 520] },
      { layers: ["gauges", "pipes"], view: [600, 190, 400, 420] },
      { layers: ["indoor", "air", "remote"], view: [90, 60, 540, 440] },
    ],
    bg: {
      title: "Монтаж на климатик",
      lead: "Добре избраният и правилно монтиран климатик охлажда и отоплява тихо и икономично години наред. Ето какво правим при монтажа.",
      metaDescription:
        "Монтаж на климатик: избор на мощност, място на вътрешното и външното тяло, тръбен път, вакуумиране, проверка за течове и пускане.",
      storyEyebrow: "Как протича монтажът",
      storyTitle: "Тих, ефективен и сигурно монтиран",
      beats: [
        {
          title: "Мощност и място",
          text: "Избираме мощността според площта, изложението и изолацията на стаята, а вътрешното тяло поставяме така, че въздухът да обхваща цялото помещение, без да духа директно към леглото или бюрото.",
        },
        {
          title: "Външното тяло",
          text: "Монтираме външното тяло на здрава конзола или на стойка на земята, с антивибрационни опори и място за въздух, на достъп за поддръжка и далеч от прозорците на съседите.",
        },
        {
          title: "Отвор и тръбен път",
          text: "Пробиваме отвор с лек наклон навън и полагаме изолираните медни тръби, кабела и маркуча за конденза. Тръбите минават в кабелен канал, за да изглеждат подредено.",
        },
        {
          title: "Вакуумиране и проверка",
          text: "Преди да пуснем хладилния агент, вакуумираме тръбите и проверяваме за течове. Тази стъпка определя колко дълго и колко ефективно ще работи климатикът.",
        },
        {
          title: "Пускане и обучение",
          text: "Пускаме климатика в режим на охлаждане и отопление, проверяваме температурите и оттичането на конденза и ви показваме дистанционното и почистването на филтрите.",
        },
      ],
      included: [
        "Избор на мощност и място на двете тела",
        "Монтаж на вътрешното тяло и на конзолата или стойката за външното",
        "Отвор в стената, тръби, кабел и отвеждане на конденза",
        "Вакуумиране, проверка за течове и отваряне на хладилния агент",
        "Пускане, проверка на работата и обяснение на управлението",
      ],
      need: [
        "Контакт или отделна линия за климатика близо до вътрешното тяло",
        "Достъп до мястото за външното тяло",
        "Съгласие на етажната собственост, ако е нужно за фасадата",
      ],
      faq: [
        {
          q: "Колко време отнема монтажът?",
          a: "Стандартен монтаж на един климатик обикновено отнема няколко часа. По-дълъг тръбен път, работа на височина или няколко вътрешни тела отнемат повече време.",
        },
        {
          q: "Колко дълъг може да е тръбният път?",
          a: "Зависи от модела: всеки производител дава максимална дължина и височина. Колкото е по-къс тръбният път, толкова по-ефективно работи климатикът, затова го планираме при огледа.",
        },
        {
          q: "Колко често се поддържа климатикът?",
          a: "Филтрите на вътрешното тяло е добре да се почистват на няколко седмици при ежедневна работа, а профилактика от техник се прави веднъж годишно.",
        },
      ],
    },
    en: {
      title: "Air conditioner installation",
      lead: "A well-chosen and properly installed air conditioner cools and heats quietly and economically for years. Here is what we do at the installation.",
      metaDescription:
        "Air conditioner installation: choosing the power, placing the indoor and outdoor units, piping, vacuuming, leak test and commissioning.",
      storyEyebrow: "How the installation goes",
      storyTitle: "Quiet, efficient and securely installed",
      beats: [
        {
          title: "Power and position",
          text: "We choose the power from the room's size, orientation and insulation, and place the indoor unit so the air covers the whole room without blowing straight at the bed or the desk.",
        },
        {
          title: "The outdoor unit",
          text: "We mount the outdoor unit on a solid wall bracket or a ground stand, on anti-vibration feet, with room for air, within reach for servicing and away from the neighbours' windows.",
        },
        {
          title: "Opening and piping",
          text: "We drill an opening sloping slightly outwards and run the insulated copper pipes, the cable and the condensate hose, inside a trunking so they look tidy.",
        },
        {
          title: "Vacuum and leak test",
          text: "Before releasing the refrigerant, we vacuum the pipes and test for leaks. This step decides how long and how efficiently the air conditioner will run.",
        },
        {
          title: "Commissioning and handover",
          text: "We run the unit in cooling and heating, check the temperatures and the condensate drain, and show you the remote and how to clean the filters.",
        },
      ],
      included: [
        "Choosing the power and the place for both units",
        "Mounting the indoor unit and the bracket or stand for the outdoor one",
        "A wall opening, pipes, cable and condensate drain",
        "Vacuuming, leak test and releasing the refrigerant",
        "Commissioning, a performance check and an explanation of the controls",
      ],
      need: [
        "A socket or dedicated circuit near the indoor unit",
        "Access to the place for the outdoor unit",
        "The building association's consent where the facade requires it",
      ],
      faq: [
        {
          q: "How long does the installation take?",
          a: "A standard installation of one unit usually takes a few hours. Longer piping, work at height or several indoor units take longer.",
        },
        {
          q: "How long can the piping be?",
          a: "It depends on the model: every manufacturer sets a maximum length and height difference. The shorter the piping, the more efficient the unit, so we plan it at the site visit.",
        },
        {
          q: "How often does an air conditioner need servicing?",
          a: "Clean the indoor unit's filters every few weeks of daily use, and have a technician service it once a year.",
        },
      ],
    },
  },
  "podovo-otoplenie": {
    slug: "podovo-otoplenie",
    guide: "podovo-otoplenie",
    stages: [
      { layers: [], view: FULL },
      { layers: ["slab", "insulation", "edge"], view: [10, 420, 420, 294] },
      { layers: ["pipes", "loops"], view: [0, 30, 1000, 580] },
      { layers: ["manifold", "loops"], view: [500, 40, 440, 308] },
      { layers: ["gauge", "manifold"], view: [600, 60, 390, 340] },
      { layers: ["screed", "pipes"], view: [200, 420, 420, 294] },
      { layers: ["finish", "heat"], view: FULL },
    ],
    bg: {
      title: "Монтаж на подово отопление",
      lead: "Подовото отопление се изгражда на слоеве под настилката. Ето как го правим, от изолацията до първото загряване.",
      metaDescription:
        "Изграждане на подово отопление: изолация, тръби PEX, колектор, изпитване под налягане, замазка, загряване по протокол и настилка.",
      storyEyebrow: "Как протича монтажът",
      storyTitle: "Слой по слой до топлия под",
      beats: [
        {
          title: "Огледът",
          text: "Огледът показва площта, наличната височина за слоевете, вида на настилката и източника на топлина. Оттук излизат разстоянието между тръбите и броят на кръговете.",
        },
        {
          title: "Изолацията",
          text: "Върху плочата полагаме топлоизолационни плочи, а покрай стените периметрова лента, която поема разширението на замазката и спира топлината да бяга встрани.",
        },
        {
          title: "Тръбите",
          text: "Полагаме тръби PEX с кислородна бариера на кръгове, обикновено през 10 до 20 cm, по-гъсто покрай външните стени. Всеки кръг е цяла тръба без съединения в пода.",
        },
        {
          title: "Колекторът",
          text: "Свързваме кръговете към колектор с дебитомери, за да получава всяка стая точно колкото вода ѝ трябва, и към задвижки, които слушат термостатите.",
        },
        {
          title: "Изпитване",
          text: "Преди замазката изпитваме системата под налягане, за да сме сигурни, че няма течове. Тръбите остават под налягане и докато се полага замазката.",
        },
        {
          title: "Замазката",
          text: "Замазката покрива тръбите с около 5–6 cm. Тя разпределя топлината равномерно и трябва да изсъхне, преди да се сложи настилката.",
        },
        {
          title: "Загряване и настилка",
          text: "Загряваме замазката постепенно по протокол, преди да се положи настилката. След това подът топли равномерно с вода от 30 до 40 °C.",
        },
      ],
      included: [
        "Оглед и проект на кръговете",
        "Топлоизолация и периметрова лента",
        "Полагане на тръбите и колектора с дебитомери",
        "Изпитване под налягане",
        "Свързване към източника на топлина и термостатите",
        "Първо загряване по протокол",
      ],
      need: [
        "Подготвена плоча и височина за слоевете (обикновено 8–10 cm)",
        "Уточнен вид настилка",
        "Източник на топлина: термопомпа, котел или връзка към съществуващата инсталация",
      ],
      faq: [
        {
          q: "Става ли подово отопление при ремонт?",
          a: "Да, ако има достатъчно височина за слоевете. Съществуват и по-тънки системи за ремонт, които оценяваме при огледа.",
        },
        {
          q: "Под какви настилки работи?",
          a: "Най-добре под плочки и камък. Ламинатът и паркетът също са подходящи, ако са обозначени за подово отопление, а дебелите килими намаляват отдаването.",
        },
        {
          q: "Колко бързо затопля?",
          a: "Подовото отопление реагира по-бавно от радиаторите, защото затопля цялата замазка, но държи топлината дълго и равномерно. Затова се настройва на постоянна температура.",
        },
      ],
    },
    en: {
      title: "Underfloor heating installation",
      lead: "Underfloor heating is built in layers beneath the floor covering. Here is how we do it, from the insulation to the first heat-up.",
      metaDescription:
        "Building underfloor heating: insulation, PEX pipes, manifold, pressure test, screed, heating-up protocol and floor covering.",
      storyEyebrow: "How the installation goes",
      storyTitle: "Layer by layer to a warm floor",
      beats: [
        {
          title: "The site visit",
          text: "The visit shows the area, the height available for the layers, the floor covering and the heat source. They set the pipe spacing and the number of loops.",
        },
        {
          title: "The insulation",
          text: "We lay insulation boards on the slab and an edge strip along the walls, which takes up the screed's expansion and stops heat escaping sideways.",
        },
        {
          title: "The pipes",
          text: "We lay PEX pipes with an oxygen barrier in loops, usually 10 to 20 cm apart and denser along the outer walls. Each loop is one pipe with no joints in the floor.",
        },
        {
          title: "The manifold",
          text: "We connect the loops to a manifold with flow meters, so each room gets exactly the water it needs, and to actuators that follow the thermostats.",
        },
        {
          title: "Pressure test",
          text: "Before the screed we pressure-test the system to be sure there are no leaks. The pipes stay under pressure while the screed is laid.",
        },
        {
          title: "The screed",
          text: "The screed covers the pipes by about 5–6 cm. It spreads the heat evenly and must dry before the floor covering goes down.",
        },
        {
          title: "Heat-up and covering",
          text: "We heat the screed up gradually following a protocol before the covering is laid. After that the floor warms evenly with water at 30 to 40 °C.",
        },
      ],
      included: [
        "A site visit and a loop design",
        "Insulation and edge strip",
        "Laying the pipes and a manifold with flow meters",
        "A pressure test",
        "Connecting to the heat source and the thermostats",
        "The first heat-up following the protocol",
      ],
      need: [
        "A prepared slab and height for the layers (usually 8–10 cm)",
        "The chosen floor covering",
        "A heat source: heat pump, boiler or a connection to the existing system",
      ],
      faq: [
        {
          q: "Can underfloor heating go in during a renovation?",
          a: "Yes, if there is enough height for the layers. There are also thinner systems for renovations, which we assess at the site visit.",
        },
        {
          q: "Which floor coverings does it work under?",
          a: "Best under tiles and stone. Laminate and parquet are suitable too if rated for underfloor heating; thick carpets reduce the output.",
        },
        {
          q: "How fast does it heat up?",
          a: "Underfloor heating reacts more slowly than radiators because it warms the whole screed, but it holds the heat long and evenly, so it is set to a steady temperature.",
        },
      ],
    },
  },
};

export function installationText(content: InstallationContent, locale: string): InstallationText {
  return locale === "en" ? content.en : content.bg;
}
