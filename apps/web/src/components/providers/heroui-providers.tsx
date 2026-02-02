"use client";

import { HeroUIProvider } from "@heroui/react";
import { useRouter } from "next/navigation";
import React, { PropsWithChildren } from "react";

const HeroUIProviders: React.FC<PropsWithChildren> = ({ children }) => {
  const router = useRouter();

  return (
    <HeroUIProvider navigate={router.push} validationBehavior="native">
      {children}
    </HeroUIProvider>
  );
};

export default HeroUIProviders;
