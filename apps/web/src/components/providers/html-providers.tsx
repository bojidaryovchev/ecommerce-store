import { Montserrat } from "next/font/google";
import React, { PropsWithChildren } from "react";

// Montserrat covers Cyrillic (Poppins does not, so Bulgarian text fell back to a system font).
const montserrat = Montserrat({
  subsets: ["latin", "cyrillic"],
  display: "swap",
});

interface Props extends PropsWithChildren {
  lang: string;
}

const HtmlProviders: React.FC<Props> = ({ lang, children }) => {
  return (
    <html lang={lang} className="light" suppressHydrationWarning>
      <body className={`${montserrat.className} bg-background text-foreground antialiased`}>{children}</body>
    </html>
  );
};

export default HtmlProviders;
