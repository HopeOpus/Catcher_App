import { NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import path from 'path';

const UPLOAD_DIR = path.join(process.cwd(), 'public', 'uploads');

interface CloudinaryUploadResponse {
  secure_url?: string;
  public_id?: string;
  error?: {
    message?: string;
  };
}

function isCloudinaryConfigured() {
  return Boolean(process.env.CLOUDINARY_CLOUD_NAME) &&
    Boolean(process.env.CLOUDINARY_API_KEY) &&
    Boolean(process.env.CLOUDINARY_API_SECRET);
}

async function uploadToCloudinary(file: File, propertyId: string) {
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
  const apiKey = process.env.CLOUDINARY_API_KEY;
  const apiSecret = process.env.CLOUDINARY_API_SECRET;

  if (!cloudName || !apiKey || !apiSecret) {
    throw new Error('Cloudinary is not configured.');
  }

  const uniqueId = Math.random().toString(36).substring(2, 11);
  const publicId = `${propertyId}_${uniqueId}`;
  const formData = new FormData();

  formData.append('file', file);
  formData.append('folder', process.env.CLOUDINARY_UPLOAD_FOLDER || 'catcher');
  formData.append('public_id', publicId);

  const response = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
    method: 'POST',
    headers: {
      Authorization: `Basic ${Buffer.from(`${apiKey}:${apiSecret}`).toString('base64')}`,
    },
    body: formData,
  });

  const result = await response.json() as CloudinaryUploadResponse;

  if (!response.ok || !result.secure_url) {
    throw new Error(result.error?.message || 'Cloudinary upload failed');
  }

  return {
    url: result.secure_url,
    filename: result.public_id || publicId,
  };
}

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const propertyId = (formData.get('propertyId') as string) || 'general';

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    if (isCloudinaryConfigured()) {
      const result = await uploadToCloudinary(file, propertyId);

      return NextResponse.json({
        success: true,
        url: result.url,
        filename: result.filename,
        size: file.size,
        type: file.type
      });
    }

    if (process.env.VERCEL) {
      return NextResponse.json(
        { error: 'Cloudinary must be configured for file uploads on Vercel.' },
        { status: 500 }
      );
    }

    try {
      await mkdir(UPLOAD_DIR, { recursive: true });
    } catch {
      // Directory already exists.
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    
    const uniqueId = Math.random().toString(36).substring(2, 11);
    const ext = file.name.split('.').pop() || 'jpg';
    const filename = `${propertyId}_${uniqueId}.${ext}`;
    const filepath = path.join(UPLOAD_DIR, filename);

    await writeFile(filepath, buffer);

    const url = `/uploads/${filename}`;
    
    return NextResponse.json({ 
      success: true, 
      url,
      filename,
      size: file.size,
      type: file.type
    });
  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json({ error: 'Upload failed' }, { status: 500 });
  }
}
