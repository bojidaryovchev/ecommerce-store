import { Navbar } from "@/components/common/navbar";
import { buildCategoryMenu } from "@/lib/category-tree";
import { categoryHref } from "@/lib/routes";
import { getCategoryIndex } from "@/queries/categories";
import type { Session } from "next-auth";
import React, { PropsWithChildren } from "react";

interface Props extends PropsWithChildren {
  session: Session | null;
}

const NavbarProviders: React.FC<Props> = async ({ session, children }) => {
  const menu = buildCategoryMenu(await getCategoryIndex(), categoryHref);

  return (
    <>
      <Navbar menu={menu} session={session} />
      {children}
    </>
  );
};

export default NavbarProviders;
