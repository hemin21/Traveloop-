import connectToDatabase from './lib/mongodb';
import mongoose from 'mongoose';

async function dropIndex() {
  try {
    await connectToDatabase();
    const collection = mongoose.connection.collection('users');
    await collection.dropIndex('clerkId_1');
    console.log('Successfully dropped clerkId_1 index from users collection.');
  } catch (error: any) {
    console.log('Error or index not found:', error.message);
  } finally {
    mongoose.disconnect();
  }
}

dropIndex();
