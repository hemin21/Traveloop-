const mongoose = require('mongoose');
const uri = "mongodb+srv://yt:akshar@cluster0.jcbhos1.mongodb.net/odootravel";
async function run() {
  try {
    await mongoose.connect(uri);
    console.log('Connected');
    const tripCol = mongoose.connection.collection('trips');
    const trip = await tripCol.findOne({}, { sort: { updatedAt: -1 } });
    
    console.log('Raw Trip from DB totalBudget:', trip.totalBudget);

    const res = {
      ...trip,
      id: trip._id.toString(),
      budget: trip.totalBudget,
    };
    console.log('Mapped Output:', JSON.stringify(res, null, 2));
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}
run();
