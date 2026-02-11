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
  Upload,
  AlertTriangle,
  CheckCircle,
  Image as ImageIcon,
  X,
  Camera,
  AlertCircle
} from 'lucide-react';
import { uploadFile, validateFile, getPreviewUrl, cleanupPreviewUrl } from '@/lib/upload';
import { db, Property as PropertyType } from '@/lib/db';
import { ReportStolenModal } from '@/components/report-stolen-modal';

interface PropertyPhoto {
  id: string;
  file: File;
  preview: string;
  uploaded?: boolean;
  url?: string;
}

interface Property {
  id: string;
  name: string;
  type: string;
  serialNumber: string;
  description: string;
  dateRegistered: string;
  status: 'Active' | 'Flagged' | 'Stolen';
  photos: PropertyPhoto[];
}

export default function PropertiesPage() {
  const [properties, setProperties] = useState<Property[]>([]);
  const [isAddingProperty, setIsAddingProperty] = useState(false);
  const [reportStolenModalOpen, setReportStolenModalOpen] = useState(false);
  const [selectedProperty, setSelectedProperty] = useState<Property | null>(null);
  const [newProperty, setNewProperty] = useState({
    name: '',
    type: '',
    serialNumber: '',
    description: '',
    photos: [] as PropertyPhoto[]
  });
  const [uploadingPhotos, setUploadingPhotos] = useState<string[]>([]);
  const [uploadProgress, setUploadProgress] = useState<Record<string, number>>({});
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load properties from database on component mount
  useEffect(() => {
    // For now, we'll use mock data. In a real application, this would fetch from an API
    const mockProperties: Property[] = [
      {
        id: '1',
        name: '2023 Toyota Camry',
        type: 'Vehicle',
        serialNumber: '4T1BF1FK8RU123456',
        description: 'Black sedan with leather interior',
        dateRegistered: '2024-01-15',
        status: 'Active',
        photos: [
          {
            id: '1',
            file: new File([''], 'car1.jpg', { type: 'image/jpeg' }),
            preview: '/placeholder-property.jpg',
            uploaded: true,
            url: '/placeholder-property.jpg'
          }
        ]
      },
      {
        id: '2',
        name: 'iPhone 15 Pro',
        type: 'Electronics',
        serialNumber: 'F123456789',
        description: '128GB, Natural Titanium',
        dateRegistered: '2024-01-10',
        status: 'Active',
        photos: [
          {
            id: '2',
            file: new File([''], 'phone1.jpg', { type: 'image/jpeg' }),
            preview: '/placeholder-electronics.jpg',
            uploaded: true,
            url: '/placeholder-electronics.jpg'
          }
        ]
      },
      {
        id: '3',
        name: 'Rolex Submariner',
        type: 'Jewelry',
        serialNumber: 'M123456',
        description: 'Stainless steel with black dial',
        dateRegistered: '2024-01-05',
        status: 'Flagged',
        photos: [
          {
            id: '3',
            file: new File([''], 'watch1.jpg', { type: 'image/jpeg' }),
            preview: '/placeholder-jewelry.jpg',
            uploaded: true,
            url: '/placeholder-jewelry.jpg'
          }
        ]
      }
    ];
    setProperties(mockProperties);
  }, []);

  const handleAddProperty = async () => {
    if (newProperty.name && newProperty.type && newProperty.serialNumber) {
      // Upload all photos first
      const uploadedPhotos = [];
      for (const photo of newProperty.photos) {
        if (!photo.uploaded && photo.file) {
          setUploadingPhotos(prev => [...prev, photo.id]);
          
          try {
            const result = await uploadFile(photo.file, (progress) => {
              setUploadProgress(prev => ({
                ...prev,
                [photo.id]: progress.percentage
              }));
            });
            
            if (result.success) {
              uploadedPhotos.push({
                ...photo,
                uploaded: true,
                url: result.url
              });
            } else {
              throw new Error(result.error || 'Upload failed');
            }
          } catch (error) {
            console.error('Upload failed:', error);
            // Handle upload error
          } finally {
            setUploadingPhotos(prev => prev.filter(id => id !== photo.id));
          }
        } else {
          uploadedPhotos.push(photo);
        }
      }

      const property: Property = {
        id: Math.random().toString(36).substr(2, 9),
        name: newProperty.name,
        type: newProperty.type,
        serialNumber: newProperty.serialNumber,
        description: newProperty.description,
        dateRegistered: new Date().toISOString().split('T')[0],
        status: 'Active',
        photos: uploadedPhotos
      };
      
      setProperties([...properties, property]);
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
          id: Math.random().toString(36).substr(2, 9),
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

  const handleDeleteProperty = (id: string) => {
    setProperties(properties.filter(prop => prop.id !== id));
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
                  <Input
                    id="type"
                    placeholder="e.g., Vehicle, Electronics, Jewelry"
                    value={newProperty.type}
                    onChange={(e) => setNewProperty({...newProperty, type: e.target.value})}
                  />
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
                                <div className="text-white text-xs">
                                  Uploading... {uploadProgress[photo.id] || 0}%
                                </div>
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
              {/* Property Image */}
              <div className="relative aspect-video bg-gray-100">
                {property.photos.length > 0 ? (
                  <img
                    src={property.photos[0].url || property.photos[0].preview}
                    alt={property.name}
                    className="w-full h-full object-cover"
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
                    onClick={() => handleDeleteProperty(property.id)}
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
            propertyId={selectedProperty.id}
            propertyName={selectedProperty.name}
            serialNumber={selectedProperty.serialNumber}
          />
        )}
      </div>
    </DashboardLayout>
  );
}
