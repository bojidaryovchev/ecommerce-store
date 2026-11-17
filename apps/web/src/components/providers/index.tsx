import AuthProviders from "@/components/providers/auth-providers";
import CartProviders from "@/components/providers/cart-providers";
import HtmlProviders from "@/components/providers/html-providers";
import NavbarProviders from "@/components/providers/navbar-providers";
import ToasterProviders from "@/components/providers/toaster-providers";
import { auth } from "@/lib/auth";
import { getMessages } from "next-intl/server";
import React, { PropsWithChildren, Suspense } from "react";
import { IntlClientProvider } from "./intl-client-provider";

const SessionProviders: React.FC<PropsWithChildren> = async ({ children }) => {
  const session = await auth();

  return (
    <AuthProviders session={session}>
      <ToasterProviders>
        <CartProviders session={session}>
          <NavbarProviders session={session}>{children}</NavbarProviders>
        </CartProviders>
      </ToasterProviders>
    </AuthProviders>
  );
};

interface ProvidersProps extends PropsWithChildren {
  locale: string;
}

const Providers: React.FC<ProvidersProps> = async ({ locale, children }) => {
  // Explicit locale: nothing here reads the request, so the page shell can be prerendered.
  const messages = await getMessages({ locale });

  return (
    <HtmlProviders lang={locale}>
      <IntlClientProvider locale={locale} messages={messages} timeZone="Europe/Sofia">
        <Suspense fallback={null}>
          <SessionProviders>{children}</SessionProviders>
        </Suspense>
      </IntlClientProvider>
    </HtmlProviders>
  );
};

export default Providers;
