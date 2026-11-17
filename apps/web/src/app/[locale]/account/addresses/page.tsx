import { AddressFormDialog } from "@/components/account/address-form-dialog";
import { AddressList } from "@/components/account/address-list";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { redirect } from "@/i18n/navigation";
import { auth } from "@/lib/auth";
import { getAddressesByUserId } from "@/queries/addresses";
import { Plus } from "lucide-react";
import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import React, { Suspense } from "react";

type Props = {
  params: Promise<{ locale: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "account.addresses.metadata" });

  return {
    title: t("title"),
    description: t("description"),
  };
}

const AddressesContent: React.FC<{ userId: string }> = async ({ userId }) => {
  const addresses = await getAddressesByUserId(userId);

  return <AddressList addresses={addresses} />;
};

const AddressesPage: React.FC<Props> = async ({ params }) => {
  const { locale } = await params;
  setRequestLocale(locale);

  const session = await auth();

  if (!session?.user?.id) {
    return redirect({ href: "/login", locale });
  }

  const t = await getTranslations("account.addresses");

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>{t("title")}</CardTitle>
            <CardDescription>{t("description")}</CardDescription>
          </div>
          <AddressFormDialog
            trigger={
              <Button size="sm">
                <Plus className="mr-2 h-4 w-4" />
                {t("add")}
              </Button>
            }
          />
        </CardHeader>
        <CardContent>
          <Suspense
            fallback={
              <div className="grid animate-pulse gap-4 sm:grid-cols-2">
                {[1, 2].map((i) => (
                  <div key={i} className="bg-muted h-40 rounded-lg" />
                ))}
              </div>
            }
          >
            <AddressesContent userId={session.user.id} />
          </Suspense>
        </CardContent>
      </Card>
    </div>
  );
};

export default AddressesPage;
