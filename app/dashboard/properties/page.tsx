/* eslint-disable @next/next/no-img-element */
'use client';

import { DashboardLayout } from '@/components/dashboard-layout';
import { useState, useRef, useEffect } from 'react';
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
  Image as ImageIcon,
  X,
  Camera,
  AlertCircle,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { validateFile, getPreviewUrl, cleanupPreviewUrl } from '@/lib/upload';
import { ReportStolenModal } from '@/components/report-stolen-modal';
import {
  PROPERTY_TYPES,
  normalizeStoredPhotoUrl,
  type PropertyStatusValue,
  type PropertyTypeValue,
} from '@/lib/catcher-domain';

interface PropertyPhoto {
  id: string;
  file?: File;
  preview: string;
  uploaded?: boolean;
  url?: string;
}

interface Property {
  id: string;
  name: string;
  type: PropertyTypeValue;
  serialNumber: string;
  description: string;
  dateRegistered: string;
  status: PropertyStatusValue;
  photos: PropertyPhoto[];
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-90" onClick={onClose}>
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#1f1f1fdb] bg-opacity-10">
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



export default function PropertiesPage() {
  const [properties, setProperties] = useState<Property[]>([]);
  const [isAddingProperty, setIsAddingProperty] = useState(false);
  const [reportStolenModalOpen, setReportStolenModalOpen] = useState(false);
  const [selectedProperty, setSelectedProperty] = useState<Property | null>(null);
  const [newProperty, setNewProperty] = useState({
    name: '',
    type: '' as PropertyTypeValue | '',
    serialNumber: '',
    description: '',
    photos: [] as PropertyPhoto[]
  });
  const [uploadingPhotos, setUploadingPhotos] = useState<string[]>([]);
  
  // Image preview modal state
  const [previewImages, setPreviewImages] = useState<string[]>([]);
  const [previewIndex, setPreviewIndex] = useState(0);
  const [previewOpen, setPreviewOpen] = useState(false);
  
  // Delete confirmation modal state
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [propertyToDelete, setPropertyToDelete] = useState<Property | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load properties from database on component mount
  useEffect(() => {
    fetchProperties();
  }, []);

  const fetchProperties = async () => {
    try {
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
                url: normalizedUrl
              };
            })
          };
        });
        setProperties(transformed);
      }
    } catch (error) {
      console.error('Error fetching properties:', error);
    }
  };


  const handleAddProperty = async () => {
    if (newProperty.name && newProperty.type && newProperty.serialNumber) {
      // Upload all photos first
      const uploadedPhotos: PropertyPhoto[] = [];
      const propertyId = Math.random().toString(36).substring(2, 11);
      
      for (const photo of newProperty.photos) {
        if (!photo.uploaded && photo.file) {
          setUploadingPhotos(prev => [...prev, photo.id]);
          
          try {
            // Use real upload API
            const formData = new FormData();
            formData.append('file', photo.file);
            formData.append('propertyId', propertyId);
            
            const response = await fetch('/api/upload', {
              method: 'POST',
              body: formData
            });
            
            if (response.ok) {
              const result = await response.json();
              uploadedPhotos.push({
                ...photo,
                uploaded: true,
                url: result.url
              });
            } else {
              throw new Error('Upload failed');
            }
          } catch (error) {
            console.error('Upload failed:', error);
            // Use preview URL as fallback
            uploadedPhotos.push({
              ...photo,
              uploaded: true,
              url: photo.preview
            });
          } finally {
            setUploadingPhotos(prev => prev.filter(id => id !== photo.id));
          }
        } else {
          uploadedPhotos.push(photo);
        }
      }

      // Save property to database
      try {
        const response = await fetch('/api/properties', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            name: newProperty.name,
            type: newProperty.type,
            serial_number: newProperty.serialNumber,
            description: newProperty.description,
            user_id: 'default-user', // In a real app, get from auth
            status: 'Active',
            photo_urls: uploadedPhotos
              .map((photo) => photo.url)
              .filter((photoUrl): photoUrl is string => Boolean(photoUrl))
          })
        });

        if (response.ok) {
          // Refresh properties list
          await fetchProperties();
        }
      } catch (error) {
        console.error('Error saving property:', error);
      }

      setNewProperty({ name: '', type: '', serialNumber: '', description: '', photos: [] });
      setIsAddingProperty(false);
    }
  };


  const handlePhotoUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files) return;

    const newPhotos: PropertyPhoto[] = [];
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const validation = validateFile(file);
      
      if (validation.valid) {
        const photo: PropertyPhoto = {
          id: Math.random().toString(36).substring(2, 11),
          file: file,
          preview: getPreviewUrl(file),
          uploaded: false
        };
        newPhotos.push(photo);
      } else {
        // Show error message
        console.error(validation.error);
      }
    }

    setNewProperty(prev => ({
      ...prev,
      photos: [...prev.photos, ...newPhotos]
    }));
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

  const triggerFileInput = () => {
    fileInputRef.current?.click();
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
      default: return <Building2 className="h-4 w-4" />;
    }
  };

  const handleDeleteClick = (property: Property) => {
    setPropertyToDelete(property);
    setDeleteModalOpen(true);
  };

  const confirmDelete = async () => {
    if (!propertyToDelete) return;
    
    try {
      const response = await fetch(`/api/properties?id=${propertyToDelete.id}`, {
        method: 'DELETE'
      });
      
      if (response.ok) {
        setProperties(properties.filter(prop => prop.id !== propertyToDelete.id));
      } else {
        console.error('Failed to delete property');
      }
    } catch (error) {
      console.error('Error deleting property:', error);
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
    <DashboardLayout>
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-[#0F2651] mb-2">Registered Properties</h1>
              <p className="text-gray-600">Manage your registered items and their status</p>
            </div>
            <Button 
              onClick={() => setIsAddingProperty(true)}
              className="bg-[#36689e] hover:bg-[#0F2651] text-white"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Property
            </Button>
          </div>
        </div>

        {/* Add Property Form */}
        {isAddingProperty && (
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="text-[#0F2651]">Add New Property</CardTitle>
              <CardDescription>Fill in the details for your new property</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
                  <Label htmlFor="photos">Photo Upload</Label>
                  <div className="space-y-4">
                    {/* Photo Upload Area */}
                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center hover:border-[#36689e] transition-colors">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={triggerFileInput}
                        className="text-[#0F2651] border-[#36689e]"
                      >
                        <Camera className="h-4 w-4 mr-2" />
                        Add Photos
                      </Button>
                      <p className="text-sm text-gray-500 mt-2">Supports multiple file selection</p>
                      <Input
                        ref={fileInputRef}
                        id="photos"
                        type="file"
                        accept="image/*"
                        multiple
                        onChange={handlePhotoUpload}
                        className="hidden"
                      />
                    </div>

                    {/* Photo Previews */}
                    {newProperty.photos.length > 0 && (
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {newProperty.photos.map((photo) => (
                          <div key={photo.id} className="relative group">
                            <img
                              src={photo.preview}
                              alt="Property preview"
                              className="w-full h-24 object-cover rounded-lg border-2 border-gray-200"
                            />
                            <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-50 transition-all rounded-lg flex items-center justify-center">
                              {uploadingPhotos.includes(photo.id) ? (
                                <div className="text-white text-xs">Uploading...</div>
                              ) : (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="text-white opacity-0 group-hover:opacity-100"
                                  onClick={() => removePhoto(photo.id)}
                                >
                                  <X className="h-4 w-4" />
                                </Button>
                              )}
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
              </div>
              <div className="flex justify-end space-x-4 mt-6">
                <Button 
                  variant="outline" 
                  onClick={() => setIsAddingProperty(false)}
                  className="text-[#0F2651] border-[#36689e]"
                >
                  Cancel
                </Button>
                <Button 
                  onClick={handleAddProperty}
                  className="bg-[#36689e] hover:bg-[#0F2651] text-white"
                  disabled={uploadingPhotos.length > 0}
                >
                  {uploadingPhotos.length > 0 ? 'Uploading...' : 'Save Property'}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Properties List */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {properties.map((property) => (
            <Card key={property.id} className="hover:shadow-lg transition-shadow">
              {/* Property Image - Clickable for preview */}
              <div 
                className="relative aspect-video bg-gray-100 cursor-pointer"
                onClick={() => {
                  if (property.photos.length > 0) {
                    const images = property.photos.map(p => p.url || p.preview);
                    setPreviewImages(images);
                    setPreviewIndex(0);
                    setPreviewOpen(true);
                  }
                }}
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
                  <div className="absolute bottom-2 right-2 bg-black bg-opacity-50 text-white text-xs px-2 py-1 rounded">
                    +{property.photos.length - 1}
                  </div>
                )}
                {property.photos.length > 0 && (
                  <div className="absolute inset-0 bg-black bg-opacity-0 hover:bg-opacity-10 transition-all flex items-center justify-center">
                    <Eye className="h-8 w-8 text-white opacity-0 hover:opacity-70" />
                  </div>
                )}
              </div>
              
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-[#0F2651] text-lg">{property.name}</CardTitle>
                    <CardDescription className="flex items-center space-x-2 mt-1">
                      <span className="inline-flex items-center space-x-1 text-sm">
                        {getTypeIcon(property.type)}
                        <span>{property.type}</span>
                      </span>
                      <span>•</span>
                      <span className="text-sm font-mono">{property.serialNumber}</span>
                    </CardDescription>
                    <p className="text-sm text-gray-600 mt-2">
                      Registered: {property.dateRegistered}
                    </p>
                  </div>
                  <Badge className={getStatusColor(property.status)}>
                    {property.status}
                  </Badge>
                </div>
              </CardHeader>
              
              <CardContent>
                <p className="text-gray-700 text-sm mb-4">{property.description}</p>
                <div className="flex justify-between">
                  <div className="flex space-x-2">
                    <Button variant="ghost" size="sm" className="text-gray-500 hover:text-[#36689e]">
                      <Eye className="h-4 w-4 mr-1" />
                      View
                    </Button>
                    <Button variant="ghost" size="sm" className="text-gray-500 hover:text-[#36689e]">
                      <Edit className="h-4 w-4 mr-1" />
                      Edit
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="text-red-600 hover:text-red-700 border-red-600 hover:border-red-700"
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
                    className="text-gray-500 hover:text-red-600"
                    onClick={() => handleDeleteClick(property)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {properties.length === 0 && (
          <Card className="border-2 border-dashed border-gray-300">
            <CardContent className="text-center py-12">
              <Building2 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-600 mb-2">No Properties Registered</h3>
              <p className="text-gray-500 mb-6">Start by adding your first property to get started with Catcher.</p>
              <Button 
                onClick={() => setIsAddingProperty(true)}
                className="bg-[#36689e] hover:bg-[#0F2651] text-white"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Your First Property
              </Button>
            </CardContent>
          </Card>
        )}

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
    </DashboardLayout>
  );
}



