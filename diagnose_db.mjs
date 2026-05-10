import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: '.env.local' });

const MONGODB_URI = process.env.MONGODB_URI;

async function testConnection() {
  if (!MONGODB_URI) {
    console.error('❌ MONGODB_URI is missing in .env.local');
    process.exit(1);
  }

  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('✅ MongoDB connection successful!');
    
    const count = await mongoose.connection.db.collection('users').countDocuments();
    console.log(`📊 Number of user records: ${count}`);
    
    if (count > 0) {
      const users = await mongoose.connection.db.collection('users').find({}).limit(3).toArray();
      console.log('📝 Sample Users:', JSON.stringify(users, null, 2));
    }
    
    const cities = await mongoose.connection.db.collection('cities').countDocuments();
    console.log(`🏙️ Total cities in DB: ${cities}`);

  } catch (err) {
    console.error('❌ MongoDB Connection FAILED:', err);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected.');
  }
}

testConnection();
