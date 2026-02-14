import { Body, Container, Head, Heading, Hr, Html, Preview, Text } from "@react-email/components";
import React from "react";

type WelcomeEmailProps = {
  name: string;
};

const WelcomeEmail: React.FC<WelcomeEmailProps> = ({ name }) => {
  return (
    <Html>
      <Head />
      <Preview>Welcome to our store!</Preview>
      <Body style={main}>
        <Container style={container}>
          <Heading style={h1}>Welcome! 🎉</Heading>
          <Text style={text}>Hi {name},</Text>
          <Text style={text}>Thanks for creating an account with us. We&apos;re excited to have you on board!</Text>
          <Text style={text}>
            Browse our collection, add items to your cart, and enjoy a seamless shopping experience.
          </Text>
          <Text style={text}>Happy shopping!</Text>
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

export { WelcomeEmail };
export type { WelcomeEmailProps };
