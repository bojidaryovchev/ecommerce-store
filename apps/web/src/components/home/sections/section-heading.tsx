import { Link } from "@/i18n/navigation";
import { cn } from "@/lib/utils";
import { ArrowRight } from "lucide-react";
import React from "react";

type Props = {
  eyebrow?: string;
  title: string;
  description?: string;
  link?: { href: string; label: string };
  /** For sections on a dark background. */
  inverted?: boolean;
  className?: string;
};

/** The heading every home section opens with: a small eyebrow, the title, an optional line and link. */
const SectionHeading: React.FC<Props> = ({ eyebrow, title, description, link, inverted, className }) => (
  <div className={cn("flex flex-wrap items-end justify-between gap-x-8 gap-y-4", className)}>
    <div className="max-w-2xl" data-reveal>
      {eyebrow && <p className="text-heat text-xs font-semibold tracking-[0.2em] uppercase">{eyebrow}</p>}
      <h2 className="mt-2.5 text-3xl font-bold tracking-tight text-balance md:text-4xl">{title}</h2>
      {description && (
        <p className={cn("mt-3 leading-relaxed", inverted ? "text-primary-foreground/75" : "text-muted-foreground")}>
          {description}
        </p>
      )}
    </div>
    {link && (
      <Link
        href={link.href}
        data-reveal
        className={cn(
          "inline-flex items-center gap-1.5 text-sm font-semibold hover:underline",
          inverted ? "text-primary-foreground" : "text-primary",
        )}
      >
        {link.label}
        <ArrowRight className="size-4" aria-hidden />
      </Link>
    )}
  </div>
);

export { SectionHeading };
