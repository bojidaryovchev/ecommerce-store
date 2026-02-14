import { Body, Container, Head, Heading, Hr, Html, Preview, Text } from "@react-email/components";
import React from "react";

type OrderShippedEmailProps = {
  orderId: string;
  customerName: string;
};

const OrderShippedEmail: React.FC<OrderShippedEmailProps> = ({ orderId, customerName }) => {
  return (
    <Html>
      <Head />
      <Preview>Your order #{orderId.slice(0, 8)} has shipped!</Preview>
      <Body style={main}>
        <Container style={container}>
          <Heading style={h1}>Your Order Has Shipped! 📦</Heading>
          <Text style={text}>Hi {customerName},</Text>
          <Text style={text}>
            Great news — your order <strong>#{orderId.slice(0, 8)}</strong> has been shipped and is on its way to you.
          </Text>
          <Text style={text}>You&apos;ll receive your delivery soon. We hope you love your purchase!</Text>
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

const text = {
  color: "#4a4a4a",
  fontSize: "14px",
  lineHeight: "24px",
  margin: "0 0 12px",
};

const hr = {
  borderColor: "#e6e6e6",
  margin: "20px 0",
};

const footer = {
  color: "#9ca3af",
  fontSize: "12px",
  margin: "0",
};

export { OrderShippedEmail };
export type { OrderShippedEmailProps };
