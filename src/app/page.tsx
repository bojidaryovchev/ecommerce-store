import GoogleSignIn from "@/components/google-sign-in.component";
import SignOutButton from "@/components/sign-out-button-client.component";
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
