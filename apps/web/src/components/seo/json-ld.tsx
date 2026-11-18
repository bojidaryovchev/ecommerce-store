import React from "react";

/** "<" written as its JSON escape, so text inside the data can never close the script tag. */
const LT_ESCAPE = String.fromCharCode(92) + "u003c";

/** Structured data for search engines, as a JSON-LD script. */
const JsonLd: React.FC<{ data: Record<string, unknown> | Array<Record<string, unknown>> }> = ({ data }) => (
  <script
    type="application/ld+json"
    dangerouslySetInnerHTML={{ __html: JSON.stringify(data).replace(/</g, LT_ESCAPE) }}
  />
);

export { JsonLd };
