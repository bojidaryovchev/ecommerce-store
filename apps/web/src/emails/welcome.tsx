import React from "react";
import { Button, Heading, Text } from "react-email";
import { emailCopy, emailLink, type EmailLocale } from "./copy";
import { EmailLayout, styles } from "./layout";

type WelcomeEmailProps = {
  locale: EmailLocale;
  name: string | null;
};

const WelcomeEmail: React.FC<WelcomeEmailProps> = ({ locale, name }) => {
  const t = emailCopy(locale);

  return (
    <EmailLayout locale={locale} preview={t("welcome.preview")}>
      <Heading style={styles.h1}>{t("welcome.title")}</Heading>
      <Text style={styles.text}>{t("welcome.greeting", { name: name || t("customer") })}</Text>
      <Text style={styles.text}>{t("welcome.text")}</Text>
      <Text style={styles.text}>{t("welcome.help")}</Text>
      <Button href={emailLink(locale, "/")} style={{ ...styles.button, margin: "8px 0 16px" }}>
        {t("welcome.shop")}
      </Button>
    </EmailLayout>
  );
};

export { WelcomeEmail };
export type { WelcomeEmailProps };
