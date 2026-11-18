"use client";

import { gsap, REDUCED_MOTION_OK, useGSAP } from "@/lib/gsap";
import React, { useRef } from "react";

type Props = {
  children: React.ReactNode;
  className?: string;
  /** Delay between the items marked `data-reveal`, in seconds. */
  stagger?: number;
  as?: "div" | "section" | "ul";
};

/**
 * Fades and lifts the descendants marked `data-reveal` as they scroll into view. The content is
 * rendered on the server and is complete without JavaScript or with reduced motion; the animation
 * only ever starts from an element already in the page.
 */
const Reveal: React.FC<Props> = ({ children, className, stagger = 0.08, as: Tag = "div" }) => {
  const ref = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      const items = ref.current?.querySelectorAll("[data-reveal]");
      if (!items?.length) return;
      const mm = gsap.matchMedia();
      mm.add(REDUCED_MOTION_OK, () => {
        gsap.from(items, {
          y: 28,
          opacity: 0,
          duration: 0.8,
          ease: "power3.out",
          stagger,
          scrollTrigger: { trigger: ref.current, start: "top 85%", once: true },
        });
      });
      return () => mm.revert();
    },
    { scope: ref },
  );

  return React.createElement(Tag, { ref, className }, children);
};

export { Reveal };
