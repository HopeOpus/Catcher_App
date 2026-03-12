import { NextResponse } from 'next/server';
import { checkDatabaseConnection } from '@/lib/db/production';

export async function GET() {
  try {
    // Check database connection
    const dbConnected = await checkDatabaseConnection();
    
    const healthCheck = {
      status: 'ok',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: process.env.NODE_ENV || 'development',
      database: {
        status: dbConnected ? 'connected' : 'disconnected',
        connection: process.env.DATABASE_URL ? 'configured' : 'not configured'
      },
      services: {
        nextauth: process.env.NEXTAUTH_SECRET ? 'configured' : 'not configured',
        cloudinary: process.env.CLOUDINARY_CLOUD_NAME ? 'configured' : 'not configured'
      }
    };

    if (!dbConnected) {
      return NextResponse.json(healthCheck, { status: 503 });
    }

    return NextResponse.json(healthCheck, { status: 200 });
  } catch (error) {
    console.error('Health check failed:', error);
    return NextResponse.json({
      status: 'error',
      timestamp: new Date().toISOString(),
      error: 'Health check failed'
    }, { status: 500 });
  }
}