import { createHmac } from "node:crypto";
import { describe, expect, it } from "vitest";
import { isPaystackWebhookSignatureValid } from "@/lib/paystack";

function sign(body: string) {
  return createHmac("sha512", "sk_test_unit").update(body).digest("hex");
}

describe("Paystack webhook signature", () => {
  const body = JSON.stringify({ event: "charge.success", data: { reference: "ref_1" } });

  it("accepts a signature made with the configured secret", () => {
    expect(isPaystackWebhookSignatureValid(body, sign(body))).toBe(true);
  });

  it("rejects a missing signature", () => {
    expect(isPaystackWebhookSignatureValid(body, null)).toBe(false);
  });

  it("rejects a signature for a different body", () => {
    expect(isPaystackWebhookSignatureValid(body, sign(`${body} `))).toBe(false);
  });

  it("rejects a truncated signature without throwing", () => {
    expect(isPaystackWebhookSignatureValid(body, sign(body).slice(0, 20))).toBe(false);
  });
});
