"use client";

import { priceFormat } from "@/i18n/format";
import { Link } from "@/i18n/navigation";
import type { CategoryMenuItem, CategoryTile } from "@/lib/category-tree";
import { INSTALLATION_FOR_CATEGORY, INSTALLATION_SYSTEMS, installationHref } from "@/lib/installation-systems";
import { cn } from "@/lib/utils";
import { ArrowRight, ChevronDown, ChevronRight } from "lucide-react";
import { useFormatter, useTranslations } from "next-intl";
import Image from "next/image";
import { NavigationMenu as Nav } from "radix-ui";
import React, { useState } from "react";

const triggerClass =
  "text-foreground/80 hover:text-foreground data-[state=open]:text-foreground hover:bg-accent data-[state=open]:bg-accent focus-visible:ring-ring/40 inline-flex h-10 items-center gap-1 rounded-full px-4 text-sm font-medium transition-colors outline-none focus-visible:ring-4";

type Props = {
  menu: CategoryMenuItem[];
  className?: string;
  /** Tells the header when a panel opens, so it can dim the page beneath. */
  onOpenChange?: (open: boolean) => void;
};

/**
 * Desktop navigation: Продукти (the products menu), Монтаж (the installations), Съвети, Контакти.
 *
 * The open panel spans the header's content width. The root is `static` so the viewport's absolute
 * wrapper positions against the header's container (which is `relative`), not against this list.
 */
const MainNav: React.FC<Props> = ({ menu, className, onOpenChange }) => {
  const t = useTranslations("navigation.navbar");
  const [value, setValue] = useState("");

  return (
    <Nav.Root
      value={value}
      onValueChange={(next) => {
        setValue(next);
        onOpenChange?.(next !== "");
      }}
      className={cn("static", className)}
      delayDuration={60}
      skipDelayDuration={250}
    >
      <Nav.List className="flex items-center gap-0.5">
        <Nav.Item value="products">
          <Nav.Trigger className={triggerClass}>
            {t("products")}
            <ChevronDown
              className="size-3.5 transition-transform duration-200 in-data-[state=open]:rotate-180"
              aria-hidden
            />
          </Nav.Trigger>
          <Nav.Content className="w-full">
            <ProductsPanel menu={menu} />
          </Nav.Content>
        </Nav.Item>
        <Nav.Item value="installation">
          <Nav.Trigger className={triggerClass}>
            {t("installation")}
            <ChevronDown
              className="size-3.5 transition-transform duration-200 in-data-[state=open]:rotate-180"
              aria-hidden
            />
          </Nav.Trigger>
          <Nav.Content className="w-full">
            <InstallationPanel />
          </Nav.Content>
        </Nav.Item>
        <Nav.Item>
          <Nav.Link asChild>
            <Link href="/saveti" className={triggerClass}>
              {t("guides")}
            </Link>
          </Nav.Link>
        </Nav.Item>
        <Nav.Item>
          <Nav.Link asChild>
            <Link href="/kontakti" className={triggerClass}>
              {t("contact")}
            </Link>
          </Nav.Link>
        </Nav.Item>
      </Nav.List>

      <div className="absolute inset-x-4 top-full z-50">
        <Nav.Viewport className="bg-popover text-popover-foreground data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=open]:slide-in-from-top-1 relative mt-2 h-(--radix-navigation-menu-viewport-height) w-full origin-top overflow-hidden rounded-2xl border shadow-2xl shadow-black/10 transition-[height] duration-200" />
      </div>
    </Nav.Root>
  );
};

/** "12 продукта · от 3 740 €" */
function useTileMeta() {
  const t = useTranslations("navigation.navbar");
  const format = useFormatter();
  return (tile: Pick<CategoryTile, "productCount" | "minPrice">) =>
    [
      t("productCount", { count: tile.productCount }),
      tile.minPrice != null
        ? t("fromPrice", {
            price: format.number(tile.minPrice / 100, { ...priceFormat("eur"), maximumFractionDigits: 0 }),
          })
        : null,
    ]
      .filter(Boolean)
      .join(" · ");
}

