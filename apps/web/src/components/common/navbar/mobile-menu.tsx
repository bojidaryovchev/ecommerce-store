"use client";

import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Link } from "@/i18n/navigation";
import type { CategoryMenuItem } from "@/lib/category-tree";
import { INSTALLATION_SYSTEMS, installationHref } from "@/lib/installation-systems";
import { cn } from "@/lib/utils";
import { ChevronDown, Menu } from "lucide-react";
import type { Session } from "next-auth";
import { useTranslations } from "next-intl";
import Image from "next/image";
import NextLink from "next/link";
import React, { useState } from "react";
import { LocaleSwitcher } from "./locale-switcher";

type Props = {
  menu: CategoryMenuItem[];
  session: Session | null;
  isAdmin: boolean;
  className?: string;
};

/** The phone and tablet navigation: categories with pictures, installations, guides, account. */
const MobileMenu: React.FC<Props> = ({ menu, session, isAdmin, className }) => {
  const t = useTranslations("navigation.navbar");
  const ti = useTranslations("installation.systems");
  const [open, setOpen] = useState(false);
  const close = () => setOpen(false);
  const row = "flex items-center gap-3 rounded-xl px-2 py-2 text-[15px] font-medium hover:bg-accent";

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild className={className}>
        <Button variant="ghost" size="icon" className="rounded-full" aria-label={t("toggleMenu")}>
          <Menu className="size-5" />
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="w-[min(92vw,24rem)] gap-0 overflow-y-auto p-0">
        <SheetHeader className="border-b px-5 py-4">
          <SheetTitle>{t("menuTitle")}</SheetTitle>
        </SheetHeader>

        <nav className="flex flex-col gap-6 px-3 py-5">
          <section>
            <p className="text-muted-foreground px-2 pb-2 text-xs font-semibold tracking-wider uppercase">
              {t("products")}
            </p>
            <ul className="space-y-0.5">
              {menu.map((root) => (
                <li key={root.id}>
                  <details className="group">
                    <summary className={cn(row, "cursor-pointer list-none [&::-webkit-details-marker]:hidden")}>
                      <span className="bg-muted relative size-10 shrink-0 overflow-hidden rounded-lg">
                        {root.image && <Image src={root.image} alt="" fill sizes="40px" className="object-cover" />}
                      </span>
                      <span className="flex-1">{root.name}</span>
                      <ChevronDown
                        className="text-muted-foreground size-4 transition-transform group-open:rotate-180"
                        aria-hidden
                      />
                    </summary>
                    <ul className="mt-1 mb-2 ml-[3.25rem] space-y-0.5 border-l pl-3">
                      <li>
                        <Link
                          href={root.href}
                          onClick={close}
                          className="text-primary block py-1.5 text-sm font-semibold"
                        >
                          {t("viewAll")} ({root.productCount})
                        </Link>
                      </li>
                      {root.children.map((child) => (
                        <li key={child.id}>
                          <Link href={child.href} onClick={close} className="text-foreground/80 block py-1.5 text-sm">
                            {child.name}
                          </Link>
                        </li>
                      ))}
                    </ul>
                  </details>
                </li>
              ))}
              <li>
                <Link href="/products" onClick={close} className="text-primary block px-2 py-2 text-sm font-semibold">
                  {t("allProducts")} →
                </Link>
              </li>
            </ul>
          </section>

          <section>
            <p className="text-muted-foreground px-2 pb-2 text-xs font-semibold tracking-wider uppercase">
              {t("installation")}
            </p>
            <ul className="space-y-0.5">
              {INSTALLATION_SYSTEMS.map((system) => (
                <li key={system.slug}>
                  <Link href={installationHref(system.slug)} onClick={close} className={row}>
                    <span className="bg-muted relative size-10 shrink-0 overflow-hidden rounded-lg">
                      <Image src={system.image} alt="" fill sizes="40px" className="object-cover" />
                    </span>
                    {ti(`${system.slug}.title`)}
                  </Link>
                </li>
              ))}
              <li>
                <Link
                  href="/kontakti?tema=ogled"
                  onClick={close}
                  className="bg-heat text-heat-foreground mt-2 flex h-11 items-center justify-center rounded-full text-sm font-semibold"
                >
                  {t("requestVisit")}
                </Link>
              </li>
            </ul>
          </section>

          <section className="space-y-0.5">
            <Link href="/saveti" onClick={close} className={row}>
              {t("guides")}
            </Link>
            <Link href="/kalkulatori" onClick={close} className={row}>
              {t("calculators")}
            </Link>
            <Link href="/kontakti" onClick={close} className={row}>
              {t("contact")}
            </Link>
          </section>

          <section className="space-y-0.5 border-t pt-4">
            {session ? (
              <>
                <Link href="/account/orders" onClick={close} className={row}>
                  {t("orders")}
                </Link>
                <Link href="/account/profile" onClick={close} className={row}>
                  {t("profile")}
                </Link>
                <Link href="/account/wishlist" onClick={close} className={row}>
                  {t("wishlist")}
                </Link>
                {isAdmin && (
                  <NextLink href="/admin" onClick={close} className={row}>
                    {t("admin")}
                  </NextLink>
                )}
              </>
            ) : (
              <Link href="/login" onClick={close} className={row}>
                {t("signIn")}
              </Link>
            )}
            <div className="px-2 pt-3">
              <LocaleSwitcher onLocaleChange={close} />
            </div>
          </section>
        </nav>
      </SheetContent>
    </Sheet>
  );
};

export { MobileMenu };
