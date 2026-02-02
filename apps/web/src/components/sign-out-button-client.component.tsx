"use client";

import { signOut } from "next-auth/react";
import React from "react";

const SignOutButton: React.FC = () => {
  return (
    <>
      <button type="button" onClick={() => signOut()} className="flex items-center gap-2 text-sm">
        Sign out
      </button>
    </>
  );
};

export default SignOutButton;
