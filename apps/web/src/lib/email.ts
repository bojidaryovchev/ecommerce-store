import { Resend } from "resend";

const resendApiKey = process.env.RESEND_API_KEY;

/**
 * Lazily-initialized Resend client.
 * Allows the app to boot without RESEND_API_KEY in dev (emails will be skipped).
 */
function getResendClient() {
  if (!resendApiKey) {
    return null;
  }
  return new Resend(resendApiKey);
}

const FROM_EMAIL = process.env.EMAIL_FROM ?? "Store <noreply@example.com>";

type SendEmailOptions = {
  to: string;
  subject: string;
  react: React.ReactElement;
};

/**
 * Send an email via Resend. Silently skips if RESEND_API_KEY is not configured.
 */
async function sendEmail({ to, subject, react }: SendEmailOptions) {
  const resend = getResendClient();

  if (!resend) {
    console.warn(`[email] Skipping email to ${to} — RESEND_API_KEY not set`);
    return null;
  }

  try {
    const { data, error } = await resend.emails.send({
      from: FROM_EMAIL,
      to,
      subject,
      react,
    });

    if (error) {
      console.error("[email] Failed to send:", error);
      return null;
    }

    console.log(`[email] Sent "${subject}" to ${to} (id: ${data?.id})`);
    return data;
  } catch (err) {
    console.error("[email] Unexpected error:", err);
    return null;
  }
}

export { sendEmail };
