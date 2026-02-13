"use server";

import { signIn } from "@/lib/auth";

/**
 * Sign in with Google OAuth
 */
async function signInWithGoogle() {
  await signIn("google", {
    redirectTo: "/",
  });
}

export { signInWithGoogle };
