import { Resend } from "resend";

let _resend: Resend | null = null;
function getResend() {
  if (!_resend) _resend = new Resend(process.env.RESEND_API_KEY!);
  return _resend;
}

export async function sendReminderEmail(to: string[], subject: string, bodyHtml: string) {
  if (!process.env.RESEND_API_KEY) {
    throw new Error("RESEND_API_KEY is not set yet.");
  }
  const resend = getResend();
  await resend.emails.send({
    from: "I Do List <onboarding@resend.dev>",
    to,
    subject,
    html: bodyHtml,
  });
}
