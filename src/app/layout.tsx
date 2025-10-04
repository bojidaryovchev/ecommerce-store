import Providers from "@/components/providers";
import { SITE_DESCRIPTION, SITE_TITLE } from "@/constants";
import type { Metadata } from "next";
import React, { PropsWithChildren } from "react";
import "./globals.css";

export const metadata: Metadata = {
  title: SITE_TITLE,
  description: SITE_DESCRIPTION,
};

const RootLayout: React.FC<PropsWithChildren> = ({ children }) => {
  return (
    <>
      <Providers>{children}</Providers>
    </>
  );
};

export default RootLayout;
