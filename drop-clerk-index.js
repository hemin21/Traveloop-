const mongoose = require('mongoose');

async function dropIndex() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/odootravel');
    console.log('Connected to MongoDB');
    
    const db = mongoose.connection.db;
    const usersCollection = db.collection('users');
    
    // Check if the index exists before dropping it
    const indexes = await usersCollection.indexes();
    console.log('Current indexes on users collection:', indexes);
    
    const clerkIdIndexExists = indexes.some(index => index.name === 'clerkId_1' || index.key.clerkId);
    
    if (clerkIdIndexExists) {
      console.log('Dropping clerkId_1 index...');
      await usersCollection.dropIndex('clerkId_1');
      console.log('Index dropped successfully.');
    } else {
      console.log('Index clerkId_1 does not exist.');
    }
    
  } catch (err) {
    console.error('Error:', err);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}

dropIndex();
