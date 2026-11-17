import { Link } from "@/i18n/navigation";
import { buildCategoryMenu } from "@/lib/category-tree";
import { categoryHref } from "@/lib/routes";
import { getCategoryIndex } from "@/queries/categories";
import { getTranslations } from "next-intl/server";
import React from "react";

/** Site footer: every category (server-rendered, so crawlers see the whole tree) and shop links. */
const SiteFooter: React.FC = async () => {
  const [categories, t, tMeta] = await Promise.all([
    getCategoryIndex(),
    getTranslations("navigation.footer"),
    getTranslations("metadata"),
  ]);
  const menu = buildCategoryMenu(categories, categoryHref);

  return (
    <footer className="border-border bg-muted/30 mt-16 border-t">
      <div className="max-w-container grid gap-10 py-12 md:grid-cols-[2fr_1fr]">
        <nav aria-label={t("categories")} className="grid grid-cols-2 gap-x-6 gap-y-6 sm:grid-cols-3">
          {menu.map((root) => (
            <div key={root.id} className="space-y-2">
              <Link href={root.href} className="text-sm font-semibold hover:underline">
                {root.name}
              </Link>
              {root.children.length > 0 && (
                <ul className="space-y-1.5">
                  {root.children.map((child) => (
                    <li key={child.id}>
                      <Link href={child.href} className="text-muted-foreground hover:text-foreground text-sm">
                        {child.name}
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          ))}
        </nav>

        <div className="space-y-6">
          <div className="space-y-2">
            <p className="text-sm font-semibold">{t("shop")}</p>
            <ul className="space-y-1.5 text-sm">
              <li>
                <Link href="/products" className="text-muted-foreground hover:text-foreground">
                  {t("allProducts")}
                </Link>
              </li>
              <li>
                <Link href="/categories" className="text-muted-foreground hover:text-foreground">
                  {t("allCategories")}
                </Link>
              </li>
              <li>
                <Link href="/account/orders" className="text-muted-foreground hover:text-foreground">
                  {t("orders")}
                </Link>
              </li>
            </ul>
          </div>
          <div className="text-muted-foreground space-y-1 text-sm">
            <p>{t("delivery")}</p>
            <p>{t("prices")}</p>
          </div>
        </div>
      </div>
      <div className="border-border border-t">
        <p className="max-w-container text-muted-foreground py-4 text-xs">
          {t("rights", { name: tMeta("siteTitle") })}
        </p>
      </div>
    </footer>
  );
};

export { SiteFooter };
