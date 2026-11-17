import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { redirect } from "@/i18n/navigation";
import { auth } from "@/lib/auth";
import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import React from "react";

type Props = {
  params: Promise<{ locale: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "account.profile.metadata" });

  return {
    title: t("title"),
    description: t("description"),
  };
}

const getInitials = (name: string | null | undefined, fallback: string) => {
  if (!name) return fallback;
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
};

const ProfilePage: React.FC<Props> = async ({ params }) => {
  const { locale } = await params;
  setRequestLocale(locale);

  const session = await auth();

  if (!session?.user?.id) {
    return redirect({ href: "/login", locale });
  }

  const t = await getTranslations("account.profile");
  const user = session.user;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>{t("title")}</CardTitle>
          <CardDescription>{t("description")}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Avatar */}
          <div className="flex items-center gap-4">
            <Avatar className="h-20 w-20">
              <AvatarImage src={user.image ?? undefined} alt={user.name ?? t("avatarAlt")} />
              <AvatarFallback className="text-lg">{getInitials(user.name, t("initialsFallback"))}</AvatarFallback>
            </Avatar>
            <div>
              <p className="text-lg font-semibold">{user.name ?? t("unknownName")}</p>
              <p className="text-muted-foreground text-sm">{t("signedInWithGoogle")}</p>
            </div>
          </div>

          {/* Profile fields */}
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label className="text-muted-foreground">{t("fields.name")}</Label>
              <p className="text-sm font-medium">{user.name ?? "—"}</p>
            </div>
            <div className="space-y-2">
              <Label className="text-muted-foreground">{t("fields.email")}</Label>
              <p className="text-sm font-medium">{user.email ?? "—"}</p>
            </div>
            <div className="space-y-2">
              <Label className="text-muted-foreground">{t("fields.role")}</Label>
              <p className="text-sm font-medium">{t(`roles.${user.role ?? "USER"}`)}</p>
            </div>
          </div>

          <p className="text-muted-foreground text-xs">{t("managedByGoogle")}</p>
        </CardContent>
      </Card>
    </div>
  );
};

export default ProfilePage;
