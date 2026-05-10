const mongoose = require('mongoose');
const { Schema } = mongoose;
require('dotenv').config({path: '.env.local'});
const Trip = mongoose.model('Trip', new Schema({}, {strict: false, collection: 'trips'}));
const Stop = mongoose.model('Stop', new Schema({}, {strict: false, collection: 'stops'}));
const Activity = mongoose.model('Activity', new Schema({}, {strict: false, collection: 'activities'}));

const InvoiceItemSchema = new Schema({
  category: { type: String, required: true },
  description: { type: String, required: true },
  qty: { type: Number, required: true },
  unitCost: { type: Number, required: true },
  amount: { type: Number, required: true },
}, { _id: false });

const InvoiceSchema = new Schema({
  tripId: { type: Schema.Types.ObjectId, ref: 'Trip', required: true },
  invoiceId: { type: String, required: true },
  travelers: { type: [String], default: [] },
  items: { type: [InvoiceItemSchema], default: [] },
  subtotal: { type: Number, required: true },
  tax: { type: Number, default: 0 },
  discount: { type: Number, default: 0 },
  grandTotal: { type: Number, required: true },
  paymentStatus: { type: String, enum: ['pending', 'paid'], default: 'pending' },
  generatedDate: { type: Date, default: Date.now },
}, {collection: 'invoices'});

const Invoice = mongoose.models.Invoice || mongoose.model('Invoice', InvoiceSchema);

mongoose.connect(process.env.MONGODB_URI).then(async () => {
  try {
    const trip = await Trip.findOne();
    const tripId = trip._id;
    const stops = await Stop.find({ tripId });
    const stopIds = stops.map(s => s._id);
    const activities = await Activity.find({ stopId: { $in: stopIds } });
    
    const activityItems = activities.map(act => {
      const cost = act.cost || 0;
      let qty = 1;
      if (act.duration) {
        const numeric = parseFloat(act.duration.toString().replace(/[^0-9.]/g, ''));
        if (!isNaN(numeric) && numeric > 0) qty = Math.ceil(numeric);
      }
      return {
        category: act.type || 'other',
        description: act.name,
        qty: qty,
        unitCost: cost,
        amount: cost * qty
      };
    });

    const stopItems = stops.filter(s => s.budget && s.budget > 0).map(s => {
      return {
        category: 'city_budget',
        description: `Allocated budget for ${s.city}`,
        qty: 1,
        unitCost: s.budget,
        amount: s.budget
      };
    });

    const items = [...stopItems, ...activityItems];
    const subtotal = items.reduce((acc, item) => acc + item.amount, 0);
    const tax = subtotal * 0.05;
    const discount = 0;
    const grandTotal = subtotal + tax - discount;

    const generatedId = 'INV-' + tripId.toString().slice(-5).toUpperCase() + '-' + Date.now().toString().slice(-5);

    console.log('Validating Invoice...', {items});
    
    const doc = new Invoice({
      tripId,
      invoiceId: generatedId,
      travelers: ['Traveler'],
      items,
      subtotal, tax, discount, grandTotal
    });
    
    await doc.validate();
    console.log('Validation passed!');
  } catch(e) {
    console.error('Validation failed:', e.message);
  } finally {
    process.exit(0);
  }
});
