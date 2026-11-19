import { EnergyLabel } from "@/components/products/energy-label/energy-label";
import { getEnergyLabels } from "@/queries/products";
import React from "react";

/** A card's energy label next to its price, from the one cached map of every product's label. */
const CardEnergyLabel: React.FC<{ productId: string; className?: string }> = async ({ productId, className }) => {
  const view = (await getEnergyLabels())[productId];
  return view ? <EnergyLabel {...view} className={className} /> : null;
};

export { CardEnergyLabel };
