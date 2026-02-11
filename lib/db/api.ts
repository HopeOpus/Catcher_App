import { PoolClient } from 'pg';
import { db } from './connection';

// Type definitions
export interface User {
  id: string;
  email: string;
  name: string;
  created_at: Date;
  updated_at: Date;
}

export interface Property {
  id: string;
  user_id: string;
  name: string;
  type: 'Vehicle' | 'Electronics' | 'Jewelry' | 'Other';
  serial_number: string;
  description: string;
  date_registered: Date;
  status: 'Active' | 'Flagged' | 'Stolen';
  created_at: Date;
  updated_at: Date;
}

export interface PropertyPhoto {
  id: string;
  property_id: string;
  file_name: string;
  file_url: string;
  file_size: number;
  file_type: string;
  uploaded_at: Date;
}

export interface PreRegisteredProperty {
  id: string;
  name: string;
  type: 'Vehicle' | 'Electronics' | 'Jewelry' | 'Other';
  description: string;
  image_url: string;
  created_at: Date;
  updated_at: Date;
}

export interface Subscription {
  id: string;
  user_id: string;
  plan_id: string;
  plan_name: string;
  price: number;
  period: 'monthly' | 'yearly';
  status: 'active' | 'cancelled' | 'expired';
  start_date: Date;
  end_date: Date;
  created_at: Date;
  updated_at: Date;
}

export interface StolenReport {
  id: string;
  user_id: string;
  property_id: string;
  property_name: string;
  serial_number: string;
  date_reported: Date;
  location: string;
  description: string;
  status: 'Reported' | 'Under Investigation' | 'Resolved';
  evidence_urls: string[];
  created_at: Date;
  updated_at: Date;
}

// User operations
export const userAPI = {
  async getUser(id: string): Promise<User | null> {
    const client = await db.connect();
    try {
      const result = await client.query(
        'SELECT * FROM users WHERE id = $1',
        [id]
      );
      return result.rows[0] || null;
    } finally {
      client.release();
    }
  },

  async createUser(userData: Omit<User, 'created_at' | 'updated_at'>): Promise<User> {
    const client = await db.connect();
    try {
      const result = await client.query(
        `INSERT INTO users (id, email, name, created_at, updated_at)
         VALUES ($1, $2, $3, NOW(), NOW())
         RETURNING *`,
        [userData.id, userData.email, userData.name]
      );
      return result.rows[0];
    } finally {
      client.release();
    }
  }
};

// Property operations
export const propertyAPI = {
  async getPropertiesByUser(userId: string): Promise<Property[]> {
    const client = await db.connect();
    try {
      const result = await client.query(
        'SELECT * FROM properties WHERE user_id = $1 ORDER BY created_at DESC',
        [userId]
      );
      return result.rows;
    } finally {
      client.release();
    }
  },

  async getProperty(id: string): Promise<Property | null> {
    const client = await db.connect();
    try {
      const result = await client.query(
        'SELECT * FROM properties WHERE id = $1',
        [id]
      );
      return result.rows[0] || null;
    } finally {
      client.release();
    }
  },

  async createProperty(propertyData: Omit<Property, 'id' | 'created_at' | 'updated_at'>): Promise<Property> {
    const client = await db.connect();
    try {
      const result = await client.query(
        `INSERT INTO properties (id, user_id, name, type, serial_number, description, date_registered, status, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW(), NOW())
         RETURNING *`,
        [
          Math.random().toString(36).substr(2, 9),
          propertyData.user_id,
          propertyData.name,
          propertyData.type,
          propertyData.serial_number,
          propertyData.description,
          propertyData.date_registered,
          propertyData.status
        ]
      );
      return result.rows[0];
    } finally {
      client.release();
    }
  },

  async updateProperty(id: string, updates: Partial<Property>): Promise<Property | null> {
    const client = await db.connect();
    try {
      const setClause = Object.keys(updates)
        .map((key, index) => `${key} = $${index + 2}`)
        .join(', ');
      
      const result = await client.query(
        `UPDATE properties 
         SET ${setClause}, updated_at = NOW()
         WHERE id = $1
         RETURNING *`,
        [id, ...Object.values(updates)]
      );
      
      return result.rows[0] || null;
    } finally {
      client.release();
    }
  },

  async deleteProperty(id: string): Promise<boolean> {
    const client = await db.connect();
    try {
      const result = await client.query(
        'DELETE FROM properties WHERE id = $1 RETURNING id',
        [id]
      );
      return result.rowCount > 0;
    } finally {
      client.release();
    }
  }
};

// Property photo operations
export const photoAPI = {
  async getPhotosByProperty(propertyId: string): Promise<PropertyPhoto[]> {
    const client = await db.connect();
    try {
      const result = await client.query(
        'SELECT * FROM property_photos WHERE property_id = $1 ORDER BY uploaded_at DESC',
        [propertyId]
      );
      return result.rows;
    } finally {
      client.release();
    }
  },

  async createPhoto(photoData: Omit<PropertyPhoto, 'id' | 'uploaded_at'>): Promise<PropertyPhoto> {
    const client = await db.connect();
    try {
      const result = await client.query(
        `INSERT INTO property_photos (id, property_id, file_name, file_url, file_size, file_type, uploaded_at)
         VALUES ($1, $2, $3, $4, $5, $6, NOW())
         RETURNING *`,
        [
          Math.random().toString(36).substr(2, 9),
          photoData.property_id,
          photoData.file_name,
          photoData.file_url,
          photoData.file_size,
          photoData.file_type
        ]
      );
      return result.rows[0];
    } finally {
      client.release();
    }
  },

  async deletePhoto(id: string): Promise<boolean> {
    const client = await db.connect();
    try {
      const result = await client.query(
        'DELETE FROM property_photos WHERE id = $1 RETURNING id',
        [id]
      );
      return result.rowCount > 0;
    } finally {
      client.release();
    }
  }
};

