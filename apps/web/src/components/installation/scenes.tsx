import type { InstallationSystemSlug } from "@/lib/installation-systems";
import React from "react";

/**
 * The blueprint scenes behind the installation stories: one drawing per system on a 1000 × 700
 * sheet. Every part the story talks about is a `<g data-layer="…">`; the story lights the layers
 * of the current step and dims the rest (see installation-story.tsx). Lines are `currentColor`;
 * hot water is `stroke-heat`, cold or cooled flows `stroke-cool`, and moving water has the `flow`
 * class (dashes that travel, still under reduced motion).
 */

const line = {
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 2,
  strokeLinecap: "round",
  strokeLinejoin: "round",
} as const;

const Grid: React.FC = () => (
  <>
    <defs>
      <pattern id="scene-grid-s" width="20" height="20" patternUnits="userSpaceOnUse">
        <path d="M20 0H0V20" fill="none" stroke="currentColor" strokeOpacity="0.06" />
      </pattern>
      <pattern id="scene-grid" width="100" height="100" patternUnits="userSpaceOnUse">
        <rect width="100" height="100" fill="url(#scene-grid-s)" />
        <path d="M100 0H0V100" fill="none" stroke="currentColor" strokeOpacity="0.1" />
      </pattern>
      <pattern id="scene-hatch" width="10" height="10" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
        <path d="M0 0V10" stroke="currentColor" strokeOpacity="0.35" strokeWidth="2" />
      </pattern>
      <pattern id="scene-dots" width="8" height="8" patternUnits="userSpaceOnUse">
        <circle cx="2" cy="2" r="1.1" fill="currentColor" fillOpacity="0.35" />
      </pattern>
    </defs>
    <rect width="1000" height="700" fill="url(#scene-grid)" />
  </>
);

/** Walls, floors and roof shared by the two house scenes. */
const HouseShell: React.FC = () => (
  <g data-layer="house" {...line}>
    <path d="M20 600 H980" strokeOpacity="0.7" />
    <path d="M80 600 V222 H640 V600" />
    <path d="M60 224 L360 70 L660 224" />
    <path d="M80 410 H640 M80 418 H640" strokeOpacity="0.6" />
    <path d="M380 222 V410 M380 418 V470 M380 520 V600" strokeOpacity="0.55" />
    <path d="M180 270 H260 V330 H180 Z M220 270 V330" strokeOpacity="0.45" />
    <path d="M470 262 H550 V322 H470 Z M510 262 V322" strokeOpacity="0.45" />
  </g>
);

const Radiator: React.FC<{ x: number; y: number; w?: number }> = ({ x, y, w = 80 }) => (
  <g {...line}>
    <rect x={x} y={y} width={w} height={36} rx="3" />
    {Array.from({ length: Math.floor(w / 13) }, (_, i) => (
      <path key={i} d={`M${x + 10 + i * 13} ${y + 5} V${y + 31}`} strokeOpacity="0.6" />
    ))}
  </g>
);

const HeatPumpScene: React.FC = () => (
  <>
    <HouseShell />
    <g data-layer="radiators">
      <Radiator x={110} y={350} />
      <Radiator x={420} y={350} />
    </g>
    <g data-layer="floor">
      <path
        className="stroke-heat"
        fill="none"
        strokeWidth="2.5"
        strokeLinecap="round"
        d="M100 590 q8 -9 16 0 t16 0 t16 0 t16 0 t16 0 t16 0 t16 0 t16 0 t16 0 t16 0 t16 0 t16 0 t16 0 t16 0 t16 0 t16 0 t16 0"
      />
    </g>
    <g data-layer="module" {...line}>
      <rect x="402" y="440" width="70" height="110" rx="6" />
      <circle cx="437" cy="520" r="14" />
      <path d="M430 520 h14 M437 513 v14" strokeOpacity="0.6" />
      <ellipse cx="495" cy="462" rx="14" ry="22" className="stroke-heat" />
    </g>
    <g data-layer="tank" {...line}>
      <path d="M540 470 Q540 445 570 445 Q600 445 600 470 V570 Q600 594 570 594 Q540 594 540 570 Z" />
      <path d="M552 560 l12 -8 l12 8 l12 -8 M552 540 l12 -8 l12 8 l12 -8" strokeOpacity="0.6" className="stroke-heat" />
    </g>
    <g data-layer="valve" {...line}>
      <path d="M505 560 l14 -8 v16 z M533 560 l-14 -8 v16 z" className="stroke-heat" />
    </g>
    <g data-layer="pipes" fill="none" strokeWidth="2.5" strokeLinecap="round">
      <path className="stroke-heat" d="M720 520 H640 M640 520 H472" />
      <path className="stroke-cool" d="M720 545 H640 M640 545 H472" />
    </g>
    <g
      data-layer="clearance"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeDasharray="6 7"
      strokeOpacity="0.6"
    >
      <rect x="678" y="428" width="248" height="186" rx="10" />
    </g>
    <g data-layer="outdoor" {...line}>
      <rect x="720" y="470" width="160" height="112" rx="6" />
      <circle cx="782" cy="526" r="36" />
      <path d="M782 490 V562 M746 526 H818" strokeOpacity="0.4" />
      <path
        d="M840 488 H866 M840 502 H866 M840 516 H866 M840 530 H866 M840 544 H866 M840 558 H866"
        strokeOpacity="0.6"
      />
      <path d="M736 582 V600 M864 582 V600" />
    </g>
    <g data-layer="control" {...line}>
      <rect x="320" y="462" width="26" height="38" rx="4" />
      <circle cx="333" cy="476" r="6" className="stroke-heat" />
    </g>
    <g data-layer="flow" fill="none" strokeWidth="2.5" strokeLinecap="round">
      <path className="flow stroke-heat" d="M402 470 H392 V380 H200 M392 380 H500 M392 470 V590 H360" />
    </g>
  </>
);

