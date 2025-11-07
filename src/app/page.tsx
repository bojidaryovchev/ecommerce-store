import AllProductsSection from "@/components/all-products-section";
import GoogleSignIn from "@/components/google-sign-in";
import SignOutButton from "@/components/sign-out-button";
import type React from "react";
import { Suspense } from "react";

const Home: React.FC = async () => {
  return (
    <>
      <GoogleSignIn />

      <SignOutButton />

      <Suspense fallback={<>Loading...</>}>
        <AllProductsSection />
      </Suspense>
    </>
  );
};

export default Home;
