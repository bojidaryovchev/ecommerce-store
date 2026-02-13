import { Button } from "@/components/ui/button";
import Link from "next/link";
import React from "react";

interface Props {
  title: string;
  link?: string;
  linkText?: string;
}

const SectionHeader: React.FC<Props> = ({ title, link = "/categories", linkText = "View All" }) => {
  return (
    <div className="flex items-center justify-between">
      <h2 className="text-3xl font-bold">{title}</h2>
      <Button asChild variant="ghost">
        <Link href={link}>{linkText} →</Link>
      </Button>
    </div>
  );
};

export { SectionHeader };
