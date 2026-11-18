import { Button } from "@/components/ui/button";
import { getMailIdentity } from "@/lib/mailbox";
import Link from "next/link";
import React from "react";

type Props = {
  children: React.ReactNode;
};

const MailboxHeader: React.FC<Props> = ({ children }) => {
  const identity = getMailIdentity();

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Mailbox</h1>
          <p className="text-muted-foreground mt-1 text-sm">
            {identity
              ? `Mail to ${identity.address} lands here, and replies leave from the same address.`
              : "Email is not configured: set EMAIL_FROM (and RESEND_API_KEY, RESEND_WEBHOOK_SECRET)."}
          </p>
        </div>
        <div className="flex gap-2">
          <Button asChild>
            <Link href="/admin/mailbox/new">New message</Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/admin">Back to Dashboard</Link>
          </Button>
        </div>
      </div>
      {children}
    </div>
  );
};

export { MailboxHeader };
