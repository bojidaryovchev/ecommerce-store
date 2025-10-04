import AuthProviders from "@/components/auth-providers";
import HtmlProviders from "@/components/html-providers";
import ToasterProviders from "@/components/toaster-providers";
import React, { PropsWithChildren } from "react";

const Providers: React.FC<PropsWithChildren> = ({ children }) => {
  return (
    <>
      <HtmlProviders>
        <AuthProviders>
          <ToasterProviders>{children}</ToasterProviders>
        </AuthProviders>
      </HtmlProviders>
    </>
  );
};

export default Providers;
