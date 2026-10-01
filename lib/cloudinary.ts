type CloudinaryUploadResult = {
  url: string;
  publicId: string;
};

type CloudinaryUploadResponse = {
  secure_url?: string;
  public_id?: string;
  error?: {
    message?: string;
  };
};

type CloudinaryConfig = {
  cloudName: string;
  apiKey: string;
  apiSecret: string;
  uploadFolder: string;
};

const MAX_IMAGE_SIZE_BYTES = 5 * 1024 * 1024;
const ALLOWED_IMAGE_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/gif",
  "image/webp",
]);

function getCloudinaryConfig(): CloudinaryConfig {
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME?.trim();
  const apiKey = process.env.CLOUDINARY_API_KEY?.trim();
  const apiSecret = process.env.CLOUDINARY_API_SECRET?.trim();
  const uploadFolder =
    process.env.CLOUDINARY_UPLOAD_FOLDER?.trim() || "catcher";

  if (!cloudName || !apiKey || !apiSecret) {
    throw new Error(
      "Cloudinary is not fully configured. Set CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, and CLOUDINARY_API_SECRET.",
    );
  }

  return {
    cloudName,
    apiKey,
    apiSecret,
    uploadFolder,
  };
}

export function isCloudinaryConfigured() {
  try {
    getCloudinaryConfig();
    return true;
  } catch {
    return false;
  }
}

export function validateImageUploadFile(file: File): string | null {
  if (!ALLOWED_IMAGE_TYPES.has(file.type)) {
    return "Only JPEG, PNG, GIF, and WebP images are allowed.";
  }

  if (file.size > MAX_IMAGE_SIZE_BYTES) {
    return "File size must be 5MB or less.";
  }

  return null;
}

const MAX_DOCUMENT_SIZE_BYTES = 10 * 1024 * 1024;
const PDF_MIME_TYPE = "application/pdf";

/** Business verification documents: a PDF or a clear photo/scan. */
export function validateDocumentUploadFile(file: File): string | null {
  if (file.type !== PDF_MIME_TYPE && !ALLOWED_IMAGE_TYPES.has(file.type)) {
    return "Upload a PDF, JPEG, PNG or WebP file.";
  }

  if (file.size > MAX_DOCUMENT_SIZE_BYTES) {
    return "Document size must be 10MB or less.";
  }

  return null;
}

export async function uploadImageToCloudinary(
  file: File,
  uploadKey: string,
  options: { subfolder?: string } = {},
): Promise<CloudinaryUploadResult> {
  const config = getCloudinaryConfig();
  const uniqueId = Math.random().toString(36).slice(2, 11);
  const publicId = `${uploadKey}_${uniqueId}`;
  const formData = new FormData();
  // PDFs go up as raw files: Cloudinary blocks PDF delivery from the image
  // pipeline on many accounts.
  const resourceType = file.type === PDF_MIME_TYPE ? "raw" : "image";

  formData.append("file", file);
  formData.append(
    "folder",
    options.subfolder ? `${config.uploadFolder}/${options.subfolder}` : config.uploadFolder,
  );
  formData.append("public_id", resourceType === "raw" ? `${publicId}.pdf` : publicId);

  const response = await fetch(
    `https://api.cloudinary.com/v1_1/${config.cloudName}/${resourceType}/upload`,
    {
      method: "POST",
      headers: {
        Authorization: `Basic ${Buffer.from(
          `${config.apiKey}:${config.apiSecret}`,
        ).toString("base64")}`,
      },
      body: formData,
      cache: "no-store",
    },
  );

  const result = (await response.json().catch(() => null)) as
    | CloudinaryUploadResponse
    | null;

  if (!response.ok || !result?.secure_url || !result.public_id) {
    throw new Error(
      result?.error?.message || "Cloudinary upload failed.",
    );
  }

  return {
    url: result.secure_url,
    publicId: result.public_id,
  };
}
