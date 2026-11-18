import { WelcomeEmail } from "@/emails";
import { emailBrand, emailCopy } from "@/emails/copy";
import { sendEmail } from "@/lib/email";
import { verifyPassword } from "@/lib/password";
import { mergeGuestCartToUser } from "@/mutations/cart";
import { DrizzleAdapter } from "@auth/drizzle-adapter";
import { accounts, db, sessions, users, verificationTokens } from "@ecommerce/database";
import type { UserRole } from "@ecommerce/database/types/enums";
import { eq, sql } from "drizzle-orm";
import NextAuth, { CredentialsSignin } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import Google from "next-auth/providers/google";
import React from "react";

/** The password was right, but the address has not been confirmed yet: the sign-in form says so. */
export class UnconfirmedEmail extends CredentialsSignin {
  code = "unconfirmed";
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: DrizzleAdapter(db, {
    usersTable: users,
    accountsTable: accounts,
    sessionsTable: sessions,
    verificationTokensTable: verificationTokens,
  }),
  providers: [
    Google({
      clientId: process.env.AUTH_GOOGLE_ID,
      clientSecret: process.env.AUTH_GOOGLE_SECRET,
      // Google vouches for the address, so signing in with Google opens the account registered with it
      // by email and password too (see events.linkAccount for an account that was never confirmed).
      allowDangerousEmailAccountLinking: true,
      authorization: {
        params: {
          prompt: "consent",
          access_type: "offline",
          response_type: "code",
        },
      },
    }),
    Credentials({
      id: "password",
      credentials: { email: {}, password: {} },
      async authorize(credentials) {
        const email = typeof credentials?.email === "string" ? credentials.email.trim().toLowerCase() : "";
        const password = typeof credentials?.password === "string" ? credentials.password : "";
        if (!email || !password) return null;
        const user = await db.query.users.findFirst({ where: sql`lower(${users.email}) = ${email}` });
        // Checked even without an account, so the answer takes as long either way.
        const matches = await verifyPassword(password, user?.passwordHash);
        if (!user || !matches) return null;
        if (!user.emailVerified) throw new UnconfirmedEmail();
        return { id: user.id, name: user.name, email: user.email, image: user.image, role: user.role };
      },
    }),
  ],
  pages: { signIn: "/login" },
  session: {
    strategy: "jwt",
  },
  events: {
    /**
     * A Google account joined to a user. Google has confirmed the address, so the user is marked
     * confirmed; a password set by whoever registered the address without ever confirming it is
     * dropped, so nobody can claim someone else's address ahead of them. A new password is one
     * "forgotten password" email away.
     */
    async linkAccount({ user }) {
      if (!user.id) return;
      const current = await db.query.users.findFirst({
        where: eq(users.id, user.id),
        columns: { emailVerified: true },
      });
      if (current && !current.emailVerified) {
        await db.update(users).set({ emailVerified: new Date(), passwordHash: null }).where(eq(users.id, user.id));
      }
    },
    async signIn({ user, isNewUser }) {
      // Merge guest cart into user cart on login
      if (user.id) {
        try {
          await mergeGuestCartToUser(user.id);
        } catch (error) {
          console.error("Failed to merge guest cart:", error);
        }
      }
      // Send welcome email on first sign-in
      if (isNewUser && user.email) {
        try {
          // Sign-in does not say which language the visitor browsed in: the shop's own, Bulgarian.
          await sendEmail({
            to: user.email,
            subject: emailCopy("bg")("welcome.subject", { brand: emailBrand("bg") }),
            react: React.createElement(WelcomeEmail, { locale: "bg", name: user.name ?? null }),
          });
        } catch (error) {
          console.error("Failed to send welcome email:", error);
        }
      }
    },
  },
  callbacks: {
    async jwt({ token, user, account }) {
      // Initial sign in
      if (user) {
        token.id = user.id!;
        token.role = user.role;
      }
      // Add access_token to the token if available
      if (account) {
        token.accessToken = account.access_token;
      }
      return token;
    },
    async session({ session, token }) {
      // Add user id and role to session
      if (session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as UserRole;
      }
      return session;
    },
  },
});
