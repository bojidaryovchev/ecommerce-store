import AuthProviders from "@/components/providers/auth-providers";
import HeroUIProviders from "@/components/providers/heroui-providers";
import HtmlProviders from "@/components/providers/html-providers";
import ToasterProviders from "@/components/providers/toaster-providers";
import React, { PropsWithChildren } from "react";

const Providers: React.FC<PropsWithChildren> = ({ children }) => {
  return (
    <>
      <HtmlProviders>
        <AuthProviders>
          <HeroUIProviders>
            <ToasterProviders>{children}</ToasterProviders>
          </HeroUIProviders>
        </AuthProviders>
      </HtmlProviders>
    </>
  );
};

export default Providers;