// Pre-registered property operations
export const preRegisteredPropertyAPI = {
  async getAll(): Promise<PreRegisteredProperty[]> {
    const client = await db.connect();
    try {
      const result = await client.query(
        'SELECT * FROM pre_registered_properties ORDER BY name'
      );
      return result.rows;
    } finally {
      client.release();
    }
  },

  async getById(id: string): Promise<PreRegisteredProperty | null> {
    const client = await db.connect();
    try {
      const result = await client.query(
        'SELECT * FROM pre_registered_properties WHERE id = $1',
        [id]
      );
      return result.rows[0] || null;
    } finally {
      client.release();
    }
  }
};

// Subscription operations
export const subscriptionAPI = {
  async getSubscriptionByUser(userId: string): Promise<Subscription | null> {
    const client = await db.connect();
    try {
      const result = await client.query(
        'SELECT * FROM subscriptions WHERE user_id = $1 AND status = $2 ORDER BY created_at DESC LIMIT 1',
        [userId, 'active']
      );
      return result.rows[0] || null;
    } finally {
      client.release();
    }
  },

  async createSubscription(subscriptionData: Omit<Subscription, 'id' | 'created_at' | 'updated_at'>): Promise<Subscription> {
    const client = await db.connect();
    try {
      const result = await client.query(
        `INSERT INTO subscriptions (id, user_id, plan_id, plan_name, price, period, status, start_date, end_date, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW(), NOW())
         RETURNING *`,
        [
          Math.random().toString(36).substr(2, 9),
          subscriptionData.user_id,
          subscriptionData.plan_id,
          subscriptionData.plan_name,
          subscriptionData.price,
          subscriptionData.period,
          subscriptionData.status,
          subscriptionData.start_date,
          subscriptionData.end_date
        ]
      );
      return result.rows[0];
    } finally {
      client.release();
    }
  },

  async updateSubscription(id: string, updates: Partial<Subscription>): Promise<Subscription | null> {
    const client = await db.connect();
    try {
      const setClause = Object.keys(updates)
        .map((key, index) => `${key} = $${index + 2}`)
        .join(', ');
      
      const result = await client.query(
        `UPDATE subscriptions 
         SET ${setClause}, updated_at = NOW()
         WHERE id = $1
         RETURNING *`,
        [id, ...Object.values(updates)]
      );
      
      return result.rows[0] || null;
    } finally {
      client.release();
    }
  }
};

// Stolen report operations
export const stolenReportAPI = {
  async getReportsByUser(userId: string): Promise<StolenReport[]> {
    const client = await db.connect();
    try {
      const result = await client.query(
        'SELECT * FROM stolen_reports WHERE user_id = $1 ORDER BY created_at DESC',
        [userId]
      );
      return result.rows;
    } finally {
      client.release();
    }
  },

  async getReport(id: string): Promise<StolenReport | null> {
    const client = await db.connect();
    try {
      const result = await client.query(
        'SELECT * FROM stolen_reports WHERE id = $1',
        [id]
      );
      return result.rows[0] || null;
    } finally {
      client.release();
    }
  },

  async createReport(reportData: Omit<StolenReport, 'id' | 'created_at' | 'updated_at'>): Promise<StolenReport> {
    const client = await db.connect();
    try {
      const result = await client.query(
        `INSERT INTO stolen_reports (id, user_id, property_id, property_name, serial_number, date_reported, location, description, status, evidence_urls, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, NOW(), NOW())
         RETURNING *`,
        [
          Math.random().toString(36).substr(2, 9),
          reportData.user_id,
          reportData.property_id,
          reportData.property_name,
          reportData.serial_number,
          reportData.date_reported,
          reportData.location,
          reportData.description,
          reportData.status,
          reportData.evidence_urls
        ]
      );
      return result.rows[0];
    } finally {
      client.release();
    }
  },

  async updateReport(id: string, updates: Partial<StolenReport>): Promise<StolenReport | null> {
    const client = await db.connect();
    try {
      const setClause = Object.keys(updates)
        .map((key, index) => `${key} = $${index + 2}`)
        .join(', ');
      
      const result = await client.query(
        `UPDATE stolen_reports 
         SET ${setClause}, updated_at = NOW()
         WHERE id = $1
         RETURNING *`,
        [id, ...Object.values(updates)]
      );
      
      return result.rows[0] || null;
    } finally {
      client.release();
    }
  },

  async deleteReport(id: string): Promise<boolean> {
    const client = await db.connect();
    try {
      const result = await client.query(
        'DELETE FROM stolen_reports WHERE id = $1 RETURNING id',
        [id]
      );
      return result.rowCount > 0;
    } finally {
      client.release();
    }
  }
};

// Export all APIs
export const api = {
  users: userAPI,
  properties: propertyAPI,
  photos: photoAPI,
  preRegisteredProperties: preRegisteredPropertyAPI,
  subscriptions: subscriptionAPI,
  stolenReports: stolenReportAPI
};