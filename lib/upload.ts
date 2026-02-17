// File upload utilities for Catcher application

export interface UploadResult {
  success: boolean;
  url?: string;
  error?: string;
}

export interface UploadProgress {
  loaded: number;
  total: number;
  percentage: number;
}

/**
 * Upload a file to a mock storage service
 * In a real application, this would upload to cloud storage like AWS S3, Cloudinary, etc.
 */
export async function uploadFile(
  file: File, 
  onProgress?: (progress: UploadProgress) => void
): Promise<UploadResult> {
  return new Promise((resolve) => {
    const fileSize = file.size;
    let uploaded = 0;
    
    const interval = setInterval(() => {
      uploaded += Math.random() * (fileSize / 10);
      
      if (onProgress) {
        const progress: UploadProgress = {
          loaded: Math.min(uploaded, fileSize),
          total: fileSize,
          percentage: Math.round((uploaded / fileSize) * 100)
        };
        onProgress(progress);
      }
      
      if (uploaded >= fileSize) {
        clearInterval(interval);
        
        // Simulate 90% success rate
        if (Math.random() > 0.1) {
          // Success - return mock URL
          const mockUrl = `https://mock-storage.com/${Date.now()}_${file.name}`;
          resolve({
            success: true,
            url: mockUrl
          });
        } else {
          // Failure
          resolve({
            success: false,
            error: 'Upload failed. Please try again.'
          });
        }
      }
    }, 100);
  });
}

/**
 * Validate file before upload
 */
export function validateFile(file: File): { valid: boolean; error?: string } {
  const allowedTypes = [
    'image/jpeg',
    'image/png', 
    'image/gif',
    'image/webp'
  ];
  
  const maxSize = 5 * 1024 * 1024; // 5MB
  
  if (!allowedTypes.includes(file.type)) {
    return {
      valid: false,
      error: 'Only image files (JPEG, PNG, GIF, WebP) are allowed'
    };
  }
  
  if (file.size > maxSize) {
    return {
      valid: false,
      error: 'File size must be less than 5MB'
    };
  }
  
  return { valid: true };
}

/**
 * Generate a preview URL for a file
 */
export function getPreviewUrl(file: File): string {
  return URL.createObjectURL(file);
}

/**
 * Clean up preview URL
 */
export function cleanupPreviewUrl(url: string): void {
  URL.revokeObjectURL(url);
}

/**
 * Compress image file (basic implementation)
 * In a real application, you might use libraries like browser-image-compression
 */
export async function compressImage(file: File, quality: number = 0.8): Promise<File> {
  return new Promise((resolve) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();
    const objectUrl = URL.createObjectURL(file);
    
    img.onload = () => {
      // Set canvas dimensions to match image
      canvas.width = img.width;
      canvas.height = img.height;
      
      // Draw image on canvas
      ctx?.drawImage(img, 0, 0);
      
      // Clean up the object URL to prevent memory leaks
      URL.revokeObjectURL(objectUrl);
      
      // Convert to blob with compression
      canvas.toBlob((blob) => {
        if (blob) {
          const compressedFile = new File([blob], file.name, {
            type: file.type,
            lastModified: Date.now()
          });
          resolve(compressedFile);
        } else {
          resolve(file); // Return original if compression fails
        }
      }, file.type, quality);
    };
    
    img.onerror = () => {
      // Clean up on error as well
      URL.revokeObjectURL(objectUrl);
      resolve(file);
    };
    
    img.src = objectUrl;
  });
}


/**
 * Get file size in human readable format
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

/**
 * Get file extension from filename
 */
export function getFileExtension(filename: string): string {
  const lastDotIndex = filename.lastIndexOf('.');
  if (lastDotIndex === -1 || lastDotIndex === filename.length - 1) {
    return '';
  }
  return filename.slice(lastDotIndex + 1);
}

/**
 * Generate unique filename
 */
export function generateUniqueFilename(originalName: string): string {
  const timestamp = Date.now();
  const randomString = Math.random().toString(36).substring(2, 11);
  const extension = getFileExtension(originalName);
  
  return extension ? `${timestamp}_${randomString}.${extension}` : `${timestamp}_${randomString}`;
}
