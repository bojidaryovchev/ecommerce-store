"use client";

import { LogOutIcon } from "lucide-react";
import { signOut } from "next-auth/react";
import React from "react";

const SignOutButton: React.FC = () => {
  return (
    <>
      <button type="button" onClick={() => signOut()} className="flex items-center gap-2 text-sm">
        <LogOutIcon className="h-4 w-4" />
        Sign out
      </button>
    </>
  );
};

export default SignOutButton;
