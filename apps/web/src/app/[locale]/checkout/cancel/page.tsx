import { Button } from "@/components/ui/button";
import { Link } from "@/i18n/navigation";
import { XCircle } from "lucide-react";
import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import React from "react";

type Props = {
  params: Promise<{ locale: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "checkout.cancel.metadata" });

  return {
    title: t("title"),
    description: t("description"),
  };
}

const CheckoutCancelPage: React.FC<Props> = async ({ params }) => {
  const { locale } = await params;
  setRequestLocale(locale);

  const t = await getTranslations("checkout.cancel");

  return (
    <main className="max-w-container py-16">
      <div className="mx-auto max-w-lg text-center">
        <XCircle className="text-muted-foreground mx-auto h-16 w-16" />
        <h1 className="mt-6 text-3xl font-bold">{t("title")}</h1>
        <p className="text-muted-foreground mt-2">{t("description")}</p>
        <div className="mt-8 flex flex-col gap-4 sm:flex-row sm:justify-center">
          <Button asChild>
            <Link href="/products">{t("continueShopping")}</Link>
          </Button>
          <Button variant="outline" asChild>
            <Link href="/">{t("backHome")}</Link>
          </Button>
        </div>
      </div>
    </main>
  );
};

export default CheckoutCancelPage;
