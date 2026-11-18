"use client";

import { Button } from "@/components/ui/button";
import { setThreadStatusAction } from "@/mutations/mailbox";
import type { MailThreadStatus } from "@ecommerce/database/schema";
import React, { useTransition } from "react";
import toast from "react-hot-toast";

type Props = {
  threadId: string;
  status: MailThreadStatus;
};

const ThreadStatusButton: React.FC<Props> = ({ threadId, status }) => {
  const [pending, startTransition] = useTransition();
  const next: MailThreadStatus = status === "open" ? "done" : "open";

  return (
    <Button
      variant="outline"
      disabled={pending}
      onClick={() =>
        startTransition(async () => {
          const result = await setThreadStatusAction(threadId, next);
          if (!result.success) toast.error(result.error);
        })
      }
    >
      {status === "open" ? "Mark as done" : "Reopen"}
    </Button>
  );
};

export { ThreadStatusButton };
