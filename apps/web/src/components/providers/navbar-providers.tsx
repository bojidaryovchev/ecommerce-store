import { Navbar } from "@/components/common/navbar";
import { buildCategoryMenu } from "@/lib/category-tree";
import { categoryHref } from "@/lib/routes";
import { getCategoryIndex, getCategoryStats } from "@/queries/categories";
import type { Session } from "next-auth";
import React, { PropsWithChildren } from "react";

interface Props extends PropsWithChildren {
  session: Session | null;
}

const NavbarProviders: React.FC<Props> = async ({ session, children }) => {
  const [index, stats] = await Promise.all([getCategoryIndex(), getCategoryStats()]);
  const menu = buildCategoryMenu(index, categoryHref, stats);

  return (
    <>
      <Navbar menu={menu} session={session} />
      {children}
    </>
  );
};

export default NavbarProviders;
