import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import {
  isCloudinaryConfigured,
  validateImageUploadFile,
  uploadImageToCloudinary,
} from '@/lib/cloudinary';
import { consumeRateLimit, resolveRateLimitIdentifier } from '@/lib/rate-limit';

function sanitizeStorageSegment(value: string): string {
  const sanitized = value.replace(/[^a-zA-Z0-9_-]/g, '').slice(0, 48);
  return sanitized || 'file';
}

export const runtime = 'nodejs';

export async function POST(request: Request) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const rateLimit = await consumeRateLimit({
      scope: 'api:upload',
      identifier: resolveRateLimitIdentifier({
        request,
        userId,
      }),
      limit: 20,
      windowMs: 10 * 60 * 1000,
      blockDurationMs: 10 * 60 * 1000,
    });

    if (!rateLimit.allowed) {
      return NextResponse.json(
        {
          error: 'Too many uploads. Please wait a bit before trying again.',
          retryAfterSeconds: rateLimit.retryAfterSeconds,
        },
        {
          status: 429,
          headers: {
            'Retry-After': String(rateLimit.retryAfterSeconds),
          },
        },
      );
    }

    const formData = await request.formData();
    const file = formData.get('file') as File;
    const propertyId = (formData.get('propertyId') as string) || 'general';

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    const validationError = validateImageUploadFile(file);

    if (validationError) {
      return NextResponse.json({ error: validationError }, { status: 400 });
    }

    const uploadKey = `${sanitizeStorageSegment(userId)}_${sanitizeStorageSegment(propertyId)}`;

    if (!isCloudinaryConfigured()) {
      return NextResponse.json(
        {
          error:
            'Cloudinary upload storage is required. Configure CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, and CLOUDINARY_API_SECRET.',
        },
        { status: 500 },
      );
    }

    const result = await uploadImageToCloudinary(file, uploadKey);

    return NextResponse.json({ 
      success: true, 
      url: result.url,
      filename: result.publicId,
      size: file.size,
      type: file.type
    });
  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json({ error: 'Upload failed' }, { status: 500 });
  }
}
