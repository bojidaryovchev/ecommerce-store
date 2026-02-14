import { Navbar } from "@/components/common/navbar";
import { getRootCategories } from "@/queries/categories";
import type { Session } from "next-auth";
import React, { PropsWithChildren } from "react";

interface Props extends PropsWithChildren {
  session: Session | null;
}

const NavbarProviders: React.FC<Props> = async ({ session, children }) => {
  const { data: categories } = await getRootCategories({ pageSize: 100 });

  return (
    <>
      <Navbar categories={categories} session={session} />
      {children}
    </>
  );
};

export default NavbarProviders;
