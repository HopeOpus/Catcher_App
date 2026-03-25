// Database models and types for Catcher application

export interface User {
  id: string;
  email: string;
  name: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Property {
  id: string;
  userId: string;
  name: string;
  type: 'Vehicle' | 'Electronics' | 'Jewelry' | 'Other';
  serialNumber: string;
  description: string;
  photoUrl?: string;
  dateRegistered: Date;
  status: 'Active' | 'Flagged' | 'Stolen';
  createdAt: Date;
  updatedAt: Date;
}

export interface Subscription {
  id: string;
  userId: string;
  planId: string;
  planName: string;
  price: number;
  period: 'monthly' | 'yearly';
  status: 'active' | 'cancelled' | 'expired';
  startDate: Date;
  endDate: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface StolenReport {
  id: string;
  userId: string;
  propertyId: string;
  propertyName: string;
  serialNumber: string;
  dateReported: Date;
  location: string;
  description: string;
  status: 'Reported' | 'Under Investigation' | 'Resolved';
  evidenceUrls: string[];
  createdAt: Date;
  updatedAt: Date;
}

export interface Plan {
  id: string;
  name: string;
  price: number;
  period: string;
  description: string;
  features: string[];
  popular: boolean;
}

// Mock database - in a real application, this would connect to a database
export const mockDatabase = {
  users: new Map<string, User>(),
  properties: new Map<string, Property>(),
  subscriptions: new Map<string, Subscription>(),
  stolenReports: new Map<string, StolenReport>(),
  plans: [
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
      popular: false
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
      popular: true
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
      popular: false
    }
  ] as Plan[]
};

// Helper function to generate unique IDs (replaces deprecated substr)
function generateId(): string {
  return Math.random().toString(36).substring(2, 11);
}

// Utility functions for database operations
export const db = {
  // Users
  getUser: (id: string): User | null => mockDatabase.users.get(id) ?? null,
  getAllUsers: (): User[] => Array.from(mockDatabase.users.values()),
  createUser: (user: Omit<User, 'createdAt' | 'updatedAt'>): User => {
    const newUser: User = {
      ...user,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    mockDatabase.users.set(user.id, newUser);
    return newUser;
  },

  // Properties
  getPropertiesByUser: (userId: string): Property[] => {
    return Array.from(mockDatabase.properties.values()).filter(p => p.userId === userId);
  },
  getAllProperties: (): Property[] => Array.from(mockDatabase.properties.values()),
  getProperty: (id: string): Property | null => mockDatabase.properties.get(id) ?? null,
  createProperty: (property: Omit<Property, 'id' | 'createdAt' | 'updatedAt'>): Property => {
    const newProperty: Property = {
      ...property,
      id: generateId(),
      createdAt: new Date(),
      updatedAt: new Date()
    };
    mockDatabase.properties.set(newProperty.id, newProperty);
    return newProperty;
  },
  updateProperty: (id: string, updates: Partial<Property>): Property | null => {
    const property = mockDatabase.properties.get(id);
    if (!property) return null;
    
    const updatedProperty: Property = {
      ...property,
      ...updates,
      updatedAt: new Date()
    };
    mockDatabase.properties.set(id, updatedProperty);
    return updatedProperty;
  },
  deleteProperty: (id: string) => {
    return mockDatabase.properties.delete(id);
  },

  // Subscriptions
  getSubscriptionByUser: (userId: string): Subscription | null => {
    return Array.from(mockDatabase.subscriptions.values()).find(s => s.userId === userId) ?? null;
  },
  getAllSubscriptions: (): Subscription[] => Array.from(mockDatabase.subscriptions.values()),
  createSubscription: (subscription: Omit<Subscription, 'id' | 'createdAt' | 'updatedAt'>): Subscription => {
    const newSubscription: Subscription = {
      ...subscription,
      id: generateId(),
      createdAt: new Date(),
      updatedAt: new Date()
    };
    mockDatabase.subscriptions.set(newSubscription.id, newSubscription);
    return newSubscription;
  },
  updateSubscription: (id: string, updates: Partial<Subscription>): Subscription | null => {
    const subscription = mockDatabase.subscriptions.get(id);
    if (!subscription) return null;
    
    const updatedSubscription: Subscription = {
      ...subscription,
      ...updates,
      updatedAt: new Date()
    };
    mockDatabase.subscriptions.set(id, updatedSubscription);
    return updatedSubscription;
  },

  // Stolen Reports
  getReportsByUser: (userId: string): StolenReport[] => {
    return Array.from(mockDatabase.stolenReports.values()).filter(r => r.userId === userId);
  },
  getAllReports: (): StolenReport[] => Array.from(mockDatabase.stolenReports.values()),
  getReport: (id: string): StolenReport | null => mockDatabase.stolenReports.get(id) ?? null,
  createReport: (report: Omit<StolenReport, 'id' | 'createdAt' | 'updatedAt'>): StolenReport => {
    const newReport: StolenReport = {
      ...report,
      id: generateId(),
      createdAt: new Date(),
      updatedAt: new Date()
    };
    mockDatabase.stolenReports.set(newReport.id, newReport);
    return newReport;
  },
  updateReport: (id: string, updates: Partial<StolenReport>): StolenReport | null => {
    const report = mockDatabase.stolenReports.get(id);
    if (!report) return null;
    
    const updatedReport: StolenReport = {
      ...report,
      ...updates,
      updatedAt: new Date()
    };
    mockDatabase.stolenReports.set(id, updatedReport);
    return updatedReport;
  },
  deleteReport: (id: string) => {
    return mockDatabase.stolenReports.delete(id);
  },

  // Plans
  getPlans: (): Plan[] => mockDatabase.plans,
  getPlan: (id: string): Plan | null => mockDatabase.plans.find(p => p.id === id) ?? null
};
