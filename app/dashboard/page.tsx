import { DashboardLayout } from '@/components/dashboard-layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Users, 
  Building2, 
  ShieldCheck, 
  AlertTriangle,
  Plus,
  Eye,
  Edit,
  Trash2
} from 'lucide-react';

export default function DashboardPage() {
  const stats = [
    {
      title: 'Total Properties',
      value: '12',
      icon: Building2,
      color: 'text-[#36689e]',
      bg: 'bg-[#36689e]/10'
    },
    {
      title: 'Active Subscriptions',
      value: '3',
      icon: ShieldCheck,
      color: 'text-green-600',
      bg: 'bg-green-100'
    },
    {
      title: 'Stolen Reports',
      value: '2',
      icon: AlertTriangle,
      color: 'text-red-600',
      bg: 'bg-red-100'
    },
    {
      title: 'Total Users',
      value: '1',
      icon: Users,
      color: 'text-blue-600',
      bg: 'bg-blue-100'
    }
  ];

  const recentProperties = [
    {
      id: 1,
      name: '2023 Toyota Camry',
      type: 'Vehicle',
      serialNumber: '4T1BF1FK8RU123456',
      dateRegistered: '2024-01-15',
      status: 'Active'
    },
    {
      id: 2,
      name: 'iPhone 15 Pro',
      type: 'Electronics',
      serialNumber: 'F123456789',
      dateRegistered: '2024-01-10',
      status: 'Active'
    },
    {
      id: 3,
      name: 'Rolex Submariner',
      type: 'Jewelry',
      serialNumber: 'M123456',
      dateRegistered: '2024-01-05',
      status: 'Flagged'
    }
  ];

  return (
    <DashboardLayout>
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-[#0F2651] mb-2">Dashboard</h1>
          <p className="text-gray-600">Welcome back! Here`s an overview of your Catcher account.</p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {stats.map((stat, index) => {
            const Icon = stat.icon;
            return (
              <Card key={index} className="hover:shadow-lg transition-shadow">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-gray-600">{stat.title}</CardTitle>
                  <Icon className={`h-8 w-8 ${stat.color} ${stat.bg} p-2 rounded-full`} />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-[#0F2651]">{stat.value}</div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Recent Activity */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Recent Properties */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-[#0F2651]">Recent Properties</CardTitle>
                  <CardDescription>Recently registered items</CardDescription>
                </div>
                <Button variant="outline" className="text-[#0F2651] border-[#36689e] hover:bg-[#36689e] hover:text-white">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Property
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recentProperties.map((property) => (
                  <div key={property.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50">
                    <div className="flex-1">
                      <h3 className="font-semibold text-[#0F2651]">{property.name}</h3>
                      <p className="text-sm text-gray-600">{property.type} • {property.serialNumber}</p>
                      <p className="text-xs text-gray-500">Registered: {property.dateRegistered}</p>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Badge variant={property.status === 'Active' ? 'default' : 'destructive'}>
                        {property.status}
                      </Badge>
                      <Button variant="ghost" size="icon" className="text-gray-500 hover:text-[#36689e]">
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" className="text-gray-500 hover:text-[#36689e]">
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" className="text-gray-500 hover:text-red-600">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Alerts & Notifications */}
          <Card>
            <CardHeader>
              <CardTitle className="text-[#0F2651]">Recent Alerts</CardTitle>
              <CardDescription>Important notifications and updates</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-start space-x-3 p-4 bg-red-50 border border-red-200 rounded-lg">
                  <AlertTriangle className="h-5 w-5 text-red-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <h4 className="font-semibold text-red-700">Suspicious Activity Detected</h4>
                    <p className="text-sm text-red-600">A property matching your registered item was found in a different location.</p>
                    <p className="text-xs text-red-500 mt-1">2 hours ago</p>
                  </div>
                </div>
                
                <div className="flex items-start space-x-3 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <ShieldCheck className="h-5 w-5 text-yellow-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <h4 className="font-semibold text-yellow-700">Subscription Renewal</h4>
                    <p className="text-sm text-yellow-600">Your premium subscription expires in 7 days.</p>
                    <p className="text-xs text-yellow-500 mt-1">1 day ago</p>
                  </div>
                </div>

                <div className="flex items-start space-x-3 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <Users className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <h4 className="font-semibold text-blue-700">New Feature Available</h4>
                    <p className="text-sm text-blue-600">Enhanced tracking features now available for premium users.</p>
                    <p className="text-xs text-blue-500 mt-1">3 days ago</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <div className="mt-8">
          <Card>
            <CardHeader>
              <CardTitle className="text-[#0F2651]">Quick Actions</CardTitle>
              <CardDescription>Common tasks you might need</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Button className="w-full bg-[#36689e] hover:bg-[#0F2651] text-white">
                  Report Stolen Item
                </Button>
                <Button variant="outline" className="w-full text-[#0F2651] border-[#36689e] hover:bg-[#36689e] hover:text-white">
                  View All Properties
                </Button>
                <Button variant="outline" className="w-full text-[#0F2651] border-[#36689e] hover:bg-[#36689e] hover:text-white">
                  Manage Subscriptions
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}