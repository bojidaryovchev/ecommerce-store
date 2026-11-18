"use client";

import type { Beat, BeatStage } from "@/content/installations";
import { gsap, REDUCED_MOTION_OK, ScrollTrigger, useGSAP } from "@/lib/gsap";
import type { InstallationSystemSlug } from "@/lib/installation-systems";
import { cn } from "@/lib/utils";
import React, { useEffect, useRef, useState } from "react";
import { SceneArt } from "./scenes";

type Props = {
  system: InstallationSystemSlug;
  eyebrow: string;
  title: string;
  beats: Beat[];
  stages: BeatStage[];
};

/** Layers that set the scene (walls, the room): dimmed less than the parts, so the place stays legible. */
const BASE_LAYERS = new Set(["house", "room"]);

/**
 * The scroll story of an installation: a blueprint scene pinned beside the steps. As each step
 * reaches the middle of the screen the camera (the SVG viewBox) glides to the part it talks about
 * and that part lights up. Every step is real text in the page; the drawing is decoration.
 */
const InstallationStory: React.FC<Props> = ({ system, eyebrow, title, beats, stages }) => {
  const root = useRef<HTMLElement>(null);
  const svg = useRef<SVGSVGElement>(null);
  const [active, setActive] = useState(0);
  const stage = stages[active] ?? stages[0]!;

  // Light the current step's layers and dim the rest.
  useEffect(() => {
    const layers = svg.current?.querySelectorAll<SVGGElement>("[data-layer]") ?? [];
    for (const layer of layers) {
      const name = layer.dataset.layer ?? "";
      const lit = stage.layers.length === 0 || stage.layers.includes(name);
      layer.style.opacity = lit ? "1" : BASE_LAYERS.has(name) ? "0.35" : "0.12";
    }
  }, [stage]);

  useGSAP(
    () => {
      const scope = root.current;
      if (!scope) return;
      const triggers = Array.from(scope.querySelectorAll<HTMLElement>("[data-beat]")).map((element, index) =>
        ScrollTrigger.create({
          trigger: element,
          start: "top 55%",
          end: "bottom 55%",
          onToggle: (self) => {
            if (self.isActive) setActive(index);
          },
        }),
      );
      return () => triggers.forEach((trigger) => trigger.kill());
    },
    { scope: root },
  );

  // Move the camera. Under reduced motion it cuts instead of gliding.
  useGSAP(
    () => {
      const target = svg.current;
      if (!target) return;
      const viewBox = stage.view.join(" ");
      const mm = gsap.matchMedia();
      mm.add(REDUCED_MOTION_OK, () => {
        gsap.to(target, { attr: { viewBox }, duration: 1.1, ease: "power2.inOut", overwrite: true });
      });
      mm.add("(prefers-reduced-motion: reduce)", () => {
        target.setAttribute("viewBox", viewBox);
      });
      return () => mm.revert();
    },
    { dependencies: [stage], scope: root },
  );

  return (
    <section ref={root} className="bg-primary text-primary-foreground relative">
      <div className="max-w-container grid gap-x-12 lg:grid-cols-[minmax(0,1.25fr)_minmax(0,1fr)]">
        <div className="bg-primary sticky top-[7.25rem] z-10 -mx-4 px-4 pt-4 pb-2 lg:top-[6.25rem] lg:mx-0 lg:flex lg:h-[calc(100vh-6.25rem)] lg:items-center lg:px-0 lg:py-0">
          <div className="w-full overflow-hidden rounded-3xl bg-white/[0.03] ring-1 ring-white/10">
            <svg
              ref={svg}
              viewBox={stages[0]!.view.join(" ")}
              className="text-primary-foreground block h-[38vh] w-full lg:h-auto lg:max-h-[78vh]"
              preserveAspectRatio="xMidYMid meet"
              aria-hidden
            >
              <g className="[&_[data-layer]]:transition-opacity [&_[data-layer]]:duration-500">
                <SceneArt system={system} />
              </g>
            </svg>
          </div>
          <ol className="mt-3 flex justify-center gap-1.5 lg:hidden" aria-hidden>
            {beats.map((beat, index) => (
              <li
                key={beat.title}
                className={cn(
                  "h-1.5 rounded-full transition-all",
                  index === active ? "bg-heat w-6" : "w-1.5 bg-white/30",
                )}
              />
            ))}
          </ol>
        </div>

        <div className="pt-6 pb-[30vh] lg:pt-[20vh]">
          <p className="text-heat text-xs font-semibold tracking-[0.2em] uppercase">{eyebrow}</p>
          <h2 className="mt-3 text-3xl font-bold tracking-tight text-balance md:text-4xl">{title}</h2>
          <ol className="mt-6">
            {beats.map((beat, index) => (
              <li
                key={beat.title}
                data-beat
                className={cn(
                  "flex min-h-[46vh] flex-col justify-center border-l-2 py-8 pl-6 transition-colors duration-500 lg:min-h-[62vh]",
                  index === active ? "border-heat" : "border-white/15",
                )}
              >
                <span
                  className={cn("text-sm font-semibold tabular-nums", index === active ? "text-heat" : "text-white/50")}
                >
                  {String(index + 1).padStart(2, "0")}
                </span>
                <h3 className="mt-2 text-2xl font-semibold">{beat.title}</h3>
                <p
                  className={cn(
                    "mt-3 max-w-prose text-lg leading-relaxed transition-colors duration-500",
                    index === active ? "text-white/90" : "text-white/55",
                  )}
                >
                  {beat.text}
                </p>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </section>
  );
};

export { InstallationStory };
