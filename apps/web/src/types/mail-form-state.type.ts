/** What the mailbox's reply and compose forms get back from their server actions. */
export type MailFormState = {
  error?: string;
  /** Set on a successful send, so the form can clear itself (a new value each time). */
  sentAt?: number;
};
