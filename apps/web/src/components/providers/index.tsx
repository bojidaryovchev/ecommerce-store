import AuthProviders from "@/components/providers/auth-providers";
import CartProviders from "@/components/providers/cart-providers";
import HtmlProviders from "@/components/providers/html-providers";
import NavbarProviders from "@/components/providers/navbar-providers";
import ToasterProviders from "@/components/providers/toaster-providers";
import { auth } from "@/lib/auth";
import { getMessages } from "next-intl/server";
import React, { PropsWithChildren, Suspense } from "react";
import { IntlClientProvider } from "./intl-client-provider";

const SessionProviders: React.FC<PropsWithChildren<{ navbar: boolean }>> = async ({ navbar, children }) => {
  const session = await auth();

  return (
    <AuthProviders session={session}>
      <ToasterProviders>
        <CartProviders session={session}>
          {navbar ? <NavbarProviders session={session}>{children}</NavbarProviders> : children}
        </CartProviders>
      </ToasterProviders>
    </AuthProviders>
  );
};

interface ProvidersProps extends PropsWithChildren {
  locale: string;
  /** The shop's header; the admin has its own sidebar instead. */
  navbar?: boolean;
}

const Providers: React.FC<ProvidersProps> = async ({ locale, navbar = true, children }) => {
  // Explicit locale: nothing here reads the request, so the page shell can be prerendered.
  const messages = await getMessages({ locale });

  return (
    <HtmlProviders lang={locale}>
      <IntlClientProvider locale={locale} messages={messages} timeZone="Europe/Sofia">
        <Suspense fallback={null}>
          <SessionProviders navbar={navbar}>{children}</SessionProviders>
        </Suspense>
      </IntlClientProvider>
    </HtmlProviders>
  );
};

export default Providers;
