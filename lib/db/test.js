#!/usr/bin/env node

/**
 * Test script for the Catcher database setup
 * Run this script to verify your database is working correctly
 */

const { testConnection, initializeDatabase } = `require('./connection')`;
const { api } = `require('./api')`;

async function runTests() {
  console.log('🧪 Running database tests...\n');

  try {
    // Test 1: Database Connection
    console.log('1. Testing database connection...');
    const connectionSuccess = await testConnection();
    if (!connectionSuccess) {
      throw new Error('Database connection failed');
    }
    console.log('   ✅ Connection successful\n');

    // Test 2: Initialize Database
    console.log('2. Initializing database schema...');
    const initSuccess = await initializeDatabase();
    if (!initSuccess) {
      throw new Error('Database initialization failed');
    }
    console.log('   ✅ Schema created and seeded\n');

    // Test 3: Test Pre-Registered Properties
    console.log('3. Testing pre-registered properties...');
    const preRegisteredProps = await api.preRegisteredProperties.getAll();
    console.log(`   Found ${preRegisteredProps.length} pre-registered properties:`);
    
    preRegisteredProps.forEach(prop => {
      console.log(`   - ${prop.name} (${prop.type}): ${prop.description}`);
    });

    if (preRegisteredProps.length !== 3) {
      throw new Error(`Expected 3 pre-registered properties, found ${preRegisteredProps.length}`);
    }
    console.log('   ✅ Pre-registered properties test passed\n');

    // Test 4: Test Specific Property Retrieval
    console.log('4. Testing specific property retrieval...');
    const vehicle = await api.preRegisteredProperties.getById('vehicle-1');
    if (!vehicle || vehicle.name !== '2023 Toyota Camry') {
      throw new Error('Failed to retrieve vehicle property correctly');
    }
    console.log(`   ✅ Retrieved: ${vehicle.name}\n`);

    // Test 5: Test User Operations
    console.log('5. Testing user operations...');
    const testUser = {
      id: 'test-user-123',
      email: 'test@example.com',
      name: 'Test User'
    };

    const createdUser = await api.users.createUser(testUser);
    if (!createdUser || createdUser.email !== testUser.email) {
      throw new Error('Failed to create user');
    }
    console.log(`   ✅ Created user: ${createdUser.name}\n`);

    // Test 6: Test Property Operations
    console.log('6. Testing property operations...');
    const testProperty = {
      user_id: createdUser.id,
      name: 'Test Property',
      type: 'Electronics',
      serial_number: 'TEST123',
      description: 'Test property for validation',
      date_registered: new Date(),
      status: 'Active'
    };

    const createdProperty = await api.properties.createProperty(testProperty);
    if (!createdProperty || createdProperty.name !== testProperty.name) {
      throw new Error('Failed to create property');
    }
    console.log(`   ✅ Created property: ${createdProperty.name}\n`);

    // Test 7: Test Property Retrieval
    console.log('7. Testing property retrieval...');
    const userProperties = await api.properties.getPropertiesByUser(createdUser.id);
    if (userProperties.length !== 1) {
      throw new Error('Failed to retrieve user properties');
    }
    console.log(`   ✅ Retrieved ${userProperties.length} property for user\n`);

    // Test 8: Cleanup
    console.log('8. Cleaning up test data...');
    await api.properties.deleteProperty(createdProperty.id);
    console.log('   ✅ Test data cleaned up\n');

    console.log('🎉 All tests passed! Database is ready for use.\n');
    console.log('📋 Summary:');
    console.log('   - Database connection: ✅');
    console.log('   - Schema initialization: ✅');
    console.log('   - Pre-registered properties: ✅');
    console.log('   - User operations: ✅');
    console.log('   - Property operations: ✅');
    console.log('   - Data retrieval: ✅');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    process.exit(1);
  }
}

// Run tests if this script is executed directly
if (require.main === module) {
  runTests();
}

module.exports = { runTests };