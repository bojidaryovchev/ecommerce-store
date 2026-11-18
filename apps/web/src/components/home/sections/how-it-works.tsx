"use client";

import { gsap, REDUCED_MOTION_OK, useGSAP } from "@/lib/gsap";
import { ClipboardCheck, Home, MousePointerClick, Wrench } from "lucide-react";
import { useTranslations } from "next-intl";
import React, { useRef } from "react";
import { SectionHeading } from "./section-heading";

const STEPS = [
  { key: "choose", Icon: MousePointerClick },
  { key: "visit", Icon: ClipboardCheck },
  { key: "install", Icon: Wrench },
  { key: "handover", Icon: Home },
] as const;

/**
 * The four steps, joined by a line that fills as the section scrolls past. Without JavaScript or
 * with reduced motion the line is simply full.
 */
const HowItWorks: React.FC = () => {
  const t = useTranslations("home.howItWorks");
  const root = useRef<HTMLElement>(null);

  useGSAP(
    () => {
      const scope = root.current;
      if (!scope) return;
      const mm = gsap.matchMedia();
      mm.add(REDUCED_MOTION_OK, () => {
        gsap.fromTo(
          scope.querySelector("[data-progress]"),
          { scaleX: 0 },
          {
            scaleX: 1,
            ease: "none",
            scrollTrigger: { trigger: scope.querySelector("ol"), start: "top 80%", end: "bottom 55%", scrub: 0.6 },
          },
        );
        gsap.from(scope.querySelectorAll("[data-step]"), {
          y: 24,
          opacity: 0,
          duration: 0.7,
          ease: "power3.out",
          stagger: 0.15,
          scrollTrigger: { trigger: scope.querySelector("ol"), start: "top 85%", once: true },
        });
      });
      return () => mm.revert();
    },
    { scope: root },
  );

  return (
    <section ref={root} className="max-w-container py-16 md:py-24">
      <SectionHeading eyebrow={t("eyebrow")} title={t("title")} />
      <ol className="relative mt-12 grid gap-10 md:grid-cols-4 md:gap-8">
        <span aria-hidden className="bg-border absolute top-7 right-[12.5%] left-[12.5%] hidden h-0.5 md:block">
          <span data-progress className="bg-heat block h-full origin-left" />
        </span>
        {STEPS.map(({ key, Icon }, index) => (
          <li key={key} data-step className="relative md:text-center">
            <span className="bg-background ring-border text-primary relative mx-0 grid size-14 place-items-center rounded-2xl shadow-sm ring-1 md:mx-auto">
              <Icon className="size-6" aria-hidden />
              <span className="bg-heat text-heat-foreground absolute -top-2 -right-2 grid size-6 place-items-center rounded-full text-xs font-bold">
                {index + 1}
              </span>
            </span>
            <h3 className="mt-5 text-lg font-semibold">{t(`steps.${key}.title`)}</h3>
            <p className="text-muted-foreground mt-2 text-sm leading-relaxed md:mx-auto md:max-w-[16rem]">
              {t(`steps.${key}.text`)}
            </p>
          </li>
        ))}
      </ol>
    </section>
  );
};

export { HowItWorks };
