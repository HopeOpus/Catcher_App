'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import {
  AlertTriangle,
  Calendar,
  FileText,
  MapPin,
  RefreshCcw,
  Search,
  ShieldAlert,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { normalizeStoredPhotoUrl } from '@/lib/catcher-domain';

type StolenReport = {
  id: string;
  property_id: string;
  property_name: string;
  serial_number: string;
  date_reported: string;
  location: string;
  description: string | null;
  status: string;
  status_label: string;
  evidence_urls: string[];
  created_at: string;
  updated_at: string;
};

function getStatusColor(status: string) {
  switch (status) {
    case 'Reported':
      return 'bg-yellow-100 text-yellow-800';
    case 'UnderInvestigation':
      return 'bg-blue-100 text-blue-800';
    case 'Resolved':
      return 'bg-green-100 text-green-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
}

function getEvidenceUrl(url: string) {
  return normalizeStoredPhotoUrl(url);
}

function getEvidenceLabel(url: string, index: number) {
  const normalizedUrl = getEvidenceUrl(url);
  const fileName = normalizedUrl.split('/').pop();
  return fileName || `Evidence ${index + 1}`;
}

function LoadingCard() {
  return (
    <Card className="animate-pulse">
      <CardHeader>
        <div className="h-6 w-40 rounded bg-slate-200" />
        <div className="h-4 w-64 rounded bg-slate-100" />
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          <div className="h-4 w-full rounded bg-slate-100" />
          <div className="h-4 w-5/6 rounded bg-slate-100" />
          <div className="h-4 w-2/3 rounded bg-slate-100" />
        </div>
      </CardContent>
    </Card>
  );
}

export default function StolenReportsPage() {
  const [reports, setReports] = useState<StolenReport[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<
    'all' | 'Reported' | 'UnderInvestigation' | 'Resolved'
  >('all');

  const fetchReports = async () => {
    try {
      setIsLoading(true);
      setErrorMessage('');

      const response = await fetch('/api/stolen-reports');
      const payload = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(payload?.error || 'Failed to load stolen reports');
      }

      setReports(Array.isArray(payload) ? payload : []);
    } catch (error) {
      console.error('Error loading stolen reports:', error);
      setReports([]);
      setErrorMessage(
        error instanceof Error
          ? error.message
          : 'Failed to load stolen reports',
      );
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void fetchReports();
  }, []);

  const openReportsCount = reports.filter(
    (report) => report.status !== 'Resolved',
  ).length;
  const filteredReports = useMemo(() => {
    const normalizedSearchTerm = searchTerm.trim().toLowerCase();

    return reports.filter((report) => {
      if (statusFilter !== 'all' && report.status !== statusFilter) {
        return false;
      }

      if (!normalizedSearchTerm) {
        return true;
      }

      return [
        report.property_name,
        report.serial_number,
        report.location,
        report.description,
        report.status_label,
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase()
        .includes(normalizedSearchTerm);
    });
  }, [reports, searchTerm, statusFilter]);

  return (
      <div className="space-y-8">
        <div className="mb-8 flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <h1 className="mb-2 text-3xl font-bold text-[#0F2651]">
              Stolen Reports
            </h1>
            <p className="text-gray-600">
              Review the reports you have submitted for your registered
              properties.
            </p>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row">
            <Button
              variant="outline"
              className="border-[#36689e] text-[#0F2651]"
              onClick={() => {
                void fetchReports();
              }}
              disabled={isLoading}
            >
              <RefreshCcw className="mr-2 h-4 w-4" />
              Refresh
            </Button>
            <Button
              asChild
              className="bg-red-600 text-white hover:bg-red-700"
            >
              <Link href="/dashboard/properties">
                <AlertTriangle className="mr-2 h-4 w-4" />
                Report From Properties
              </Link>
            </Button>
          </div>
        </div>

        <div className="mb-8 grid grid-cols-1 gap-4 md:grid-cols-2">
          <Card>
            <CardHeader className="pb-3">
              <CardDescription>Total Reports</CardDescription>
              <CardTitle className="text-3xl text-[#0F2651]">
                {reports.length}
              </CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardDescription>Open Cases</CardDescription>
              <CardTitle className="text-3xl text-[#0F2651]">
                {openReportsCount}
              </CardTitle>
            </CardHeader>
          </Card>
        </div>

        {errorMessage ? (
          <div className="mb-6 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {errorMessage}
          </div>
        ) : null}

        {!isLoading && reports.length > 0 ? (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="text-[#0F2651]">Search & Filters</CardTitle>
              <CardDescription>
                Search by property, serial number, location, or filter by report status.
              </CardDescription>
            </CardHeader>
            <CardContent className="grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,2fr)_220px]">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <Input
                  value={searchTerm}
                  onChange={(event) => setSearchTerm(event.target.value)}
                  placeholder="Search stolen reports"
                  className="pl-9"
                />
              </div>
              <select
                value={statusFilter}
                onChange={(event) =>
                  setStatusFilter(
                    event.target.value as
                      | 'all'
                      | 'Reported'
                      | 'UnderInvestigation'
                      | 'Resolved',
                  )
                }
                className="flex h-10 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm ring-offset-white focus:outline-none focus:ring-2 focus:ring-slate-400 focus:ring-offset-2"
              >
                <option value="all">All statuses</option>
                <option value="Reported">Reported</option>
                <option value="UnderInvestigation">Under Investigation</option>
                <option value="Resolved">Resolved</option>
              </select>
            </CardContent>
          </Card>
        ) : null}

        {isLoading ? (
          <div className="space-y-6">
            <LoadingCard />
            <LoadingCard />
            <LoadingCard />
          </div>
        ) : reports.length === 0 ? (
          <Card className="border-2 border-dashed border-gray-300">
            <CardContent className="py-12 text-center">
              <ShieldAlert className="mx-auto mb-4 h-12 w-12 text-gray-400" />
              <h3 className="mb-2 text-lg font-semibold text-gray-600">
                No Stolen Reports Yet
              </h3>
              <p className="mx-auto mb-6 max-w-2xl text-gray-500">
                When one of your registered properties is reported stolen, it
                will appear here. To create a report, open your properties
                dashboard and use the report action on the affected item.
              </p>
              <Button
                asChild
                className="bg-red-600 text-white hover:bg-red-700"
              >
                <Link href="/dashboard/properties">
                  <AlertTriangle className="mr-2 h-4 w-4" />
                  Go To Properties
                </Link>
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6">
            {filteredReports.map((report) => (
              <Card key={report.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                    <div className="flex items-start gap-4">
                      <div className="flex h-16 w-16 items-center justify-center rounded-lg bg-red-100">
                        <AlertTriangle className="h-8 w-8 text-red-600" />
                      </div>
                      <div>
                        <CardTitle className="text-[#0F2651]">
                          {report.property_name}
                        </CardTitle>
                        <CardDescription className="mt-1">
                          Serial: {report.serial_number}
                        </CardDescription>
                        <div className="mt-3 flex flex-col gap-2 text-sm text-gray-600 sm:flex-row sm:flex-wrap sm:gap-4">
                          <span className="inline-flex items-center gap-1">
                            <MapPin className="h-4 w-4" />
                            {report.location}
                          </span>
                          <span className="inline-flex items-center gap-1">
                            <Calendar className="h-4 w-4" />
                            Reported{' '}
                            {new Date(report.date_reported).toLocaleDateString()}
                          </span>
                        </div>
                        <div className="mt-3">
                          <Button
                            asChild
                            variant="outline"
                            className="border-[#36689e] text-[#0F2651]"
                          >
                            <Link href={`/dashboard/properties/${encodeURIComponent(report.property_id)}`}>
                              View Property Details
                            </Link>
                          </Button>
                        </div>
                      </div>
                    </div>
                    <Badge className={getStatusColor(report.status)}>
                      {report.status_label || report.status}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
                    <div className="md:col-span-2">
                      <h4 className="mb-2 font-semibold text-[#0F2651]">
                        Incident Description
                      </h4>
                      <p className="text-gray-700">
                        {report.description || 'No additional description provided.'}
                      </p>
                    </div>
                    <div>
                      <h4 className="mb-2 font-semibold text-[#0F2651]">
                        Evidence
                      </h4>
                      {report.evidence_urls.length > 0 ? (
                        <div className="space-y-2">
                          {report.evidence_urls.map((url, index) => (
                            <a
                              key={`${report.id}-${index}`}
                              href={getEvidenceUrl(url)}
                              target="_blank"
                              rel="noreferrer"
                              className="flex items-center gap-2 rounded-md border border-slate-200 px-3 py-2 text-sm text-[#36689e] hover:bg-slate-50"
                            >
                              <FileText className="h-4 w-4" />
                              <span className="truncate">
                                {getEvidenceLabel(url, index)}
                              </span>
                            </a>
                          ))}
                        </div>
                      ) : (
                        <div className="rounded-md border border-dashed border-slate-200 px-3 py-4 text-sm text-gray-500">
                          No evidence attached to this report.
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {!isLoading && reports.length > 0 && filteredReports.length === 0 ? (
          <Card className="border-2 border-dashed border-slate-300">
            <CardContent className="py-12 text-center">
              <Search className="mx-auto mb-4 h-10 w-10 text-slate-400" />
              <h3 className="mb-2 text-lg font-semibold text-[#0F2651]">
                No matching stolen reports
              </h3>
              <p className="mx-auto mb-6 max-w-2xl text-slate-600">
                Adjust the search term or change the status filter to see more reports.
              </p>
              <Button
                variant="outline"
                className="border-[#36689e] text-[#0F2651]"
                onClick={() => {
                  setSearchTerm('');
                  setStatusFilter('all');
                }}
              >
                Clear Filters
              </Button>
            </CardContent>
          </Card>
        ) : null}
      </div>
  );
}