const PelletScene: React.FC = () => (
  <>
    <HouseShell />
    <g data-layer="flue" {...line}>
      <path d="M222 470 V160" />
      <path d="M208 200 V118 H236 V200" />
      <path d="M200 112 H244" />
    </g>
    <g data-layer="stove" {...line}>
      <rect x="180" y="470" width="84" height="128" rx="8" />
      <rect x="194" y="500" width="56" height="44" rx="4" />
      <path className="stroke-heat" d="M206 536 q8 -20 14 -7 q6 -16 14 7" />
      <path d="M180 482 H264" strokeOpacity="0.5" />
      <path d="M194 560 h56 M194 572 h56" strokeOpacity="0.35" />
    </g>
    <g data-layer="safety" {...line}>
      <circle cx="300" cy="540" r="13" />
      <path d="M294 540 h12" strokeOpacity="0.6" />
      <ellipse cx="335" cy="500" rx="13" ry="20" className="stroke-heat" />
      <path d="M300 470 v-14 m-8 0 h16" />
    </g>
    <g data-layer="pipes" fill="none" strokeWidth="2.5" strokeLinecap="round">
      <path className="stroke-heat" d="M264 520 H287 M313 520 H360 V375 H200 M360 375 H520 M360 540 H540" />
      <path className="stroke-cool" d="M264 580 H370 V395 M370 580 H540" />
    </g>
    <g data-layer="radiators">
      <Radiator x={110} y={350} />
      <Radiator x={420} y={350} />
      <Radiator x={420} y={540} />
    </g>
    <g data-layer="tank" {...line}>
      <path d="M560 470 Q560 448 590 448 Q620 448 620 470 V570 Q620 594 590 594 Q560 594 560 570 Z" />
      <path d="M572 560 l12 -8 l12 8 l12 -8" className="stroke-heat" strokeOpacity="0.7" />
    </g>
    <g data-layer="control" {...line}>
      <rect x="320" y="440" width="22" height="30" rx="4" />
    </g>
    <g data-layer="flow" fill="none" strokeWidth="2.5" strokeLinecap="round">
      <path className="flow stroke-heat" d="M360 375 H200 M360 375 H520 M360 540 H540" />
    </g>
  </>
);

const AirConditionerScene: React.FC = () => (
  <>
    <g data-layer="room" {...line}>
      <path d="M40 600 H620 M40 80 H620" strokeOpacity="0.7" />
      <path d="M40 80 V600" strokeOpacity="0.4" />
      <path d="M100 470 H260 M120 470 V600 M240 470 V600" strokeOpacity="0.5" />
      <path d="M660 600 H980" strokeOpacity="0.7" />
    </g>
    <g data-layer="wall">
      <rect x="620" y="60" width="40" height="540" fill="url(#scene-hatch)" />
      <path d="M620 60 V600 M660 60 V600" {...line} />
      <path d="M620 160 L660 170" {...line} strokeOpacity="0.8" />
    </g>
    <g data-layer="indoor" {...line}>
      <path d="M300 128 H556 Q566 128 566 138 V182 Q566 192 556 192 H300 Q290 192 290 182 V138 Q290 128 300 128 Z" />
      <path d="M306 176 H550" strokeOpacity="0.5" />
    </g>
    <g data-layer="air" fill="none" strokeWidth="2.5" strokeLinecap="round">
      <path
        className="stroke-cool"
        d="M330 214 q16 18 0 36 M380 214 q16 18 0 36 M430 214 q16 18 0 36 M480 214 q16 18 0 36 M530 214 q16 18 0 36"
      />
    </g>
    <g data-layer="pipes" fill="none" strokeWidth="2.5" strokeLinecap="round">
      <path className="stroke-cool" d="M566 150 H620 L660 160 H700 V430 H736" />
      <path className="stroke-heat" d="M566 162 H620 L660 172 H690 V442 H736" />
    </g>
    <g data-layer="drain" fill="none" stroke="currentColor" strokeWidth="2" strokeDasharray="5 6" strokeOpacity="0.8">
      <path d="M566 176 H620 L660 186 H678 V600" />
    </g>
    <g data-layer="bracket" {...line}>
      <path d="M716 486 H940 M740 486 L716 520 M916 486 L940 520 M716 520 V470 M940 520 V470" />
    </g>
    <g data-layer="outdoor" {...line}>
      <rect x="736" y="360" width="190" height="122" rx="6" />
      <circle cx="808" cy="421" r="40" />
      <path d="M808 381 V461 M768 421 H848" strokeOpacity="0.4" />
      <path
        d="M876 378 H912 M876 394 H912 M876 410 H912 M876 426 H912 M876 442 H912 M876 458 H912"
        strokeOpacity="0.6"
      />
    </g>
    <g data-layer="gauges" {...line}>
      <circle cx="790" cy="250" r="22" />
      <circle cx="850" cy="250" r="22" />
      <path d="M790 250 l10 -10 M850 250 l-8 -12" className="stroke-heat" />
      <path d="M790 272 V330 Q790 350 770 350 H760 M850 272 V300" strokeOpacity="0.7" />
      <rect x="760" y="530" width="100" height="60" rx="8" />
      <path d="M810 530 V350" strokeOpacity="0.7" strokeDasharray="4 5" />
    </g>
    <g data-layer="remote" {...line}>
      <rect x="160" y="444" width="22" height="24" rx="4" />
      <circle cx="171" cy="452" r="3" className="stroke-cool" />
    </g>
  </>
);

