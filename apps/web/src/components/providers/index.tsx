import AuthProviders from "@/components/providers/auth-providers";
import CartProviders from "@/components/providers/cart-providers";
import HtmlProviders from "@/components/providers/html-providers";
import NavbarProviders from "@/components/providers/navbar-providers";
import ToasterProviders from "@/components/providers/toaster-providers";
import React, { PropsWithChildren, Suspense } from "react";

const Providers: React.FC<PropsWithChildren> = ({ children }) => {
  return (
    <>
      <HtmlProviders>
        <Suspense fallback={null}>
          <AuthProviders>
            <ToasterProviders>
              <CartProviders>
                <NavbarProviders>{children}</NavbarProviders>
              </CartProviders>
            </ToasterProviders>
          </AuthProviders>
        </Suspense>
      </HtmlProviders>
    </>
  );
};

export default Providers;
