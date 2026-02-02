import LoginCard from "@/components/login-card.component";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";

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
