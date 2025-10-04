"use client";

import { Button } from "@/components/ui/button";
import { signOut } from "next-auth/react";
import React from "react";

const SignOutButton: React.FC = () => {
  return (
    <>
      <Button onClick={() => signOut()}>Sign out</Button>
    </>
  );
};

export default SignOutButton;
