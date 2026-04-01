export const SUPPORT_EMAIL =
  process.env.NEXT_PUBLIC_SUPPORT_EMAIL || "support@catcher.com.ng";

type MailtoOptions = {
  subject: string;
  body: string;
};

export function buildSupportMailto({ subject, body }: MailtoOptions): string {
  const params = new URLSearchParams({
    subject,
    body,
  });

  return `mailto:${SUPPORT_EMAIL}?${params.toString()}`;
}
