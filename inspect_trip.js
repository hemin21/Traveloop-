const mongoose = require('mongoose');

const uri = "mongodb+srv://yt:akshar@cluster0.jcbhos1.mongodb.net/odootravel";

async function run() {
  try {
    await mongoose.connect(uri);
    console.log('Connected');
    const collection = mongoose.connection.collection('trips');
    const trip = await collection.find({}).sort({ createdAt: -1 }).limit(1).toArray();
    console.log(JSON.stringify(trip, null, 2));
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

run();
