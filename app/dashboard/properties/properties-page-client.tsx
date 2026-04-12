/* eslint-disable @next/next/no-img-element */
'use client';

import Link from 'next/link';
import { useState, useRef, useEffect, useEffectEvent, useMemo } from 'react';
import { useSearchParams } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { 
  Building2, 
  Plus, 
  Eye, 
  Edit, 
  Trash2, 
  AlertTriangle,
  CheckCircle,
  FileText,
  Image as ImageIcon,
  X,
  Camera,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  Search,
  RefreshCcw,
  UploadCloud
} from 'lucide-react';
import {
  cleanupPreviewUrl,
  formatFileSize,
  getPreviewUrl,
  uploadFile,
  validateFile,
} from '@/lib/upload';
import { ReportStolenModal } from '@/components/report-stolen-modal';
import {
  PROPERTY_TYPES,
  type PropertyPlanCodeValue,
  normalizeStoredPhotoUrl,
  type PropertyStatusValue,
  type PropertyTypeValue,
} from '@/lib/catcher-domain';
import {
  PROPERTY_PLAN_DEFINITIONS,
  formatNgnFromKobo,
} from '@/lib/property-plans';

interface PropertyPhoto {
  id: string;
  file?: File;
  preview: string;
  uploaded?: boolean;
  url?: string;
  status?: 'pending' | 'uploading' | 'uploaded' | 'error';
  progress?: number;
  uploadError?: string | null;
}

export interface Property {
  id: string;
  name: string;
  type: PropertyTypeValue;
  serialNumber: string;
  description: string;
  dateRegistered: string;
  status: PropertyStatusValue;
  photos: PropertyPhoto[];
}

interface PropertyDraft {
  name: string;
  type: PropertyTypeValue | '';
  serialNumber: string;
  description: string;
  status: PropertyStatusValue;
  planCode: PropertyPlanCodeValue | '';
  photos: PropertyPhoto[];
}

type PageNotice = {
  tone: 'success' | 'info' | 'warning' | 'error';
  message: string;
};

const FREE_PLAN_LIMIT_REACHED_MESSAGE =
  'Your account has already used its one free property upload. Choose Monthly or Yearly to continue.';
const PROPERTIES_PAGE_SIZE = 6;

function createDraftPhoto(file: File): PropertyPhoto {
  return {
    id: Math.random().toString(36).substring(2, 11),
    file,
    preview: getPreviewUrl(file),
    uploaded: false,
    status: 'pending',
    progress: 0,
    uploadError: null,
  };
}

function movePhotoInList(
  photos: PropertyPhoto[],
  photoId: string,
  direction: 'left' | 'right',
) {
  const currentIndex = photos.findIndex((photo) => photo.id === photoId);

  if (currentIndex === -1) {
    return photos;
  }

  const nextIndex =
    direction === 'left' ? currentIndex - 1 : currentIndex + 1;

  if (nextIndex < 0 || nextIndex >= photos.length) {
    return photos;
  }

  const nextPhotos = [...photos];
  const [movedPhoto] = nextPhotos.splice(currentIndex, 1);
  nextPhotos.splice(nextIndex, 0, movedPhoto);
  return nextPhotos;
}

// Image Preview Modal Component
function ImagePreviewModal({ 
  images, 
  currentIndex, 
  onClose, 
  onNext, 
  onPrev 
}: { 
  images: string[]; 
  currentIndex: number; 
  onClose: () => void; 
  onNext: () => void;
  onPrev: () => void;
}) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowRight') onNext();
      if (e.key === 'ArrowLeft') onPrev();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose, onNext, onPrev]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90" onClick={onClose}>
      {/* Close button */}
      <button 
        className="absolute top-4 right-4 text-white p-2 hover:bg-white/20 rounded-full"
        onClick={onClose}
      >
        <X className="h-8 w-8" />
      </button>
      
      {/* Previous button */}
      {images.length > 1 && (
        <button 
          className="absolute left-4 text-white p-2 hover:bg-white/20 rounded-full"
          onClick={(e) => { e.stopPropagation(); onPrev(); }}
        >
          <ChevronLeft className="h-10 w-10" />
        </button>
      )}
      
      {/* Image */}
      <img 
        src={images[currentIndex]} 
        alt={`Image ${currentIndex + 1}`}
        className="max-h-[90vh] max-w-[90vw] object-contain"
        onClick={(e) => e.stopPropagation()}
      />
      
      {/* Next button */}
      {images.length > 1 && (
        <button 
          className="absolute right-4 text-white p-2 hover:bg-white/20 rounded-full"
          onClick={(e) => { e.stopPropagation(); onNext(); }}
        >
          <ChevronRight className="h-10 w-10" />
        </button>
      )}
      
      {/* Image counter */}
      {images.length > 1 && (
        <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 text-white text-sm bg-black/50 px-4 py-2 rounded-full">
          {currentIndex + 1} / {images.length}
        </div>
      )}
    </div>
  );
}

// Delete Confirmation Modal Component
function DeleteConfirmModal({
  isOpen,
  itemName,
  onConfirm,
  onCancel
}: {
  isOpen: boolean;
  itemName: string;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4 overflow-hidden">
        <div className="p-6">
          <div className="flex items-center justify-center w-12 h-12 mx-auto bg-red-100 rounded-full mb-4">
            <AlertTriangle className="h-6 w-6 text-red-600" />
          </div>
          <h3 className="text-lg font-semibold text-[#0F2651] text-center mb-2">
            Delete Property
          </h3>
          <p className="text-gray-600 text-center">
            Are you sure you want to delete <strong>`{itemName}`</strong>? This action cannot be undone.
          </p>
        </div>
        <div className="flex gap-3 px-6 pb-6">
          <Button
            onClick={onCancel}
            className="flex-1 border border-gray-300 text-gray-700 hover:bg-gray-50"
            variant="outline"
          >
            Cancel
          </Button>
          <Button
            onClick={onConfirm}
            className="flex-1 bg-red-600 hover:bg-red-700 text-white"
          >
            Delete
          </Button>
        </div>
      </div>
    </div>
  );
}