const UnderfloorScene: React.FC = () => (
  <>
    <g data-layer="room" {...line}>
      <rect x="60" y="60" width="480" height="340" rx="4" strokeOpacity="0.7" />
      <path d="M60 230 H120 M480 60 V120" strokeOpacity="0.4" />
    </g>
    <g data-layer="loops" fill="none" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path
        className="stroke-heat"
        d="M540 100 H100 V130 H500 V160 H100 V190 H500 V220 H100 V250 H500 V280 H100 V310 H500 V340 H100 V370 H540"
      />
    </g>
    <g data-layer="manifold" {...line}>
      <rect x="640" y="90" width="230" height="200" rx="8" />
      <path d="M660 140 H850 M660 220 H850" />
      {[0, 1, 2, 3, 4].map((i) => (
        <g key={i}>
          <circle cx={680 + i * 40} cy={140} r="9" className="stroke-heat" />
          <circle cx={680 + i * 40} cy={220} r="9" className="stroke-cool" />
          <path d={`M${680 + i * 40} 149 V176 M${680 + i * 40} 211 V190`} strokeOpacity="0.6" />
        </g>
      ))}
      <path d="M540 100 H640 M540 370 H600 V250 H640" strokeOpacity="0.8" />
    </g>
    <g data-layer="gauge" {...line}>
      <circle cx="900" cy="350" r="34" />
      <path d="M900 350 l18 -18" className="stroke-heat" />
      <path d="M872 340 h6 M900 322 v6 M922 340 h6" strokeOpacity="0.6" />
      <path d="M870 290 V316" strokeOpacity="0.6" />
    </g>
    <g data-layer="finish">
      <path d="M40 470 H960" {...line} />
      {Array.from({ length: 12 }, (_, i) => (
        <path key={i} d={`M${40 + i * 80} 458 V470`} {...line} strokeOpacity="0.6" />
      ))}
      <path d="M40 458 H960" {...line} strokeOpacity="0.6" />
    </g>
    <g data-layer="screed">
      <rect x="50" y="470" width="910" height="78" fill="url(#scene-dots)" />
      <path d="M50 548 H960" {...line} strokeOpacity="0.5" />
    </g>
    <g data-layer="pipes" fill="none" strokeWidth="2.5">
      {Array.from({ length: 15 }, (_, i) => (
        <circle key={i} cx={90 + i * 60} cy={526} r="9" className={i % 2 ? "stroke-cool" : "stroke-heat"} />
      ))}
    </g>
    <g data-layer="insulation">
      <rect x="50" y="548" width="910" height="44" fill="url(#scene-hatch)" />
      <path d="M50 592 H960" {...line} strokeOpacity="0.6" />
    </g>
    <g data-layer="edge">
      <rect x="40" y="458" width="10" height="134" fill="currentColor" fillOpacity="0.35" />
    </g>
    <g data-layer="slab">
      <rect x="40" y="592" width="920" height="60" fill="url(#scene-hatch)" />
      <path d="M40 592 H960 V652 H40 Z" {...line} />
    </g>
    <g data-layer="heat" fill="none" strokeWidth="2.5" strokeLinecap="round">
      <path
        className="flow stroke-heat"
        d="M160 440 q12 -18 0 -36 t0 -36 M360 440 q12 -18 0 -36 t0 -36 M560 440 q12 -18 0 -36 t0 -36 M760 440 q12 -18 0 -36 t0 -36"
      />
    </g>
  </>
);

const SCENES: Record<InstallationSystemSlug, React.FC> = {
  termopompa: HeatPumpScene,
  "peletno-otoplenie": PelletScene,
  klimatik: AirConditionerScene,
  "podovo-otoplenie": UnderfloorScene,
};

/** The drawing for a system, with its grid; the viewBox is set (and animated) by the story. */
const SceneArt: React.FC<{ system: InstallationSystemSlug }> = ({ system }) => {
  const Scene = SCENES[system];
  return (
    <>
      <Grid />
      <Scene />
    </>
  );
};

export { SceneArt };
