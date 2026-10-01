import "server-only";
import { sendResendEmail } from "@/lib/resend";

export function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function buildBusinessEmail(options: {
  title: string;
  paragraphs: string[];
  actionLabel?: string;
  actionUrl?: string;
  footnote?: string;
}) {
  const text = [
    "Hello,",
    "",
    options.title,
    "",
    ...options.paragraphs.flatMap((paragraph) => [paragraph, ""]),
    options.actionLabel && options.actionUrl ? `${options.actionLabel}: ${options.actionUrl}` : "",
    options.footnote ?? "",
    "",
    "Thank you,",
    "Catcher",
  ]
    .filter((line, index, lines) => line !== "" || lines[index - 1] !== "")
    .join("\n");

  const actionHtml =
    options.actionLabel && options.actionUrl
      ? `<p style="margin-top:24px;"><a href="${escapeHtml(options.actionUrl)}" style="display:inline-block;background:#0F2651;color:#ffffff;text-decoration:none;padding:12px 18px;border-radius:999px;font-weight:600;">${escapeHtml(options.actionLabel)}</a></p>`
      : "";

  const html = `
    <div style="font-family:Arial,sans-serif;line-height:1.6;color:#0f172a;max-width:640px;margin:0 auto;padding:24px;">
      <p>Hello,</p>
      <h1 style="font-size:24px;line-height:1.3;color:#0F2651;margin:0 0 16px;">${escapeHtml(options.title)}</h1>
      ${options.paragraphs.map((paragraph) => `<p>${escapeHtml(paragraph)}</p>`).join("")}
      ${actionHtml}
      ${options.footnote ? `<p style="margin-top:24px;font-size:13px;color:#64748b;">${escapeHtml(options.footnote)}</p>` : ""}
      <p style="margin-top:24px;">Thank you,<br />Catcher</p>
    </div>
  `;

  return { text, html };
}

async function safeSend(to: string | string[], subject: string, body: { text: string; html: string }) {
  try {
    await sendResendEmail({ to, subject, ...body });
    return true;
  } catch (error) {
    console.error(`Failed to send business email "${subject}":`, error);
    return false;
  }
}

export function sendBusinessInviteEmail(options: {
  to: string;
  businessName: string;
  inviterName: string;
  roleLabel: string;
  acceptUrl: string;
  expiresInDays: number;
}) {
  return safeSend(
    options.to,
    `${options.inviterName} invited you to ${options.businessName} on Catcher`,
    buildBusinessEmail({
      title: `Join ${options.businessName} on Catcher`,
      paragraphs: [
        `${options.inviterName} has invited you to join ${options.businessName} as ${options.roleLabel}. You will be able to work with the business's registered assets, stolen reports and billing according to that role.`,
        `Sign in or create a Catcher account with this email address (${options.to}) to accept.`,
      ],
      actionLabel: "Accept invitation",
      actionUrl: options.acceptUrl,
      footnote: `This invitation expires in ${options.expiresInDays} days. If you were not expecting it, you can ignore this email.`,
    }),
  );
}

export function sendBusinessVerificationEmail(options: {
  to: string[];
  businessName: string;
  outcome: "verified" | "rejected";
  note: string | null;
  dashboardUrl: string;
}) {
  const verified = options.outcome === "verified";

  return safeSend(
    options.to,
    verified
      ? `${options.businessName} is now a verified business on Catcher`
      : `Action needed: ${options.businessName} verification`,
    buildBusinessEmail({
      title: verified ? "Your business is verified" : "We could not verify your business yet",
      paragraphs: verified
        ? [
            `${options.businessName} has been verified against its CAC registration. Your assets now show a Verified Business badge in the public registry and on verification pages.`,
          ]
        : [
            `We reviewed the documents for ${options.businessName} but could not verify the business.`,
            options.note ? `Reason: ${options.note}` : "Please check that the CAC certificate is clear and matches the business details.",
            "You can keep registering assets while you update the details and upload a new document.",
          ],
      actionLabel: verified ? "Open business settings" : "Update verification details",
      actionUrl: options.dashboardUrl,
    }),
  );
}