function PropertyDetailsModal({
  property,
  onClose,
  onEdit,
  onReportStolen,
  onDelete,
  onOpenPreview,
}: {
  property: Property | null;
  onClose: () => void;
  onEdit: (property: Property) => void;
  onReportStolen: (property: Property) => void;
  onDelete: (property: Property) => void;
  onOpenPreview: (property: Property, index?: number) => void;
}) {
  if (!property) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
      onClick={onClose}
    >
      <div
        className="max-h-[90vh] w-full max-w-5xl overflow-y-auto rounded-2xl bg-white shadow-xl"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex flex-col gap-4 border-b border-slate-200 px-6 py-5 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h2 className="text-2xl font-semibold text-[#0F2651]">{property.name}</h2>
            <p className="mt-1 break-all text-sm text-gray-600">
              {property.type} · {property.serialNumber}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Badge className={property.status === 'Active'
              ? 'bg-green-100 text-green-800'
              : property.status === 'Flagged'
                ? 'bg-yellow-100 text-yellow-800'
                : 'bg-red-100 text-red-800'}
            >
              {property.status}
            </Badge>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="mr-2 h-4 w-4" />
              Close
            </Button>
          </div>
        </div>

        <div className="grid gap-8 px-6 py-6 lg:grid-cols-[minmax(0,1.35fr)_minmax(280px,1fr)]">
          <div className="space-y-4">
            <div className="overflow-hidden rounded-2xl border border-slate-200 bg-slate-100">
              {property.photos.length > 0 ? (
                <button
                  type="button"
                  className="block h-full w-full"
                  onClick={() => onOpenPreview(property)}
                >
                  <img
                    src={property.photos[0].url || property.photos[0].preview}
                    alt={property.name}
                    className="h-full max-h-[28rem] w-full object-cover"
                  />
                </button>
              ) : (
                <div className="flex min-h-[18rem] items-center justify-center">
                  <ImageIcon className="h-14 w-14 text-slate-400" />
                </div>
              )}
            </div>

            {property.photos.length > 1 ? (
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                {property.photos.map((photo, index) => (
                  <button
                    key={photo.id}
                    type="button"
                    className="overflow-hidden rounded-xl border border-slate-200 bg-slate-100"
                    onClick={() => onOpenPreview(property, index)}
                  >
                    <img
                      src={photo.url || photo.preview}
                      alt={`${property.name} ${index + 1}`}
                      className="h-24 w-full object-cover"
                    />
                  </button>
                ))}
              </div>
            ) : null}
          </div>

          <div className="space-y-6">
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
              <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Type
                </p>
                <p className="mt-1 text-sm font-medium text-[#0F2651]">{property.type}</p>
              </div>
              <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Serial Number
                </p>
                <p className="mt-1 break-all text-sm font-medium text-[#0F2651]">
                  {property.serialNumber}
                </p>
              </div>
              <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Registered
                </p>
                <p className="mt-1 text-sm font-medium text-[#0F2651]">
                  {property.dateRegistered}
                </p>
              </div>
              <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Photos
                </p>
                <p className="mt-1 text-sm font-medium text-[#0F2651]">
                  {property.photos.length}
                </p>
              </div>
            </div>

            <div className="rounded-2xl border border-slate-200 px-4 py-4">
              <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
                Description
              </h3>
              <p className="mt-3 whitespace-pre-wrap break-words text-sm leading-6 text-gray-700">
                {property.description || 'No description provided.'}
              </p>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
              <Button
                type="button"
                variant="outline"
                className="border-[#36689e] text-[#0F2651]"
                onClick={() => onEdit(property)}
              >
                <Edit className="mr-2 h-4 w-4" />
                Edit Property
              </Button>
              <Button
                type="button"
                className="bg-red-600 text-white hover:bg-red-700"
                onClick={() => onReportStolen(property)}
              >
                <AlertCircle className="mr-2 h-4 w-4" />
                Report Stolen
              </Button>
              <Button
                type="button"
                variant="ghost"
                className="text-red-600 hover:text-red-700"
                onClick={() => onDelete(property)}
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Delete
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
type PropertiesPageClientProps = {
  initialProperties: Property[];
  hasUsedFreePlan: boolean;
};

export default function PropertiesPageClient({
  initialProperties,
  hasUsedFreePlan,
}: PropertiesPageClientProps) {
  const searchParams = useSearchParams();
  const checkoutState = searchParams.get('checkout');
  const checkoutReference = searchParams.get('reference');
  const emptyPropertyDraft: PropertyDraft = {
    name: '',
    type: '' as PropertyTypeValue | '',
    serialNumber: '',
    description: '',
    status: 'Active',
    planCode: '' as PropertyPlanCodeValue | '',
    photos: [] as PropertyPhoto[]
  };
  const [properties, setProperties] = useState<Property[]>(initialProperties);
  const [hasUsedFreePlanState, setHasUsedFreePlanState] = useState(hasUsedFreePlan);
  const [isAddingProperty, setIsAddingProperty] = useState(false);
  const [editingPropertyId, setEditingPropertyId] = useState<string | null>(null);
  const [reportStolenModalOpen, setReportStolenModalOpen] = useState(false);
  const [selectedProperty, setSelectedProperty] = useState<Property | null>(null);
  const [viewingProperty, setViewingProperty] = useState<Property | null>(null);
  const [newProperty, setNewProperty] = useState(emptyPropertyDraft);
  const [uploadingPhotos, setUploadingPhotos] = useState<string[]>([]);
  const [isSavingProperty, setIsSavingProperty] = useState(false);
  const [formError, setFormError] = useState('');
  const [pageError, setPageError] = useState('');
  const [pageNotice, setPageNotice] = useState<PageNotice | null>(null);
  
  // Image preview modal state
  const [previewImages, setPreviewImages] = useState<string[]>([]);
  const [previewIndex, setPreviewIndex] = useState(0);
  const [previewOpen, setPreviewOpen] = useState(false);
  
  // Delete confirmation modal state
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [propertyToDelete, setPropertyToDelete] = useState<Property | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | PropertyStatusValue>('all');
  const [typeFilter, setTypeFilter] = useState<'all' | PropertyTypeValue>('all');
  const [propertiesPageIndex, setPropertiesPageIndex] = useState(0);
  const [isPhotoDropActive, setIsPhotoDropActive] = useState(false);
  const [photoToReplaceId, setPhotoToReplaceId] = useState<string | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const replaceFileInputRef = useRef<HTMLInputElement>(null);
  const propertyFormRef = useRef<HTMLDivElement>(null);
  const activeDraftPhotosRef = useRef<PropertyPhoto[]>([]);

  const refreshPropertiesAfterVerification = useEffectEvent(async () => {
    await fetchProperties();
    setPageNotice({
      tone: 'success',
      message:
        'Payment confirmed. Your property subscription is now active and the property is live in your dashboard.',
    });
  });

  useEffect(() => {
    if (!viewingProperty) {
      return;
    }

    const refreshedProperty = properties.find(
      (property) => property.id === viewingProperty.id,
    );

    if (refreshedProperty) {
      setViewingProperty(refreshedProperty);
      return;
    }

    setViewingProperty(null);
  }, [properties, viewingProperty]);

  useEffect(() => {
    activeDraftPhotosRef.current = newProperty.photos;
  }, [newProperty.photos]);

  useEffect(() => {
    return () => {
      cleanupDraftPhotos(activeDraftPhotosRef.current);
    };
  }, []);

  useEffect(() => {
    if (!checkoutState) {
      return;
    }

    switch (checkoutState) {
      case 'success':
        setPageNotice({
          tone: 'success',
          message:
            'Payment confirmed. Your property subscription is now active and the property is live in your dashboard.',
        });
        break;
      case 'processing':
        setPageNotice({
          tone: 'info',
          message:
            'Your payment is being confirmed. This property will appear here as soon as the subscription is activated.',
        });
        break;
      case 'review':
        setPageNotice({
          tone: 'warning',
          message:
            'Your payment was received, but it needs manual review before the property subscription can be activated.',
        });
        break;
      case 'failed':
        setPageNotice({
          tone: 'error',
          message:
            'Paystack could not confirm your payment, so the property subscription was not activated.',
        });
        break;
      case 'cancelled':
        setPageNotice({
          tone: 'info',
          message:
            'Payment was cancelled. Your uploaded property details were saved for this checkout, but the subscription was not activated.',
        });
        break;
      case 'error':
        setPageNotice({
          tone: 'error',
          message:
            'We could not confirm the payment callback. If you were charged, refresh this page in a moment.',
        });
        break;
      default:
        break;
    }
  }, [checkoutState]);

  useEffect(() => {
    if (checkoutState !== 'processing' || !checkoutReference) {
      return;
    }

    let disposed = false;
    let intervalId: number | null = null;

    const verifyCheckout = async () => {
      try {
        const response = await fetch(
          `/api/payments/paystack/verify?reference=${encodeURIComponent(checkoutReference)}`,
          { cache: 'no-store' },
        );
        const payload = await response.json().catch(() => null);

        if (!response.ok || disposed) {
          return;
        }

        if (payload?.outcome === 'completed') {
          if (!disposed) {
            await refreshPropertiesAfterVerification();
          }
          if (intervalId !== null) {
            window.clearInterval(intervalId);
            intervalId = null;
          }
        }

        if (payload?.outcome === 'review' && !disposed) {
          setPageNotice({
            tone: 'warning',
            message:
              'Your payment was received, but it needs manual review before the property subscription can be activated.',
          });
          if (intervalId !== null) {
            window.clearInterval(intervalId);
            intervalId = null;
          }
        }

        if (payload?.outcome === 'failed' && !disposed) {
          setPageNotice({
            tone: 'error',
            message:
              'Paystack could not confirm your payment, so the property subscription was not activated.',
          });
          if (intervalId !== null) {
            window.clearInterval(intervalId);
            intervalId = null;
          }
        }
      } catch (error) {
        console.error('Error polling payment verification:', error);
      }
    };

    void verifyCheckout();
    intervalId = window.setInterval(() => {
      void verifyCheckout();
    }, 5000);

    return () => {
      disposed = true;
      if (intervalId !== null) {
        window.clearInterval(intervalId);
      }
    };
  }, [checkoutReference, checkoutState]);

  const cleanupDraftPhotos = (photos: PropertyPhoto[]) => {
    photos.forEach((photo) => {
      if (photo.preview.startsWith('blob:')) {
        cleanupPreviewUrl(photo.preview);
      }
    });
  };

  const resetPropertyDraft = () => {
    cleanupDraftPhotos(newProperty.photos);
    setNewProperty(emptyPropertyDraft);
    setEditingPropertyId(null);
    setFormError('');
  };

  const scrollFormIntoView = () => {
    window.requestAnimationFrame(() => {
      propertyFormRef.current?.scrollIntoView({
        behavior: 'smooth',
        block: 'start',
      });
    });
  };

  const openImagePreview = (property: Property, startIndex = 0) => {
    if (property.photos.length === 0) {
      return;
    }

    const images = property.photos.map((photo) => photo.url || photo.preview);
    setPreviewImages(images);
    setPreviewIndex(startIndex);
    setPreviewOpen(true);
  };

  const startCreateProperty = () => {
    resetPropertyDraft();
    setPageNotice(null);
    setIsAddingProperty(true);
    scrollFormIntoView();
  };

  const startEditingProperty = (property: Property) => {
    resetPropertyDraft();
    setPageNotice(null);
    setViewingProperty(null);
    setNewProperty({
      name: property.name,
      type: property.type,
      serialNumber: property.serialNumber,
      description: property.description,
      status: property.status,
      planCode: '' as PropertyPlanCodeValue | '',
      photos: property.photos.map((photo) => ({
        ...photo,
        uploaded: true,
        status: 'uploaded',
        progress: 100,
        uploadError: null,
      })),
    });
    setEditingPropertyId(property.id);
    setIsAddingProperty(true);
    scrollFormIntoView();
  };

  const fetchProperties = async () => {
    try {
      setPageError('');
      const response = await fetch('/api/properties');
      if (response.ok) {
        const data = await response.json();
        // Transform database data to frontend format
        const transformed = data.map((p: { 
          id: string; 
          name: string; 
          type: PropertyTypeValue; 
          serial_number: string; 
          description: string | null; 
          date_registered: string | Date; 
          status: PropertyStatusValue;
          photo_url?: string;
          photo_urls?: string[];
        }) => {
          const photoUrls =
            Array.isArray(p.photo_urls) && p.photo_urls.length > 0
              ? p.photo_urls
              : p.photo_url
                ? [p.photo_url]
                : [];

          return {
            id: p.id,
            name: p.name,
            type: p.type,
            serialNumber: p.serial_number,
            description: p.description || '',
            dateRegistered: new Date(p.date_registered).toISOString().split('T')[0],
            status: p.status,
            photos: photoUrls.map((photoUrl, index) => {
              const normalizedUrl = normalizeStoredPhotoUrl(photoUrl);

              return {
                id: `${p.id}-${index}`,
                preview: normalizedUrl,
                uploaded: true,
                url: normalizedUrl,
                status: 'uploaded',
                progress: 100,
                uploadError: null,
              };
            })
          };
        });
        setProperties(transformed);
      } else {
        const payload = await response.json().catch(() => null);
        throw new Error(payload?.error || 'Failed to load your properties');
      }
    } catch (error) {
      console.error('Error fetching properties:', error);
      setProperties([]);
      setPageError(
        error instanceof Error ? error.message : 'Failed to load your properties',
      );
    }
  };

  const selectedPlan = !editingPropertyId && newProperty.planCode
    ? PROPERTY_PLAN_DEFINITIONS.find((plan) => plan.code === newProperty.planCode) ?? null
    : null;
  const freePlanLimitReached = !editingPropertyId && hasUsedFreePlanState;
  const visibleProperties = useMemo(() => {
    const normalizedSearchTerm = searchTerm.trim().toLowerCase();

    return properties.filter((property) => {
      if (statusFilter !== 'all' && property.status !== statusFilter) {
        return false;
      }

      if (typeFilter !== 'all' && property.type !== typeFilter) {
        return false;
      }

      if (!normalizedSearchTerm) {
        return true;
      }

      return [
        property.name,
        property.type,
        property.serialNumber,
        property.description,
        property.status,
      ]
        .join(' ')
        .toLowerCase()
        .includes(normalizedSearchTerm);
    });
  }, [properties, searchTerm, statusFilter, typeFilter]);
  const propertyPageCount = Math.max(
    Math.ceil(visibleProperties.length / PROPERTIES_PAGE_SIZE),
    1,
  );
  const paginatedVisibleProperties = useMemo(() => {
    const start = propertiesPageIndex * PROPERTIES_PAGE_SIZE;
    return visibleProperties.slice(start, start + PROPERTIES_PAGE_SIZE);
  }, [propertiesPageIndex, visibleProperties]);
  const visiblePropertyRangeStart =
    visibleProperties.length === 0
      ? 0
      : propertiesPageIndex * PROPERTIES_PAGE_SIZE + 1;
  const visiblePropertyRangeEnd =
    visibleProperties.length === 0
      ? 0
      : Math.min(
          visibleProperties.length,
          visiblePropertyRangeStart + paginatedVisibleProperties.length - 1,
        );
  const pendingPhotoCount = newProperty.photos.filter(
    (photo) => !photo.uploaded && photo.status !== 'error',
  ).length;
  const uploadingPhotoCount = newProperty.photos.filter(
    (photo) => photo.status === 'uploading',
  ).length;
  const uploadedPhotoCount = newProperty.photos.filter((photo) => photo.uploaded).length;
  const failedPhotoCount = newProperty.photos.filter(
    (photo) => photo.status === 'error',
  ).length;

  useEffect(() => {
    setPropertiesPageIndex(0);
  }, [searchTerm, statusFilter, typeFilter]);

  useEffect(() => {
    if (propertiesPageIndex > propertyPageCount - 1) {
      setPropertiesPageIndex(Math.max(propertyPageCount - 1, 0));
    }
  }, [propertiesPageIndex, propertyPageCount]);

  const handleSaveProperty = async () => {
    if (!newProperty.name || !newProperty.type || !newProperty.serialNumber) {
      setFormError('Property name, type, and serial number are required.');
      return;
    }

    if (!editingPropertyId && !newProperty.planCode) {
      setFormError(
        hasUsedFreePlanState
          ? FREE_PLAN_LIMIT_REACHED_MESSAGE
          : 'Choose a subscription before continuing.',
      );
      return;
    }

    if (!editingPropertyId && newProperty.planCode === 'free' && hasUsedFreePlanState) {
      setFormError(FREE_PLAN_LIMIT_REACHED_MESSAGE);
      return;
    }

    setFormError('');
    setPageNotice(null);
    setIsSavingProperty(true);

    const uploadedPhotos: PropertyPhoto[] = [];
    const uploadKey = Math.random().toString(36).substring(2, 11);

    try {
      if (newProperty.photos.some((photo) => !photo.uploaded && photo.file)) {
        setPageNotice({
          tone: 'info',
          message: editingPropertyId
            ? 'Uploading your updated images and saving this property...'
            : 'Uploading your property images and preparing the next subscription step...',
        });
      }

      for (const photo of newProperty.photos) {
        if (!photo.uploaded && photo.file) {
          setUploadingPhotos((prev) => [...prev, photo.id]);
          setNewProperty((prev) => ({
            ...prev,
            photos: prev.photos.map((draftPhoto) =>
              draftPhoto.id === photo.id
                ? {
                    ...draftPhoto,
                    status: 'uploading',
                    progress: 0,
                    uploadError: null,
                  }
                : draftPhoto,
            ),
          }));

          try {
            const result = await uploadFile(photo.file, {
              propertyId: uploadKey,
              onProgress: (progress) => {
                setNewProperty((prev) => ({
                  ...prev,
                  photos: prev.photos.map((draftPhoto) =>
                    draftPhoto.id === photo.id
                      ? {
                          ...draftPhoto,
                          status: 'uploading',
                          progress: progress.percentage,
                          uploadError: null,
                        }
                      : draftPhoto,
                  ),
                }));
              },
            });

            if (!result.success || !result.url) {
              throw new Error(result.error || 'Failed to upload one of the selected photos');
            }

            setNewProperty((prev) => ({
              ...prev,
              photos: prev.photos.map((draftPhoto) =>
                draftPhoto.id === photo.id
                  ? {
                      ...draftPhoto,
                      uploaded: true,
                      url: result.url,
                      status: 'uploaded',
                      progress: 100,
                      uploadError: null,
                    }
                  : draftPhoto,
              ),
            }));
            uploadedPhotos.push({
              ...photo,
              uploaded: true,
              url: result.url,
              status: 'uploaded',
              progress: 100,
              uploadError: null,
            });
          } catch (uploadError) {
            const uploadErrorMessage =
              uploadError instanceof Error
                ? uploadError.message
                : 'Failed to upload one of the selected photos';

            setNewProperty((prev) => ({
              ...prev,
              photos: prev.photos.map((draftPhoto) =>
                draftPhoto.id === photo.id
                  ? {
                      ...draftPhoto,
                      status: 'error',
                      progress: 0,
                      uploadError: uploadErrorMessage,
                    }
                  : draftPhoto,
              ),
            }));
            throw uploadError;
          } finally {
            setUploadingPhotos((prev) => prev.filter((id) => id !== photo.id));
          }
        } else {
          uploadedPhotos.push({
            ...photo,
            status: 'uploaded',
            progress: 100,
            uploadError: null,
          });
        }
      }

      const payloadBody = {
        id: editingPropertyId ?? undefined,
        name: newProperty.name,
        type: newProperty.type,
        serial_number: newProperty.serialNumber,
        description: newProperty.description,
        status: newProperty.status,
        photo_urls: uploadedPhotos
          .map((photo) => photo.url)
          .filter((photoUrl): photoUrl is string => Boolean(photoUrl)),
      };

      if (editingPropertyId) {
        const response = await fetch('/api/properties', {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(payloadBody),
        });
        const payload = await response.json().catch(() => null);

        if (!response.ok) {
          throw new Error(payload?.error || 'Failed to update property');
        }

        await fetchProperties();
        resetPropertyDraft();
        setIsAddingProperty(false);
        setPageNotice({
          tone: 'success',
          message: 'Property details updated successfully.',
        });
        return;
      }

      const checkoutResponse = await fetch('/api/property-checkout-sessions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...payloadBody,
          plan_code: newProperty.planCode,
        }),
      });
      const checkoutPayload = await checkoutResponse.json().catch(() => null);

      if (!checkoutResponse.ok) {
        throw new Error(checkoutPayload?.error || 'Failed to start property checkout');
      }

      if (checkoutPayload?.mode === 'free') {
        await fetchProperties();
        setHasUsedFreePlanState(true);
        resetPropertyDraft();
        setIsAddingProperty(false);
        setPageNotice({
          tone: 'success',
          message:
            'Your property was registered successfully and the Free subscription is now active.',
        });
        return;
      }

      if (checkoutPayload?.mode === 'payment' && checkoutPayload.authorizationUrl) {
        window.location.assign(checkoutPayload.authorizationUrl);
        return;
      }

      throw new Error('Property checkout did not return a valid activation or payment response.');
    } catch (error) {
      console.error('Error saving property:', error);
      setFormError(
        error instanceof Error
          ? error.message
          : editingPropertyId
            ? 'Failed to update property. Please try again.'
            : 'Failed to start property checkout. Please try again.',
      );
    } finally {
      setIsSavingProperty(false);
    }
  };
  const addPhotosToDraft = (files: File[]) => {
    const validPhotos: PropertyPhoto[] = [];
    const invalidFileMessages: string[] = [];

    files.forEach((file) => {
      const validation = validateFile(file);

      if (!validation.valid) {
        invalidFileMessages.push(
          `${file.name}: ${validation.error ?? 'This file cannot be uploaded.'}`,
        );
        return;
      }

      validPhotos.push(createDraftPhoto(file));
    });

    if (invalidFileMessages.length > 0) {
      setFormError(invalidFileMessages[0]);
    } else {
      setFormError('');
    }

    if (validPhotos.length === 0) {
      return;
    }

    setNewProperty((prev) => ({
      ...prev,
      photos: [...prev.photos, ...validPhotos],
    }));
  };

  const handlePhotoUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;

    if (!files) {
      return;
    }

    addPhotosToDraft(Array.from(files));
    event.target.value = '';
  };

  const handleReplacePhotoUpload = (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const files = event.target.files;
    const replacementFile = files?.[0];

    if (!replacementFile || !photoToReplaceId) {
      event.target.value = '';
      setPhotoToReplaceId(null);
      return;
    }

    const validation = validateFile(replacementFile);

    if (!validation.valid) {
      setFormError(validation.error ?? 'The replacement photo is not valid.');
      event.target.value = '';
      setPhotoToReplaceId(null);
      return;
    }

    setNewProperty((prev) => ({
      ...prev,
      photos: prev.photos.map((photo) => {
        if (photo.id !== photoToReplaceId) {
          return photo;
        }

        if (photo.preview.startsWith('blob:')) {
          cleanupPreviewUrl(photo.preview);
        }

        return {
          ...photo,
          file: replacementFile,
          preview: getPreviewUrl(replacementFile),
          uploaded: false,
          url: undefined,
          status: 'pending',
          progress: 0,
          uploadError: null,
        };
      }),
    }));
    setFormError('');
    event.target.value = '';
    setPhotoToReplaceId(null);
  };

  const removePhoto = (photoId: string) => {
    const photoToRemove = newProperty.photos.find((photo) => photo.id === photoId);

    if (photoToRemove?.preview.startsWith('blob:')) {
      cleanupPreviewUrl(photoToRemove.preview);
    }

    setNewProperty(prev => ({
      ...prev,
      photos: prev.photos.filter(photo => photo.id !== photoId)
    }));
  };

  const movePhoto = (photoId: string, direction: 'left' | 'right') => {
    setNewProperty((prev) => ({
      ...prev,
      photos: movePhotoInList(prev.photos, photoId, direction),
    }));
  };

  const handlePhotoDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setIsPhotoDropActive(false);
    const files = Array.from(event.dataTransfer.files).filter((file) =>
      file.type.startsWith('image/'),
    );

    if (files.length === 0) {
      setFormError('Only image files can be dropped here.');
      return;
    }

    addPhotosToDraft(files);
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  const triggerReplacePhotoInput = (photoId: string) => {
    setPhotoToReplaceId(photoId);
    replaceFileInputRef.current?.click();
  };

  const handleCancelAddProperty = () => {
    resetPropertyDraft();
    setIsAddingProperty(false);
    setUploadingPhotos([]);
    setPhotoToReplaceId(null);
    setIsPhotoDropActive(false);
  };

  const getNoticeClasses = (tone: PageNotice['tone']) => {
    switch (tone) {
      case 'success':
        return 'border-green-200 bg-green-50 text-green-800';
      case 'info':
        return 'border-blue-200 bg-blue-50 text-blue-800';
      case 'warning':
        return 'border-amber-200 bg-amber-50 text-amber-800';
      case 'error':
      default:
        return 'border-red-200 bg-red-50 text-red-700';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Active': return 'bg-green-100 text-green-800';
      case 'Flagged': return 'bg-yellow-100 text-yellow-800';
      case 'Stolen': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'Vehicle': return <Building2 className="h-4 w-4" />;
      case 'Electronics': return <CheckCircle className="h-4 w-4" />;
      case 'Jewelry': return <AlertTriangle className="h-4 w-4" />;
      case 'Document': return <FileText className="h-4 w-4" />;
      default: return <Building2 className="h-4 w-4" />;
    }
  };

  const handleDeleteClick = (property: Property) => {
    setViewingProperty(null);
    setPropertyToDelete(property);
    setDeleteModalOpen(true);
  };

  const confirmDelete = async () => {
    if (!propertyToDelete) return;
    
    try {
      setPageError('');
      const response = await fetch(`/api/properties?id=${propertyToDelete.id}`, {
        method: 'DELETE'
      });
      
      if (response.ok) {
        setProperties(properties.filter(prop => prop.id !== propertyToDelete.id));
        if (selectedProperty?.id === propertyToDelete.id) {
          setSelectedProperty(null);
          setReportStolenModalOpen(false);
        }
      } else {
        const payload = await response.json().catch(() => null);
        throw new Error(payload?.error || 'Failed to delete property');
      }
    } catch (error) {
      console.error('Error deleting property:', error);
      setPageError(
        error instanceof Error ? error.message : 'Failed to delete property',
      );
    } finally {
      setDeleteModalOpen(false);
      setPropertyToDelete(null);
    }
  };

  const cancelDelete = () => {
    setDeleteModalOpen(false);
    setPropertyToDelete(null);
  };

  return (
      <div className="space-y-8">
        {/* Header */}
        <div>
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <h1 className="text-3xl font-bold text-[#0F2651] mb-2">Registered Properties</h1>
              <p className="max-w-3xl text-gray-600">
                Upload a property, choose a subscription, complete payment if needed,
                and manage your registered items here.
              </p>
            </div>
            <Button 
              onClick={startCreateProperty}
              className="bg-[#36689e] hover:bg-[#0F2651] text-white"
            >
              <Plus className="h-4 w-4 mr-2" />
              Upload Property
            </Button>
          </div>
        </div>

        {pageError ? (
          <div className="mb-6 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {pageError}
          </div>
        ) : null}

        {pageNotice ? (
          <div
            className={`mb-6 rounded-md border px-4 py-3 text-sm ${getNoticeClasses(pageNotice.tone)}`}
          >
            {pageNotice.message}
          </div>
        ) : null}

        {properties.length > 0 ? (
          <Card>
            <CardHeader>
              <CardTitle className="text-[#0F2651]">Search & Filters</CardTitle>
              <CardDescription>
                Search by property name, serial number, description, or filter by type and status.
              </CardDescription>
            </CardHeader>
            <CardContent className="grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,2fr)_220px_220px]">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <Input
                  value={searchTerm}
                  onChange={(event) => setSearchTerm(event.target.value)}
                  placeholder="Search properties"
                  className="pl-9"
                />
              </div>
              <select
                value={statusFilter}
                onChange={(event) =>
                  setStatusFilter(event.target.value as 'all' | PropertyStatusValue)
                }
                className="flex h-10 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm ring-offset-white focus:outline-none focus:ring-2 focus:ring-slate-400 focus:ring-offset-2"
              >
                <option value="all">All statuses</option>
                <option value="Active">Active</option>
                <option value="Flagged">Flagged</option>
                <option value="Stolen">Stolen</option>
              </select>
              <select
                value={typeFilter}
                onChange={(event) =>
                  setTypeFilter(event.target.value as 'all' | PropertyTypeValue)
                }
                className="flex h-10 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm ring-offset-white focus:outline-none focus:ring-2 focus:ring-slate-400 focus:ring-offset-2"
              >
                <option value="all">All types</option>
                {PROPERTY_TYPES.map((typeOption) => (
                  <option key={typeOption} value={typeOption}>
                    {typeOption}
                  </option>
                ))}
              </select>
            </CardContent>
          </Card>
        ) : null}

        {/* Add Property Form */}
        {isAddingProperty && (
          <Card ref={propertyFormRef}>
            <CardHeader>
              <CardTitle className="text-[#0F2651]">
                {editingPropertyId ? 'Edit Property' : 'Upload Property'}
              </CardTitle>
              <CardDescription>
                {editingPropertyId
                  ? 'Update the details for this property.'
                  : 'Upload the property details, choose a subscription, and continue to payment if required.'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {!editingPropertyId ? (
                <div className="mb-6 grid grid-cols-1 gap-3 lg:grid-cols-3">
                  <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4">
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Step 1
                    </p>
                    <p className="mt-2 font-semibold text-[#0F2651]">Upload property details</p>
                    <p className="mt-1 text-sm text-slate-600">
                      Add the name, type, serial number, description, and photos for this property.
                    </p>
                  </div>
                  <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4">
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Step 2
                    </p>
                    <p className="mt-2 font-semibold text-[#0F2651]">Choose a subscription</p>
                    <p className="mt-1 text-sm text-slate-600">
                      Select the Free, Monthly, or Yearly subscription for this upload.
                    </p>
                  </div>
                  <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4">
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Step 3
                    </p>
                    <p className="mt-2 font-semibold text-[#0F2651]">Pay and activate</p>
                    <p className="mt-1 text-sm text-slate-600">
                      Paid subscriptions continue to Paystack, then you can manage renewals later from Subscriptions.
                    </p>
                  </div>
                </div>
              ) : null}
              <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="name">Property Name</Label>
                  <Input
                    id="name"
                    placeholder="e.g., 2023 Toyota Camry"
                    value={newProperty.name}
                    onChange={(e) => setNewProperty({...newProperty, name: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="type">Property Type</Label>
                  <select
                    id="type"
                    value={newProperty.type}
                    onChange={(e) =>
                      setNewProperty({
                        ...newProperty,
                        type: e.target.value as PropertyTypeValue | '',
                      })
                    }
                    className="flex h-10 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm ring-offset-white focus:outline-none focus:ring-2 focus:ring-slate-400 focus:ring-offset-2"
                  >
                    <option value="">Select a category</option>
                    {PROPERTY_TYPES.map((typeOption) => (
                      <option key={typeOption} value={typeOption}>
                        {typeOption}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="serial">Serial Number</Label>
                  <Input
                    id="serial"
                    placeholder="e.g., 4T1BF1FK8RU123456"
                    value={newProperty.serialNumber}
                    onChange={(e) => setNewProperty({...newProperty, serialNumber: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="status">Status</Label>
                  <select
                    id="status"
                    value={newProperty.status}
                    onChange={(e) =>
                      setNewProperty({
                        ...newProperty,
                        status: e.target.value as PropertyStatusValue,
                      })
                    }
                    className="flex h-10 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm ring-offset-white focus:outline-none focus:ring-2 focus:ring-slate-400 focus:ring-offset-2"
                  >
                    <option value="Active">Active</option>
                    <option value="Flagged">Flagged</option>
                    <option value="Stolen">Stolen</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="photos">Photo Upload</Label>
                  <div className="space-y-4">
                    <div
                      className={`rounded-2xl border-2 border-dashed p-5 text-center transition-colors ${
                        isPhotoDropActive
                          ? 'border-[#36689e] bg-[#36689e]/5'
                          : 'border-gray-300 hover:border-[#36689e]'
                      }`}
                      onDragOver={(event) => {
                        event.preventDefault();
                        setIsPhotoDropActive(true);
                      }}
                      onDragEnter={(event) => {
                        event.preventDefault();
                        setIsPhotoDropActive(true);
                      }}
                      onDragLeave={(event) => {
                        event.preventDefault();
                        setIsPhotoDropActive(false);
                      }}
                      onDrop={handlePhotoDrop}
                    >
                      <UploadCloud className="mx-auto h-10 w-10 text-[#36689e]" />
                      <p className="mt-3 text-base font-semibold text-[#0F2651]">
                        Drag and drop photos here
                      </p>
                      <p className="mt-1 text-sm text-gray-500">
                        Or browse from your device. The first photo becomes the cover image.
                      </p>
                      <div className="mt-4 flex flex-col justify-center gap-3 sm:flex-row">
                        <Button
                          type="button"
                          variant="outline"
                          onClick={triggerFileInput}
                          className="text-[#0F2651] border-[#36689e]"
                        >
                          <Camera className="h-4 w-4 mr-2" />
                          Add Photos
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          onClick={triggerFileInput}
                          className="text-[#36689e]"
                        >
                          Browse Files
                        </Button>
                      </div>
                      <p className="mt-3 text-xs text-gray-500">
                        JPEG, PNG, GIF, and WebP up to 5MB each.
                      </p>
                      <Input
                        ref={fileInputRef}
                        id="photos"
                        type="file"
                        accept="image/*"
                        multiple
                        onChange={handlePhotoUpload}
                        className="hidden"
                      />
                      <Input
                        ref={replaceFileInputRef}
                        type="file"
                        accept="image/*"
                        onChange={handleReplacePhotoUpload}
                        className="hidden"
                      />
                    </div>

                    {newProperty.photos.length > 0 ? (
                      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
                        <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-3">
                          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                            Ready
                          </p>
                          <p className="mt-2 text-lg font-semibold text-[#0F2651]">
                            {pendingPhotoCount}
                          </p>
                        </div>
                        <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-3">
                          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                            Uploading
                          </p>
                          <p className="mt-2 text-lg font-semibold text-[#0F2651]">
                            {uploadingPhotoCount}
                          </p>
                        </div>
                        <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-3">
                          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                            Uploaded
                          </p>
                          <p className="mt-2 text-lg font-semibold text-[#0F2651]">
                            {uploadedPhotoCount}
                          </p>
                        </div>
                        <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-3">
                          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                            Errors
                          </p>
                          <p className="mt-2 text-lg font-semibold text-[#0F2651]">
                            {failedPhotoCount}
                          </p>
                        </div>
                      </div>
                    ) : null}

                    {newProperty.photos.length > 0 && (
                      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
                        {newProperty.photos.map((photo, index) => (
                          <div
                            key={photo.id}
                            className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm"
                          >
                            <div className="relative group">
                            <img
                              src={photo.preview}
                              alt="Property preview"
                              className="h-40 w-full object-cover"
                            />
                            <div className="absolute left-3 top-3 flex items-center gap-2">
                              <span className="rounded-full bg-white/90 px-2 py-1 text-xs font-semibold text-[#0F2651]">
                                {index === 0 ? 'Cover photo' : `Photo ${index + 1}`}
                              </span>
                            </div>
                            {photo.status === 'uploading' ? (
                              <div className="absolute inset-x-0 bottom-0 bg-black/70 px-3 py-3 text-white">
                                <div className="flex items-center justify-between text-xs font-medium">
                                  <span>Uploading...</span>
                                  <span>{photo.progress ?? 0}%</span>
                                </div>
                                <div className="mt-2 h-2 overflow-hidden rounded-full bg-white/20">
                                  <div
                                    className="h-full rounded-full bg-white transition-all"
                                    style={{ width: `${photo.progress ?? 0}%` }}
                                  />
                                </div>
                              </div>
                            ) : null}
                            {photo.uploadError ? (
                              <div className="absolute inset-x-0 bottom-0 bg-red-700/90 px-3 py-3 text-xs text-white">
                                {photo.uploadError}
                              </div>
                            ) : null}
                            </div>
                            <div className="space-y-3 px-4 py-4">
                              <div className="flex items-center justify-between gap-3">
                                <div className="min-w-0">
                                  <p className="truncate text-sm font-semibold text-[#0F2651]">
                                    {photo.file?.name ?? `Property image ${index + 1}`}
                                  </p>
                                  <p className="mt-1 text-xs text-slate-500">
                                    {photo.file ? formatFileSize(photo.file.size) : 'Already uploaded'}
                                  </p>
                                </div>
                                <Badge
                                  className={
                                    photo.status === 'error'
                                      ? 'bg-red-100 text-red-800'
                                      : photo.status === 'uploading'
                                        ? 'bg-blue-100 text-blue-800'
                                        : photo.uploaded
                                          ? 'bg-green-100 text-green-800'
                                          : 'bg-slate-100 text-slate-700'
                                  }
                                >
                                  {photo.status === 'error'
                                    ? 'Needs attention'
                                    : photo.status === 'uploading'
                                      ? 'Uploading'
                                      : photo.uploaded
                                        ? 'Ready'
                                        : 'Queued'}
                                </Badge>
                              </div>
                              <div className="flex flex-wrap gap-2">
                                <Button
                                  type="button"
                                  variant="outline"
                                  size="sm"
                                  className="border-[#36689e] text-[#0F2651]"
                                  onClick={() => triggerReplacePhotoInput(photo.id)}
                                  disabled={uploadingPhotos.includes(photo.id)}
                                >
                                  <RefreshCcw className="mr-2 h-3.5 w-3.5" />
                                  Replace
                                </Button>
                                <Button
                                  type="button"
                                  variant="outline"
                                  size="sm"
                                  onClick={() => movePhoto(photo.id, 'left')}
                                  disabled={index === 0 || uploadingPhotos.includes(photo.id)}
                                >
                                  <ChevronLeft className="mr-1 h-3.5 w-3.5" />
                                  Left
                                </Button>
                                <Button
                                  type="button"
                                  variant="outline"
                                  size="sm"
                                  onClick={() => movePhoto(photo.id, 'right')}
                                  disabled={
                                    index === newProperty.photos.length - 1 ||
                                    uploadingPhotos.includes(photo.id)
                                  }
                                >
                                  Right
                                  <ChevronRight className="ml-1 h-3.5 w-3.5" />
                                </Button>
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  className="text-red-600 hover:text-red-700"
                                  onClick={() => removePhoto(photo.id)}
                                  disabled={uploadingPhotos.includes(photo.id)}
                                >
                                  <X className="mr-1 h-3.5 w-3.5" />
                                  Remove
                                </Button>
                              </div>
                              <p className="text-xs text-slate-500">
                                Reorder photos before saving. The first image is used as the cover photo everywhere in the dashboard.
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
                <div className="md:col-span-2 space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    placeholder="Additional details about your property..."
                    value={newProperty.description}
                    onChange={(e) => setNewProperty({...newProperty, description: e.target.value})}
                    rows={4}
                  />
                </div>
                {!editingPropertyId ? (
                  <div className="md:col-span-2 space-y-4">
                    <div className="space-y-2">
                      <Label>Choose a Subscription</Label>
                      <p className="text-sm text-slate-600">
                        Free is available once per account. Monthly and yearly subscriptions
                        redirect securely to Paystack. After payment, you manage renewals
                        and restores from Subscriptions.
                      </p>
                    </div>
                    {freePlanLimitReached ? (
                      <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-4 text-sm text-amber-800">
                        <p className="font-semibold text-amber-900">Free upload limit reached</p>
                        <p className="mt-1">
                          This account has already used its one free property upload. Choose
                          the Monthly or Yearly subscription to continue with this new property.
                        </p>
                      </div>
                    ) : null}
                    <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
                      {PROPERTY_PLAN_DEFINITIONS.map((plan) => {
                        const isSelected = newProperty.planCode === plan.code;
                        const isDisabled =
                          plan.code === 'free' && hasUsedFreePlanState;

                        return (
                          <button
                            key={plan.code}
                            type="button"
                            disabled={isDisabled}
                            onClick={() =>
                              setNewProperty((current) => ({
                                ...current,
                                planCode: plan.code,
                              }))
                            }
                            className={`rounded-2xl border px-4 py-4 text-left transition-all ${
                              isSelected
                                ? 'border-[#36689e] bg-[#36689e]/5 ring-1 ring-[#36689e]/20'
                                : 'border-slate-200 bg-white hover:border-[#36689e]/60'
                            } ${isDisabled ? 'cursor-not-allowed opacity-60' : ''}`}
                          >
                            <div className="flex items-start justify-between gap-3">
                              <div>
                                <p className="text-lg font-semibold text-[#0F2651]">{plan.name}</p>
                                <p className="mt-1 text-sm text-slate-600">
                                  {plan.priceNgnKobo === 0
                                    ? 'Free'
                                    : formatNgnFromKobo(plan.priceNgnKobo)}
                                </p>
                              </div>
                              {plan.badge ? (
                                <span className="rounded-full bg-[#36689e] px-2 py-1 text-xs font-semibold text-white">
                                  {plan.badge}
                                </span>
                              ) : null}
                              {isDisabled ? (
                                <span className="rounded-full bg-amber-100 px-2 py-1 text-xs font-semibold text-amber-800">
                                  Limit reached
                                </span>
                              ) : null}
                            </div>
                            <p className="mt-3 text-sm leading-6 text-slate-600">
                              {plan.description}
                            </p>
                            <p
                              className={`mt-4 text-xs font-semibold uppercase tracking-wide ${
                                isSelected ? 'text-[#36689e]' : 'text-slate-500'
                              }`}
                            >
                              {isSelected
                                ? plan.code === 'free'
                                  ? 'Selected for immediate activation'
                                  : 'Selected for payment'
                                : plan.code === 'free'
                                  ? 'One-time free subscription'
                                  : 'Paid subscription'}
                            </p>
                            {isDisabled ? (
                              <p className="mt-3 text-xs font-medium text-amber-700">
                                Free is available for only one property upload. Choose Monthly or Yearly for this property.
                              </p>
                            ) : null}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ) : null}
              </div>
              {formError ? (
                <div className="mt-4 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                  {formError}
                </div>
              ) : null}
              <div className="flex justify-end space-x-4 mt-6">
                <Button 
                  variant="outline" 
                  onClick={handleCancelAddProperty}
                  className="text-[#0F2651] border-[#36689e]"
                  disabled={uploadingPhotos.length > 0 || isSavingProperty}
                >
                  Cancel
                </Button>
                <Button 
                  onClick={handleSaveProperty}
                  className="bg-[#36689e] hover:bg-[#0F2651] text-white"
                  disabled={uploadingPhotos.length > 0 || isSavingProperty}
                >
                  {uploadingPhotos.length > 0
                    ? 'Uploading...'
                    : isSavingProperty
                      ? (editingPropertyId
                        ? 'Updating...'
                        : selectedPlan?.code === 'free'
                          ? 'Activating Subscription...'
                          : 'Continuing to Payment...')
                      : (editingPropertyId
                        ? 'Save Changes'
                        : selectedPlan?.buttonLabel ?? (hasUsedFreePlanState
                          ? 'Choose Monthly or Yearly'
                          : 'Choose a Subscription'))}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Properties List */}
        {visibleProperties.length > 0 ? (
          <Card>
            <CardContent className="flex flex-col gap-3 px-6 py-4 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-sm text-slate-600">
                Showing {visiblePropertyRangeStart}-{visiblePropertyRangeEnd} of{' '}
                {visibleProperties.length} registered properties
              </p>
              <p className="text-sm text-slate-500">
                Page {propertiesPageIndex + 1} of {propertyPageCount}
              </p>
            </CardContent>
          </Card>
        ) : null}

        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 2xl:grid-cols-3">
          {paginatedVisibleProperties.map((property) => (
            <Card key={property.id} className="overflow-hidden transition-shadow hover:shadow-lg">
              {/* Property Image - Clickable for preview */}
              <div 
                className="relative aspect-video cursor-pointer overflow-hidden bg-gray-100"
                onClick={() => openImagePreview(property)}
              >
                {property.photos.length > 0 ? (
                  <img
                    src={property.photos[0].url || property.photos[0].preview}
                    alt={property.name}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      // Prevent infinite loop on error
                      const target = e.currentTarget as HTMLImageElement;
                      if (target.src !== property.photos[0].preview) {
                        target.src = property.photos[0].preview;
                      }
                    }}
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <ImageIcon className="h-12 w-12 text-gray-400" />
                  </div>
                )}
                {property.photos.length > 1 && (
                  <div className="absolute bottom-2 right-2 rounded bg-black/50 px-2 py-1 text-xs text-white">
                    +{property.photos.length - 1}
                  </div>
                )}
                {property.photos.length > 0 && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/0 transition-all hover:bg-black/10">
                    <Eye className="h-8 w-8 text-white opacity-0 hover:opacity-70" />
                  </div>
                )}
              </div>
              
              <CardHeader>
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                  <div className="min-w-0 flex-1">
                    <CardTitle className="text-lg text-[#0F2651]">{property.name}</CardTitle>
                    <CardDescription className="mt-1 flex flex-wrap items-center gap-2">
                      <span className="inline-flex items-center space-x-1 text-sm">
                        {getTypeIcon(property.type)}
                        <span>{property.type}</span>
                      </span>
                      <span>•</span>
                      <span className="break-all text-sm font-mono">{property.serialNumber}</span>
                    </CardDescription>
                    <p className="text-sm text-gray-600 mt-2">
                      Registered: {property.dateRegistered}
                    </p>
                  </div>
                  <Badge className={`${getStatusColor(property.status)} w-fit`}>
                    {property.status}
                  </Badge>
                </div>
              </CardHeader>
              
              <CardContent className="space-y-5">
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-3">
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Type
                    </p>
                    <p className="mt-1 text-sm font-medium text-[#0F2651]">{property.type}</p>
                  </div>
                  <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-3">
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Photos
                    </p>
                    <p className="mt-1 text-sm font-medium text-[#0F2651]">
                      {property.photos.length}
                    </p>
                  </div>
                </div>

                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Description
                  </p>
                  <p className="mt-2 whitespace-pre-wrap break-words text-sm leading-6 text-gray-700">
                    {property.description || 'No description provided.'}
                  </p>
                </div>

                <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
                  <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
                    <Button
                      variant="outline"
                      size="sm"
                      className="justify-center border-[#36689e] text-[#0F2651]"
                      onClick={() => setViewingProperty(property)}
                    >
                      <Eye className="h-4 w-4 mr-1" />
                      View
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="justify-center border-slate-300 text-slate-700"
                      onClick={() => startEditingProperty(property)}
                    >
                      <Edit className="h-4 w-4 mr-1" />
                      Edit
                    </Button>
                    <Button
                      asChild
                      variant="outline"
                      size="sm"
                      className="justify-center border-[#36689e] text-[#0F2651]"
                    >
                      <Link href={`/dashboard/properties/${encodeURIComponent(property.id)}`}>
                        <Eye className="h-4 w-4 mr-1" />
                        Details
                      </Link>
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="justify-center border-red-200 text-red-600 hover:text-red-700"
                      onClick={() => {
                        setSelectedProperty(property);
                        setReportStolenModalOpen(true);
                      }}
                    >
                      <AlertCircle className="h-4 w-4 mr-1" />
                      Report Stolen
                    </Button>
                  </div>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="justify-center text-gray-500 hover:text-red-600"
                    onClick={() => handleDeleteClick(property)}
                  >
                    <Trash2 className="h-4 w-4 mr-1" />
                    Delete
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {visibleProperties.length > 0 ? (
          <Card>
            <CardContent className="flex flex-col gap-3 px-6 py-4 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-sm text-slate-600">
                Page {propertiesPageIndex + 1} of {propertyPageCount}
              </p>
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={propertiesPageIndex === 0}
                  onClick={() => setPropertiesPageIndex((current) => Math.max(current - 1, 0))}
                >
                  Previous
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={propertiesPageIndex >= propertyPageCount - 1}
                  onClick={() =>
                    setPropertiesPageIndex((current) =>
                      Math.min(current + 1, propertyPageCount - 1),
                    )
                  }
                >
                  Next
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : null}

        {properties.length > 0 && visibleProperties.length === 0 ? (
          <Card className="border-2 border-dashed border-slate-300">
            <CardContent className="py-12 text-center">
              <Search className="mx-auto mb-4 h-10 w-10 text-slate-400" />
              <h3 className="mb-2 text-lg font-semibold text-[#0F2651]">
                No matching properties
              </h3>
              <p className="mx-auto mb-6 max-w-2xl text-slate-600">
                Try a different search term or clear one of the filters to see more registered properties.
              </p>
              <Button
                variant="outline"
                className="border-[#36689e] text-[#0F2651]"
                onClick={() => {
                  setSearchTerm('');
                  setStatusFilter('all');
                  setTypeFilter('all');
                }}
              >
                Clear Filters
              </Button>
            </CardContent>
          </Card>
        ) : null}

        {properties.length === 0 && (
          <Card className="border-2 border-dashed border-gray-300">
            <CardContent className="text-center py-12">
              <Building2 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-600 mb-2">No Properties Registered</h3>
              <p className="text-gray-500 mb-6">
                Register your first property, choose a subscription, and activate it to get started with Catcher.
              </p>
              <Button 
                onClick={startCreateProperty}
                className="bg-[#36689e] hover:bg-[#0F2651] text-white"
              >
                <Plus className="h-4 w-4 mr-2" />
                Upload Your First Property
              </Button>
            </CardContent>
          </Card>
        )}

        <PropertyDetailsModal
          property={viewingProperty}
          onClose={() => setViewingProperty(null)}
          onEdit={(property) => startEditingProperty(property)}
          onReportStolen={(property) => {
            setViewingProperty(null);
            setSelectedProperty(property);
            setReportStolenModalOpen(true);
          }}
          onDelete={(property) => handleDeleteClick(property)}
          onOpenPreview={(property, index) => openImagePreview(property, index)}
        />

        {/* Report Stolen Modal */}
        {selectedProperty && (
          <ReportStolenModal
            isOpen={reportStolenModalOpen}
            onClose={() => {
              setReportStolenModalOpen(false);
              setSelectedProperty(null);
            }}
            onReported={fetchProperties}
            propertyId={selectedProperty.id}
            propertyName={selectedProperty.name}
            serialNumber={selectedProperty.serialNumber}
          />
        )}

        {/* Image Preview Modal */}
        {previewOpen && (
          <ImagePreviewModal
            images={previewImages}
            currentIndex={previewIndex}
            onClose={() => setPreviewOpen(false)}
            onNext={() => setPreviewIndex((previewIndex + 1) % previewImages.length)}
            onPrev={() => setPreviewIndex((previewIndex - 1 + previewImages.length) % previewImages.length)}
          />
        )}

        {/* Delete Confirmation Modal */}
        <DeleteConfirmModal
          isOpen={deleteModalOpen}
          itemName={propertyToDelete?.name || ''}
          onConfirm={confirmDelete}
          onCancel={cancelDelete}
        />
      </div>
  );
}



