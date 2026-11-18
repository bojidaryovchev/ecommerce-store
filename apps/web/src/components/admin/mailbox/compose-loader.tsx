import { getMailIdentity } from "@/lib/mailbox";
import { getOrderContact } from "@/queries/mailbox";
import { notFound } from "next/navigation";
import React from "react";
import { ComposeForm } from "./compose-form";

type Props = {
  orderId?: string;
  to?: string;
};

/** A new message, addressed from an order ("Email customer") or to a given address. */
const ComposeLoader: React.FC<Props> = async ({ orderId, to }) => {
  const identity = getMailIdentity();
  if (!identity) {
    return (
      <p className="text-muted-foreground rounded-lg border p-4 text-sm">
        Email is not configured (EMAIL_FROM, RESEND_API_KEY), so nothing can be sent.
      </p>
    );
  }

  const contact = orderId ? await getOrderContact(orderId) : null;
  if (orderId && !contact) notFound();

  return (
    <ComposeForm
      from={identity.from}
      defaults={
        contact
          ? {
              to: contact.email ?? "",
              // The reference in the subject is what ties the customer's answer to the order as well.
              subject: `Поръчка #${contact.reference}`,
              name: contact.name,
              orderId: contact.orderId,
            }
          : { to: to ?? "" }
      }
    />
  );
};

export { ComposeLoader };
