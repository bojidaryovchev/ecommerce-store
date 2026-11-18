import { CreditCard, ShieldCheck, Truck, Wrench } from "lucide-react";
import { useTranslations } from "next-intl";
import React from "react";

const ITEMS = [
  { key: "delivery", Icon: Truck },
  { key: "installation", Icon: Wrench },
  { key: "warranty", Icon: ShieldCheck },
  { key: "payment", Icon: CreditCard },
] as const;

/** What every order comes with, said once, under the hero. */
const TrustStrip: React.FC = () => {
  const t = useTranslations("home.trust");
  return (
    <section className="max-w-container py-12 md:py-16">
      <ul className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {ITEMS.map(({ key, Icon }) => (
          <li key={key} className="flex items-start gap-4">
            <span className="bg-primary/5 text-primary grid size-11 shrink-0 place-items-center rounded-xl">
              <Icon className="size-5" aria-hidden />
            </span>
            <span>
              <span className="block font-semibold">{t(`${key}.title`)}</span>
              <span className="text-muted-foreground mt-0.5 block text-sm">{t(`${key}.text`)}</span>
            </span>
          </li>
        ))}
      </ul>
    </section>
  );
};

export { TrustStrip };
