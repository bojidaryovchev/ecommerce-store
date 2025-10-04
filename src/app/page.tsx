import GoogleSignIn from "@/components/google-sign-in";
import SignOutButton from "@/components/sign-out-button";
import type React from "react";

const Home: React.FC = () => {
  return (
    <>
      <GoogleSignIn />

      <SignOutButton />
    </>
  );
};

export default Home;
