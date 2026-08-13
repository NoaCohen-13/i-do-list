import { Resend } from "resend";

let _resend: Resend | null = null;
function getResend() {
  if (!_resend) _resend = new Resend(process.env.RESEND_API_KEY!);
  return _resend;
}

/**
 * Sends one email per recipient rather than a single multi-recipient send.
 * On Resend's no-domain free tier, only the account owner's own verified
 * address can receive mail — every other recipient is rejected, and Resend
 * rejects the whole send if ANY recipient is invalid. Sending individually
 * means the account owner still gets reminders even before a domain is
 * verified, instead of every recipient failing together.
 *
 * Returns recipients that failed, so callers can decide whether "sent" (at
 * least one success) is good enough to mark as delivered.
 */
export async function sendReminderEmail(to: string[], subject: string, bodyHtml: string) {
  if (!process.env.RESEND_API_KEY) {
    throw new Error("RESEND_API_KEY is not set yet.");
  }
  const resend = getResend();
  const failed: string[] = [];

  for (const recipient of to) {
    const { error } = await resend.emails.send({
      from: "I Do List <onboarding@resend.dev>",
      to: recipient,
      subject,
      html: bodyHtml,
    });
    if (error) failed.push(recipient);
  }

  if (failed.length === to.length) {
    throw new Error(`Resend rejected all recipients: ${failed.join(", ")}`);
  }
  return { failed };
}
