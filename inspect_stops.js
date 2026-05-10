const mongoose = require('mongoose');
const uri = "mongodb+srv://yt:akshar@cluster0.jcbhos1.mongodb.net/odootravel";
async function run() {
  try {
    await mongoose.connect(uri);
    console.log('Connected');
    const tripCol = mongoose.connection.collection('trips');
    const trip = await tripCol.findOne({}, { sort: { updatedAt: -1 } });
    console.log('Trip:', trip._id, trip.title);
    const stopCol = mongoose.connection.collection('stops');
    const stops = await stopCol.find({ tripId: trip._id }).toArray();
    console.log('Stops:', JSON.stringify(stops, null, 2));
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}
run();
