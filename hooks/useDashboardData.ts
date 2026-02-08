'use client';

import { useState, useEffect } from 'react';
import { db, Property, StolenReport, Subscription, Plan } from '@/lib/db';
import { useAuth } from '@clerk/nextjs';

export interface DashboardStats {
  totalProperties: number;
  activeSubscriptions: number;
  stolenReports: number;
  totalUsers: number;
}

export interface DashboardData {
  stats: DashboardStats;
  recentProperties: Property[];
  recentReports: StolenReport[];
  currentSubscription: Subscription | null;
  plans: Plan[];
  loading: boolean;
  error: string | null;
}

export function useDashboardData() {
  const { userId } = useAuth();
  const [data, setData] = useState<DashboardData>({
    stats: {
      totalProperties: 0,
      activeSubscriptions: 0,
      stolenReports: 0,
      totalUsers: 1 // Mock data
    },
    recentProperties: [],
    recentReports: [],
    currentSubscription: null,
    plans: [],
    loading: true,
    error: null
  });

  useEffect(() => {
    if (!userId) return;

    const fetchData = async () => {
      try {
        setData(prev => ({ ...prev, loading: true, error: null }));
        
        // Fetch all data in parallel
        const [
          properties,
          reports,
          subscription,
          plans
        ] = await Promise.all([
          db.getPropertiesByUser(userId),
          db.getReportsByUser(userId),
          db.getSubscriptionByUser(userId),
          db.getPlans()
        ]);

        // Calculate stats
        const stats: DashboardStats = {
          totalProperties: properties.length,
          activeSubscriptions: subscription ? 1 : 0,
          stolenReports: reports.length,
          totalUsers: 1 // Mock data
        };

        // Get recent items (last 3)
        const recentProperties = properties
          .sort((a, b) => b.dateRegistered.getTime() - a.dateRegistered.getTime())
          .slice(0, 3);

        const recentReports = reports
          .sort((a, b) => b.dateReported.getTime() - a.dateReported.getTime())
          .slice(0, 3);

        setData({
          stats,
          recentProperties,
          recentReports,
          currentSubscription: subscription,
          plans,
          loading: false,
          error: null
        });
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
        setData(prev => ({
          ...prev,
          loading: false,
          error: 'Failed to load dashboard data'
        }));
      }
    };

    fetchData();
  }, [userId]);

  return data;
}

export function useProperties() {
  const { userId } = useAuth();
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchProperties = async () => {
    if (!userId) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const userProperties = await db.getPropertiesByUser(userId);
      setProperties(userProperties);
    } catch (err) {
      setError('Failed to fetch properties');
      console.error('Error fetching properties:', err);
    } finally {
      setLoading(false);
    }
  };

  const createProperty = async (propertyData: Omit<Property, 'id' | 'userId' | 'dateRegistered' | 'createdAt' | 'updatedAt'>) => {
    if (!userId) return null;
    
    setLoading(true);
    setError(null);
    
    try {
      const newProperty = await db.createProperty({
        ...propertyData,
        userId,
        dateRegistered: new Date(),
        status: 'Active'
      });
      
      setProperties(prev => [...prev, newProperty]);
      return newProperty;
    } catch (err) {
      setError('Failed to create property');
      console.error('Error creating property:', err);
      return null;
    } finally {
      setLoading(false);
    }
  };

  const updateProperty = async (id: string, updates: Partial<Property>) => {
    setLoading(true);
    setError(null);
    
    try {
      const updatedProperty = await db.updateProperty(id, updates);
      if (updatedProperty) {
        setProperties(prev => prev.map(p => p.id === id ? updatedProperty : p));
      }
      return updatedProperty;
    } catch (err) {
      setError('Failed to update property');
      console.error('Error updating property:', err);
      return null;
    } finally {
      setLoading(false);
    }
  };

  const deleteProperty = async (id: string) => {
    setLoading(true);
    setError(null);
    
    try {
      const success = await db.deleteProperty(id);
      if (success) {
        setProperties(prev => prev.filter(p => p.id !== id));
      }
      return success;
    } catch (err) {
      setError('Failed to delete property');
      console.error('Error deleting property:', err);
      return false;
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProperties();
  }, [userId]);

  return {
    properties,
    loading,
    error,
    createProperty,
    updateProperty,
    deleteProperty,
    refetch: fetchProperties
  };
}

