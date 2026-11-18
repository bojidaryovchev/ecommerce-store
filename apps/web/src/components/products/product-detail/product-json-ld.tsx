import { SITE_URL } from "@/lib/site-url";
import React from "react";

type Availability = "InStock" | "OutOfStock" | "BackOrder" | "Discontinued";

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
  /** The category trail, "Термопомпи > Термопомпи моноблок". */
  category?: string | null;
  color?: string | null;
  /** Barcode digits (8, 12, 13 or 14), and the manufacturer's part number, from the catalogue enrichment. */
  gtin?: string | null;
  mpn?: string | null;
  /** The product's registration number in the EU energy label database (EPREL). */
  eprel?: string | null;
  /** Customer reviews: the average and count over all of them, and the latest few in full. */
  rating?: { value: number; count: number } | null;
  reviews?: Array<{ author: string; rating: number; date: string; body: string | null }>;
  /** Breadcrumb trail, home first: [name, absolute url]. */
  breadcrumbs: Array<{ name: string; url: string }>;
}

// "</script>" inside JSON would end the script tag; escape "<" without writing a backslash literal here.
const LESS_THAN_ESCAPE = String.fromCharCode(92) + "u003c";
const toScript = (data: unknown) => JSON.stringify(data).replaceAll("<", LESS_THAN_ESCAPE);

/** Cut at a word, not in the middle of one. */
const clip = (text: string, max: number) => {
  if (text.length <= max) return text;
  const cut = text.slice(0, max);
  return `${cut.slice(0, Math.max(cut.lastIndexOf(" "), max - 40)).trimEnd()}…`;
};

const absolute = (url: string) => (url.startsWith("http") ? url : `${SITE_URL}${url.startsWith("/") ? "" : "/"}${url}`);

/**
 * schema.org Product + BreadcrumbList for rich results. Product goes out only with an offer or customer
 * ratings: Google's product snippets need one of them, and a price-on-request product has no offer. The offer
 * carries the delivery terms (lib/delivery.ts) and the 14-day return policy, at the customer's cost.
 */
const ProductJsonLd: React.FC<Props> = (props) => {
  const rated = props.rating && props.rating.count > 0;
  const product = (props.price || rated) && {
    "@context": "https://schema.org",
    "@type": "Product",
    name: props.name,
    ...(props.description && { description: clip(props.description, 1000) }),
    ...(props.images.length > 0 && { image: props.images.map(absolute) }),
    ...(props.category && { category: props.category }),
    ...(props.color && { color: props.color }),
    sku: props.sku,
    ...(props.gtin &&
      /^(\d{8}|\d{12}|\d{13}|\d{14})$/.test(props.gtin) && { [`gtin${props.gtin.length}`]: props.gtin }),
    ...(props.mpn && { mpn: props.mpn }),
    // An EU energy label needs its EPREL code (Google's merchant listing docs); the class alone is not enough.
    ...(props.eprel && {
      hasCertification: {
        "@type": "Certification",
        issuedBy: { "@type": "Organization", name: "European_Commission" },
        name: "EPREL",
        certificationIdentification: props.eprel,
      },
    }),
    ...(props.brand && { brand: { "@type": "Brand", name: props.brand } }),
    ...(rated && {
      aggregateRating: {
        "@type": "AggregateRating",
        ratingValue: props.rating!.value.toFixed(1),
        reviewCount: props.rating!.count,
        bestRating: 5,
        worstRating: 1,
      },
      review: (props.reviews ?? []).map((review) => ({
        "@type": "Review",
        author: { "@type": "Person", name: review.author },
        datePublished: review.date,
        reviewRating: { "@type": "Rating", ratingValue: review.rating, bestRating: 5, worstRating: 1 },
        ...(review.body && { reviewBody: review.body }),
      })),
    }),
    ...(props.price && {
      offers: {
        "@type": "Offer",
        url: props.url,
        price: (props.price.amount / 100).toFixed(2),
        priceCurrency: props.price.currency.toUpperCase(),
        availability: `https://schema.org/${props.availability}`,
        itemCondition: "https://schema.org/NewCondition",
        hasMerchantReturnPolicy: {
          "@type": "MerchantReturnPolicy",
          applicableCountry: "BG",
          returnPolicyCategory: "https://schema.org/MerchantReturnFiniteReturnWindow",
          merchantReturnDays: 14,
          returnMethod: "https://schema.org/ReturnByMail",
          returnFees: "https://schema.org/ReturnFeesCustomerResponsibility",
          refundType: "https://schema.org/FullRefund",
        },
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
      {product && <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: toScript(product) }} />}
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: toScript(breadcrumbs) }} />
    </>
  );
};

export { ProductJsonLd };
