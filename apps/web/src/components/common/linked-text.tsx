import { Link } from "@/i18n/navigation";
import { resourceSegments } from "@/lib/resource-links";
import React from "react";

/** Text with the shop's guides, calculators and installation pages linked where it names them (lib/resource-links.ts). */
const LinkedText: React.FC<{ text: string }> = ({ text }) => (
  <>
    {resourceSegments(text).map((segment, index) =>
      typeof segment === "string" ? (
        <React.Fragment key={index}>{segment}</React.Fragment>
      ) : (
        <Link key={index} href={segment.href} className="text-primary font-medium underline underline-offset-2">
          {segment.text}
        </Link>
      ),
    )}
  </>
);

export { LinkedText };
