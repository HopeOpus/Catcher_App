import { NextResponse } from "next/server";
import {
  isPropertyPlanCode,
  isPropertyStatus,
  isPropertyType,
} from "@/lib/catcher-domain";
import {
  getAuthenticatedAppUser,
  syncAuthenticatedAppUserRecord,
} from "@/lib/authenticated-user";
import {
  createPropertyCheckoutSession,
  type PropertyCheckoutPaymentMethod,
} from "@/lib/property-checkout";
import { parseSubmittedPhotoUrls } from "@/lib/property-payload";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

function getRequestBaseUrl(request: Request): string {
  const url = new URL(request.url);
  return `${url.protocol}//${url.host}`;
}

function isPropertyCheckoutPaymentMethod(value: unknown): value is PropertyCheckoutPaymentMethod {
  return value === "cash" || value === "wallet";
}

export async function POST(request: Request) {
  try {
    const authenticatedUser = await getAuthenticatedAppUser();

    if (!authenticatedUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const name = typeof body.name === "string" ? body.name.trim() : "";
    const serialNumber =
      typeof body.serial_number === "string" ? body.serial_number.trim() : "";
    const description =
      typeof body.description === "string" && body.description.trim().length > 0
        ? body.description.trim()
        : null;
    const planCode = body.plan_code;
    const paymentMethod = body.payment_method;
    const status = body.status;
    const type = body.type;

    if (!name || !serialNumber || !isPropertyType(type)) {
      return NextResponse.json(
        {
          error:
            "name, type, and serial_number are required to start property checkout.",
        },
        { status: 400 },
      );
    }

    if (!isPropertyPlanCode(planCode)) {
      return NextResponse.json(
        { error: "plan_code must be one of free, monthly, or yearly." },
        { status: 400 },
      );
    }

    if (paymentMethod !== undefined && !isPropertyCheckoutPaymentMethod(paymentMethod)) {
      return NextResponse.json(
        { error: "payment_method must be either cash or wallet." },
        { status: 400 },
      );
    }

    if (status && !isPropertyStatus(status)) {
      return NextResponse.json(
        { error: "status must be one of Active, Flagged, or Stolen." },
        { status: 400 },
      );
    }

    const submittedPhotoUrls = parseSubmittedPhotoUrls(
      body.photo_urls,
      body.photo_url,
    );

    if (submittedPhotoUrls.invalid) {
      return NextResponse.json(
        {
          error:
            "One or more photo uploads were not persisted. Please re-upload your photos and try again.",
        },
        { status: 400 },
      );
    }

    await syncAuthenticatedAppUserRecord(prisma, authenticatedUser);

    const checkout = await createPropertyCheckoutSession({
      authenticatedUser,
      baseUrl: getRequestBaseUrl(request),
      returnPath: "/dashboard/properties",
      name,
      type,
      serialNumber,
      description,
      status: status ?? "Active",
      photoUrls: submittedPhotoUrls.urls,
      planCode,
      paymentMethod,
      dateRegistered: body.date_registered
        ? new Date(body.date_registered)
        : undefined,
    });

    return NextResponse.json(checkout, {
      status: checkout.mode === "payment" ? 201 : 200,
    });
  } catch (error) {
    console.error("Error creating property checkout session:", error);
    const errorMessage =
      error instanceof Error
        ? error.message
        : "Failed to start property checkout.";
    const lowerErrorMessage = errorMessage.toLowerCase();
    const statusCode =
      lowerErrorMessage.includes("free property upload") ||
      lowerErrorMessage.includes("catcher security credits")
        ? 400
        : 500;

    return NextResponse.json(
      {
        error:
          process.env.NODE_ENV === "production" && statusCode === 500
            ? "Failed to start property checkout."
            : errorMessage,
      },
      { status: statusCode },
    );
  }
}
