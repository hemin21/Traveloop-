const mongoose = require('mongoose');
const uri = "mongodb+srv://yt:akshar@cluster0.jcbhos1.mongodb.net/odootravel";
async function run() {
  try {
    await mongoose.connect(uri);
    console.log('Connected');
    
    const tripCol = mongoose.connection.collection('trips');
    const trip = await tripCol.findOne({}, { sort: { updatedAt: -1 } });
    
    const userCol = mongoose.connection.collection('users');
    const users = await userCol.find({}).toArray();
    
    console.log('Trip Title:', trip.title);
    console.log('Trip userId (stored):', trip.userId);
    console.log('Available users:', users.map(u => ({ _id: u._id, email: u.email })));
    
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}
run();
