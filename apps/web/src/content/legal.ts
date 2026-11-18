import { DELIVERY, DELIVERY_ALWAYS_FREE } from "@/lib/delivery";

/**
 * Information and legal pages. DRAFTS: written from the Consumer Protection Act (ЗЗП), the 2022
 * Act on the sale of goods (ЗПЦСЦУПС) and the GDPR for what this shop does, and to be reviewed by a
 * lawyer before launch (see the plan). The trader's details are placeholders in [brackets] until the
 * company exists; every page shows that it is a draft.
 */
export type InfoSection = { heading: string; paragraphs: string[]; list?: string[] };
export type InfoText = { title: string; description: string; sections: InfoSection[] };

export const INFO_SLUGS = [
  "dostavka",
  "vrashtane",
  "garantsiya",
  "obshti-usloviya",
  "poveritelnost",
  "biskvitki",
  "za-nas",
] as const;
export type InfoSlug = (typeof INFO_SLUGS)[number];

/** While true, every page says it is a draft awaiting legal review. */
export const LEGAL_DRAFT = true;
/** When the texts last changed, shown on every page. */
export const LEGAL_UPDATED = "2026-11-18";

/** Short names for menus and the footer. */
export const INFO_NAV: Record<InfoSlug, { bg: string; en: string }> = {
  dostavka: { bg: "Доставка", en: "Delivery" },
  vrashtane: { bg: "Връщане и отказ", en: "Returns and withdrawal" },
  garantsiya: { bg: "Гаранция и рекламации", en: "Warranty and complaints" },
  "obshti-usloviya": { bg: "Общи условия", en: "Terms and conditions" },
  poveritelnost: { bg: "Поверителност", en: "Privacy" },
  biskvitki: { bg: "Бисквитки", en: "Cookies" },
  "za-nas": { bg: "За нас", en: "About us" },
};

export const infoHref = (slug: InfoSlug) => `/${slug}`;
export const WITHDRAWAL_HREF = "/vrashtane/otkaz";
export const infoNav = (slug: InfoSlug, locale: string) => (locale === "en" ? INFO_NAV[slug].en : INFO_NAV[slug].bg);

const TRADER_BG = "[Наименование на търговеца], ЕИК [ЕИК], със седалище и адрес на управление [адрес]";

/** The delivery price in words, from the terms in lib/delivery.ts. */
const eur = (cents: number) => `${(cents / 100).toLocaleString("bg-BG", { maximumFractionDigits: 2 })} €`;
const DELIVERY_PRICE_BG = DELIVERY_ALWAYS_FREE
  ? "Доставката е безплатна за всяка поръчка в България."
  : DELIVERY.freeFrom > 0
    ? `Доставката е безплатна за поръчки от ${eur(DELIVERY.freeFrom)}. За по-малките поръчки струва ${eur(DELIVERY.fee)}. Цената се вижда в количката и преди плащането.`
    : `Доставката струва ${eur(DELIVERY.fee)}. Цената се вижда в количката и преди плащането.`;
const DELIVERY_PRICE_EN = DELIVERY_ALWAYS_FREE
  ? "Delivery is free for every order in Bulgaria."
  : DELIVERY.freeFrom > 0
    ? `Delivery is free for orders from ${eur(DELIVERY.freeFrom)}. Smaller orders pay ${eur(DELIVERY.fee)}. The price is shown in the cart and before payment.`
    : `Delivery costs ${eur(DELIVERY.fee)}. The price is shown in the cart and before payment.`;
const TRADER_EN = "[Trader's name], UIC [UIC], registered office [address]";

