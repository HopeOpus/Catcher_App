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
  AlertTriangle, 
  Eye, 
  Edit, 
  Trash2, 
  MapPin,
  Calendar,
  FileText,
  Upload
} from 'lucide-react';

interface StolenReport {
  id: number;
  propertyName: string;
  serialNumber: string;
  dateReported: string;
  location: string;
  description: string;
  status: 'Reported' | 'Under Investigation' | 'Resolved';
  evidence: string[];
}

export default function StolenReportsPage() {
  const [reports, setReports] = useState<StolenReport[]>([
    {
      id: 1,
      propertyName: '2023 Toyota Camry',
      serialNumber: '4T1BF1FK8RU123456',
      dateReported: '2024-01-15',
      location: 'Lagos, Nigeria',
      description: 'Vehicle was stolen from my driveway while parked overnight. Last seen at 10 PM.',
      status: 'Under Investigation',
      evidence: ['/evidence1.jpg', '/evidence2.jpg']
    },
    {
      id: 2,
      propertyName: 'iPhone 15 Pro',
      serialNumber: 'F123456789',
      dateReported: '2024-01-10',
      location: 'Abuja, Nigeria',
      description: 'Phone was stolen during a robbery at the shopping mall. Had tracking enabled.',
      status: 'Reported',
      evidence: ['/evidence3.jpg']
    }
  ]);

  const [isReporting, setIsReporting] = useState(false);
  const [newReport, setNewReport] = useState({
    propertyName: '',
    serialNumber: '',
    location: '',
    description: '',
    evidence: [] as File[]
  });
  const handleReportStolen = () => {
    if (newReport.propertyName && newReport.serialNumber && newReport.location && newReport.description) {
      const report: StolenReport = {
        id: Date.now(),
        propertyName: newReport.propertyName,
        serialNumber: newReport.serialNumber,
        dateReported: new Date().toISOString().split('T')[0],
        location: newReport.location,
        description: newReport.description,
        status: 'Reported',
        evidence: []
      };
      
      setReports([...reports, report]);
      setNewReport({ propertyName: '', serialNumber: '', location: '', description: '', evidence: [] });
      setIsReporting(false);
    }
  };

  const handleDeleteReport = (id: number) => {
    setReports(reports.filter(report => report.id !== id));
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Reported': return 'bg-yellow-100 text-yellow-800';
      case 'Under Investigation': return 'bg-blue-100 text-blue-800';
      case 'Resolved': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <DashboardLayout>
      <div className="container mx-auto px-4 py-8 max-w-9xl">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-[#0F2651] mb-2">Stolen Reports</h1>
              <p className="text-gray-600">Report and track stolen or missing properties</p>
            </div>
            <Button 
              onClick={() => setIsReporting(true)}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              <AlertTriangle className="h-4 w-4 mr-2" />
              Report Stolen Item
            </Button>
          </div>
        </div>

        {/* Report Stolen Form */}
        {isReporting && (
          <Card className="mb-8 border-red-200">
            <CardHeader>
              <CardTitle className="text-[#0F2651]">Report Stolen Property</CardTitle>
              <CardDescription>Provide details about your stolen property</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="propertyName">Property Name</Label>
                  <Input
                    id="propertyName"
                    placeholder="e.g., 2023 Toyota Camry"
                    value={newReport.propertyName}
                    onChange={(e) => setNewReport({...newReport, propertyName: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="serialNumber">Serial Number</Label>
                  <Input
                    id="serialNumber"
                    placeholder="e.g., 4T1BF1FK8RU123456"
                    value={newReport.serialNumber}
                    onChange={(e) => setNewReport({...newReport, serialNumber: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="location">Location of Theft</Label>
                  <div className="flex space-x-2">
                    <MapPin className="h-4 w-4 text-gray-500 mt-2 flex-shrink-0" />
                    <Input
                      id="location"
                      placeholder="e.g., Lagos, Nigeria"
                      value={newReport.location}
                      onChange={(e) => setNewReport({...newReport, location: e.target.value})}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="date">Date of Theft</Label>
                  <div className="flex space-x-2">
                    <Calendar className="h-4 w-4 text-gray-500 mt-2 flex-shrink-0" />
                    <Input
                      id="date"
                      type="date"
                      value={new Date().toISOString().split('T')[0]}
                    />
                  </div>
                </div>
                <div className="md:col-span-2 space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    placeholder="Describe the incident and any details that might help..."
                    value={newReport.description}
                    onChange={(e) => setNewReport({...newReport, description: e.target.value})}
                    rows={4}
                  />
                </div>
                  <div className="md:col-span-2 space-y-2">
                  <Label htmlFor="evidence">Evidence Photos</Label>
                  <div className="flex items-center space-x-4">
                    <Input
                      id="evidence"
                      type="file"
                      accept="image/*"
                      multiple
                      onChange={(e) => setNewReport({...newReport, evidence: Array.from(e.target.files || [])})}
                    />
                    <Button variant="outline" className="text-[#0F2651] border-[#36689e]">
                      <Upload className="h-4 w-4 mr-2" />
                      Upload Evidence
                    </Button>
                  </div>
                </div>
              </div>
              <div className="flex justify-end space-x-4 mt-6">
                <Button 
                  variant="outline" 
                  onClick={() => setIsReporting(false)}
                  className="text-[#0F2651] border-[#36689e]"
                >
                  Cancel
                </Button>
                <Button 
                  onClick={handleReportStolen}
                  className="bg-red-600 hover:bg-red-700 text-white"
                >
                  Submit Report
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Reports List */}
        <div className="space-y-6">
          {reports.map((report) => (
            <Card key={report.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="w-16 h-16 bg-red-100 rounded-lg flex items-center justify-center">
                      <AlertTriangle className="h-8 w-8 text-red-600" />
                    </div>
                    <div>
                      <CardTitle className="text-[#0F2651]">{report.propertyName}</CardTitle>
                      <CardDescription>
                        Serial: {report.serialNumber} • Reported: {report.dateReported}
                      </CardDescription>
                      <div className="flex items-center space-x-4 mt-2 text-sm text-gray-600">
                        <div className="flex items-center space-x-1">
                          <MapPin className="h-4 w-4" />
                          <span>{report.location}</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <Calendar className="h-4 w-4" />
                          <span>{report.dateReported}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-col items-end space-y-2">
                    <Badge className={getStatusColor(report.status)}>
                      {report.status}
                    </Badge>
                    <div className="flex items-center space-x-2">
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
                        onClick={() => handleDeleteReport(report.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="md:col-span-2">
                    <h4 className="font-semibold text-[#0F2651] mb-2">Incident Description</h4>
                    <p className="text-gray-700">{report.description}</p>
                  </div>
                  <div>
                    <h4 className="font-semibold text-[#0F2651] mb-2">Evidence</h4>
                    <div className="grid grid-cols-2 gap-2">
                      {report.evidence.map((evidence, index) => (
                        <div key={index} className="aspect-square bg-gray-200 rounded-lg flex items-center justify-center">
                          <FileText className="h-8 w-8 text-gray-500" />
                        </div>
                      ))}
                      {report.evidence.length === 0 && (
                        <div className="col-span-2 text-center text-gray-500 py-4">
                          No evidence uploaded
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {reports.length === 0 && (
          <Card>
            <CardContent className="text-center py-12">
              <AlertTriangle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-600 mb-2">No Stolen Reports</h3>
              <p className="text-gray-500 mb-6">You haven`t reported any stolen properties yet. If you need to report a stolen item, use the button above.</p>
              <Button 
                onClick={() => setIsReporting(true)}
                className="bg-red-600 hover:bg-red-700 text-white"
              >
                <AlertTriangle className="h-4 w-4 mr-2" />
                Report Stolen Item
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
}
