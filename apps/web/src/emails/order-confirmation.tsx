import { formatCurrency } from "@/lib/utils";
import { Body, Column, Container, Head, Heading, Hr, Html, Preview, Row, Section, Text } from "@react-email/components";
import React from "react";

type OrderItem = {
  name: string;
  quantity: number;
  unitAmount: number;
  currency: string;
};

type OrderConfirmationEmailProps = {
  orderId: string;
  customerName: string;
  items: OrderItem[];
  subtotal: number;
  shipping: number;
  tax: number;
  total: number;
  currency: string;
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

const OrderConfirmationEmail: React.FC<OrderConfirmationEmailProps> = ({
  orderId,
  customerName,
  items,
  subtotal,
  shipping,
  tax,
  total,
  currency,
  shippingAddress,
}) => {
  return (
    <Html>
      <Head />
      <Preview>Order confirmed — #{orderId.slice(0, 8)}</Preview>
      <Body style={main}>
        <Container style={container}>
          <Heading style={h1}>Order Confirmed</Heading>
          <Text style={text}>Hi {customerName},</Text>
          <Text style={text}>
            Thank you for your order! We&apos;ve received your payment and your order is being processed.
          </Text>

          <Section style={orderIdSection}>
            <Text style={orderIdLabel}>Order ID</Text>
            <Text style={orderIdValue}>#{orderId.slice(0, 8)}</Text>
          </Section>

          <Hr style={hr} />

          <Heading as="h2" style={h2}>
            Items
          </Heading>

          {items.map((item, index) => (
            <Row key={index} style={itemRow}>
              <Column style={itemName}>
                {item.name} × {item.quantity}
              </Column>
              <Column style={itemPrice}>{formatCurrency(item.unitAmount * item.quantity, item.currency)}</Column>
            </Row>
          ))}

          <Hr style={hr} />

          <Row style={summaryRow}>
            <Column style={summaryLabel}>Subtotal</Column>
            <Column style={summaryValue}>{formatCurrency(subtotal, currency)}</Column>
          </Row>
          {shipping > 0 && (
            <Row style={summaryRow}>
              <Column style={summaryLabel}>Shipping</Column>
              <Column style={summaryValue}>{formatCurrency(shipping, currency)}</Column>
            </Row>
          )}
          {tax > 0 && (
            <Row style={summaryRow}>
              <Column style={summaryLabel}>Tax</Column>
              <Column style={summaryValue}>{formatCurrency(tax, currency)}</Column>
            </Row>
          )}
          <Row style={summaryRow}>
            <Column style={{ ...summaryLabel, fontWeight: "bold" }}>Total</Column>
            <Column style={{ ...summaryValue, fontWeight: "bold" }}>{formatCurrency(total, currency)}</Column>
          </Row>

          {shippingAddress && (
            <>
              <Hr style={hr} />
              <Heading as="h2" style={h2}>
                Shipping Address
              </Heading>
              <Text style={text}>
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
                {shippingAddress.city}
                {shippingAddress.state && `, ${shippingAddress.state}`} {shippingAddress.postalCode}
                <br />
                {shippingAddress.country}
              </Text>
            </>
          )}

          <Hr style={hr} />
          <Text style={footer}>If you have any questions, just reply to this email.</Text>
        </Container>
      </Body>
    </Html>
  );
};

const main = {
  backgroundColor: "#f6f9fc",
  fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
};

const container = {
  backgroundColor: "#ffffff",
  margin: "0 auto",
  padding: "40px 20px",
  maxWidth: "560px",
};

const h1 = {
  color: "#1a1a1a",
  fontSize: "24px",
  fontWeight: "bold" as const,
  margin: "0 0 20px",
};

const h2 = {
  color: "#1a1a1a",
  fontSize: "18px",
  fontWeight: "600" as const,
  margin: "0 0 12px",
};

const text = {
  color: "#4a4a4a",
  fontSize: "14px",
  lineHeight: "24px",
  margin: "0 0 12px",
};

const orderIdSection = {
  backgroundColor: "#f0f4f8",
  borderRadius: "6px",
  padding: "16px",
  marginBottom: "20px",
};

const orderIdLabel = {
  color: "#6b7280",
  fontSize: "12px",
  textTransform: "uppercase" as const,
  margin: "0 0 4px",
};

const orderIdValue = {
  color: "#1a1a1a",
  fontSize: "18px",
  fontWeight: "bold" as const,
  fontFamily: "monospace",
  margin: "0",
};

const hr = {
  borderColor: "#e6e6e6",
  margin: "20px 0",
};

const itemRow = {
  marginBottom: "8px",
};

const itemName = {
  color: "#4a4a4a",
  fontSize: "14px",
};

const itemPrice = {
  color: "#1a1a1a",
  fontSize: "14px",
  textAlign: "right" as const,
};

const summaryRow = {
  marginBottom: "4px",
};

const summaryLabel = {
  color: "#6b7280",
  fontSize: "14px",
};

const summaryValue = {
  color: "#1a1a1a",
  fontSize: "14px",
  textAlign: "right" as const,
};

const footer = {
  color: "#9ca3af",
  fontSize: "12px",
  margin: "0",
};

export { OrderConfirmationEmail };
export type { OrderConfirmationEmailProps };
