import { Button } from "@/components/ui/button";
import Link from "next/link";
import React from "react";

interface Props {
  title: string;
}

const SectionHeader: React.FC<Props> = ({ title }) => {
  return (
    <div className="flex items-center justify-between">
      <h2 className="text-3xl font-bold">{title}</h2>
      <Button asChild variant="ghost">
        <Link href="/categories">View All →</Link>
      </Button>
    </div>
  );
};

export default SectionHeader;
