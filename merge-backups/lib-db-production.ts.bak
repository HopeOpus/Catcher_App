import { db } from './connection';

export async function checkDatabaseConnection() {
  if (!process.env.DATABASE_URL) {
    return false;
  }

  const client = await db.connect();
  try {
    await client.query('SELECT 1');
    return true;
  } catch (error) {
    console.error('Database connection failed:', error);
    return false;
  } finally {
    client.release();
  }
}

export async function runMigrations() {
  try {
    console.log('Run database migrations via npm run db:migrate before deploying.');
    return true;
  } catch (error) {
    console.error('Migration failed:', error);
    return false;
  }
}

export async function cleanupDatabase() {
  await db.end();
}

export default db;
