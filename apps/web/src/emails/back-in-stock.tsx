import React from "react";
import { Button, Heading, Text } from "react-email";
import { emailCopy, emailLink, type EmailLocale } from "./copy";
import { EmailLayout, styles } from "./layout";

type BackInStockEmailProps = {
  locale: EmailLocale;
  productName: string;
  /** The product page, relative to the site ("/produkt/…"). */
  productPath: string;
  /** The price with VAT as the customer reads it, when the product has one. */
  price: string | null;
};

/** The one email a stock alert sends: the product is back. Nothing else is sent to the address. */
const BackInStockEmail: React.FC<BackInStockEmailProps> = ({ locale, productName, productPath, price }) => {
  const t = emailCopy(locale);

  return (
    <EmailLayout locale={locale} preview={t("stockAlert.preview", { product: productName })}>
      <Heading style={styles.h1}>{t("stockAlert.title")}</Heading>
      <Text style={styles.text}>{t("stockAlert.text", { product: productName })}</Text>
      {price && <Text style={styles.text}>{t("stockAlert.price", { price })}</Text>}
      <Button href={emailLink(locale, productPath)} style={{ ...styles.button, margin: "8px 0 16px" }}>
        {t("stockAlert.open")}
      </Button>
      <Text style={styles.small}>{t("stockAlert.why")}</Text>
    </EmailLayout>
  );
};

export { BackInStockEmail };
export type { BackInStockEmailProps };
