"use server";

import { signIn } from "@/lib/auth";

/** Only same-site paths ("/en/account", not "//evil.com" or "https://…"), to avoid open redirects. */
const safeRedirectPath = (value: FormDataEntryValue | null): string =>
  typeof value === "string" && value.startsWith("/") && !value.startsWith("//") && !value.includes("\\") ? value : "/";

/**
 * Sign in with Google OAuth, then return to `redirectTo` (posted by the sign-in form) or the home page
 */
async function signInWithGoogle(formData?: FormData) {
  await signIn("google", {
    redirectTo: safeRedirectPath(formData?.get("redirectTo") ?? null),
  });
}

export { signInWithGoogle };
