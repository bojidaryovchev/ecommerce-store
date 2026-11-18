import React from "react";
import { HouseBlueprint } from "../house-blueprint";

/** The dark blueprint band around the house plan. */
const BlueprintBand: React.FC = () => (
  <section className="bg-primary text-primary-foreground relative overflow-hidden py-20 md:py-24">
    <div
      aria-hidden
      className="bg-heat/20 pointer-events-none absolute -top-40 -left-40 size-[32rem] rounded-full blur-3xl"
    />
    <div
      aria-hidden
      className="bg-cool/20 pointer-events-none absolute -right-40 -bottom-40 size-[32rem] rounded-full blur-3xl"
    />
    <div className="max-w-container relative">
      <HouseBlueprint />
    </div>
  </section>
);

export { BlueprintBand };
