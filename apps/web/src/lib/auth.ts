import { WelcomeEmail } from "@/emails";
import { sendEmail } from "@/lib/email";
import { mergeGuestCartToUser } from "@/mutations/cart";
import { DrizzleAdapter } from "@auth/drizzle-adapter";
import { accounts, db, sessions, users, verificationTokens } from "@ecommerce/database";
import type { UserRole } from "@ecommerce/database/types/enums";
import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import React from "react";

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
      authorization: {
        params: {
          prompt: "consent",
          access_type: "offline",
          response_type: "code",
        },
      },
    }),
  ],
  session: {
    strategy: "jwt",
  },
  events: {
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
          await sendEmail({
            to: user.email,
            subject: "Welcome to our store!",
            react: React.createElement(WelcomeEmail, { name: user.name ?? "there" }),
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
