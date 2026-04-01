import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";

/**
 * Prisma client singleton for the Catcher application.
 *
 * Uses the global-caching pattern recommended by Prisma for Next.js
 * to prevent exhausting DB connections during hot-reload in development.
 *
 * @see https://www.prisma.io/docs/guides/nextjs
 */

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error("DATABASE_URL is not set");
}

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
  prismaAdapter: PrismaPg | undefined;
};

const adapter =
  globalForPrisma.prismaAdapter ??
  new PrismaPg({
    connectionString,
  });

function createPrismaClient() {
  return new PrismaClient({
    adapter,
    log:
      process.env.NODE_ENV === 'development'
        ? ['query', 'error', 'warn']
        : ['error'],
  });
}

function canReusePrismaClient(client: PrismaClient | undefined) {
  if (!client) {
    return false;
  }

  if (!(client instanceof PrismaClient)) {
    return false;
  }

  const candidate = client as PrismaClient & {
    billingReceipt?: unknown;
    notification?: unknown;
    propertyCheckoutSession?: unknown;
  };

  return Boolean(
    candidate.billingReceipt &&
      candidate.notification &&
      candidate.propertyCheckoutSession,
  );
}

const reusablePrisma = canReusePrismaClient(globalForPrisma.prisma)
  ? globalForPrisma.prisma
  : undefined;

export const prisma: PrismaClient = reusablePrisma ?? createPrismaClient();

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
  globalForPrisma.prismaAdapter = adapter;
}

/**
 * Check database connectivity — used by the health endpoint.
 */
export async function checkDatabaseConnection(): Promise<boolean> {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return true;
  } catch (error) {
    console.error('Database connection check failed:', error);
    return false;
  }
}

export default prisma;
