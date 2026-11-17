import { redirect } from "@/i18n/navigation";
import { setRequestLocale } from "next-intl/server";

type Props = {
  params: Promise<{ locale: string }>;
};

const AccountPage = async ({ params }: Props) => {
  const { locale } = await params;
  setRequestLocale(locale);

  redirect({ href: "/account/profile", locale });
};

export default AccountPage;
