"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { CONTACT_EMAIL } from "@/constants";
import { useCart } from "@/contexts/cart-context";
import { Link } from "@/i18n/navigation";
import type { CategoryMenuItem } from "@/lib/category-tree";
import { DELIVERY, DELIVERY_ALWAYS_FREE } from "@/lib/delivery";
import { BadgeEuro, Flame, Mail, ShoppingBag, Snowflake, Truck, UserRound, Wrench } from "lucide-react";
import type { Session } from "next-auth";
import { signOut } from "next-auth/react";
import { useFormatter, useTranslations } from "next-intl";
import NextLink from "next/link";
import React, { useState } from "react";
import { LocaleSwitcher } from "./locale-switcher";
import { MainNav } from "./main-nav";
import { MobileMenu } from "./mobile-menu";
import { SearchField } from "./search-field";

interface Props {
  menu: CategoryMenuItem[];
  session: Session | null;
}

const isAdmin = (session: Session | null) => session?.user?.role === "ADMIN" || session?.user?.role === "SUPER_ADMIN";

/**
 * The storefront header: a slim top bar with the shop's promises, then logo, navigation, search,
 * account and cart. On phones the navigation moves into a drawer and the search gets its own row.
 */
const Navbar: React.FC<Props> = ({ menu, session }) => {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <header className="bg-background/95 supports-[backdrop-filter]:bg-background/85 sticky top-0 z-50 w-full border-b backdrop-blur-md">
      {/* Dims the page under an open menu panel; purely visual, so leaving the panel still closes it. */}
      <div
        aria-hidden
        className={`pointer-events-none absolute inset-x-0 top-full h-screen bg-slate-950/25 transition-opacity duration-200 ${menuOpen ? "opacity-100" : "opacity-0"}`}
      />
      <TopBar />
      <div className="max-w-container relative flex h-16 items-center gap-2 lg:gap-4 xl:gap-6">
        <MobileMenu menu={menu} session={session} isAdmin={isAdmin(session)} className="lg:hidden" />
        <Logo />
        <MainNav menu={menu} className="hidden lg:flex" onOpenChange={setMenuOpen} />
        {/* min-w-0: the search gives way first when the row is tight (small laptops). */}
        <SearchField className="ml-auto hidden min-w-0 flex-1 md:block md:max-w-md lg:max-w-sm xl:max-w-md" />
        <div className="ml-auto flex items-center gap-1 md:ml-0">
          <LocaleSwitcher className="hidden md:flex" />
          <AccountMenu session={session} />
          <CartButton />
        </div>
      </div>
      <div className="max-w-container pb-3 md:hidden">
        <SearchField />
      </div>
    </header>
  );
};

/** The delivery terms in a few words, from lib/delivery.ts: the shop's banner line. */
const useDeliveryLine = () => {
  const t = useTranslations("navigation.topBar");
  const format = useFormatter();
  if (DELIVERY_ALWAYS_FREE) return t("freeDelivery");
  if (DELIVERY.freeFrom > 0) {
    return t("freeDeliveryFrom", {
      amount: format.number(DELIVERY.freeFrom / 100, { style: "currency", currency: "EUR", maximumFractionDigits: 0 }),
    });
  }
  return t("delivery");
};

const TopBar: React.FC = () => {
  const t = useTranslations("navigation.topBar");
  const tn = useTranslations("navigation.navbar");
  const deliveryLine = useDeliveryLine();
  const item = "inline-flex min-h-6 items-center gap-1.5 whitespace-nowrap";

  return (
    <div className="bg-primary text-primary-foreground/85 text-xs">
      {/* Phones: the delivery terms alone, as a strip above the header. */}
      <p className="flex h-8 items-center justify-center gap-1.5 font-medium md:hidden">
        <Truck className="text-heat size-3.5" aria-hidden />
        {deliveryLine}
      </p>
      <div className="max-w-container hidden h-9 items-center justify-between gap-6 md:flex">
        <ul className="flex items-center gap-5">
          <li className={`${item} text-primary-foreground font-semibold`}>
            <Truck className="text-heat size-3.5" aria-hidden />
            <Link href="/dostavka" className="inline-flex min-h-6 items-center hover:underline">
              {deliveryLine}
            </Link>
          </li>
          <li className={item}>
            <Wrench className="size-3.5" aria-hidden />
            {t("installation")}
          </li>
          {/* Not `item`: its inline-flex would beat `hidden` and squeeze the bar on tablets. */}
          <li className="hidden items-center gap-1.5 whitespace-nowrap lg:inline-flex">
            <BadgeEuro className="size-3.5" aria-hidden />
            {t("prices")}
          </li>
        </ul>
        <div className="flex items-center gap-5">
          <a href={`mailto:${CONTACT_EMAIL}`} className={`${item} hover:text-primary-foreground`}>
            <Mail className="size-3.5" aria-hidden />
            <span className="sr-only">{t("writeUs")}: </span>
            {CONTACT_EMAIL}
          </a>
          <Link
            href="/kontakti?tema=ogled"
            className="bg-heat text-heat-foreground hover:bg-heat/90 rounded-full px-3 py-1 font-semibold whitespace-nowrap transition-colors"
          >
            {tn("requestVisit")}
          </Link>
        </div>
      </div>
    </div>
  );
};

