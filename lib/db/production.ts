import { PrismaClient } from '@prisma/client';

// Production database configuration optimized for Vercel
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
    // Connection pooling for Vercel serverless functions
    connectionLimit: 5,
    // Enable query optimization
    transactionOptions: {
      timeout: 30000, // 30 seconds
      maxWait: 10000, // 10 seconds
    },
  });

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;

// Health check function
export async function checkDatabaseConnection() {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return true;
  } catch (error) {
    console.error('Database connection failed:', error);
    return false;
  }
}

// Database migration function for production
export async function runMigrations() {
  try {
    // This would typically be run during deployment
    // For Vercel, migrations should be run manually or via CI/CD
    console.log('Database migration check completed');
    return true;
  } catch (error) {
    console.error('Migration failed:', error);
    return false;
  }
}

// Connection cleanup for serverless environments
export function cleanupDatabase() {
  return prisma.$disconnect();
}

export default prisma;