'use client';

import { DashboardLayout } from '@/components/dashboard-layout';
import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  CreditCard, 
  Check, 
  X, 
  Zap, 
  Shield, 
  Users, 
  BarChart3,
  Calendar,
  DollarSign
} from 'lucide-react';

interface Plan {
  id: string;
  name: string;
  price: number;
  period: string;
  description: string;
  features: string[];
  popular: boolean;
  color: string;
}

export default function SubscriptionsPage() {
  const [currentPlan, setCurrentPlan] = useState('basic');
  const [isProcessing, setIsProcessing] = useState(false);

  const plans: Plan[] = [
    {
      id: 'basic',
      name: 'Basic',
      price: 0,
      period: 'Free forever',
      description: 'Perfect for individuals starting out',
      features: [
        'Register up to 5 properties',
        'Basic theft protection',
        'Email notifications',
        'Community support'
      ],
      popular: false,
      color: 'border-gray-200'
    },
    {
      id: 'premium',
      name: 'Premium',
      price: 9.99,
      period: 'per month',
      description: 'Advanced features for serious protection',
      features: [
        'Unlimited property registration',
        'Priority theft alerts',
        '24/7 premium support',
        'Advanced analytics',
        'Insurance integration',
        'Mobile app access'
      ],
      popular: true,
      color: 'border-[#36689e] bg-[#36689e]/5'
    },
    {
      id: 'enterprise',
      name: 'Enterprise',
      price: 29.99,
      period: 'per month',
      description: 'Complete solution for businesses',
      features: [
        'Everything in Premium',
        'Dedicated account manager',
        'Custom integration',
        'Advanced reporting',
        'Bulk property management',
        'Priority response times',
        'Custom insurance policies'
      ],
      popular: false,
      color: 'border-gray-200'
    }
  ];

  const handleSubscribe = async (planId: string) => {
    setIsProcessing(true);
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    setCurrentPlan(planId);
    setIsProcessing(false);
  };

  const currentPlanData = plans.find(plan => plan.id === currentPlan);

  return (
    <DashboardLayout>
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Header */}
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-[#0F2651] mb-2">Subscription Plans</h1>
          <p className="text-gray-600">Choose the perfect plan to protect your valuable assets</p>
        </div>

        {/* Current Plan */}
        {currentPlanData && (
          <Card className="mb-8 border-[#36689e] bg-[#36689e]/5">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-[#0F2651]">Current Plan: {currentPlanData.name}</CardTitle>
                  <CardDescription>
                    {currentPlanData.price === 0 ? 'Free Plan' : `$${currentPlanData.price} / ${currentPlanData.period}`}
                  </CardDescription>
                </div>
                <div className="flex items-center space-x-4">
                  <Badge className="bg-[#36689e] text-white">
                    <CreditCard className="h-4 w-4 mr-2" />
                    Active
                  </Badge>
                  <Button 
                    variant="outline" 
                    className="text-[#0F2651] border-[#36689e]"
                  >
                    <Calendar className="h-4 w-4 mr-2" />
                    Manage Billing
                  </Button>
                </div>
              </div>
            </CardHeader>
          </Card>
        )}

        {/* Plans Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
          {plans.map((plan) => {
            const isCurrent = plan.id === currentPlan;
            const isPopular = plan.popular;
            
            return (
              <Card 
                key={plan.id} 
                className={`hover:shadow-lg transition-shadow ${plan.color} ${
                  isPopular ? 'ring-2 ring-[#36689e] transform scale-105' : ''
                }`}
              >
                <CardHeader className="pb-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-[#0F2651] text-xl">{plan.name}</CardTitle>
                      {isPopular && (
                        <Badge className="bg-[#36689e] text-white mt-2">Most Popular</Badge>
                      )}
                    </div>
                    {isCurrent && (
                      <Badge className="bg-green-100 text-green-800">
                        <Check className="h-4 w-4 mr-2" />
                        Current
                      </Badge>
                    )}
                  </div>
                  <CardDescription className="mt-2">{plan.description}</CardDescription>
                </CardHeader>
                
                <CardContent>
                  <div className="mb-6">
                    <div className="flex items-baseline">
                      <span className="text-3xl font-bold text-[#0F2651]">
                        ${plan.price}
                      </span>
                      <span className="text-gray-600 ml-2">/{plan.period}</span>
                    </div>
                  </div>

                  <div className="space-y-3 mb-6">
                    {plan.features.map((feature, index) => (
                      <div key={index} className="flex items-center space-x-3">
                        <Check className="h-4 w-4 text-[#36689e] flex-shrink-0" />
                        <span className="text-sm text-gray-700">{feature}</span>
                      </div>
                    ))}
                  </div>

                  <Button 
                    className={`w-full ${
                      isPopular 
                        ? 'bg-[#36689e] hover:bg-[#0F2651] text-white' 
                        : 'bg-white text-[#0F2651] border border-[#36689e] hover:bg-[#36689e] hover:text-white'
                    }`}
                    disabled={isCurrent || isProcessing}
                    onClick={() => handleSubscribe(plan.id)}
                  >
                    {isCurrent ? 'Current Plan' : isProcessing ? 'Processing...' : 'Subscribe Now'}
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Features Comparison */}
        <Card>
          <CardHeader>
            <CardTitle className="text-[#0F2651]">Feature Comparison</CardTitle>
            <CardDescription>See what`s included in each plan</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left pb-4 text-[#0F2651] font-semibold">Features</th>
                    {plans.map((plan) => (
                      <th key={plan.id} className="text-center pb-4">
                        <span className="font-semibold text-[#0F2651]">{plan.name}</span>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b">
                    <td className="py-4 text-gray-700">Property Registration</td>
                    <td className="py-4 text-center">
                      <span className="text-sm text-gray-600">Up to 5</span>
                    </td>
                    <td className="py-4 text-center">
                      <Check className="h-4 w-4 text-[#36689e] mx-auto" />
                    </td>
                    <td className="py-4 text-center">
                      <Check className="h-4 w-4 text-[#36689e] mx-auto" />
                    </td>
                  </tr>
                  <tr className="border-b">
                    <td className="py-4 text-gray-700">Theft Protection</td>
                    <td className="py-4 text-center">
                      <Check className="h-4 w-4 text-[#36689e] mx-auto" />
                    </td>
                    <td className="py-4 text-center">
                      <Check className="h-4 w-4 text-[#36689e] mx-auto" />
                    </td>
                    <td className="py-4 text-center">
                      <Check className="h-4 w-4 text-[#36689e] mx-auto" />
                    </td>
                  </tr>
                  <tr className="border-b">
                    <td className="py-4 text-gray-700">Support</td>
                    <td className="py-4 text-center">
                      <span className="text-sm text-gray-600">Community</span>
                    </td>
                    <td className="py-4 text-center">
                      <span className="text-sm text-gray-600">24/7 Premium</span>
                    </td>
                    <td className="py-4 text-center">
                      <span className="text-sm text-gray-600">Dedicated Manager</span>
                    </td>
                  </tr>
                  <tr className="border-b">
                    <td className="py-4 text-gray-700">Analytics</td>
                    <td className="py-4 text-center">
                      <X className="h-4 w-4 text-gray-400 mx-auto" />
                    </td>
                    <td className="py-4 text-center">
                      <Check className="h-4 w-4 text-[#36689e] mx-auto" />
                    </td>
                    <td className="py-4 text-center">
                      <Check className="h-4 w-4 text-[#36689e] mx-auto" />
                    </td>
                  </tr>
                  <tr>
                    <td className="py-4 text-gray-700">Insurance Integration</td>
                    <td className="py-4 text-center">
                      <X className="h-4 w-4 text-gray-400 mx-auto" />
                    </td>
                    <td className="py-4 text-center">
                      <Check className="h-4 w-4 text-[#36689e] mx-auto" />
                    </td>
                    <td className="py-4 text-center">
                      <Check className="h-4 w-4 text-[#36689e] mx-auto" />
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* FAQ */}
        <div className="mt-12 grid grid-cols-1 md:grid-cols-2 gap-8">
          <Card>
            <CardHeader>
              <CardTitle className="text-[#0F2651]">Frequently Asked Questions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h4 className="font-semibold text-[#0F2651] mb-2">Can I change my plan later?</h4>
                <p className="text-sm text-gray-600">Yes, you can upgrade or downgrade your plan at any time. Changes will be applied to your next billing cycle.</p>
              </div>
              <div>
                <h4 className="font-semibold text-[#0F2651] mb-2">Is there a free trial?</h4>
                <p className="text-sm text-gray-600">The Basic plan is always free. Premium and Enterprise plans can be tried for 14 days with full access to all features.</p>
              </div>
              <div>
                <h4 className="font-semibold text-[#0F2651] mb-2">What payment methods do you accept?</h4>
                <p className="text-sm text-gray-600">We accept all major credit cards and PayPal. All transactions are secured with industry-standard encryption.</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-[#0F2651]">Need Help?</CardTitle>
              <CardDescription>Our team is here to help you</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center space-x-4 p-4 bg-gray-50 rounded-lg">
                <Shield className="h-8 w-8 text-[#36689e]" />
                <div>
                  <h4 className="font-semibold text-[#0F2651]">Security Guaranteed</h4>
                  <p className="text-sm text-gray-600">Your data is protected with bank-level security</p>
                </div>
              </div>
              <div className="flex items-center space-x-4 p-4 bg-gray-50 rounded-lg">
                <BarChart3 className="h-8 w-8 text-[#36689e]" />
                <div>
                  <h4 className="font-semibold text-[#0F2651]">Analytics Included</h4>
                  <p className="text-sm text-gray-600">Track your property protection status</p>
                </div>
              </div>
              <Button className="w-full bg-[#36689e] hover:bg-[#0F2651] text-white">
                Contact Support
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}