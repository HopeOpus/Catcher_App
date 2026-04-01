import { randomUUID } from "node:crypto";
import { Prisma, type PrismaClient } from "@prisma/client";
import { AuditLogEntityType } from "@prisma/client";
import { prisma } from "@/lib/prisma";

type AuditLogWriteClient =
  | Pick<PrismaClient, "auditLog">
  | Pick<Prisma.TransactionClient, "auditLog">;

export type RecordAuditLogInput = {
  actorUserId?: string | null;
  action: string;
  entityType: AuditLogEntityType;
  entityId: string;
  entityLabel?: string | null;
  summary: string;
  targetUserId?: string | null;
  propertyId?: string | null;
  stolenReportId?: string | null;
  coverageId?: string | null;
  catalogItemId?: string | null;
  details?: Prisma.InputJsonValue | null;
};

export async function recordAuditLog(
  input: RecordAuditLogInput,
  db: AuditLogWriteClient = prisma,
) {
  return db.auditLog.create({
    data: {
      id: randomUUID(),
      actorUserId: input.actorUserId ?? null,
      action: input.action,
      entityType: input.entityType,
      entityId: input.entityId,
      entityLabel: input.entityLabel ?? null,
      summary: input.summary,
      targetUserId: input.targetUserId ?? null,
      propertyId: input.propertyId ?? null,
      stolenReportId: input.stolenReportId ?? null,
      coverageId: input.coverageId ?? null,
      catalogItemId: input.catalogItemId ?? null,
      details:
        input.details === undefined
          ? undefined
          : input.details === null
            ? Prisma.JsonNull
            : input.details,
    },
  });
}

export async function safeRecordAuditLog(
  input: RecordAuditLogInput,
  db: AuditLogWriteClient = prisma,
) {
  try {
    return await recordAuditLog(input, db);
  } catch (error) {
    console.error("Failed to record audit log:", error);
    return null;
  }
}
