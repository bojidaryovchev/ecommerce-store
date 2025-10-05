import { UserRole } from "@prisma/client";
import { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      roles: UserRole[];
    } & DefaultSession["user"];
  }

  interface User {
    roles: UserRole[];
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    roles: UserRole[];
    accessToken?: string;
  }
}
