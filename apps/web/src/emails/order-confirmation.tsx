import React from "react";
import { Button, Column, Heading, Hr, Link, Row, Section, Text } from "react-email";
import { emailCopy, emailLink, emailMoney, orderNumber, type EmailLocale } from "./copy";
import { EmailLayout, styles } from "./layout";

type OrderItem = {
  name: string;
  quantity: number;
  unitAmount: number;
  currency: string;
};

type OrderConfirmationEmailProps = {
  locale: EmailLocale;
  orderId: string;
  customerName: string | null;
  items: OrderItem[];
  subtotal: number;
  shipping: number;
  tax: number;
  discount?: number;
  total: number;
  currency: string;
  /** Signed-in customers can open the order in their account. */
  viewable: boolean;
  shippingAddress?: {
    name: string;
    line1: string;
    line2?: string;
    city: string;
    state?: string;
    postalCode: string;
    country: string;
  };
};

const row = { margin: "0 0 6px" };
const label = { color: "#5b6474", fontSize: "14px", lineHeight: "22px" };
const value = { color: "#1a1f2b", fontSize: "14px", lineHeight: "22px", textAlign: "right" as const };

/**
 * The contract's confirmation, sent once Stripe confirms the payment: what was bought, for how much,
 * where it goes, what happens next, and the right of withdrawal with the way to exercise it.
 */
const OrderConfirmationEmail: React.FC<OrderConfirmationEmailProps> = ({
  locale,
  orderId,
  customerName,
  items,
  subtotal,
  shipping,
  tax,
  discount = 0,
  total,
  currency,
  viewable,
  shippingAddress,
}) => {
  const t = emailCopy(locale);
  const number = orderNumber(orderId);
  const money = (amount: number, itemCurrency = currency) => emailMoney(locale, amount, itemCurrency);
  const country = (code: string) => {
    try {
      return new Intl.DisplayNames([locale], { type: "region" }).of(code) ?? code;
    } catch {
      return code;
    }
  };

  return (
    <EmailLayout locale={locale} preview={t("order.preview", { number })}>
      <Heading style={styles.h1}>{t("order.title")}</Heading>
      <Text style={styles.text}>{t("order.greeting", { name: customerName || t("customer") })}</Text>
      <Text style={styles.text}>{t("order.intro")}</Text>

      <Section style={styles.box}>
        <Text style={{ ...styles.small, margin: 0 }}>{t("order.number")}</Text>
        <Text
          style={{ color: "#1a1f2b", fontSize: "20px", fontWeight: 700, fontFamily: "monospace", margin: "2px 0 0" }}
        >
          #{number}
        </Text>
      </Section>

      <Heading as="h2" style={styles.h2}>
        {t("order.items")}
      </Heading>
      {items.map((item, index) => (
        <Row key={index} style={row}>
          <Column style={{ ...label, color: "#1a1f2b" }}>
            {item.name} × {item.quantity}
          </Column>
          <Column style={value}>{money(item.unitAmount * item.quantity, item.currency)}</Column>
        </Row>
      ))}

      <Hr style={{ borderColor: "#e6eaf0", margin: "16px 0" }} />

      <Row style={row}>
        <Column style={label}>{t("order.subtotal")}</Column>
        <Column style={value}>{money(subtotal)}</Column>
      </Row>
      {shipping > 0 && (
        <Row style={row}>
          <Column style={label}>{t("order.shipping")}</Column>
          <Column style={value}>{money(shipping)}</Column>
        </Row>
      )}
      {discount > 0 && (
        <Row style={row}>
          <Column style={label}>{t("order.discount")}</Column>
          <Column style={{ ...value, color: "#15803d" }}>−{money(discount)}</Column>
        </Row>
      )}
      {tax > 0 && (
        <Row style={row}>
          <Column style={label}>{t("order.tax")}</Column>
          <Column style={value}>{money(tax)}</Column>
        </Row>
      )}
      <Row style={row}>
        <Column style={{ ...label, color: "#1a1f2b", fontWeight: 700, fontSize: "16px" }}>{t("order.total")}</Column>
        <Column style={{ ...value, fontWeight: 700, fontSize: "16px" }}>{money(total)}</Column>
      </Row>
      <Text style={{ ...styles.small, marginTop: "4px" }}>{t("order.vatIncluded")}</Text>

      {shippingAddress && (
        <>
          <Heading as="h2" style={styles.h2}>
            {t("order.address")}
          </Heading>
          <Text style={styles.text}>
            {shippingAddress.name}
            <br />
            {shippingAddress.line1}
            {shippingAddress.line2 && (
              <>
                <br />
                {shippingAddress.line2}
              </>
            )}
            <br />
            {shippingAddress.postalCode} {shippingAddress.city}
            {shippingAddress.state && `, ${shippingAddress.state}`}
            <br />
            {country(shippingAddress.country)}
          </Text>
        </>
      )}

      <Heading as="h2" style={styles.h2}>
        {t("order.next")}
      </Heading>
      <Text style={styles.text}>{t("order.nextText")}</Text>
      {viewable && (
        <Button
          href={emailLink(locale, `/account/orders/${orderId}`)}
          style={{ ...styles.button, margin: "8px 0 8px" }}
        >
          {t("order.view")}
        </Button>
      )}

      <Section style={{ ...styles.box, marginTop: "24px" }}>
        <Text style={{ ...styles.text, fontWeight: 700, margin: "0 0 4px" }}>{t("order.withdrawalTitle")}</Text>
        <Text style={{ ...styles.small, margin: "0 0 8px" }}>{t("order.withdrawalText")}</Text>
        <Text style={{ ...styles.small, margin: 0 }}>
          <Link href={emailLink(locale, `/vrashtane/otkaz?poruchka=${number}`)} style={styles.link}>
            {t("order.withdrawalLink")}
          </Link>
        </Text>
      </Section>
    </EmailLayout>
  );
};

export { OrderConfirmationEmail };
export type { OrderConfirmationEmailProps };
