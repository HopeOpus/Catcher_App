'use client';

import { DashboardLayout } from '@/components/dashboard-layout';
import { useState } from 'react';
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
  CheckCircle
} from 'lucide-react';

interface Property {
  id: number;
  name: string;
  type: string;
  serialNumber: string;
  description: string;
  dateRegistered: string;
  status: 'Active' | 'Flagged' | 'Stolen';
  photo?: string;
}

export default function PropertiesPage() {
  const [properties, setProperties] = useState<Property[]>([
    {
      id: 1,
      name: '2023 Toyota Camry',
      type: 'Vehicle',
      serialNumber: '4T1BF1FK8RU123456',
      description: 'Black sedan with leather interior',
      dateRegistered: '2024-01-15',
      status: 'Active',
      photo: '/placeholder-property.jpg'
    },
    {
      id: 2,
      name: 'iPhone 15 Pro',
      type: 'Electronics',
      serialNumber: 'F123456789',
      description: '128GB, Natural Titanium',
      dateRegistered: '2024-01-10',
      status: 'Active',
      photo: '/placeholder-electronics.jpg'
    },
    {
      id: 3,
      name: 'Rolex Submariner',
      type: 'Jewelry',
      serialNumber: 'M123456',
      description: 'Stainless steel with black dial',
      dateRegistered: '2024-01-05',
      status: 'Flagged',
      photo: '/placeholder-jewelry.jpg'
    }
  ]);

  const [isAddingProperty, setIsAddingProperty] = useState(false);
  const [newProperty, setNewProperty] = useState({
    name: '',
    type: '',
    serialNumber: '',
    description: '',
    photo: null as File | null
  });

  const handleAddProperty = () => {
    if (newProperty.name && newProperty.type && newProperty.serialNumber) {
      const property: Property = {
        id: Date.now(),
        name: newProperty.name,
        type: newProperty.type,
        serialNumber: newProperty.serialNumber,
        description: newProperty.description,
        dateRegistered: new Date().toISOString().split('T')[0],
        status: 'Active'
      };
      
      setProperties([...properties, property]);
      setNewProperty({ name: '', type: '', serialNumber: '', description: '', photo: null });
      setIsAddingProperty(false);
    }
  };

  const handleDeleteProperty = (id: number) => {
    setProperties(properties.filter(prop => prop.id !== id));
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
                  <Label htmlFor="photo">Photo Upload</Label>
                  <div className="flex items-center space-x-4">
                  <Input
                    id="photo"
                    type="file"
                    accept="image/*"
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewProperty({...newProperty, photo: e.target.files?.[0] || null})}
                  />
                    <Button variant="outline" className="text-[#0F2651] border-[#36689e]">
                      <Upload className="h-4 w-4 mr-2" />
                      Upload
                    </Button>
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
                >
                  Save Property
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Properties List */}
        <div className="space-y-6">
          {properties.map((property) => (
            <Card key={property.id}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="w-16 h-16 bg-gray-200 rounded-lg flex items-center justify-center">
                      {getTypeIcon(property.type)}
                    </div>
                    <div>
                      <CardTitle className="text-[#0F2651]">{property.name}</CardTitle>
                      <CardDescription>
                        {property.type} • {property.serialNumber}
                      </CardDescription>
                      <p className="text-sm text-gray-600 mt-1">
                        Registered: {property.dateRegistered}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Badge className={getStatusColor(property.status)}>
                      {property.status}
                    </Badge>
                    <Button variant="ghost" size="icon" className="text-gray-500 hover:text-[#36689e]">
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" className="text-gray-500 hover:text-[#36689e]">
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="text-gray-500 hover:text-red-600"
                      onClick={() => handleDeleteProperty(property.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-gray-700">{property.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        {properties.length === 0 && (
          <Card>
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
      </div>
    </DashboardLayout>
  );
}