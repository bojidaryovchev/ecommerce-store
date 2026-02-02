import { Poppins } from "next/font/google";
import React, { PropsWithChildren } from "react";

const poppins = Poppins({
  weight: ["100", "200", "300", "400", "500", "600", "700", "800", "900"],
  subsets: ["latin"],
});

const HtmlProviders: React.FC<PropsWithChildren> = ({ children }) => {
  return (
    <html lang="en" className="light" suppressHydrationWarning>
      <body className={`${poppins.className} bg-background text-foreground antialiased`}>{children}</body>
    </html>
  );
};

export default HtmlProviders;
