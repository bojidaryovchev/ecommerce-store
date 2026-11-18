"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { approveAllReadyAction } from "@/mutations/enrichment";
import { useRouter } from "next/navigation";
import React, { useState, useTransition } from "react";
import toast from "react-hot-toast";

/** Publishes every clean proposal at once, after a confirmation. */
const ApproveAllButton: React.FC<{ ready: number }> = ({ ready }) => {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  const approve = () => {
    startTransition(async () => {
      const result = await approveAllReadyAction();
      if (result.success) {
        toast.success(`Published ${result.data.count} product${result.data.count === 1 ? "" : "s"}`);
        setOpen(false);
      } else {
        toast.error(result.error);
      }
      router.refresh();
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button disabled={ready === 0}>Approve all ready ({ready})</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Publish {ready} proposals?</DialogTitle>
          <DialogDescription>
            Their new names, descriptions and specifications go live and are locked against the supplier sync. Flagged
            products are not included. Open a few first: this is the copy shoppers and search engines will read.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline" disabled={isPending}>
              Cancel
            </Button>
          </DialogClose>
          <Button onClick={approve} disabled={isPending}>
            {isPending ? "Publishing…" : "Publish"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export { ApproveAllButton };
