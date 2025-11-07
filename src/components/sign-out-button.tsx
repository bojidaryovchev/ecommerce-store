"use client";

import { signOut } from "next-auth/react";
import React from "react";

const SignOutButton: React.FC = () => {
  return (
    <>
      <button type="button" onClick={() => signOut()}>
        Sign out
      </button>
    </>
  );
};

export default SignOutButton;
