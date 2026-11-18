import { Link } from "@/i18n/navigation";
import { useTranslations } from "next-intl";
import { AuthShell } from "../auth-shell";
import { PasswordSignInForm } from "../password-forms";
import { GoogleSignIn } from "./google-sign-in";

export type LoginNotice = "confirmed" | "reset" | "OAuthAccountNotLinked" | "error";

type Props = {
  /** Same-site path to return to after signing in (locale prefix included, e.g. "/en/account"). */
  redirectTo?: string;
  /** A line above the form: the address was confirmed, the password changed, or signing in failed. */
  notice?: LoginNotice;
};

const LoginCard: React.FC<Props> = ({ redirectTo, notice }) => {
  const t = useTranslations("auth.loginCard");
  const bad = notice === "OAuthAccountNotLinked" || notice === "error";

  return (
    <AuthShell title={t("title")} description={t("description")}>
      {notice && (
        <p
          role={bad ? "alert" : "status"}
          className={
            bad
              ? "bg-destructive/10 text-destructive rounded-xl px-3.5 py-2.5 text-sm"
              : "rounded-xl bg-emerald-50 px-3.5 py-2.5 text-sm text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-200"
          }
        >
          {t(`notices.${notice}`)}
        </p>
      )}
      <GoogleSignIn redirectTo={redirectTo} />
      <div className="text-muted-foreground flex items-center gap-3 text-xs">
        <span className="bg-border h-px flex-1" />
        {t("or")}
        <span className="bg-border h-px flex-1" />
      </div>
      <PasswordSignInForm redirectTo={redirectTo} />
      <p className="text-muted-foreground text-center text-sm">
        {t("noAccount")}{" "}
        <Link href="/register" className="text-primary font-semibold hover:underline">
          {t("register")}
        </Link>
      </p>
    </AuthShell>
  );
};

export { LoginCard };
