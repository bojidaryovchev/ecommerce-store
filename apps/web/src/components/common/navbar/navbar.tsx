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
import { Separator } from "@/components/ui/separator";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { useCart } from "@/contexts/cart-context";
import { Link } from "@/i18n/navigation";
import type { Category } from "@ecommerce/database/schema";
import { Menu, ShoppingCart } from "lucide-react";
import type { Session } from "next-auth";
import { signOut } from "next-auth/react";
import { useTranslations } from "next-intl";
import NextLink from "next/link";
import React, { useState } from "react";
import { LocaleSwitcher } from "./locale-switcher";
import { SearchBar } from "./search-bar";

interface Props {
  categories: Category[];
  session: Session | null;
}

const Navbar: React.FC<Props> = ({ categories, session }) => {
  const t = useTranslations("navigation.navbar");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { summary, openCart } = useCart();
  const isAdmin = session?.user?.role === "ADMIN" || session?.user?.role === "SUPER_ADMIN";

  const getInitials = (name: string | null | undefined) => {
    if (!name) return t("userInitialsFallback");
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <header className="border-border bg-background sticky top-0 z-50 w-full border-b">
      <div className="max-w-container flex h-16 items-center justify-between">
        {/* Left side - Logo and Mobile menu toggle */}
        <div className="flex items-center gap-4">
          {/* Mobile menu */}
          <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
            <SheetTrigger asChild className="sm:hidden">
              <Button variant="ghost" size="icon">
                <Menu className="h-5 w-5" />
                <span className="sr-only">{t("toggleMenu")}</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="overflow-y-auto">
              <SheetHeader>
                <SheetTitle>{t("menuTitle")}</SheetTitle>
              </SheetHeader>
              <nav className="mt-6 flex flex-col gap-4">
                <SearchBar className="sm:hidden" />
                <LocaleSwitcher className="sm:hidden" onLocaleChange={() => setMobileMenuOpen(false)} />
                <Link href="/" className="text-lg font-medium" onClick={() => setMobileMenuOpen(false)}>
                  {t("home")}
                </Link>
                <Link href="/products" className="text-lg font-medium" onClick={() => setMobileMenuOpen(false)}>
                  {t("products")}
                </Link>
                <Separator />
                <Link href="/categories" className="text-lg font-medium" onClick={() => setMobileMenuOpen(false)}>
                  {t("allCategories")}
                </Link>
                {categories.map((category) => (
                  <Link
                    key={category.id}
                    href={`/categories/${category.slug}`}
                    className="text-muted-foreground pl-4"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    {category.name}
                  </Link>
                ))}
                {session && (
                  <>
                    <Separator />
                    <Link
                      href="/account/profile"
                      className="text-lg font-medium"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      {t("profile")}
                    </Link>
                    <Link
                      href="/account/addresses"
                      className="text-lg font-medium"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      {t("addresses")}
                    </Link>
                    <Link
                      href="/account/wishlist"
                      className="text-lg font-medium"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      {t("wishlist")}
                    </Link>
                    <Link
                      href="/account/orders"
                      className="text-lg font-medium"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      {t("orders")}
                    </Link>
                  </>
                )}
                {session && isAdmin && (
                  <>
                    <Separator />
                    {/* The admin is outside the locale routing, so its links never get a locale prefix. */}
                    <NextLink href="/admin" className="text-lg font-medium" onClick={() => setMobileMenuOpen(false)}>
                      {t("admin")}
                    </NextLink>
                  </>
                )}
              </nav>
            </SheetContent>
          </Sheet>

          {/* Logo */}
          <Link href="/" className="text-xl font-bold">
            {t("brand")}
          </Link>
        </div>

        {/* Center - Desktop navigation */}
        <nav className="hidden items-center gap-6 sm:flex">
          <Link href="/" className="hover:text-primary text-sm font-medium transition-colors">
            {t("home")}
          </Link>
          <Link href="/products" className="hover:text-primary text-sm font-medium transition-colors">
            {t("products")}
          </Link>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="text-sm font-medium">
                {t("categories")}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="center">
              <DropdownMenuItem asChild>
                <Link href="/categories">{t("allCategories")}</Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              {categories.map((category) => (
                <DropdownMenuItem key={category.id} asChild>
                  <Link href={`/categories/${category.slug}`}>{category.name}</Link>
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
          <SearchBar className="hidden lg:block" />
        </nav>

        {/* Right side - Cart and User menu */}
        <div className="flex items-center gap-2">
          {/* Mobile/Tablet search toggle */}
          <SearchBar className="hidden sm:block lg:hidden" />
          {/* Language switcher (on mobile it is in the menu sheet) */}
          <LocaleSwitcher className="hidden sm:flex" />
          {/* Cart Button */}
          <Button variant="ghost" size="icon" className="relative" onClick={openCart}>
            <ShoppingCart className="h-5 w-5" />
            {summary.itemCount > 0 && (
              <span className="bg-primary text-primary-foreground absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full text-xs font-medium">
                {summary.itemCount > 99 ? "99+" : summary.itemCount}
              </span>
            )}
            <span className="sr-only">{t("openCart")}</span>
          </Button>

          {session ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                  <Avatar className="h-8 w-8">
                    <AvatarImage
                      src={session.user?.image ?? undefined}
                      alt={session.user?.name ?? t("userAvatarAlt")}
                    />
                    <AvatarFallback>{getInitials(session.user?.name)}</AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>
                  <p className="text-sm font-medium">{t("signedInAs")}</p>
                  <p className="text-muted-foreground text-xs">{session.user?.email}</p>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link href="/account/profile">{t("profile")}</Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/account/addresses">{t("addresses")}</Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/account/wishlist">{t("wishlist")}</Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/account/orders">{t("orders")}</Link>
                </DropdownMenuItem>
                {isAdmin && (
                  <DropdownMenuItem asChild>
                    <NextLink href="/admin">{t("admin")}</NextLink>
                  </DropdownMenuItem>
                )}
                <DropdownMenuItem className="text-destructive focus:text-destructive" onClick={() => signOut()}>
                  {t("signOut")}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Button asChild variant="secondary">
              <Link href="/login">{t("signIn")}</Link>
            </Button>
          )}
        </div>
      </div>
    </header>
  );
};

export { Navbar };
