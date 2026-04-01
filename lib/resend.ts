import "server-only";

const RESEND_API_BASE_URL = "https://api.resend.com";

type SendResendEmailInput = {
  to: string | string[];
  subject: string;
  text: string;
  html?: string;
};

type ResendEmailResponse = {
  id: string;
};

function getResendApiKey() {
  const apiKey = process.env.RESEND_API_KEY?.trim();

  if (!apiKey) {
    throw new Error("RESEND_API_KEY is not configured.");
  }

  return apiKey;
}

function getResendFromEmail() {
  const fromEmail = process.env.RESEND_FROM_EMAIL?.trim();

  if (!fromEmail) {
    throw new Error("RESEND_FROM_EMAIL is not configured.");
  }

  return fromEmail;
}

export async function sendResendEmail(
  input: SendResendEmailInput,
): Promise<ResendEmailResponse> {
  const response = await fetch(`${RESEND_API_BASE_URL}/emails`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${getResendApiKey()}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: getResendFromEmail(),
      to: Array.isArray(input.to) ? input.to : [input.to],
      subject: input.subject,
      text: input.text,
      ...(input.html ? { html: input.html } : {}),
    }),
    cache: "no-store",
  });

  const payload = (await response.json().catch(() => null)) as
    | {
        id?: string;
        message?: string;
        error?: {
          message?: string;
        };
      }
    | null;

  if (!response.ok || !payload?.id) {
    throw new Error(
      payload?.message ||
        payload?.error?.message ||
        "Resend email request failed.",
    );
  }

  return {
    id: payload.id,
  };
}
