import type { Session } from "next-auth";
import { SessionProvider } from "next-auth/react";
import React, { PropsWithChildren } from "react";

interface Props extends PropsWithChildren {
  session: Session | null;
}

const AuthProviders: React.FC<Props> = ({ session, children }) => {
  return <SessionProvider session={session}>{children}</SessionProvider>;
};

export default AuthProviders;
