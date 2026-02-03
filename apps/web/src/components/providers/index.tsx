import AuthProviders from "@/components/providers/auth-providers";
import HtmlProviders from "@/components/providers/html-providers";
import NavbarProviders from "@/components/providers/navbar-providers";
import ToasterProviders from "@/components/providers/toaster-providers";
import React, { PropsWithChildren } from "react";

const Providers: React.FC<PropsWithChildren> = ({ children }) => {
  return (
    <>
      <HtmlProviders>
        <AuthProviders>
          <ToasterProviders>
            <NavbarProviders>{children}</NavbarProviders>
          </ToasterProviders>
        </AuthProviders>
      </HtmlProviders>
    </>
  );
};

export default Providers;
