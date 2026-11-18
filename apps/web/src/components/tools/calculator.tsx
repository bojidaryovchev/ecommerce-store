"use client";

import { Link } from "@/i18n/navigation";
import {
  airConditionerPower,
  heatPumpPower,
  radiatorPower,
  TOOL_LINKS,
  type Climate,
  type Insulation,
  type RoomInsulation,
  type Tool,
  type WaterRegime,
} from "@/lib/calculators";
import { cn } from "@/lib/utils";
import { useFormatter, useTranslations } from "next-intl";
import React, { useId, useState } from "react";

/** A number with a slider and a field that stay in step. */
const NumberField: React.FC<{
  label: string;
  value: number;
  onChange: (value: number) => void;
  min: number;
  max: number;
  step?: number;
  unit: string;
}> = ({ label, value, onChange, min, max, step = 1, unit }) => {
  const id = useId();
  const clamp = (next: number) => Math.min(max, Math.max(min, Number.isFinite(next) ? next : min));
  return (
    <div>
      <div className="flex items-center justify-between gap-4">
        <label htmlFor={id} className="text-sm font-medium">
          {label}
        </label>
        <span className="flex items-center gap-1.5">
          <input
            id={id}
            type="number"
            inputMode="decimal"
            min={min}
            max={max}
            step={step}
            value={value}
            onChange={(event) => onChange(clamp(Number(event.target.value)))}
            className="focus:border-ring w-20 rounded-lg border px-2 py-1 text-right text-sm tabular-nums outline-none"
          />
          <span className="text-muted-foreground w-6 text-sm">{unit}</span>
        </span>
      </div>
      <input
        type="range"
        aria-hidden
        tabIndex={-1}
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(event) => onChange(clamp(Number(event.target.value)))}
        className="accent-heat mt-3 w-full"
      />
    </div>
  );
};

function Choice<T extends string>({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: T;
  options: Array<{ value: T; label: string }>;
  onChange: (value: T) => void;
}) {
  return (
    <fieldset>
      <legend className="text-sm font-medium">{label}</legend>
      <div className="mt-2 grid gap-2">
        {options.map((option) => (
          <label
            key={option.value}
            className={cn(
              "flex cursor-pointer items-center gap-3 rounded-xl border px-4 py-2.5 text-sm transition-colors",
              value === option.value ? "border-primary bg-primary/5 font-medium" : "hover:border-primary/30",
            )}
          >
            <input
              type="radio"
              checked={value === option.value}
              onChange={() => onChange(option.value)}
              className="accent-primary"
            />
            {option.label}
          </label>
        ))}
      </div>
    </fieldset>
  );
}

const Toggle: React.FC<{ label: string; checked: boolean; onChange: (checked: boolean) => void }> = ({
  label,
  checked,
  onChange,
}) => (
  <label className="flex cursor-pointer items-center gap-3 text-sm">
    <input
      type="checkbox"
      checked={checked}
      onChange={(event) => onChange(event.target.checked)}
      className="accent-primary size-4"
    />
    {label}
  </label>
);

const Result: React.FC<{ tool: Tool; children: React.ReactNode }> = ({ tool, children }) => {
  const t = useTranslations("tools");
  const links = TOOL_LINKS[tool];
  return (
    <div className="bg-primary text-primary-foreground rounded-3xl p-7 md:p-9" aria-live="polite">
      <p className="text-heat-soft text-xs font-semibold tracking-[0.2em] uppercase">{t("result")}</p>
      <div className="mt-4 space-y-5">{children}</div>
      <p className="text-primary-foreground/70 mt-6 border-t border-white/15 pt-5 text-sm">{t("approx")}</p>
      <div className="mt-6 flex flex-wrap gap-3">
        <Link
          href={`/kontakti?tema=ogled${links.installation ? `&sistema=${links.installation}` : ""}`}
          className="bg-heat text-heat-foreground hover:bg-heat/90 inline-flex h-11 items-center rounded-full px-6 text-sm font-semibold transition-colors"
        >
          {t("visit")}
        </Link>
        <Link
          href={`/${links.category}`}
          className="inline-flex h-11 items-center rounded-full border border-white/30 px-6 text-sm font-semibold transition-colors hover:bg-white/10"
        >
          {t("seeProducts")}
        </Link>
      </div>
      <Link
        href={`/saveti/${links.guide}`}
        className="text-primary-foreground/80 mt-4 inline-block text-sm underline underline-offset-4"
      >
        {t("guide")}
      </Link>
    </div>
  );
};

const Figure: React.FC<{ label: string; value: string; big?: boolean }> = ({ label, value, big }) => (
  <div>
    <p className="text-primary-foreground/70 text-sm">{label}</p>
    <p className={cn("font-bold tabular-nums", big ? "mt-1 text-5xl tracking-tight" : "mt-0.5 text-2xl")}>{value}</p>
  </div>
);

