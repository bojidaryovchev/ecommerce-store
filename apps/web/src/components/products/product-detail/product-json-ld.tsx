import { SITE_URL } from "@/lib/site-url";
import React from "react";

type Availability = "InStock" | "OutOfStock" | "BackOrder";

interface Props {
  name: string;
  description: string | null;
  images: string[];
  brand: string | null;
  sku: string;
  /** Absolute product URL. */
  url: string;
  price: { amount: number; currency: string } | null;
  availability: Availability;
  /** Breadcrumb trail, home first: [name, absolute url]. */
  breadcrumbs: Array<{ name: string; url: string }>;
}

// "</script>" inside JSON would end the script tag; escape "<" without writing a backslash literal here.
const LESS_THAN_ESCAPE = String.fromCharCode(92) + "u003c";
const toScript = (data: unknown) => JSON.stringify(data).replaceAll("<", LESS_THAN_ESCAPE);

const absolute = (url: string) => (url.startsWith("http") ? url : `${SITE_URL}${url.startsWith("/") ? "" : "/"}${url}`);

/** schema.org Product + BreadcrumbList for rich results. */
const ProductJsonLd: React.FC<Props> = (props) => {
  const product = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: props.name,
    ...(props.description && { description: props.description.slice(0, 1000) }),
    image: props.images.map(absolute),
    sku: props.sku,
    ...(props.brand && { brand: { "@type": "Brand", name: props.brand } }),
    ...(props.price && {
      offers: {
        "@type": "Offer",
        url: props.url,
        price: (props.price.amount / 100).toFixed(2),
        priceCurrency: props.price.currency.toUpperCase(),
        availability: `https://schema.org/${props.availability}`,
        itemCondition: "https://schema.org/NewCondition",
      },
    }),
  };
  const breadcrumbs = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: props.breadcrumbs.map((crumb, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: crumb.name,
      item: crumb.url,
    })),
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: toScript(product) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: toScript(breadcrumbs) }} />
    </>
  );
};

export { ProductJsonLd };
