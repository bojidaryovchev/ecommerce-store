import Navbar from "@/components/navbar.component";
import { auth } from "@/lib/auth";
import { getRootCategories } from "@/lib/queries/categories";
import React, { PropsWithChildren } from "react";

const NavbarProviders: React.FC<PropsWithChildren> = async ({ children }) => {
  const [categories, session] = await Promise.all([getRootCategories(), auth()]);

  return (
    <>
      <Navbar categories={categories} session={session} />
      {children}
    </>
  );
};

export default NavbarProviders;
