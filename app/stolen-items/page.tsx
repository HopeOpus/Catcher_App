import { Navigation } from "@/components/navigation";
import { db } from '@/lib/db/connection';
import { MapPin, Calendar, AlertTriangle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';

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
    const client = await db.connect();
    const query = `
      SELECT id, property_name, serial_number, date_reported, location, description, status
      FROM stolen_reports
      ORDER BY date_reported DESC
    `;
    const result = await client.query(query);
    client.release();
    return result.rows;
  } catch (error) {
    console.error('Error fetching stolen items:', error);
    return [];
  }
}

export default async function StolenItemsPage() {
  let items = await getStolenItems();

  // Mock data fallback if DB is empty
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
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <Navigation />
      
      <main className="pt-24 pb-16 flex-grow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h1 className="text-4xl md:text-5xl font-bold text-[#0F2651] mb-4">
              Stolen Items <span className="text-[#36689e]">Database</span>
            </h1>
            <p className="text-xl text-slate-600 max-w-3xl mx-auto">
              Check our public database of reported stolen items to avoid purchasing stolen property.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {items.map((item: StolenItem) => (
              <div key={item.id} className="bg-white rounded-2xl shadow-sm hover:shadow-md transition-shadow border border-slate-200 overflow-hidden flex flex-col">
                <div className="p-6 flex-grow">
                  <div className="flex justify-between items-start mb-4">
                    <div className="bg-red-50 p-3 rounded-xl text-red-600">
                      <AlertTriangle className="h-6 w-6" />
                    </div>
                    <Badge className="bg-red-100 text-red-800 border-none">
                      {item.status || 'Reported Stolen'}
                    </Badge>
                  </div>
                  <h3 className="text-xl font-semibold text-[#0F2651] mb-2">{item.property_name}</h3>
                  <div className="space-y-3 mb-4 text-sm text-slate-600">
                    <div className="flex items-center gap-2">
                      <span className="font-medium bg-slate-100 px-2 py-1 rounded text-slate-700">SN: {item.serial_number}</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <MapPin className="h-4 w-4 mt-0.5 flex-shrink-0 text-slate-400" />
                      <span>{item.location || 'Location not specified'}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-slate-400" />
                      <span>{new Date(item.date_reported).toLocaleDateString()}</span>
                    </div>
                  </div>
                  <p className="text-slate-600 text-sm line-clamp-3">
                    {item.description}
                  </p>
                </div>
                <div className="px-6 py-4 border-t border-slate-100 bg-slate-50 mt-auto">
                  <button className="text-[#36689e] font-medium text-sm hover:text-[#0F2651] transition-colors w-full text-center">
                    View Details
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>

      <footer className="bg-[#0F2651] text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="col-span-1 md:col-span-2">
              <img 
                src="/logo2.svg" 
                alt="Catcher Logo" 
                className="h-8 w-auto"
              />
              <p className="mt-4 text-slate-400 max-w-md">
                Catcher helps you secure your valuables, instantly report them stolen, and help stop thieves from reselling them.
              </p>
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-4">Product</h3>
              <ul className="space-y-2 text-slate-400">
                <li><Link href="/" className="hover:text-white transition-colors">Features</Link></li>
                <li><Link href="/stolen-items" className="hover:text-white transition-colors">Stolen Items</Link></li>
                <li><Link href="#" className="hover:text-white transition-colors">API</Link></li>
                <li><Link href="#" className="hover:text-white transition-colors">Documentation</Link></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-slate-800 mt-8 pt-8 flex flex-col md:flex-row justify-between items-center">
            <p className="text-slate-400">© 2024 Catcher. All rights reserved.</p>
            <div className="flex gap-4 mt-4 md:mt-0">
              <a href="#" className="text-slate-400 hover:text-white transition-colors">Privacy</a>
              <a href="#" className="text-slate-400 hover:text-white transition-colors">Terms</a>
              <a href="#" className="text-slate-400 hover:text-white transition-colors">Support</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