/** The mark: warmth and cooling, the two halves of what the shop installs. */
const Logo: React.FC = () => {
  const t = useTranslations("navigation.navbar");
  const tm = useTranslations("metadata");
  return (
    <Link href="/" className="group flex shrink-0 items-center gap-2.5" aria-label={t("brand")}>
      <span className="bg-primary text-primary-foreground relative grid size-9 place-items-center overflow-hidden rounded-xl">
        <Flame
          className="text-heat absolute -top-0.5 -left-0.5 size-6 transition-transform group-hover:-translate-y-0.5"
          aria-hidden
        />
        <Snowflake className="text-primary-foreground absolute -right-0.5 -bottom-0.5 size-5 opacity-90" aria-hidden />
      </span>
      {/* The name beside the mark, except on small laptops, where the full menu needs the room. */}
      <span className="hidden leading-tight sm:block lg:hidden xl:block">
        <span className="block text-[15px] font-bold tracking-tight">{t("brand")}</span>
        <span className="text-muted-foreground block text-xs">{tm("tagline")}</span>
      </span>
    </Link>
  );
};

const AccountMenu: React.FC<{ session: Session | null }> = ({ session }) => {
  const t = useTranslations("navigation.navbar");

  if (!session) {
    return (
      <Button asChild variant="ghost" size="icon" className="rounded-full">
        <Link href="/login" title={t("signIn")}>
          <UserRound className="size-5" aria-hidden />
          <span className="sr-only">{t("signIn")}</span>
        </Link>
      </Button>
    );
  }

  const initials =
    session.user?.name
      ?.split(" ")
      .map((part) => part[0])
      .join("")
      .toUpperCase()
      .slice(0, 2) || t("userInitialsFallback");

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="rounded-full" aria-label={t("account")}>
          <Avatar className="size-8">
            <AvatarImage src={session.user?.image ?? undefined} alt={session.user?.name ?? t("userAvatarAlt")} />
            <AvatarFallback className="text-xs">{initials}</AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel>
          <p className="text-sm font-medium">{t("signedInAs")}</p>
          <p className="text-muted-foreground truncate text-xs">{session.user?.email}</p>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link href="/account/orders">{t("orders")}</Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link href="/account/profile">{t("profile")}</Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link href="/account/addresses">{t("addresses")}</Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link href="/account/wishlist">{t("wishlist")}</Link>
        </DropdownMenuItem>
        {isAdmin(session) && (
          <DropdownMenuItem asChild>
            {/* The admin is outside the locale routing. */}
            <NextLink href="/admin">{t("admin")}</NextLink>
          </DropdownMenuItem>
        )}
        <DropdownMenuSeparator />
        <DropdownMenuItem className="text-destructive focus:text-destructive" onClick={() => signOut()}>
          {t("signOut")}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

const CartButton: React.FC = () => {
  const t = useTranslations("navigation.navbar");
  const { summary, openCart } = useCart();
  return (
    <Button variant="ghost" size="icon" className="relative rounded-full" onClick={openCart} aria-label={t("openCart")}>
      <ShoppingBag className="size-5" />
      {summary.itemCount > 0 && (
        <span className="bg-heat text-heat-foreground absolute -top-0.5 -right-0.5 flex size-5 items-center justify-center rounded-full text-[11px] font-semibold tabular-nums">
          {summary.itemCount > 99 ? "99+" : summary.itemCount}
        </span>
      )}
    </Button>
  );
};

export { Navbar };
