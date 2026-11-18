import React from "react";
import { Button, Heading, Section, Text } from "react-email";
import { emailCopy, emailLink, orderNumber, type EmailLocale } from "./copy";
import { EmailLayout, styles } from "./layout";

type OrderShippedEmailProps = {
  locale: EmailLocale;
  orderId: string;
  customerName: string | null;
  /** Signed-in customers can open the order in their account. */
  viewable: boolean;
};

const OrderShippedEmail: React.FC<OrderShippedEmailProps> = ({ locale, orderId, customerName, viewable }) => {
  const t = emailCopy(locale);
  const number = orderNumber(orderId);

  return (
    <EmailLayout locale={locale} preview={t("shipped.preview")}>
      <Heading style={styles.h1}>{t("shipped.title")}</Heading>
      <Text style={styles.text}>{t("shipped.greeting", { name: customerName || t("customer") })}</Text>
      <Text style={styles.text}>{t("shipped.text", { number })}</Text>
      <Section style={styles.box}>
        <Text style={{ ...styles.small, margin: 0 }}>{t("shipped.check")}</Text>
      </Section>
      {viewable && (
        <Button
          href={emailLink(locale, `/account/orders/${orderId}`)}
          style={{ ...styles.button, margin: "8px 0 16px" }}
        >
          {t("shipped.view")}
        </Button>
      )}
    </EmailLayout>
  );
};

export { OrderShippedEmail };
export type { OrderShippedEmailProps };
