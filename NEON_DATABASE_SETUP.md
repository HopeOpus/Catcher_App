# Neon Database Setup Guide for Catcher Application

This guide will help you set up a Neon PostgreSQL database to store your pre-registered properties with images and descriptions.

## Option 1: Manual Setup on Neon Dashboard

### Step 1: Create a Neon Project

1. Go to [Neon Dashboard](https://console.neon.tech/)
2. Sign up or log in to your account
3. Click "New Project"
4. Choose a project name (e.g., "catcher-app")
5. Select a region closest to your users
6. Click "Create Project"

### Step 2: Get Database Connection Details

1. In your Neon project dashboard, go to the "Connection Details" section
2. Copy the connection string (it will look like: `postgresql://user:password@ep-xxx.us-east-1.aws.neon.tech/catcher-app`)
3. Note down the database name, host, username, and password separately

### Step 3: Set Up Environment Variables

1. Create a `.env.local` file in your project root (if not already exists)
2. Add the following environment variables:

```env
# Database Configuration
DATABASE_URL="your-neon-connection-string-here"

# Keep your existing Clerk environment variables
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_Y2xlYW4tdG9hZC0zNS5jbGVyay5hY2NvdW50cy5kZXYk
CLERK_SECRET_KEY=sk_test_GHL4Ldnytcuoz6aJR06xfWmFxpniKFOV0BgnOUpQXJ
NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/
NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=/
```

### Step 4: Run Database Migration

1. Install the required dependencies:
   ```bash
   npm install pg
   ```

2. Run the migration script:
   ```bash
   node lib/db/migrate.js
   ```

   This will:
   - Create all necessary tables
   - Set up indexes for performance
   - Seed the pre-registered properties with your existing data

### Step 5: Verify Setup

1. Check that the migration completed successfully
2. Verify your pre-registered properties are in the database:
   - 2023 Toyota Camry (Vehicle)
   - iPhone 15 Pro (Electronics) 
   - Rolex Submariner (Jewelry)

## Option 2: Using the Provided Files

### Step 1: Install Dependencies

```bash
npm install pg
```

### Step 2: Configure Environment

Update your `.env.local` file with your Neon database URL:

```env
DATABASE_URL="postgresql://your_username:your_password@ep-xxx.us-east-1.aws.neon.tech/your_database_name?sslmode=require"
```

### Step 3: Run Migration

```bash
node lib/db/migrate.js
```

### Step 4: Test Connection

You can test your database connection by running:

```bash
node -e "
const { testConnection } = require('./lib/db/connection');
testConnection().then(success => {
  console.log(success ? '✅ Database connected!' : '❌ Connection failed');
  process.exit(success ? 0 : 1);
});
"
```

## Database Schema Overview

The database includes the following tables:

### 1. `pre_registered_properties` (Your Pre-Registered Properties)
Stores your pre-defined property templates:

| Field | Type | Description |
|-------|------|-------------|
| id | VARCHAR(255) | Unique identifier |
| name | VARCHAR(255) | Property name (e.g., "2023 Toyota Camry") |
| type | VARCHAR(50) | Property type (Vehicle, Electronics, Jewelry, Other) |
| description | TEXT | Detailed description |
| image_url | VARCHAR(500) | URL to property image |

### 2. `properties`
Stores user-registered properties (linked to users)

### 3. `property_photos`
Stores property images with metadata

### 4. `users`
Stores user information

### 5. `subscriptions`
Stores user subscription data

### 6. `stolen_reports`
Stores theft reports

## Pre-Registered Properties Data

The migration will automatically seed these properties:

### Vehicle
- **ID**: `vehicle-1`
- **Name**: "2023 Toyota Camry"
- **Type**: "Vehicle"
- **Description**: "Black sedan with leather interior"
- **Image**: "/placeholder-property.jpg"

### Electronics
- **ID**: `electronics-1`
- **Name**: "iPhone 15 Pro"
- **Type**: "Electronics"
- **Description**: "128GB, Natural Titanium"
- **Image**: "/placeholder-electronics.jpg"

### Jewelry
- **ID**: `jewelry-1`
- **Name**: "Rolex Submariner"
- **Type**: "Jewelry"
- **Description**: "Stainless steel with black dial"
- **Image**: "/placeholder-jewelry.jpg"

## API Usage

Once set up, you can use the database API:

```javascript
import { api } from '@/lib/db/api';

// Get all pre-registered properties
const properties = await api.preRegisteredProperties.getAll();

// Get a specific property
const vehicle = await api.preRegisteredProperties.getById('vehicle-1');

// Create a new user property
const newProperty = await api.properties.createProperty({
  user_id: 'user-123',
  name: 'My Car',
  type: 'Vehicle',
  serial_number: 'ABC123',
  description: 'My personal vehicle',
  date_registered: new Date(),
  status: 'Active'
});
```

## Troubleshooting

### Connection Issues
- Ensure your Neon project is running
- Check that your DATABASE_URL is correct
- Verify SSL is enabled (add `?sslmode=require` to your connection string)

### Migration Errors
- Ensure you have the `pg` package installed
- Check that your database user has CREATE TABLE permissions
- Verify your connection string format

### Missing Dependencies
If you get TypeScript errors about missing modules:
```bash
npm install --save-dev @types/pg
```

## Security Notes

1. **Never commit your `.env.local` file** to version control
2. Use strong passwords for your Neon database
3. Consider using Neon's branch feature for development/staging environments
4. Monitor your database usage and set appropriate limits

## Next Steps

After setting up the database:

1. Update your frontend to use the new API endpoints
2. Implement proper image upload functionality
3. Add user authentication integration
4. Set up monitoring and backups

## Support

For issues with this setup:
1. Check the Neon documentation: https://neon.tech/docs
2. Review the migration script: `lib/db/migrate.js`
3. Check the API documentation: `lib/db/api.ts`
4. Review the schema: `lib/db/schema.sql`