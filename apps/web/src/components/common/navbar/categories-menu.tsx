"use client";

import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
} from "@/components/ui/navigation-menu";
import { Link } from "@/i18n/navigation";
import type { CategoryMenuItem } from "@/lib/category-tree";
import { useTranslations } from "next-intl";
import React from "react";

interface Props {
  menu: CategoryMenuItem[];
}

/** Desktop mega menu: every top-level category with its subcategories, opened on hover or focus. */
const CategoriesMenu: React.FC<Props> = ({ menu }) => {
  const t = useTranslations("navigation.navbar");

  return (
    <NavigationMenu>
      <NavigationMenuList>
        <NavigationMenuItem>
          <NavigationMenuTrigger className="text-sm font-medium">{t("categories")}</NavigationMenuTrigger>
          <NavigationMenuContent>
            <div className="grid w-[min(92vw,56rem)] grid-cols-2 gap-x-6 gap-y-5 p-4 md:grid-cols-3 lg:grid-cols-4">
              {menu.map((root) => (
                <div key={root.id} className="space-y-1">
                  <NavigationMenuLink asChild className="px-2 py-1 font-semibold">
                    <Link href={root.href}>{root.name}</Link>
                  </NavigationMenuLink>
                  {root.children.length > 0 && (
                    <ul>
                      {root.children.map((child) => (
                        <li key={child.id}>
                          <NavigationMenuLink asChild className="text-muted-foreground px-2 py-1">
                            <Link href={child.href}>{child.name}</Link>
                          </NavigationMenuLink>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              ))}
            </div>
            <div className="border-t px-6 py-3">
              <NavigationMenuLink asChild className="text-primary inline-flex p-0 text-sm font-medium">
                <Link href="/categories">{t("allCategories")} →</Link>
              </NavigationMenuLink>
            </div>
          </NavigationMenuContent>
        </NavigationMenuItem>
      </NavigationMenuList>
    </NavigationMenu>
  );
};

export { CategoriesMenu };
