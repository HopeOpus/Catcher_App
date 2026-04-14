import { Prisma } from "@prisma/client";

export function isDatabaseConnectionError(error: unknown) {
  return (
    error instanceof Prisma.PrismaClientKnownRequestError &&
    error.code === "P1001"
  );
}
