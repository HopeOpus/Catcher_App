import { randomUUID } from "node:crypto";
import type { Prisma, PrismaClient } from "@prisma/client";
import { AdminNoteTargetType } from "@prisma/client";
import { prisma } from "@/lib/prisma";

type AdminNoteWriteClient =
  | Pick<PrismaClient, "adminNote">
  | Pick<Prisma.TransactionClient, "adminNote">;

export type CreateAdminNoteInput = {
  authorUserId: string;
  targetType: AdminNoteTargetType;
  targetId: string;
  body: string;
  isPinned?: boolean;
  targetUserId?: string | null;
  propertyId?: string | null;
  stolenReportId?: string | null;
};

export async function createAdminNote(
  input: CreateAdminNoteInput,
  db: AdminNoteWriteClient = prisma,
) {
  return db.adminNote.create({
    data: {
      id: randomUUID(),
      authorUserId: input.authorUserId,
      targetType: input.targetType,
      targetId: input.targetId,
      body: input.body,
      isPinned: input.isPinned ?? false,
      targetUserId: input.targetUserId ?? null,
      propertyId: input.propertyId ?? null,
      stolenReportId: input.stolenReportId ?? null,
    },
  });
}

export async function updateAdminNote(
  noteId: string,
  data: {
    body?: string;
    isPinned?: boolean;
  },
  db: AdminNoteWriteClient = prisma,
) {
  return db.adminNote.update({
    where: { id: noteId },
    data,
  });
}

export async function deleteAdminNote(
  noteId: string,
  db: AdminNoteWriteClient = prisma,
) {
  return db.adminNote.delete({
    where: { id: noteId },
  });
}
