import { randomUUID } from "node:crypto";
import type { Prisma, PrismaClient } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { getAppBaseUrl } from "@/lib/app-url";

type PublicVerificationWriteClient =
  | Pick<PrismaClient, "propertyPublicVerification">
  | Pick<Prisma.TransactionClient, "propertyPublicVerification">;

type EnsurePropertyPublicVerificationInput = {
  propertyId: string;
  propertyName: string;
  serialNumber: string;
};

function slugifySegment(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48);
}

function buildVerificationSlug(propertyName: string, serialNumber: string) {
  const namePart = slugifySegment(propertyName) || "property";
  const serialPart =
    slugifySegment(serialNumber).replace(/-/g, "").slice(-6) ||
    randomUUID().replace(/-/g, "").slice(0, 6);

  return `${namePart}-${serialPart}`.slice(0, 100);
}

function buildVerificationToken() {
  return randomUUID().replace(/-/g, "") + randomUUID().replace(/-/g, "");
}

export function buildPropertyVerificationPath(slug: string) {
  return `/verify/${slug}`;
}

export function buildPropertyVerificationUrl(slug: string) {
  return `${getAppBaseUrl()}${buildPropertyVerificationPath(slug)}`;
}

export async function ensurePropertyPublicVerification(
  input: EnsurePropertyPublicVerificationInput,
  db: PublicVerificationWriteClient = prisma,
) {
  const existingVerification = await db.propertyPublicVerification.findUnique({
    where: { propertyId: input.propertyId },
  });

  if (existingVerification) {
    return existingVerification;
  }

  const baseSlug = buildVerificationSlug(
    input.propertyName,
    input.serialNumber,
  );

  for (let attempt = 0; attempt < 5; attempt += 1) {
    const slug =
      attempt === 0
        ? baseSlug
        : `${baseSlug}-${randomUUID().replace(/-/g, "").slice(0, 4)}`.slice(
            0,
            100,
          );

    try {
      return await db.propertyPublicVerification.create({
        data: {
          id: randomUUID(),
          propertyId: input.propertyId,
          slug,
          token: buildVerificationToken(),
          isActive: true,
        },
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : "";

      if (!message.includes("Unique constraint")) {
        throw error;
      }
    }
  }

  throw new Error("Unable to create a unique public verification slug.");
}
