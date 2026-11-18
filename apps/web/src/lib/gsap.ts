"use client";

import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

/**
 * GSAP with the plugins the storefront uses, registered once. Import from here, never from "gsap"
 * directly, so ScrollTrigger is always registered before a timeline asks for it.
 *
 * Every animation goes through `gsap.matchMedia()` with REDUCED_MOTION_OK: visitors who ask for
 * reduced motion get the finished state, never a half-hidden one.
 */
gsap.registerPlugin(ScrollTrigger, useGSAP);

export const REDUCED_MOTION_OK = "(prefers-reduced-motion: no-preference)";

export { gsap, ScrollTrigger, useGSAP };