export function useStolenReports() {
  const { userId } = useAuth();
  const [reports, setReports] = useState<StolenReport[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchReports = async () => {
    if (!userId) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const userReports = await db.getReportsByUser(userId);
      setReports(userReports);
    } catch (err) {
      setError('Failed to fetch reports');
      console.error('Error fetching reports:', err);
    } finally {
      setLoading(false);
    }
  };

  const createReport = async (reportData: Omit<StolenReport, 'id' | 'userId' | 'dateReported' | 'createdAt' | 'updatedAt'>) => {
    if (!userId) return null;
    
    setLoading(true);
    setError(null);
    
    try {
      const newReport = await db.createReport({
        ...reportData,
        userId,
        dateReported: new Date()
      });
      
      setReports(prev => [...prev, newReport]);
      return newReport;
    } catch (err) {
      setError('Failed to create report');
      console.error('Error creating report:', err);
      return null;
    } finally {
      setLoading(false);
    }
  };

  const updateReport = async (id: string, updates: Partial<StolenReport>) => {
    setLoading(true);
    setError(null);
    
    try {
      const updatedReport = await db.updateReport(id, updates);
      if (updatedReport) {
        setReports(prev => prev.map(r => r.id === id ? updatedReport : r));
      }
      return updatedReport;
    } catch (err) {
      setError('Failed to update report');
      console.error('Error updating report:', err);
      return null;
    } finally {
      setLoading(false);
    }
  };

  const deleteReport = async (id: string) => {
    setLoading(true);
    setError(null);
    
    try {
      const success = await db.deleteReport(id);
      if (success) {
        setReports(prev => prev.filter(r => r.id !== id));
      }
      return success;
    } catch (err) {
      setError('Failed to delete report');
      console.error('Error deleting report:', err);
      return false;
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, [userId]);

  return {
    reports,
    loading,
    error,
    createReport,
    updateReport,
    deleteReport,
    refetch: fetchReports
  };
}

export function useSubscriptions() {
  const { userId } = useAuth();
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchSubscription = async () => {
    if (!userId) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const userSubscription = await db.getSubscriptionByUser(userId);
      setSubscription(userSubscription || null);
    } catch (err) {
      setError('Failed to fetch subscription');
      console.error('Error fetching subscription:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchPlans = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const availablePlans = await db.getPlans();
      setPlans(availablePlans);
    } catch (err) {
      setError('Failed to fetch plans');
      console.error('Error fetching plans:', err);
    } finally {
      setLoading(false);
    }
  };

  const createSubscription = async (planId: string) => {
    if (!userId) return null;
    
    setLoading(true);
    setError(null);
    
    try {
      const plan = await db.getPlan(planId);
      if (!plan) {
        setError('Invalid plan selected');
        return null;
      }

      const newSubscription = await db.createSubscription({
        userId,
        planId,
        planName: plan.name,
        price: plan.price,
        period: plan.period === 'per month' ? 'monthly' : 'yearly',
        status: 'active',
        startDate: new Date(),
        endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days from now
      });
      
      setSubscription(newSubscription);
      return newSubscription;
    } catch (err) {
      setError('Failed to create subscription');
      console.error('Error creating subscription:', err);
      return null;
    } finally {
      setLoading(false);
    }
  };

  const updateSubscription = async (updates: Partial<Subscription>) => {
    if (!subscription) return null;
    
    setLoading(true);
    setError(null);
    
    try {
      const updatedSubscription = await db.updateSubscription(subscription.id, updates);
      if (updatedSubscription) {
        setSubscription(updatedSubscription);
      }
      return updatedSubscription;
    } catch (err) {
      setError('Failed to update subscription');
      console.error('Error updating subscription:', err);
      return null;
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSubscription();
    fetchPlans();
  }, [userId]);

  return {
    subscription,
    plans,
    loading,
    error,
    createSubscription,
    updateSubscription,
    refetch: fetchSubscription
  };
}