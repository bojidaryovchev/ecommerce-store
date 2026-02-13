import { LoginCard } from "@/components/auth";
import { auth } from "@/lib/auth";
import type { Metadata } from "next";
import { redirect } from "next/navigation";

export const metadata: Metadata = {
  title: "Sign In | Ecommerce Store",
  description: "Sign in to your account",
};

const LoginPage = async () => {
  const session = await auth();

  if (session) {
    redirect("/");
  }

  return (
    <main className="container mx-auto flex min-h-[60vh] items-center justify-center px-4 py-16">
      <LoginCard />
    </main>
  );
};

export default LoginPage;
