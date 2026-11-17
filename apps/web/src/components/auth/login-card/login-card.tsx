import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { useTranslations } from "next-intl";
import { GoogleSignIn } from "./google-sign-in";

type Props = {
  /** Same-site path to return to after signing in (locale prefix included, e.g. "/en/account"). */
  redirectTo?: string;
};

const LoginCard: React.FC<Props> = ({ redirectTo }) => {
  const t = useTranslations("auth.loginCard");

  return (
    <Card className="w-full max-w-md">
      <CardHeader className="flex flex-col items-center gap-1 pb-0">
        <h1 className="text-2xl font-bold">{t("title")}</h1>
        <p className="text-muted-foreground">{t("description")}</p>
      </CardHeader>
      <CardContent className="space-y-4">
        <GoogleSignIn redirectTo={redirectTo} />
      </CardContent>
    </Card>
  );
};

export { LoginCard };
