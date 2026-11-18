import React from "react";
import { Button, Heading, Text } from "react-email";
import { emailCopy, type EmailLocale } from "./copy";
import { EmailLayout, styles } from "./layout";

/** Emails about email-and-password accounts: confirming the address, a new password, an address already registered. */
const ConfirmEmail: React.FC<{ locale: EmailLocale; name: string; url: string }> = ({ locale, name, url }) => {
  const t = emailCopy(locale);
  return (
    <EmailLayout locale={locale} preview={t("account.confirm.preview")}>
      <Heading style={styles.h1}>{t("account.confirm.title")}</Heading>
      <Text style={styles.text}>{t("account.confirm.greeting", { name })}</Text>
      <Text style={styles.text}>{t("account.confirm.text")}</Text>
      <Button href={url} style={{ ...styles.button, margin: "8px 0 16px" }}>
        {t("account.confirm.button")}
      </Button>
      <Text style={styles.small}>{t("account.confirm.ignore")}</Text>
    </EmailLayout>
  );
};

const ResetPasswordEmail: React.FC<{ locale: EmailLocale; url: string }> = ({ locale, url }) => {
  const t = emailCopy(locale);
  return (
    <EmailLayout locale={locale} preview={t("account.reset.preview")}>
      <Heading style={styles.h1}>{t("account.reset.title")}</Heading>
      <Text style={styles.text}>{t("account.reset.text")}</Text>
      <Button href={url} style={{ ...styles.button, margin: "8px 0 16px" }}>
        {t("account.reset.button")}
      </Button>
      <Text style={styles.small}>{t("account.reset.ignore")}</Text>
    </EmailLayout>
  );
};

const AccountExistsEmail: React.FC<{ locale: EmailLocale; loginUrl: string; resetUrl: string }> = ({
  locale,
  loginUrl,
  resetUrl,
}) => {
  const t = emailCopy(locale);
  return (
    <EmailLayout locale={locale} preview={t("account.exists.preview")}>
      <Heading style={styles.h1}>{t("account.exists.title")}</Heading>
      <Text style={styles.text}>{t("account.exists.text")}</Text>
      <Button href={loginUrl} style={{ ...styles.button, margin: "8px 12px 16px 0" }}>
        {t("account.exists.login")}
      </Button>
      <Button
        href={resetUrl}
        style={{ ...styles.button, backgroundColor: "#ffffff", color: "#1c3456", border: "1px solid #c6d0e0" }}
      >
        {t("account.exists.reset")}
      </Button>
      <Text style={styles.small}>{t("account.exists.ignore")}</Text>
    </EmailLayout>
  );
};

export { AccountExistsEmail, ConfirmEmail, ResetPasswordEmail };