const ProductsPanel: React.FC<{ menu: CategoryMenuItem[] }> = ({ menu }) => {
  const t = useTranslations("navigation.navbar");
  const meta = useTileMeta();
  const [activeId, setActiveId] = useState(menu[0]?.id);
  const active = menu.find((root) => root.id === activeId) ?? menu[0];
  if (!active) return null;
  const tiles = active.children.length > 0 ? active.children : [active];

  return (
    <div className="grid min-h-[28rem] grid-cols-[18rem_1fr]">
      <ul className="bg-muted/50 space-y-0.5 border-r p-3" aria-label={t("productsMenu")}>
        {menu.map((root) => {
          const selected = root.id === active.id;
          return (
            <li key={root.id}>
              <Nav.Link asChild active={selected}>
                <Link
                  href={root.href}
                  onMouseEnter={() => setActiveId(root.id)}
                  onFocus={() => setActiveId(root.id)}
                  className={cn(
                    "flex items-center gap-3 rounded-xl px-2.5 py-2 text-sm transition-colors outline-none",
                    selected
                      ? "bg-background text-foreground shadow-sm ring-1 ring-black/5"
                      : "text-foreground/75 hover:text-foreground focus-visible:bg-background",
                  )}
                >
                  <span className="bg-muted relative size-9 shrink-0 overflow-hidden rounded-lg">
                    {root.image && <Image src={root.image} alt="" fill sizes="36px" className="object-cover" />}
                  </span>
                  <span className="flex-1 font-medium">{root.name}</span>
                  <ChevronRight
                    className={cn("size-4 transition-opacity", selected ? "opacity-60" : "opacity-0")}
                    aria-hidden
                  />
                </Link>
              </Nav.Link>
            </li>
          );
        })}
        <li className="mt-2 border-t pt-2">
          <Nav.Link asChild>
            <Link
              href="/produkti"
              className="text-primary flex items-center gap-2 rounded-xl px-2.5 py-2 text-sm font-semibold hover:underline"
            >
              {t("allProducts")}
              <ArrowRight className="size-4" aria-hidden />
            </Link>
          </Nav.Link>
        </li>
      </ul>

      <div className="flex flex-col p-6">
        <div className="flex items-end justify-between gap-6">
          <div>
            <p className="text-xl font-semibold tracking-tight">{active.name}</p>
            <p className="text-muted-foreground mt-0.5 text-sm">{t("productCount", { count: active.productCount })}</p>
          </div>
          <Nav.Link asChild>
            <Link
              href={active.href}
              className="text-primary inline-flex min-h-6 items-center gap-1.5 text-sm font-semibold hover:underline"
            >
              {t("viewAll")}
              <ArrowRight className="size-4" aria-hidden />
            </Link>
          </Nav.Link>
        </div>

        <div className="mt-5 grid flex-1 grid-cols-[1fr_15rem] gap-6">
          <ul className={cn("grid auto-rows-min gap-3", tiles.length <= 2 ? "grid-cols-2" : "grid-cols-3")}>
            {tiles.map((tile) => (
              <li key={tile.id}>
                <Nav.Link asChild>
                  <Link
                    href={tile.href}
                    className="group bg-background hover:border-primary/25 block rounded-xl border p-2 transition-all hover:shadow-lg hover:shadow-black/5"
                  >
                    <span className="bg-muted relative block aspect-[4/3] overflow-hidden rounded-lg">
                      {tile.image && (
                        <Image
                          src={tile.image}
                          alt=""
                          fill
                          sizes={tiles.length <= 2 ? "320px" : "220px"}
                          className={cn(
                            "transition-transform duration-500 group-hover:scale-105",
                            tile.imageKind === "product" ? "object-contain p-3 mix-blend-multiply" : "object-cover",
                          )}
                        />
                      )}
                    </span>
                    <span className="mt-2 block px-1 text-sm leading-snug font-medium">{tile.name}</span>
                    <span className="text-muted-foreground block px-1 pb-0.5 text-xs">{meta(tile)}</span>
                  </Link>
                </Nav.Link>
              </li>
            ))}
          </ul>
          <Highlight root={active} />
        </div>
      </div>
    </div>
  );
};