export const INFO_PAGES: Record<InfoSlug, { bg: InfoText; en: InfoText }> = {
  dostavka: {
    bg: {
      title: "Доставка",
      description: "Как и къде доставяме, срокове, цена на доставката и проверка на пратката.",
      sections: [
        {
          heading: "Къде доставяме",
          paragraphs: ["Доставяме в цяла България, до адрес, който посочите при поръчката."],
        },
        {
          heading: "Срок",
          paragraphs: [
            "Срокът зависи от наличността при производителя. Потвърждаваме го по имейл след поръчката. Когато поръчката е с монтаж, доставката се уговаря заедно с датата на монтажа след огледа.",
          ],
        },
        {
          heading: "Цена",
          paragraphs: [DELIVERY_PRICE_BG],
        },
        {
          heading: "Големи уреди",
          paragraphs: [
            "Котлите, термопомпите и другите обемни уреди се доставят със специализиран транспорт до адреса. Моля, уверете се, че достъпът до мястото на разтоварване е възможен.",
          ],
        },
        {
          heading: "Проверка при получаване",
          paragraphs: [
            "Прегледайте пратката в присъствието на куриера. При видима повреда на опаковката или уреда го отбележете в протокола и ни пишете на имейл, като приложите снимки.",
          ],
        },
      ],
    },
    en: {
      title: "Delivery",
      description: "How and where we deliver, delivery times, the delivery price and checking the parcel.",
      sections: [
        {
          heading: "Where we deliver",
          paragraphs: ["We deliver across Bulgaria, to the address you give with the order."],
        },
        {
          heading: "Delivery time",
          paragraphs: [
            "It depends on the manufacturer's stock. We confirm it by email after the order. For orders with installation, delivery is agreed together with the installation date after the site visit.",
          ],
        },
        { heading: "Price", paragraphs: [DELIVERY_PRICE_EN] },
        {
          heading: "Large units",
          paragraphs: [
            "Boilers, heat pumps and other bulky units are delivered by specialised transport to the address. Please make sure the unloading spot is accessible.",
          ],
        },
        {
          heading: "Checking on delivery",
          paragraphs: [
            "Check the parcel in front of the courier. If the packaging or the unit is visibly damaged, note it in the courier's report and email us photos.",
          ],
        },
      ],
    },
  },
  vrashtane: {
    bg: {
      title: "Връщане и отказ от договора",
      description:
        "Правото ви да се откажете от покупка онлайн в 14-дневен срок, как да го упражните и как връщаме парите.",
      sections: [
        {
          heading: "14 дни за отказ",
          paragraphs: [
            "Имате право да се откажете от договора, сключен от разстояние, без да посочвате причина, в срок от 14 дни (чл. 50 ЗЗП). За стоките срокът тече от деня, в който вие или посочено от вас лице получите стоката. За услугите, като монтажа, той тече от сключването на договора.",
          ],
        },
        {
          heading: "Как да се откажете",
          paragraphs: [
            "Най-лесно е с бутона „Отказ от договора тук“ в началото на тази страница (връзка към формата има и в долния край на всяка страница): попълвате я и веднага получавате потвърждение по имейл. Можете и да ни изпратите ясно заявление или стандартния формуляр за отказ на имейла ни. Достатъчно е да го изпратите преди изтичането на срока.",
          ],
        },
        {
          heading: "Връщане на стоката",
          paragraphs: [
            "Върнете стоката в 14 дни от уведомлението за отказ. Разходите за връщането са за ваша сметка, освен ако не сме уговорили друго. Отговаряте за намаляването на стойността ѝ, ако сте я използвали повече от необходимото, за да установите естеството, характеристиките и функционирането ѝ.",
          ],
        },
        {
          heading: "Възстановяване на сумата",
          paragraphs: [
            "Връщаме всички получени плащания, включително разходите за първоначалната доставка, до 14 дни от получаването на уведомлението ви, по същия начин, по който сте платили. Можем да задържим възстановяването, докато получим стоката или доказателство, че сте я изпратили.",
          ],
        },
        {
          heading: "Кога правото на отказ не се прилага",
          paragraphs: ["Законът (чл. 57 ЗЗП) изключва някои случаи, сред които:"],
          list: [
            "стоки, изработени по ваша поръчка или спецификация",
            "услуги, изцяло изпълнени с изричното ви предварително съгласие и потвърждение, че губите правото на отказ след изпълнението",
            "запечатани стоки, разпечатани след доставката, които не могат да бъдат върнати по хигиенни причини",
          ],
        },
        {
          heading: "Стандартен формуляр за отказ",
          paragraphs: [
            "До [наименование и адрес на търговеца], имейл contact@justpurrrfect.com: С настоящото уведомявам/уведомяваме, че се отказвам/отказваме от сключения от мен/нас договор за покупка на следните стоки/за предоставяне на следната услуга: … Поръчано на/получено на: … Име на потребителя/потребителите: … Адрес на потребителя/потребителите: … Подпис (само ако формулярът е на хартия): … Дата: …",
          ],
        },
      ],
    },
    en: {
      title: "Returns and withdrawal",
      description:
        "Your right to withdraw from an online purchase within 14 days, how to exercise it and how we refund.",
      sections: [
        {
          heading: "14 days to withdraw",
          paragraphs: [
            "You may withdraw from a distance contract within 14 days without giving a reason (art. 50 of the Consumer Protection Act). For goods the period runs from the day you, or someone you name, receive them; for services such as installation, from the conclusion of the contract.",
          ],
        },
        {
          heading: "How to withdraw",
          paragraphs: [
            "The easiest way is the “Withdraw from the contract here” button at the top of this page (the form is also linked at the bottom of every page): you fill it in and get an email confirmation at once. You can also email us a clear statement or the model withdrawal form. Sending it before the period ends is enough.",
          ],
        },
        {
          heading: "Returning the goods",
          paragraphs: [
            "Return the goods within 14 days of your notice. You bear the cost of returning them unless we agreed otherwise. You are liable for any loss in value from handling beyond what is needed to establish their nature, characteristics and functioning.",
          ],
        },
        {
          heading: "Refund",
          paragraphs: [
            "We refund all payments received, including the original delivery cost, within 14 days of receiving your notice, by the same means you paid. We may withhold the refund until we receive the goods or proof that you sent them.",
          ],
        },
        {
          heading: "When the right does not apply",
          paragraphs: ["The law (art. 57) excludes some cases, among them:"],
          list: [
            "goods made to your order or specification",
            "services fully performed with your prior express consent and acknowledgement that you lose the right once they are performed",
            "sealed goods unsealed after delivery that cannot be returned for hygiene reasons",
          ],
        },
        {
          heading: "Model withdrawal form",
          paragraphs: [
            "To [trader's name and address], email contact@justpurrrfect.com: I/We hereby give notice that I/we withdraw from my/our contract of sale of the following goods/for the provision of the following service: … Ordered on/received on: … Name of consumer(s): … Address of consumer(s): … Signature (only if on paper): … Date: …",
          ],
        },
      ],
    },
  },
  garantsiya: {
    bg: {
      title: "Гаранция и рекламации",
      description: "Законовата гаранция за съответствие, гаранцията от производителя и как да подадете рекламация.",
      sections: [
        {
          heading: "Законова гаранция",
          paragraphs: [
            "Отговаряме за всяко несъответствие на стоката с договора, което се прояви в срок от две години от доставката (Закон за предоставянето на цифрово съдържание и цифрови услуги и за продажбата на стоки). Ако несъответствието се прояви в първата година, се приема, че е съществувало при доставката.",
          ],
        },
        {
          heading: "Гаранция от производителя",
          paragraphs: [
            "Повечето уреди имат и търговска гаранция от производителя, описана в гаранционната карта. При някои уреди, като термопомпите и котлите, тя изисква пускане и периодична профилактика от оторизиран техник. Търговската гаранция не ограничава законовите ви права.",
          ],
        },
        {
          heading: "Как да подадете рекламация",
          paragraphs: [
            "Пишете ни на имейл или през страницата за контакти, като посочите номера на поръчката, уреда и проблема, и по възможност приложите снимки. Ще потвърдим получаването и ще предложим ремонт или замяна, а когато това не е възможно, намаляване на цената или връщане на сумата.",
          ],
        },
        {
          heading: "Монтажът",
          paragraphs: [
            "За монтажа, който сме извършили, отговаряме за качеството на работата. Ако забележите проблем след монтажа, пишете ни веднага.",
          ],
        },
      ],
    },
    en: {
      title: "Warranty and complaints",
      description: "The legal guarantee of conformity, the manufacturer's warranty and how to make a complaint.",
      sections: [
        {
          heading: "Legal guarantee",
          paragraphs: [
            "We are liable for any lack of conformity of the goods that becomes apparent within two years of delivery (Act on the sale of goods, 2022). If it appears within the first year, it is presumed to have existed at delivery.",
          ],
        },
        {
          heading: "Manufacturer's warranty",
          paragraphs: [
            "Most units also carry the manufacturer's commercial warranty, described on the warranty card. For some, such as heat pumps and boilers, it requires commissioning and periodic servicing by an authorised technician. It does not limit your legal rights.",
          ],
        },
        {
          heading: "How to complain",
          paragraphs: [
            "Email us or use the contact page, giving the order number, the unit and the problem, with photos if you can. We confirm receipt and offer repair or replacement, and where that is not possible, a price reduction or a refund.",
          ],
        },
        {
          heading: "The installation",
          paragraphs: [
            "We are responsible for the quality of installation work we carried out. If you notice a problem afterwards, write to us at once.",
          ],
        },
      ],
    },
  },
  "obshti-usloviya": {
    bg: {
      title: "Общи условия",
      description: "Условията за пазаруване в магазина: поръчка, цени, плащане, доставка, монтаж, отказ и рекламации.",
      sections: [
        {
          heading: "Търговец",
          paragraphs: [`Магазинът се управлява от ${TRADER_BG}, имейл contact@justpurrrfect.com.`],
        },
        {
          heading: "Поръчка",
          paragraphs: [
            "Поръчвате, като добавите продуктите в количката и платите онлайн. Договорът се сключва с потвърждението на плащането, за което получавате имейл с номера на поръчката.",
          ],
        },
        {
          heading: "Цени и плащане",
          paragraphs: [
            "Цените са в евро с включен ДДС. Плащате с банкова карта чрез Stripe; данните на картата не стигат до нас. Цената на доставката се показва преди плащането.",
          ],
        },
        {
          heading: "Доставка",
          paragraphs: ["Доставката е описана на страницата „Доставка“."],
        },
        {
          heading: "Монтаж",
          paragraphs: [
            "Монтажът е отделна услуга. Обемът и цената му се уговарят след оглед на място и се потвърждават писмено, преди да започне работата.",
          ],
        },
        {
          heading: "Отказ, гаранция и рекламации",
          paragraphs: [
            "Правото на отказ в 14-дневен срок е описано на страницата „Връщане и отказ от договора“, а гаранцията и рекламациите на страницата „Гаранция и рекламации“.",
          ],
        },
        {
          heading: "Лични данни",
          paragraphs: ["Как обработваме личните ви данни е описано в „Политика за поверителност“."],
        },
        {
          heading: "Спорове",
          paragraphs: [
            "Ако не постигнем съгласие, можете да се обърнете към Комисията за защита на потребителите (www.kzp.bg) или към секторна помирителна комисия за извънсъдебно решаване на спора. Приложимо е българското право.",
          ],
        },
      ],
    },
    en: {
      title: "Terms and conditions",
      description:
        "The terms for shopping here: ordering, prices, payment, delivery, installation, withdrawal and complaints.",
      sections: [
        { heading: "The trader", paragraphs: [`The shop is run by ${TRADER_EN}, email contact@justpurrrfect.com.`] },
        {
          heading: "Ordering",
          paragraphs: [
            "You order by adding products to the cart and paying online. The contract is concluded when the payment is confirmed, and you receive an email with the order number.",
          ],
        },
        {
          heading: "Prices and payment",
          paragraphs: [
            "Prices are in euros including VAT. You pay by card through Stripe; your card details never reach us. The delivery price is shown before payment.",
          ],
        },
        { heading: "Delivery", paragraphs: ["Delivery is described on the Delivery page."] },
        {
          heading: "Installation",
          paragraphs: [
            "Installation is a separate service. Its scope and price are agreed after a site visit and confirmed in writing before the work starts.",
          ],
        },
        {
          heading: "Withdrawal, warranty and complaints",
          paragraphs: [
            "The 14-day right of withdrawal is described on the Returns and withdrawal page, the warranty and complaints on the Warranty page.",
          ],
        },
        { heading: "Personal data", paragraphs: ["How we process personal data is described in the Privacy policy."] },
        {
          heading: "Disputes",
          paragraphs: [
            "If we cannot agree, you may turn to the Consumer Protection Commission (www.kzp.bg) or a sectoral conciliation commission for out-of-court resolution. Bulgarian law applies.",
          ],
        },
      ],
    },
  },
  poveritelnost: {
    bg: {
      title: "Политика за поверителност",
      description: "Какви лични данни събираме, защо, с кого ги споделяме, колко време ги пазим и какви са правата ви.",
      sections: [
        {
          heading: "Администратор",
          paragraphs: [`Администратор на личните данни е ${TRADER_BG}, имейл contact@justpurrrfect.com.`],
        },
        {
          heading: "Какви данни обработваме",
          paragraphs: ["Обработваме само данните, които са ни нужни:"],
          list: [
            "при поръчка: име, имейл, телефон, адрес за доставка и съдържанието на поръчката",
            "при профил: име и имейл, а при вход с имейл и парола и криптиран отпечатък на паролата (самата парола не пазим)",
            "при запитване или писмо до нас: данните и съдържанието на съобщението, включително прикачени файлове",
            "технически: бисквитките, описани в „Политика за бисквитките“",
          ],
        },
        {
          heading: "Защо и на какво основание",
          paragraphs: [
            "За да изпълним поръчката или монтажа (договор), да водим счетоводство и да издаваме документи (законово задължение), да отговорим на запитванията ви и да пазим магазина от злоупотреби (легитимен интерес). Данните на платежните карти обработва само Stripe.",
          ],
        },
        {
          heading: "С кого ги споделяме",
          paragraphs: ["Ползваме доставчици, които обработват данни от наше име:"],
          list: [
            "Stripe: плащания",
            "Resend: изпращане и получаване на имейли",
            "Vercel и Amazon Web Services: хостинг и файлове",
            "Neon: базата данни",
            "куриери и монтажни партньори: само данните, нужни за доставката или монтажа",
          ],
        },
        {
          heading: "Предаване извън ЕС",
          paragraphs: [
            "Някои доставчици са със седалище в САЩ. Предаването на данни става въз основа на Рамката за защита на данните ЕС–САЩ или стандартни договорни клаузи.",
          ],
        },
        {
          heading: "Колко време ги пазим",
          paragraphs: [
            "Данните за поръчките и счетоводните документи пазим толкова, колкото изисква Законът за счетоводството. Кореспонденцията пазим, докато е нужна за отговор и за евентуални рекламации.",
          ],
        },
        {
          heading: "Вашите права",
          paragraphs: [
            "Имате право на достъп, коригиране, изтриване, ограничаване на обработването, преносимост и възражение, както и да оттеглите съгласие по всяко време. Пишете ни на имейла по-горе. Имате право на жалба до Комисията за защита на личните данни (www.cpdp.bg).",
          ],
        },
      ],
    },
    en: {
      title: "Privacy policy",
      description: "What personal data we collect, why, who we share it with, how long we keep it and your rights.",
      sections: [
        { heading: "Controller", paragraphs: [`The controller is ${TRADER_EN}, email contact@justpurrrfect.com.`] },
        {
          heading: "What we process",
          paragraphs: ["Only the data we need:"],
          list: [
            "for an order: name, email, phone, delivery address and the order contents",
            "for an account: name and email, and for email-and-password sign-in a one-way hash of the password (never the password itself)",
            "for an enquiry or an email to us: your details and the message, including attachments",
            "technical: the cookies described in the Cookie policy",
          ],
        },
        {
          heading: "Why, and on what basis",
          paragraphs: [
            "To fulfil the order or installation (contract), to keep accounts and issue documents (legal obligation), and to answer you and protect the shop from abuse (legitimate interest). Card data is processed only by Stripe.",
          ],
        },
        {
          heading: "Who we share it with",
          paragraphs: ["Providers that process data on our behalf:"],
          list: [
            "Stripe: payments",
            "Resend: sending and receiving email",
            "Vercel and Amazon Web Services: hosting and files",
            "Neon: the database",
            "couriers and installation partners: only what delivery or installation needs",
          ],
        },
        {
          heading: "Transfers outside the EU",
          paragraphs: [
            "Some providers are based in the US. Transfers rely on the EU–US Data Privacy Framework or standard contractual clauses.",
          ],
        },
        {
          heading: "How long we keep it",
          paragraphs: [
            "Order data and accounting documents for as long as the Accountancy Act requires; correspondence for as long as needed to answer and handle any complaints.",
          ],
        },
        {
          heading: "Your rights",
          paragraphs: [
            "You have the right of access, rectification, erasure, restriction, portability and objection, and may withdraw consent at any time. Email us at the address above. You may complain to the Commission for Personal Data Protection (www.cpdp.bg).",
          ],
        },
      ],
    },
  },
  biskvitki: {
    bg: {
      title: "Политика за бисквитките",
      description: "Кои бисквитки ползва магазинът и защо.",
      sections: [
        {
          heading: "Само необходимите",
          paragraphs: [
            "Магазинът ползва само бисквитки, без които не може да работи. Не ползваме бисквитки за анализ или реклама, затова не искаме съгласие. Ако това се промени, ще ви попитаме преди да ги запишем.",
          ],
          list: [
            "cart_session_id: пази количката, докато пазарувате без профил; 30 дни",
            "authjs.session-token: пази входа в профила ви; 30 дни",
            "authjs.csrf-token и authjs.callback-url: защитават входа и ви връщат на страницата, от която сте влезли; до затваряне на браузъра",
            "authjs.state, authjs.pkce.code_verifier, authjs.nonce: само по време на вход с Google; 15 минути",
          ],
        },
        {
          heading: "Имената",
          paragraphs: ["На защитена връзка (https) имената на бисквитките за вход започват с __Secure- или __Host-."],
        },
        {
          heading: "Плащането",
          paragraphs: [
            "Плащането се извършва на страницата на Stripe (checkout.stripe.com), която ползва свои бисквитки според собствената си политика.",
          ],
        },
      ],
    },
    en: {
      title: "Cookie policy",
      description: "Which cookies the shop uses and why.",
      sections: [
        {
          heading: "Only the necessary ones",
          paragraphs: [
            "The shop uses only cookies it cannot work without. We use no analytics or advertising cookies, so we do not ask for consent. If that changes, we will ask before setting them.",
          ],
          list: [
            "cart_session_id: keeps your cart while you shop without an account; 30 days",
            "authjs.session-token: keeps you signed in; 30 days",
            "authjs.csrf-token and authjs.callback-url: protect signing in and bring you back to the page you came from; until you close the browser",
            "authjs.state, authjs.pkce.code_verifier, authjs.nonce: only while signing in with Google; 15 minutes",
          ],
        },
        {
          heading: "The names",
          paragraphs: ["On a secure connection (https) the sign-in cookie names start with __Secure- or __Host-."],
        },
        {
          heading: "Payment",
          paragraphs: [
            "Payment happens on Stripe's page (checkout.stripe.com), which uses its own cookies under its own policy.",
          ],
        },
      ],
    },
  },
  "za-nas": {
    bg: {
      title: "За нас",
      description: "Кои сме и как работим: уреди за отопление и климатизация с доставка и монтаж до ключ.",
      sections: [
        {
          heading: "Какво правим",
          paragraphs: [
            "Предлагаме уреди за отопление и климатизация, от термопомпи и пелетни камини до радиатори и лири за баня, и ги монтираме до ключ. Целта ни е не просто да продадем уред, а домът ви да е топъл през зимата и прохладен през лятото.",
          ],
        },
        {
          heading: "Как работим",
          paragraphs: [
            "Помагаме да изберете решение, идваме на оглед, даваме оферта, монтираме и пускаме системата, и оставаме на разположение за сервиз. Целият разговор с нас остава на едно място, на имейла ни.",
          ],
        },
        {
          heading: "Данни за фирмата",
          paragraphs: [`${TRADER_BG}. Имейл: contact@justpurrrfect.com.`],
        },
      ],
    },
    en: {
      title: "About us",
      description: "Who we are and how we work: heating and cooling units with delivery and turnkey installation.",
      sections: [
        {
          heading: "What we do",
          paragraphs: [
            "We offer heating and cooling units, from heat pumps and pellet stoves to radiators and towel rails, and install them turnkey. The aim is not just to sell a unit but a home that is warm in winter and cool in summer.",
          ],
        },
        {
          heading: "How we work",
          paragraphs: [
            "We help you choose, come for a site visit, quote, install and commission the system, and stay available for service. The whole conversation with us stays in one place, our email.",
          ],
        },
        { heading: "Company details", paragraphs: [`${TRADER_EN}. Email: contact@justpurrrfect.com.`] },
      ],
    },
  },
};

export function infoText(slug: InfoSlug, locale: string): InfoText {
  return locale === "en" ? INFO_PAGES[slug].en : INFO_PAGES[slug].bg;
}
