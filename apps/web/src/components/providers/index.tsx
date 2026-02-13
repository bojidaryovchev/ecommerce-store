import AuthProviders from "@/components/providers/auth-providers";
import CartProviders from "@/components/providers/cart-providers";
import HtmlProviders from "@/components/providers/html-providers";
import NavbarProviders from "@/components/providers/navbar-providers";
import ToasterProviders from "@/components/providers/toaster-providers";
import { auth } from "@/lib/auth";
import React, { PropsWithChildren, Suspense } from "react";

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

const Providers: React.FC<PropsWithChildren> = ({ children }) => {
  return (
    <>
      <HtmlProviders>
        <Suspense fallback={null}>
          <SessionProviders>{children}</SessionProviders>
        </Suspense>
      </HtmlProviders>
    </>
  );
};

export default Providers;
