"use client";

import { Link } from "@/i18n/navigation";
import { gsap, REDUCED_MOTION_OK, useGSAP } from "@/lib/gsap";
import { cn } from "@/lib/utils";
import { ArrowRight } from "lucide-react";
import { useTranslations } from "next-intl";
import React, { useRef, useState } from "react";

/** Points on the plan, in the drawing's own units (a 1200 × 640 sheet), and where each leads. */
const HOTSPOTS = [
  { key: "termopompa", x: 1010, y: 470, href: "/montazh/termopompa" },
  { key: "bojler", x: 845, y: 440, href: "/montazh/termopompa" },
  { key: "peletna-kamina", x: 450, y: 470, href: "/montazh/peletno-otoplenie" },
  { key: "radiator", x: 365, y: 482, href: "/radiatori-i-konvektori" },
  { key: "podovo", x: 700, y: 548, href: "/montazh/podovo-otoplenie" },
  { key: "klimatik", x: 815, y: 262, href: "/montazh/klimatik" },
  { key: "liri", x: 352, y: 282, href: "/liri-za-banya" },
  { key: "solar", x: 436, y: 168, href: "/solarni-sistemi" },
] as const;

/** The part of the drawing shown: the house, the outdoor unit and a little ground either side. */
const VIEW = { x: 230, y: 70, w: 880, h: 535 };

/**
 * The home page's plan of a house: every system the shop installs, in place, drawn line by line as
 * it scrolls into view. The drawing is decoration; the numbered points over it and the legend
 * beside it are the links (the legend is what keyboards and screen readers use).
 */
