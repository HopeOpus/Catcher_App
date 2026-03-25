import { Navigation } from "@/components/navigation";
import { getStolenReportStatusLabel } from "@/lib/catcher-domain";
import { prisma } from "@/lib/prisma";
import { MapPin, Calendar, AlertTriangle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';
import Image from "next/image";

export const dynamic = "force-dynamic";

interface StolenItem {
  id: string;
  property_name: string;
  serial_number: string;
  date_reported: string;
  location: string;
  description: string;
  status: string;
}

async function getStolenItems() {
  try {
    const reports = await prisma.stolenReport.findMany({
      orderBy: { dateReported: "desc" },
    });

    return reports.map((report: (typeof reports)[number]) => ({
      id: report.id,
      property_name: report.propertyName,
      serial_number: report.serialNumber,
      date_reported: report.dateReported.toISOString(),
      location: report.location ?? "",
      description: report.description ?? "",
      status: getStolenReportStatusLabel(report.status),
    }));
  } catch (error) {
    console.error('Error fetching stolen items:', error);
    return [];
  }
}

export default async function StolenItemsPage() {
  let items = await getStolenItems();

  if (items.length === 0) {
    items = [
      {
        id: '1',
        property_name: '2023 Toyota Camry',
        serial_number: '4T1BF1FK8RU123456',
        date_reported: '2024-01-15T00:00:00.000Z',
        location: 'Lagos, Nigeria',
        description: 'Vehicle was stolen from my driveway while parked overnight. Last seen at 10 PM.',
        status: 'Reported'
      },
      {
        id: '2',
        property_name: 'iPhone 15 Pro',
        serial_number: 'F123456789',
        date_reported: '2024-01-10T00:00:00.000Z',
        location: 'Abuja, Nigeria',
        description: 'Phone was stolen during a robbery at the shopping mall. Had tracking enabled.',
        status: 'Reported'
      },
      {
        id: '3',
        property_name: 'MacBook Pro M2',
        serial_number: 'C02HG543Q6L4',
        date_reported: '2024-02-05T00:00:00.000Z',
        location: 'Port Harcourt, Nigeria',
        description: 'Stolen from a coffee shop while I went to the restroom.',
        status: 'Reported'
      }
    ];
  }

  return (
    <div className="flex min-h-screen flex-col bg-slate-50">
      <Navigation />

      <main className="flex-grow pb-16 pt-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mb-12 text-center">
            <h1 className="mb-4 text-4xl font-bold text-[#0F2651] md:text-5xl">
              Stolen Items <span className="text-[#36689e]">Database</span>
            </h1>
            <p className="mx-auto max-w-3xl text-xl text-slate-600">
              Check our public database of reported stolen items to avoid purchasing stolen property.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {items.map((item: StolenItem) => (
              <div key={item.id} className="flex flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition-shadow hover:shadow-md">
                <div className="flex-grow p-6">
                  <div className="mb-4 flex items-start justify-between">
                    <div className="rounded-xl bg-red-50 p-3 text-red-600">
                      <AlertTriangle className="h-6 w-6" />
                    </div>
                    <Badge className="border-none bg-red-100 text-red-800">
                      {item.status || 'Reported Stolen'}
                    </Badge>
                  </div>
                  <h3 className="mb-2 text-xl font-semibold text-[#0F2651]">{item.property_name}</h3>
                  <div className="mb-4 space-y-3 text-sm text-slate-600">
                    <div className="flex items-center gap-2">
                      <span className="rounded bg-slate-100 px-2 py-1 font-medium text-slate-700">SN: {item.serial_number}</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <MapPin className="mt-0.5 h-4 w-4 flex-shrink-0 text-slate-400" />
                      <span>{item.location || 'Location not specified'}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-slate-400" />
                      <span>{new Date(item.date_reported).toLocaleDateString()}</span>
                    </div>
                  </div>
                  <p className="line-clamp-3 text-sm text-slate-600">
                    {item.description}
                  </p>
                </div>
                <div className="mt-auto border-t border-slate-100 bg-slate-50 px-6 py-4">
                  <button className="w-full text-center text-sm font-medium text-[#36689e] transition-colors hover:text-[#0F2651]">
                    View Details
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>

      <footer className="bg-[#0F2651] py-16 text-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 gap-8 md:grid-cols-4">
            <div className="col-span-1 md:col-span-2">
              <Image
                src="/logo2.svg"
                alt="Catcher Logo"
                width={160}
                height={32}
                className="h-8 w-auto"
              />
              <p className="mt-4 max-w-md text-slate-400">
                Catcher helps you secure your valuables, instantly report them stolen, and help stop thieves from reselling them.
              </p>
            </div>
            <div>
              <h3 className="mb-4 text-lg font-semibold">Product</h3>
              <ul className="space-y-2 text-slate-400">
                <li><Link href="/" className="transition-colors hover:text-white">Features</Link></li>
                <li><Link href="/stolen-items" className="transition-colors hover:text-white">Stolen Items</Link></li>
                <li><Link href="#" className="transition-colors hover:text-white">API</Link></li>
                <li><Link href="#" className="transition-colors hover:text-white">Documentation</Link></li>
              </ul>
            </div>
          </div>
          <div className="mt-8 flex flex-col items-center justify-between border-t border-slate-800 pt-8 md:flex-row">
            <p className="text-slate-400">© 2024 Catcher. All rights reserved.</p>
            <div className="mt-4 flex gap-4 md:mt-0">
              <a href="#" className="text-slate-400 transition-colors hover:text-white">Privacy</a>
              <a href="#" className="text-slate-400 transition-colors hover:text-white">Terms</a>
              <a href="#" className="text-slate-400 transition-colors hover:text-white">Support</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
