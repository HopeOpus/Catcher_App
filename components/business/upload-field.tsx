'use client';

import * as React from 'react';
import { FileText, ImageIcon, Loader2, RefreshCw, Trash2, UploadCloud } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

type UploadFieldProps = {
  id: string;
  label: string;
  description: string;
  value: string | null;
  onChange: (url: string | null) => void;
  /** "document" accepts PDFs as well as images. */
  kind: 'document' | 'image';
  error?: string;
  optional?: boolean;
};

const ACCEPT = {
  document: 'application/pdf,image/jpeg,image/png,image/webp',
  image: 'image/jpeg,image/png,image/webp',
};

function isPdfUrl(url: string) {
  return /\.pdf($|\?)/i.test(url) || url.includes('/raw/upload/');
}

export function UploadField({
  id,
  label,
  description,
  value,
  onChange,
  kind,
  error,
  optional,
}: UploadFieldProps) {
  const inputRef = React.useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = React.useState(false);
  const [isDragging, setIsDragging] = React.useState(false);
  const [uploadError, setUploadError] = React.useState<string | null>(null);
  const [fileName, setFileName] = React.useState<string | null>(null);
  const shownError = uploadError ?? error;
  const describedBy = `${id}-description${shownError ? ` ${id}-error` : ''}`;

  const upload = async (file: File) => {
    setIsUploading(true);
    setUploadError(null);

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('propertyId', kind === 'document' ? 'business-cac' : 'business-logo');

      if (kind === 'document') {
        formData.append('purpose', 'business_document');
      }

      const response = await fetch('/api/upload', { method: 'POST', body: formData });
      const payload = await response.json().catch(() => null);

      if (!response.ok || !payload?.url) {
        throw new Error(payload?.error || 'Upload failed. Please try again.');
      }

      setFileName(file.name);
      onChange(payload.url as string);
    } catch (uploadFailure) {
      setUploadError(uploadFailure instanceof Error ? uploadFailure.message : 'Upload failed.');
    } finally {
      setIsUploading(false);
    }
  };

  const handleFiles = (files: FileList | null) => {
    const file = files?.[0];

    if (file) {
      void upload(file);
    }
  };

  return (
    <div className="space-y-2">
      <div className="flex items-baseline justify-between gap-2">
        <label htmlFor={id} className="text-sm font-medium text-slate-900">
          {label}
          {optional ? <span className="font-normal text-slate-500"> (optional)</span> : null}
        </label>
      </div>
      <p id={`${id}-description`} className="text-xs leading-5 text-slate-500">
        {description}
      </p>

      <input
        ref={inputRef}
        id={id}
        type="file"
        accept={ACCEPT[kind]}
        className="sr-only"
        aria-describedby={describedBy}
        aria-invalid={Boolean(shownError)}
        onChange={(event) => {
          handleFiles(event.target.files);
          event.target.value = '';
        }}
      />

      {value ? (
        <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 p-3">
          {kind === 'image' && !isPdfUrl(value) ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={value} alt="" className="h-12 w-12 rounded-lg border border-slate-200 bg-white object-cover" />
          ) : (
            <span className="flex h-12 w-12 items-center justify-center rounded-lg border border-slate-200 bg-white">
              <FileText aria-hidden className="h-5 w-5 text-[#36689e]" />
            </span>
          )}
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium text-[#0F2651]">
              {fileName ?? (kind === 'document' ? 'CAC document uploaded' : 'Logo uploaded')}
            </p>
            <a
              href={value}
              target="_blank"
              rel="noreferrer"
              className="text-xs font-medium text-[#36689e] underline-offset-2 hover:underline"
            >
              View file
            </a>
          </div>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-10 cursor-pointer"
            disabled={isUploading}
            onClick={() => inputRef.current?.click()}
          >
            {isUploading ? (
              <Loader2 aria-hidden className="h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw aria-hidden className="h-4 w-4" />
            )}
            <span className="sr-only sm:not-sr-only sm:ml-1">Replace</span>
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-10 cursor-pointer text-slate-500 hover:text-red-600"
            aria-label={`Remove ${label.toLowerCase()}`}
            disabled={isUploading}
            onClick={() => {
              setFileName(null);
              onChange(null);
            }}
          >
            <Trash2 aria-hidden className="h-4 w-4" />
          </Button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          onDragOver={(event) => {
            event.preventDefault();
            setIsDragging(true);
          }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={(event) => {
            event.preventDefault();
            setIsDragging(false);
            handleFiles(event.dataTransfer.files);
          }}
          disabled={isUploading}
          aria-describedby={describedBy}
          className={cn(
            'flex w-full cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed px-4 py-7 text-center transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#36689e] focus-visible:ring-offset-2 disabled:cursor-wait',
            isDragging
              ? 'border-[#36689e] bg-[#36689e]/5'
              : shownError
                ? 'border-red-300 bg-red-50/40'
                : 'border-slate-300 hover:border-[#36689e] hover:bg-slate-50',
          )}
        >
          {isUploading ? (
            <Loader2 aria-hidden className="h-6 w-6 animate-spin text-[#36689e]" />
          ) : kind === 'document' ? (
            <UploadCloud aria-hidden className="h-6 w-6 text-[#36689e]" />
          ) : (
            <ImageIcon aria-hidden className="h-6 w-6 text-[#36689e]" />
          )}
          <span className="text-sm font-medium text-[#0F2651]">
            {isUploading ? 'Uploading…' : 'Click to upload or drag a file here'}
          </span>
          <span className="text-xs text-slate-500">
            {kind === 'document' ? 'PDF, JPEG, PNG or WebP · up to 10 MB' : 'JPEG, PNG or WebP · up to 5 MB'}
          </span>
        </button>
      )}

      {shownError ? (
        <p id={`${id}-error`} role="alert" className="text-xs font-medium text-red-600">
          {shownError}
        </p>
      ) : null}
    </div>
  );
}
