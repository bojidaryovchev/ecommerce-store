"use client";

import { Button } from "@/components/ui/button";
import { setProductVisibilityAction } from "@/mutations/enrichment";
import { Eye, EyeOff } from "lucide-react";
import { useRouter } from "next/navigation";
import React, { useTransition } from "react";
import toast from "react-hot-toast";

/** Takes the product out of the shop (not listed, sold or indexed), or puts it back. */
const VisibilityToggle: React.FC<{ productId: string; active: boolean }> = ({ productId, active }) => {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  const toggle = () =>
    startTransition(async () => {
      const result = await setProductVisibilityAction(productId, !active);
      if (!result.success) {
        toast.error(result.error);
        return;
      }
      toast.success(active ? "Hidden from the shop" : "Shown in the shop again");
      router.refresh();
    });

  return (
    <Button type="button" variant={active ? "outline" : "default"} onClick={toggle} disabled={pending}>
      {active ? <EyeOff className="mr-2 size-4" aria-hidden /> : <Eye className="mr-2 size-4" aria-hidden />}
      {pending ? "Saving…" : active ? "Hide from the shop" : "Show in the shop"}
    </Button>
  );
};

export { VisibilityToggle };
