import { Resend } from "resend";

const resend = process.env.RESEND_API_KEY
  ? new Resend(process.env.RESEND_API_KEY)
  : null;

const fromEmail = process.env.RESEND_FROM_EMAIL ?? "noreply@dentallab.app";

export async function sendMagicLinkEmail(params: {
  to: string;
  url: string;
  labName: string;
}) {
  if (!resend) {
    console.info("[dev] Magic link:", params.url);
    return { ok: true, dev: true };
  }

  await resend.emails.send({
    from: fromEmail,
    to: params.to,
    subject: `Sign in to ${params.labName}`,
    html: `
      <p>Click the link below to sign in to ${params.labName}:</p>
      <p><a href="${params.url}">Sign in</a></p>
      <p>This link expires in 15 minutes.</p>
    `,
  });

  return { ok: true };
}
