import GoogleSignIn from "@/components/google-sign-in";
import SignOutButton from "@/components/sign-out-button";
import React from "react";

const Home: React.FC = async () => {
  return (
    <>
      <GoogleSignIn />

      <SignOutButton />
    </>
  );
};

export default Home;