const HeatPumpCalculator: React.FC = () => {
  const t = useTranslations("tools.termopompa");
  const tu = useTranslations("tools.units");
  const format = useFormatter();
  const [area, setArea] = useState(120);
  const [insulation, setInsulation] = useState<Insulation>("insulated");
  const [climate, setClimate] = useState<Climate>("lowland");
  const [hotWater, setHotWater] = useState(true);
  const [people, setPeople] = useState(4);
  const result = heatPumpPower({ area, insulation, climate, hotWater, people });
  const kw = (value: number) => `${format.number(value, { maximumFractionDigits: 1 })} ${tu("kw")}`;

  return (
    <div className="grid items-start gap-8 lg:grid-cols-[1fr_24rem]">
      <div className="bg-card space-y-7 rounded-3xl border p-7 md:p-9">
        <NumberField label={t("area")} value={area} onChange={setArea} min={20} max={600} step={5} unit={tu("m2")} />
        <Choice
          label={t("insulation")}
          value={insulation}
          onChange={setInsulation}
          options={(["new", "insulated", "none"] as const).map((value) => ({
            value,
            label: t(`insulations.${value}`),
          }))}
        />
        <Choice
          label={t("climate")}
          value={climate}
          onChange={setClimate}
          options={(["lowland", "mountain"] as const).map((value) => ({ value, label: t(`climates.${value}`) }))}
        />
        <Toggle label={t("water")} checked={hotWater} onChange={setHotWater} />
        {hotWater && <NumberField label={t("people")} value={people} onChange={setPeople} min={1} max={10} unit="" />}
      </div>
      <Result tool="termopompa">
        <Figure label={t("recommended")} value={result.recommended ? kw(result.recommended) : "—"} big />
        <div className="grid grid-cols-2 gap-4">
          <Figure label={t("heatLoss")} value={kw(result.heating)} />
          {hotWater && <Figure label={t("waterAdd")} value={kw(result.hotWater)} />}
        </div>
      </Result>
    </div>
  );
};

const AirConditionerCalculator: React.FC = () => {
  const t = useTranslations("tools.klimatik");
  const tu = useTranslations("tools.units");
  const format = useFormatter();
  const [area, setArea] = useState(25);
  const [height, setHeight] = useState(2.6);
  const [sunny, setSunny] = useState(false);
  const [topFloor, setTopFloor] = useState(false);
  const [kitchen, setKitchen] = useState(false);
  const [people, setPeople] = useState(2);
  const result = airConditionerPower({ area, height, sunny, topFloor, kitchen, people });

  return (
    <div className="grid items-start gap-8 lg:grid-cols-[1fr_24rem]">
      <div className="bg-card space-y-7 rounded-3xl border p-7 md:p-9">
        <NumberField label={t("area")} value={area} onChange={setArea} min={8} max={90} unit={tu("m2")} />
        <NumberField
          label={t("height")}
          value={height}
          onChange={setHeight}
          min={2.2}
          max={4}
          step={0.1}
          unit={tu("m")}
        />
        <div className="space-y-3">
          <Toggle label={t("sunny")} checked={sunny} onChange={setSunny} />
          <Toggle label={t("topFloor")} checked={topFloor} onChange={setTopFloor} />
          <Toggle label={t("kitchen")} checked={kitchen} onChange={setKitchen} />
        </div>
        <NumberField label={t("people")} value={people} onChange={setPeople} min={1} max={10} unit="" />
      </div>
      <Result tool="klimatik">
        <Figure
          label={t("recommended")}
          value={result.recommended ? `${format.number(result.recommended)} ${tu("btu")}` : "24 000+ BTU"}
          big
        />
        <Figure
          label={t("need")}
          value={`${format.number(result.kw, { maximumFractionDigits: 1 })} ${tu("kw")} · ${format.number(Math.round(result.btu / 100) * 100)} ${tu("btu")}`}
        />
      </Result>
    </div>
  );
};

const RadiatorCalculator: React.FC = () => {
  const t = useTranslations("tools.radiatori");
  const tu = useTranslations("tools.units");
  const format = useFormatter();
  const [area, setArea] = useState(15);
  const [height, setHeight] = useState(2.6);
  const [insulation, setInsulation] = useState<RoomInsulation>("average");
  const [regime, setRegime] = useState<WaterRegime>("high");
  const result = radiatorPower({ area, height, insulation, regime });
  const watts = (value: number) => `${format.number(Math.round(value / 10) * 10)} ${tu("w")}`;

  return (
    <div className="grid items-start gap-8 lg:grid-cols-[1fr_24rem]">
      <div className="bg-card space-y-7 rounded-3xl border p-7 md:p-9">
        <NumberField label={t("area")} value={area} onChange={setArea} min={4} max={80} unit={tu("m2")} />
        <NumberField
          label={t("height")}
          value={height}
          onChange={setHeight}
          min={2.2}
          max={4}
          step={0.1}
          unit={tu("m")}
        />
        <Choice
          label={t("insulation")}
          value={insulation}
          onChange={setInsulation}
          options={(["good", "average", "poor"] as const).map((value) => ({ value, label: t(`insulations.${value}`) }))}
        />
        <Choice
          label={t("regime")}
          value={regime}
          onChange={setRegime}
          options={(["high", "medium", "low"] as const).map((value) => ({ value, label: t(`regimes.${value}`) }))}
        />
      </div>
      <Result tool="radiatori">
        <Figure label={t("rated")} value={watts(result.rated)} big />
        <Figure label={t("need")} value={watts(result.need)} />
        <div>
          <p className="text-primary-foreground/70 text-sm">{t("lengths")}</p>
          <ul className="mt-2 grid grid-cols-3 gap-2">
            {(["11", "22", "33"] as const).map((type) => (
              <li key={type} className="rounded-xl bg-white/10 px-3 py-2 text-center">
                <span className="text-primary-foreground/70 block text-xs">{t(`types.${type}`)}</span>
                <span className="block font-semibold tabular-nums">
                  {format.number(result.lengths[type])} {tu("mm")}
                </span>
              </li>
            ))}
          </ul>
        </div>
      </Result>
    </div>
  );
};

const CALCULATORS: Record<Tool, React.FC> = {
  termopompa: HeatPumpCalculator,
  klimatik: AirConditionerCalculator,
  radiatori: RadiatorCalculator,
};

const ToolCalculator: React.FC<{ tool: Tool }> = ({ tool }) => {
  const Calculator = CALCULATORS[tool];
  return <Calculator />;
};

export { ToolCalculator };
