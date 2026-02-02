"use client";

import { Button } from "@heroui/react";
import Link from "next/link";
import React from "react";

interface Props {
  title: string;
}

const SectionHeader: React.FC<Props> = ({ title }) => {
  return (
    <div className="flex items-center justify-between">
      <h2 className="text-3xl font-bold">{title}</h2>
      <Button as={Link} href="/categories" variant="light">
        View All →
      </Button>
    </div>
  );
};

export default SectionHeader;
