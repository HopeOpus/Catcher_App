import { NextResponse } from "next/server";
import { checkDatabaseConnection } from "@/lib/prisma";

export async function GET() {
  try {
    const dbConnected = await checkDatabaseConnection();
    
    const healthCheck = {
      status: dbConnected ? "ok" : "error",
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: process.env.NODE_ENV || "development",
      database: {
        status: dbConnected ? "connected" : "disconnected",
        connection: process.env.DATABASE_URL ? "configured" : "not configured",
      },
      services: {
        clerk: process.env.CLERK_SECRET_KEY ? 'configured' : 'not configured',
        cloudinary: process.env.CLOUDINARY_CLOUD_NAME ? 'configured' : 'not configured',
        paystack: process.env.PAYSTACK_SECRET_KEY || process.env.PAYSTACK_LIVE_SECRET_KEY || process.env.PAYSTACK_TEST_SECRET_KEY ? 'configured' : 'not configured',
        resend: process.env.RESEND_API_KEY ? 'configured' : 'not configured'
      }
    };

    if (!dbConnected) {
      return NextResponse.json(healthCheck, { status: 503 });
    }

    return NextResponse.json(healthCheck, { status: 200 });
  } catch (error) {
    console.error("Health check failed:", error);
    return NextResponse.json({
      status: "error",
      timestamp: new Date().toISOString(),
      error: "Health check failed",
    }, { status: 500 });
  }
}
