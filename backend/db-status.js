const mongoose = require('mongoose');
require('dotenv').config();

const checkDatabaseStatus = async () => {
  try {
    console.log('🔍 Checking Database Status...\n');
    
    // Connect to MongoDB
    const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/teaching-platform';
    console.log('🔌 Connecting to:', uri.replace(/\/\/(.*)@/, '//***@'));
    
    await mongoose.connect(uri);
    console.log('✅ Connected successfully!\n');
    
    // Get database info
    const db = mongoose.connection.db;
    const admin = db.admin();
    
    // Get server status
    const serverStatus = await admin.serverStatus();
    console.log('📊 Server Information:');
    console.log('   Host:', serverStatus.host);
    console.log('   Version:', serverStatus.version);
    console.log('   Process:', serverStatus.process);
    console.log('   PID:', serverStatus.pid);
    console.log();
    
    // List all databases
    const databases = await admin.listDatabases();
    console.log('📚 Databases (' + databases.databases.length + '):');
    databases.databases.forEach((db, index) => {
      console.log(`   ${index + 1}. ${db.name} (${(db.sizeOnDisk / 1024 / 1024).toFixed(2)} MB)`);
    });
    console.log();
    
    // List collections in current database
    const collections = await db.listCollections().toArray();
    console.log('📂 Collections in teaching-platform (' + collections.length + '):');
    collections.forEach((collection, index) => {
      console.log(`   ${index + 1}. ${collection.name}`);
    });
    console.log();
    
    // Count documents in each collection
    console.log('📊 Document Counts:');
    for (const collection of collections) {
      const count = await db.collection(collection.name).countDocuments();
      console.log(`   ${collection.name}: ${count} documents`);
    }
    console.log();
    
    console.log('✅ Database status check completed successfully!');
    
  } catch (error) {
    console.error('❌ Error checking database status:', error.message);
    process.exit(1);
  } finally {
    await mongoose.connection.close();
    console.log('🔌 Database connection closed.');
  }
};

checkDatabaseStatus();