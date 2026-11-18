import { SITE_URL } from "@/lib/site-url";
import React from "react";
import { Body, Container, Head, Html, Link, Preview, Section, Text } from "react-email";
import { emailBrand, emailCopy, emailLink, emailTagline, type EmailLocale } from "./copy";

/** The shop's colours, as plain hex for mail clients (the site's navy and heat orange). */
export const NAVY = "#1c3456";
export const HEAT = "#e4692b";
const INK = "#1a1f2b";
const MUTED = "#5b6474";

export const styles = {
  h1: { color: INK, fontSize: "24px", lineHeight: "32px", fontWeight: 700, margin: "0 0 16px" },
  h2: { color: INK, fontSize: "16px", lineHeight: "24px", fontWeight: 700, margin: "24px 0 8px" },
  text: { color: "#3b4252", fontSize: "15px", lineHeight: "24px", margin: "0 0 12px" },
  small: { color: MUTED, fontSize: "13px", lineHeight: "20px", margin: "0 0 8px" },
  button: {
    backgroundColor: HEAT,
    borderRadius: "999px",
    color: "#ffffff",
    display: "inline-block",
    fontSize: "14px",
    fontWeight: 700,
    padding: "12px 24px",
    textDecoration: "none",
  },
  link: { color: NAVY, fontWeight: 600, textDecoration: "underline" },
  box: { backgroundColor: "#f3f5f8", borderRadius: "12px", padding: "16px 20px", margin: "16px 0" },
} as const;

/** Every email: the shop's name on navy, the message, and a footer with the way to reach us and the shop's terms. */
const EmailLayout: React.FC<{ locale: EmailLocale; preview: string; children: React.ReactNode }> = ({
  locale,
  preview,
  children,
}) => {
  const t = emailCopy(locale);
  const host = SITE_URL.replace(/^https?:\/\//, "");
  const footerLinks = [
    { href: emailLink(locale, "/dostavka"), label: t("footer.delivery") },
    { href: emailLink(locale, "/vrashtane"), label: t("footer.returns") },
    { href: emailLink(locale, "/obshti-usloviya"), label: t("footer.terms") },
    { href: emailLink(locale, "/poveritelnost"), label: t("footer.privacy") },
  ];

  return (
    <Html lang={locale}>
      <Head />
      <Preview>{preview}</Preview>
      <Body
        style={{
          backgroundColor: "#eef1f5",
          fontFamily: "Montserrat, -apple-system, 'Segoe UI', Roboto, Arial, sans-serif",
          margin: 0,
          padding: "24px 12px",
        }}
      >
        <Container
          style={{
            maxWidth: "560px",
            margin: "0 auto",
            backgroundColor: "#ffffff",
            borderRadius: "16px",
            overflow: "hidden",
          }}
        >
          <Section style={{ backgroundColor: NAVY, padding: "22px 32px" }}>
            <Text style={{ color: "#ffffff", fontSize: "18px", lineHeight: "24px", fontWeight: 700, margin: 0 }}>
              {emailBrand(locale)}
            </Text>
            <Text style={{ color: "#c6d0e0", fontSize: "12px", lineHeight: "18px", margin: "2px 0 0" }}>
              {emailTagline(locale)}
            </Text>
          </Section>
          <Section style={{ padding: "32px 32px 16px" }}>{children}</Section>
          <Section style={{ padding: "20px 32px 28px", borderTop: "1px solid #e6eaf0" }}>
            <Text style={{ ...styles.small, color: INK }}>{t("footer.questions")}</Text>
            <Text style={styles.small}>
              {footerLinks.map((link, index) => (
                <React.Fragment key={link.href}>
                  {index > 0 && " · "}
                  <Link href={link.href} style={{ color: MUTED, textDecoration: "underline" }}>
                    {link.label}
                  </Link>
                </React.Fragment>
              ))}
            </Text>
            <Text style={{ ...styles.small, margin: 0 }}>
              <Link href={emailLink(locale, "/")} style={{ color: MUTED }}>
                {host}
              </Link>
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
};

export { EmailLayout };