/** The card beside the tiles: the installation this category leads to, else a pointer to the guides. */
const Highlight: React.FC<{ root: CategoryMenuItem }> = ({ root }) => {
  const t = useTranslations("navigation.navbar");
  const ti = useTranslations("installation.systems");
  const system = INSTALLATION_SYSTEMS.find((entry) => entry.slug === INSTALLATION_FOR_CATEGORY[root.slug]);
  const href = system ? installationHref(system.slug) : "/saveti";
  const image = system?.image ?? root.image;

  return (
    <Nav.Link asChild>
      <Link href={href} className="group relative flex min-h-56 overflow-hidden rounded-2xl text-white">
        {image && (
          <Image
            src={image}
            alt=""
            fill
            sizes="240px"
            className="object-cover transition-transform duration-700 group-hover:scale-105"
          />
        )}
        <span className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" aria-hidden />
        <span className="relative mt-auto block p-4">
          <span className="text-heat-soft block text-xs font-semibold tracking-wider uppercase">
            {system ? t("installationMenu") : t("browse")}
          </span>
          <span className="mt-1 block text-base leading-snug font-semibold">
            {system ? ti(`${system.slug}.title`) : t("highlightGuides")}
          </span>
          <span className="mt-1 block text-xs text-white/80">
            {system ? ti(`${system.slug}.short`) : t("highlightGuidesText")}
          </span>
          <span className="mt-3 inline-flex items-center gap-1 text-xs font-semibold">
            {system ? t("highlightInstall") : t("guides")}
            <ArrowRight className="size-3.5 transition-transform group-hover:translate-x-0.5" aria-hidden />
          </span>
        </span>
      </Link>
    </Nav.Link>
  );
};

const InstallationPanel: React.FC = () => {
  const t = useTranslations("navigation.navbar");
  const ti = useTranslations("installation.systems");

  return (
    <div className="grid grid-cols-[18rem_1fr] gap-0">
      <div className="bg-muted/50 flex flex-col border-r p-6">
        <p className="text-xl font-semibold tracking-tight">{t("installationMenu")}</p>
        <p className="text-muted-foreground mt-2 text-sm leading-relaxed">{t("installationLead")}</p>
        <div className="mt-auto flex flex-col gap-2 pt-6">
          <Nav.Link asChild>
            <Link
              href="/kontakti?tema=ogled"
              className="bg-heat text-heat-foreground hover:bg-heat/90 inline-flex h-10 items-center justify-center rounded-full px-5 text-sm font-semibold transition-colors"
            >
              {t("requestVisit")}
            </Link>
          </Nav.Link>
          <Nav.Link asChild>
            <Link
              href={installationHref()}
              className="text-primary inline-flex items-center justify-center gap-1.5 py-2 text-sm font-semibold hover:underline"
            >
              {t("howWeWork")}
              <ArrowRight className="size-4" aria-hidden />
            </Link>
          </Nav.Link>
        </div>
      </div>
      <ul className="grid grid-cols-2 gap-3 p-6">
        {INSTALLATION_SYSTEMS.map((system) => (
          <li key={system.slug}>
            <Nav.Link asChild>
              <Link
                href={installationHref(system.slug)}
                className="group hover:border-primary/25 flex items-center gap-4 rounded-xl border p-2.5 transition-all hover:shadow-lg hover:shadow-black/5"
              >
                <span className="bg-muted relative h-20 w-28 shrink-0 overflow-hidden rounded-lg">
                  <Image
                    src={system.image}
                    alt=""
                    fill
                    sizes="112px"
                    className="object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                </span>
                <span className="min-w-0">
                  <span className="block font-semibold">{ti(`${system.slug}.title`)}</span>
                  <span className="text-muted-foreground mt-0.5 block text-sm leading-snug">
                    {ti(`${system.slug}.short`)}
                  </span>
                </span>
              </Link>
            </Nav.Link>
          </li>
        ))}
      </ul>
    </div>
  );
};

export { MainNav };
