import { createHmac, timingSafeEqual } from "node:crypto";

const PAYSTACK_API_BASE_URL = "https://api.paystack.co";
const PAYSTACK_ENVIRONMENTS = new Set(["test", "live"]);

type PaystackInitializeRequest = {
  amountKobo: number;
  email: string;
  reference: string;
  callbackUrl: string;
  metadata: Record<string, unknown>;
};

type PaystackApiResponse<T> = {
  status: boolean;
  message: string;
  data: T;
};

type PaystackInitializeResponse = {
  authorization_url: string;
  access_code: string;
  reference: string;
};

type PaystackTransactionVerification = {
  id: number;
  domain?: string | null;
  status: string;
  reference: string;
  amount: number;
  currency: string;
  paid_at: string | null;
  gateway_response?: string | null;
  customer?: {
    email?: string | null;
    customer_code?: string | null;
  } | null;
  authorization?: {
    authorization_code?: string | null;
  } | null;
  metadata?: unknown;
};

export function getConfiguredPaystackEnvironment(): "test" | "live" {
  const configuredEnvironment = process.env.PAYSTACK_ENV?.trim().toLowerCase();

  if (configuredEnvironment) {
    if (!PAYSTACK_ENVIRONMENTS.has(configuredEnvironment)) {
      throw new Error("PAYSTACK_ENV must be either 'test' or 'live'.");
    }

    return configuredEnvironment as "test" | "live";
  }

  return process.env.NODE_ENV === "production" ? "live" : "test";
}

function validatePaystackKeyMatchesEnvironment(
  key: string,
  environment: "test" | "live",
  keyName: string,
) {
  const expectedPrefix = environment === "live" ? "sk_live_" : "sk_test_";

  if (key.startsWith("sk_") && !key.startsWith(expectedPrefix)) {
    throw new Error(
      `${keyName} does not match the configured Paystack environment (${environment}).`,
    );
  }
}

export function getConfiguredPaystackPublicKey(): string {
  const environment = getConfiguredPaystackEnvironment();
  const environmentSpecificKey =
    environment === "live"
      ? process.env.NEXT_PUBLIC_PAYSTACK_LIVE_PUBLIC_KEY?.trim()
      : process.env.NEXT_PUBLIC_PAYSTACK_TEST_PUBLIC_KEY?.trim();
  const fallbackKey = process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY?.trim();
  const publicKey = environmentSpecificKey || fallbackKey;

  if (!publicKey) {
    const requiredVariable =
      environment === "live"
        ? "NEXT_PUBLIC_PAYSTACK_LIVE_PUBLIC_KEY"
        : "NEXT_PUBLIC_PAYSTACK_TEST_PUBLIC_KEY";

    throw new Error(
      `${requiredVariable} is not configured. NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY is supported only as a legacy fallback.`,
    );
  }

  const expectedPrefix = environment === "live" ? "pk_live_" : "pk_test_";
  if (publicKey.startsWith("pk_") && !publicKey.startsWith(expectedPrefix)) {
    throw new Error(
      `Configured Paystack public key does not match the configured Paystack environment (${environment}).`,
    );
  }

  return publicKey;
}

function getPaystackSecretKey(): string {
  const environment = getConfiguredPaystackEnvironment();
  const environmentSpecificKey =
    environment === "live"
      ? process.env.PAYSTACK_LIVE_SECRET_KEY?.trim()
      : process.env.PAYSTACK_TEST_SECRET_KEY?.trim();
  const fallbackKey = process.env.PAYSTACK_SECRET_KEY?.trim();
  const secretKey = environmentSpecificKey || fallbackKey;
  const keyName = environmentSpecificKey
    ? environment === "live"
      ? "PAYSTACK_LIVE_SECRET_KEY"
      : "PAYSTACK_TEST_SECRET_KEY"
    : "PAYSTACK_SECRET_KEY";

  if (!secretKey) {
    const requiredVariable =
      environment === "live"
        ? "PAYSTACK_LIVE_SECRET_KEY"
        : "PAYSTACK_TEST_SECRET_KEY";

    throw new Error(
      `${requiredVariable} is not configured. PAYSTACK_SECRET_KEY is supported only as a legacy fallback.`,
    );
  }

  validatePaystackKeyMatchesEnvironment(
    secretKey,
    environment,
    keyName,
  );

  return secretKey;
}

async function parsePaystackResponse<T>(
  response: Response,
): Promise<PaystackApiResponse<T>> {
  const payload = (await response.json().catch(() => null)) as
    | PaystackApiResponse<T>
    | null;

  if (!response.ok || !payload?.status) {
    throw new Error(payload?.message || "Paystack request failed.");
  }

  return payload;
}

export async function initializePaystackTransaction(
  payload: PaystackInitializeRequest,
): Promise<PaystackInitializeResponse> {
  const response = await fetch(`${PAYSTACK_API_BASE_URL}/transaction/initialize`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${getPaystackSecretKey()}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      amount: payload.amountKobo.toString(),
      email: payload.email,
      reference: payload.reference,
      currency: "USD",
      callback_url: payload.callbackUrl,
      metadata: JSON.stringify(payload.metadata),
    }),
    cache: "no-store",
  });

  const result = await parsePaystackResponse<PaystackInitializeResponse>(response);
  return result.data;
}

export async function verifyPaystackTransaction(
  reference: string,
): Promise<PaystackTransactionVerification> {
  const response = await fetch(
    `${PAYSTACK_API_BASE_URL}/transaction/verify/${encodeURIComponent(reference)}`,
    {
      method: "GET",
      headers: {
        Authorization: `Bearer ${getPaystackSecretKey()}`,
        "Content-Type": "application/json",
      },
      cache: "no-store",
    },
  );

  const result =
    await parsePaystackResponse<PaystackTransactionVerification>(response);
  return result.data;
}

export function isPaystackWebhookSignatureValid(
  rawBody: string,
  providedSignature: string | null,
): boolean {
  if (!providedSignature) {
    return false;
  }

  const expectedSignature = createHmac("sha512", getPaystackSecretKey())
    .update(rawBody)
    .digest("hex");
  const providedBuffer = Buffer.from(providedSignature, "utf8");
  const expectedBuffer = Buffer.from(expectedSignature, "utf8");

  if (providedBuffer.length !== expectedBuffer.length) {
    return false;
  }

  return timingSafeEqual(providedBuffer, expectedBuffer);
}
