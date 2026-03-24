'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { MapPin, AlertTriangle, X } from 'lucide-react';

interface ReportStolenModalProps {
  isOpen: boolean;
  onClose: () => void;
  propertyId: string;
  propertyName: string;
  serialNumber: string;
  onReported?: () => Promise<void> | void;
}

export function ReportStolenModal({
  isOpen,
  onClose,
  propertyId,
  propertyName,
  serialNumber,
  onReported,
}: ReportStolenModalProps) {
  const [location, setLocation] = useState('');
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrorMessage('');

    try {
      const response = await fetch('/api/stolen-reports', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          property_id: propertyId,
          location,
          description,
        }),
      });

      if (!response.ok) {
        const payload = await response.json().catch(() => null);
        throw new Error(payload?.error || 'Failed to submit stolen report');
      }
      
      setLocation('');
      setDescription('');
      await onReported?.();
      onClose();
    } catch (error) {
      console.error('Error submitting stolen report:', error);
      setErrorMessage(
        error instanceof Error
          ? error.message
          : 'Failed to submit stolen report',
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-[#141414db] bg-opacity-10 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
        <div className="flex items-center justify-between p-6 border-b">
          <div className="flex items-center space-x-3">
            <AlertTriangle className="h-6 w-6 text-red-600" />
            <div>
              <h2 className="text-lg font-semibold text-[#0F2651]">Report Stolen Property</h2>
              <p className="text-sm text-gray-600">Please provide details about where and when your property was stolen.</p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="space-y-2">
            <Label htmlFor="property-name">Property</Label>
            <Input
              id="property-name"
              value={`${propertyName} (${serialNumber})`}
              disabled
              className="bg-gray-50"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="location">
              <span className="flex items-center space-x-1">
                <MapPin className="h-4 w-4" />
                <span>Location Where Stolen</span>
              </span>
            </Label>
            <Input
              id="location"
              placeholder="e.g., 123 Main Street, Lagos or Near Central Market"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Additional Details</Label>
            <Textarea
              id="description"
              placeholder="Describe what happened, when it was stolen, any witnesses, or other relevant information..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={4}
            />
          </div>

          {errorMessage ? (
            <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
              {errorMessage}
            </div>
          ) : null}

          <div className="flex justify-end space-x-3 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="text-[#0F2651] border-[#36689e]"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="bg-[#36689e] hover:bg-[#0F2651] text-white"
              disabled={isSubmitting || !location.trim()}
            >
              {isSubmitting ? 'Submitting...' : 'Report Stolen'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