const HouseBlueprint: React.FC = () => {
  const t = useTranslations("home.house");
  const root = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState<string | null>(null);

  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      mm.add(REDUCED_MOTION_OK, () => {
        const scope = root.current;
        if (!scope) return;
        const paths = Array.from(scope.querySelectorAll<SVGGeometryElement>("[data-draw]"));
        paths.forEach((path) => {
          const length = path.getTotalLength();
          gsap.set(path, { strokeDasharray: length, strokeDashoffset: length });
        });
        gsap
          .timeline({ scrollTrigger: { trigger: root.current, start: "top 70%", once: true } })
          .to(paths, { strokeDashoffset: 0, duration: 1.8, ease: "power2.inOut", stagger: 0.025 })
          .from(scope.querySelectorAll("[data-flow]"), { opacity: 0, duration: 0.6, stagger: 0.1 }, "-=0.6")
          .from(
            scope.querySelectorAll("[data-hotspot]"),
            { scale: 0, opacity: 0, duration: 0.45, ease: "back.out(2.2)", stagger: 0.07 },
            "-=0.4",
          );
      });
      return () => mm.revert();
    },
    { scope: root },
  );

  return (
    <div ref={root} className="grid items-center gap-10 lg:grid-cols-[22rem_1fr] lg:gap-12">
      <div>
        <p className="text-heat text-xs font-semibold tracking-[0.2em] uppercase">{t("eyebrow")}</p>
        <h2 className="mt-3 text-3xl font-bold tracking-tight text-balance md:text-4xl">{t("title")}</h2>
        <p className="text-primary-foreground/75 mt-4 leading-relaxed">{t("description")}</p>
        <ol className="mt-8 grid gap-1.5 sm:grid-cols-2 lg:grid-cols-1" aria-label={t("legend")}>
          {HOTSPOTS.map((spot, index) => (
            <li key={spot.key}>
              <Link
                href={spot.href}
                onMouseEnter={() => setActive(spot.key)}
                onMouseLeave={() => setActive(null)}
                onFocus={() => setActive(spot.key)}
                onBlur={() => setActive(null)}
                className={cn(
                  "group flex items-center gap-3 rounded-xl px-3 py-2 text-sm transition-colors",
                  active === spot.key ? "bg-white/10" : "hover:bg-white/5",
                )}
              >
                <span className="bg-heat text-heat-foreground grid size-6 shrink-0 place-items-center rounded-full text-xs font-bold tabular-nums">
                  {index + 1}
                </span>
                <span className="flex-1 font-medium">{t(`hotspots.${spot.key}`)}</span>
                <ArrowRight className="size-4 opacity-0 transition-opacity group-hover:opacity-70" aria-hidden />
              </Link>
            </li>
          ))}
        </ol>
      </div>

      <div className="relative">
        <svg
          viewBox={`${VIEW.x} ${VIEW.y} ${VIEW.w} ${VIEW.h}`}
          className="text-primary-foreground h-auto w-full"
          aria-hidden
        >
          <defs>
            <pattern id="bp-grid-s" width="20" height="20" patternUnits="userSpaceOnUse">
              <path d="M20 0H0V20" fill="none" stroke="currentColor" strokeOpacity="0.06" />
            </pattern>
            <pattern id="bp-grid" width="100" height="100" patternUnits="userSpaceOnUse">
              <rect width="100" height="100" fill="url(#bp-grid-s)" />
              <path d="M100 0H0V100" fill="none" stroke="currentColor" strokeOpacity="0.1" />
            </pattern>
          </defs>
          <rect x={VIEW.x} y={VIEW.y} width={VIEW.w} height={VIEW.h} fill="url(#bp-grid)" rx="20" />

          <g fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            {/* ground and foundation */}
            <path data-draw d="M240 560 H1100" strokeOpacity="0.7" />
            <path data-draw d="M300 560 V580 H900 V560" strokeOpacity="0.4" />
            {/* walls, floors, roof */}
            <path data-draw d="M300 560 V252 H900 V560" />
            <path data-draw d="M280 254 L600 92 L920 254" />
            <path data-draw d="M300 410 H900 M300 418 H900" strokeOpacity="0.6" />
            <path data-draw d="M600 252 V410 M600 418 V470 M600 520 V560" strokeOpacity="0.6" />
            <path data-draw d="M736 168 V118 H778 V190" />
            {/* windows and door */}
            <path data-draw d="M462 296 H540 V352 H462 Z M501 296 V352" strokeOpacity="0.55" />
            <path data-draw d="M640 300 H720 V370 H640 Z M680 300 V370" strokeOpacity="0.55" />
            <path data-draw d="M512 446 H580 V512 H512 Z M546 446 V512" strokeOpacity="0.55" />
            <path data-draw d="M722 474 H768 V560" strokeOpacity="0.55" />

            {/* solar collector on the roof, its tubes */}
            <path data-draw d="M372 199 L494 138 L503 155 L381 216 Z" />
            <path
              data-draw
              d="M392 189 L401 206 M412 179 L421 196 M432 169 L441 186 M452 159 L461 176 M472 149 L481 166"
              strokeOpacity="0.6"
            />

            {/* towel rail in the bathroom */}
            <path data-draw d="M336 290 V384 M370 290 V384" />
            <path
              data-draw
              d="M336 302 H370 M336 318 H370 M336 334 H370 M336 350 H370 M336 366 H370 M336 380 H370"
              strokeOpacity="0.75"
            />

            {/* air conditioner in the bedroom, its line to the outside */}
            <path
              data-draw
              d="M772 270 H860 Q866 270 866 276 V292 Q866 298 860 298 H772 Q766 298 766 292 V276 Q766 270 772 270 Z"
            />
            <path data-draw d="M866 284 H900" strokeOpacity="0.6" />

            {/* radiator in the living room */}
            <path data-draw d="M328 496 H404 V532 H328 Z" />
            <path
              data-draw
              d="M341 500 V528 M354 500 V528 M367 500 V528 M380 500 V528 M393 500 V528"
              strokeOpacity="0.6"
            />

            {/* pellet stove with its glass, flue */}
            <path data-draw d="M424 480 H478 V558 H424 Z" />
            <path data-draw d="M434 500 H468 V530 H434 Z" strokeOpacity="0.7" />
            <path data-draw d="M451 480 V420" strokeOpacity="0.7" />

            {/* hot water tank in the technical room */}
            <path data-draw d="M822 470 Q822 448 846 448 Q870 448 870 470 V536 Q870 556 846 556 Q822 556 822 536 Z" />

            {/* outdoor unit of the heat pump, its fan and grille */}
            <path data-draw d="M954 478 H1066 V558 H954 Z" />
            <circle data-draw cx="996" cy="518" r="27" />
            <path
              data-draw
              d="M1040 492 H1058 M1040 504 H1058 M1040 516 H1058 M1040 528 H1058 M1040 540 H1058"
              strokeOpacity="0.6"
            />
          </g>

          {/* what flows: hot water, warm floors, the fire, cool air */}
          <g fill="none" strokeWidth="2.5" strokeLinecap="round">
            <path data-flow className="stroke-heat" d="M954 506 H900 M900 506 H870" />
            <path data-flow className="stroke-cool" d="M954 532 H900 M900 532 H870" />
            <path data-flow className="stroke-heat" d="M424 514 H404" />
            <path
              data-flow
              className="stroke-heat"
              d="M612 551 q9 -8 18 0 t18 0 t18 0 t18 0 t18 0 t18 0 t18 0 t18 0 t18 0 t18 0 t18 0"
            />
            <path data-flow className="stroke-heat" d="M440 524 q5 -14 9 -5 q4 -12 9 5" />
            <path
              data-flow
              className="stroke-cool"
              d="M782 308 q9 9 0 18 M806 308 q9 9 0 18 M830 308 q9 9 0 18 M854 308 q9 9 0 18"
            />
          </g>
        </svg>

        {HOTSPOTS.map((spot, index) => (
          <Link
            key={spot.key}
            href={spot.href}
            data-hotspot
            tabIndex={-1}
            aria-hidden
            onMouseEnter={() => setActive(spot.key)}
            onMouseLeave={() => setActive(null)}
            style={{ left: `${((spot.x - VIEW.x) / VIEW.w) * 100}%`, top: `${((spot.y - VIEW.y) / VIEW.h) * 100}%` }}
            className="group absolute -translate-x-1/2 -translate-y-1/2"
          >
            <span className="bg-heat/40 absolute inset-0 animate-ping rounded-full [animation-duration:2.4s]" />
            <span
              className={cn(
                "bg-heat text-heat-foreground relative grid size-7 place-items-center rounded-full text-xs font-bold shadow-lg ring-4 ring-white/20 transition-transform md:size-8",
                active === spot.key && "scale-125",
              )}
            >
              {index + 1}
            </span>
            <span
              className={cn(
                "bg-background text-foreground pointer-events-none absolute bottom-full left-1/2 mb-3 hidden -translate-x-1/2 rounded-lg px-3 py-1.5 text-xs font-semibold whitespace-nowrap shadow-xl transition-opacity md:block",
                active === spot.key ? "opacity-100" : "opacity-0",
              )}
            >
              {t(`hotspots.${spot.key}`)}
            </span>
          </Link>
        ))}
      </div>
    </div>
  );
};

export { HouseBlueprint };
