"use client";

import type { Category } from "@ecommerce/database/schema";
import {
  Avatar,
  Button,
  Dropdown,
  DropdownItem,
  DropdownMenu,
  DropdownTrigger,
  Navbar as HeroNavbar,
  Link,
  NavbarBrand,
  NavbarContent,
  NavbarItem,
  NavbarMenu,
  NavbarMenuItem,
  NavbarMenuToggle,
} from "@heroui/react";
import type { Session } from "next-auth";
import { signOut } from "next-auth/react";
import React from "react";

interface Props {
  categories: Category[];
  session: Session | null;
}

const Navbar: React.FC<Props> = ({ categories, session }) => {
  const dropdownItems = [
    <DropdownItem key="all" href="/categories">
      All Categories
    </DropdownItem>,
    ...categories.map((category) => (
      <DropdownItem key={category.id} href={`/categories/${category.slug}`}>
        {category.name}
      </DropdownItem>
    )),
  ];

  const isAdmin = session?.user?.role === "ADMIN" || session?.user?.role === "SUPER_ADMIN";

  return (
    <HeroNavbar maxWidth="xl" isBordered>
      <NavbarContent>
        <NavbarMenuToggle className="sm:hidden" />
        <NavbarBrand>
          <Link href="/" className="font-bold text-inherit">
            Ecommerce Store
          </Link>
        </NavbarBrand>
      </NavbarContent>

      <NavbarContent className="hidden gap-4 sm:flex" justify="center">
        <NavbarItem>
          <Link color="foreground" href="/">
            Home
          </Link>
        </NavbarItem>
        <Dropdown>
          <NavbarItem>
            <DropdownTrigger>
              <Button
                disableRipple
                className="bg-transparent p-0 data-[hover=true]:bg-transparent"
                radius="sm"
                variant="light"
              >
                Categories
              </Button>
            </DropdownTrigger>
          </NavbarItem>
          <DropdownMenu
            aria-label="Categories"
            items={categories}
            itemClasses={{
              base: "gap-4",
            }}
          >
            {dropdownItems}
          </DropdownMenu>
        </Dropdown>
      </NavbarContent>

      <NavbarContent justify="end">
        {session ? (
          <Dropdown placement="bottom-end">
            <DropdownTrigger>
              <Avatar
                as="button"
                className="transition-transform"
                name={session.user?.name ?? "User"}
                size="sm"
                src={session.user?.image ?? undefined}
              />
            </DropdownTrigger>
            <DropdownMenu aria-label="User menu">
              <DropdownItem key="profile" className="h-14 gap-2" textValue="Profile">
                <p className="font-semibold">Signed in as</p>
                <p className="font-semibold">{session.user?.email}</p>
              </DropdownItem>
              {isAdmin ? (
                <DropdownItem key="admin" href="/admin">
                  Admin Panel
                </DropdownItem>
              ) : null}
              <DropdownItem key="signout" color="danger" onPress={() => signOut()}>
                Sign Out
              </DropdownItem>
            </DropdownMenu>
          </Dropdown>
        ) : (
          <NavbarItem>
            <Button as={Link} href="/login" color="primary" variant="flat">
              Sign In
            </Button>
          </NavbarItem>
        )}
      </NavbarContent>

      <NavbarMenu>
        <NavbarMenuItem>
          <Link className="w-full" href="/" size="lg">
            Home
          </Link>
        </NavbarMenuItem>
        <NavbarMenuItem>
          <Link className="w-full" href="/categories" size="lg">
            All Categories
          </Link>
        </NavbarMenuItem>
        {categories.map((category) => (
          <NavbarMenuItem key={category.id}>
            <Link className="w-full" href={`/categories/${category.slug}`} size="lg">
              {category.name}
            </Link>
          </NavbarMenuItem>
        ))}
        {session && isAdmin && (
          <NavbarMenuItem>
            <Link className="w-full" href="/admin" size="lg">
              Admin Panel
            </Link>
          </NavbarMenuItem>
        )}
      </NavbarMenu>
    </HeroNavbar>
  );
};

export default Navbar;
