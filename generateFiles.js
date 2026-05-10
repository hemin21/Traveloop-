const fs = require('fs');
const path = require('path');

const write = (filePath, content) => {
  const fullPath = path.join(__dirname, filePath);
  fs.mkdirSync(path.dirname(fullPath), { recursive: true });
  fs.writeFileSync(fullPath, content.trim() + '\n');
};

// 1. Models
write('lib/models/User.ts', `
import mongoose, { Schema, Document } from 'mongoose';

export interface IUser extends Document {
  clerkId: string;
  firstName?: string;
  lastName?: string;
  email: string;
  photo?: string;
  phone?: string;
  city?: string;
  country?: string;
  additionalInfo?: string;
  savedDestinations: string[];
  isAdmin: boolean;
  createdAt: Date;
}

const UserSchema: Schema = new Schema({
  clerkId: { type: String, required: true, unique: true },
  firstName: { type: String },
  lastName: { type: String },
  email: { type: String, required: true },
  photo: { type: String },
  phone: { type: String },
  city: { type: String },
  country: { type: String },
  additionalInfo: { type: String },
  savedDestinations: { type: [String], default: [] },
  isAdmin: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now },
});

export default mongoose.models.User || mongoose.model<IUser>('User', UserSchema);
`);

write('lib/models/Trip.ts', `
import mongoose, { Schema, Document } from 'mongoose';

export interface ITrip extends Document {
  userId: string;
  title: string;
  description?: string;
  coverPhoto?: string;
  startDate: Date;
  endDate: Date;
  status: 'upcoming' | 'ongoing' | 'completed';
  isPublic: boolean;
  shareToken?: string;
  totalBudget?: number;
  totalSpent: number;
  collaborators: string[];
  stops: mongoose.Types.ObjectId[];
  createdAt: Date;
  updatedAt: Date;
}

const TripSchema: Schema = new Schema({
  userId: { type: String, required: true },
  title: { type: String, required: true },
  description: { type: String },
  coverPhoto: { type: String },
  startDate: { type: Date, required: true },
  endDate: { type: Date, required: true },
  status: { type: String, enum: ['upcoming', 'ongoing', 'completed'], default: 'upcoming' },
  isPublic: { type: Boolean, default: false },
  shareToken: { type: String },
  totalBudget: { type: Number },
  totalSpent: { type: Number, default: 0 },
  collaborators: { type: [String], default: [] },
  stops: [{ type: Schema.Types.ObjectId, ref: 'Stop' }],
}, { timestamps: true });

export default mongoose.models.Trip || mongoose.model<ITrip>('Trip', TripSchema);
`);

write('lib/models/Stop.ts', `
import mongoose, { Schema, Document } from 'mongoose';

export interface IStop extends Document {
  tripId: mongoose.Types.ObjectId;
  cityName: string;
  country: string;
  startDate: Date;
  endDate: Date;
  order: number;
  budget?: number;
  notes?: string;
  createdAt: Date;
}

const StopSchema: Schema = new Schema({
  tripId: { type: Schema.Types.ObjectId, ref: 'Trip', required: true },
  cityName: { type: String, required: true },
  country: { type: String, required: true },
  startDate: { type: Date, required: true },
  endDate: { type: Date, required: true },
  order: { type: Number, required: true },
  budget: { type: Number },
  notes: { type: String },
  createdAt: { type: Date, default: Date.now },
});

export default mongoose.models.Stop || mongoose.model<IStop>('Stop', StopSchema);
`);

write('lib/models/Activity.ts', `
import mongoose, { Schema, Document } from 'mongoose';

export interface IActivity extends Document {
  stopId: mongoose.Types.ObjectId;
  name: string;
  description?: string;
  type: 'sightseeing' | 'food' | 'adventure' | 'transport' | 'hotel' | 'other';
  cost?: number;
  duration?: number;
  startTime?: string;
  date: Date;
  image?: string;
  isCustom: boolean;
}

const ActivitySchema: Schema = new Schema({
  stopId: { type: Schema.Types.ObjectId, ref: 'Stop', required: true },
  name: { type: String, required: true },
  description: { type: String },
  type: { type: String, enum: ['sightseeing', 'food', 'adventure', 'transport', 'hotel', 'other'], required: true },
  cost: { type: Number },
  duration: { type: Number },
  startTime: { type: String },
  date: { type: Date, required: true },
  image: { type: String },
  isCustom: { type: Boolean, default: true },
});

export default mongoose.models.Activity || mongoose.model<IActivity>('Activity', ActivitySchema);
`);

write('lib/models/PackingItem.ts', `
import mongoose, { Schema, Document } from 'mongoose';

export interface IPackingItem extends Document {
  tripId: mongoose.Types.ObjectId;
  userId: string;
  name: string;
  category: 'documents' | 'clothing' | 'electronics' | 'toiletries' | 'other';
  isPacked: boolean;
  createdAt: Date;
}

const PackingItemSchema: Schema = new Schema({
  tripId: { type: Schema.Types.ObjectId, ref: 'Trip', required: true },
  userId: { type: String, required: true },
  name: { type: String, required: true },
  category: { type: String, enum: ['documents', 'clothing', 'electronics', 'toiletries', 'other'], default: 'other' },
  isPacked: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now },
});

export default mongoose.models.PackingItem || mongoose.model<IPackingItem>('PackingItem', PackingItemSchema);
`);

write('lib/models/Note.ts', `
import mongoose, { Schema, Document } from 'mongoose';

export interface INote extends Document {
  tripId: mongoose.Types.ObjectId;
  stopId?: mongoose.Types.ObjectId;
  userId: string;
  title: string;
  content: string;
  day?: number;
  createdAt: Date;
  updatedAt: Date;
}

const NoteSchema: Schema = new Schema({
  tripId: { type: Schema.Types.ObjectId, ref: 'Trip', required: true },
  stopId: { type: Schema.Types.ObjectId, ref: 'Stop' },
  userId: { type: String, required: true },
  title: { type: String, required: true },
  content: { type: String, required: true },
  day: { type: Number },
}, { timestamps: true });

export default mongoose.models.Note || mongoose.model<INote>('Note', NoteSchema);
`);

write('lib/models/CommunityPost.ts', `
import mongoose, { Schema, Document } from 'mongoose';

export interface ICommunityPost extends Document {
  userId: string;
  tripId: mongoose.Types.ObjectId;
  userName: string;
  userPhoto?: string;
  content: string;
  image?: string;
  tags: string[];
  likes: string[];
  createdAt: Date;
}

const CommunityPostSchema: Schema = new Schema({
  userId: { type: String, required: true },
  tripId: { type: Schema.Types.ObjectId, ref: 'Trip', required: true },
  userName: { type: String, required: true },
  userPhoto: { type: String },
  content: { type: String, required: true },
  image: { type: String },
  tags: { type: [String], default: [] },
  likes: { type: [String], default: [] },
  createdAt: { type: Date, default: Date.now },
});

export default mongoose.models.CommunityPost || mongoose.model<ICommunityPost>('CommunityPost', CommunityPostSchema);
`);

write('lib/models/Invoice.ts', `
import mongoose, { Schema, Document } from 'mongoose';

export interface IInvoiceItem {
  category: string;
  description: string;
  quantity: number;
  unitCost: number;
  amount: number;
}

export interface IInvoice extends Document {
  tripId: mongoose.Types.ObjectId;
  invoiceId: string;
  travelers: string[];
  items: IInvoiceItem[];
  subtotal: number;
  tax: number;
  discount: number;
  grandTotal: number;
  paymentStatus: 'pending' | 'paid';
  generatedDate: Date;
}

const InvoiceItemSchema: Schema = new Schema({
  category: { type: String, required: true },
  description: { type: String, required: true },
  quantity: { type: Number, required: true },
  unitCost: { type: Number, required: true },
  amount: { type: Number, required: true },
}, { _id: false });

const InvoiceSchema: Schema = new Schema({
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
});

export default mongoose.models.Invoice || mongoose.model<IInvoice>('Invoice', InvoiceSchema);
`);

// 2. API Routes
const routes = [
  'api/trips/route.ts',
  'api/trips/[tripId]/route.ts',
  'api/trips/[tripId]/stops/route.ts',
  'api/stops/[stopId]/route.ts',
  'api/stops/[stopId]/activities/route.ts',
  'api/activities/[activityId]/route.ts',
  'api/packing/[tripId]/route.ts',
  'api/notes/[tripId]/route.ts',
  'api/community/route.ts',
  'api/search/cities/route.ts',
  'api/search/activities/route.ts',
  'api/invoice/[tripId]/route.ts',
  'api/webhook/clerk/route.ts',
  'api/admin/analytics/route.ts',
  'api/admin/users/route.ts',
  'api/profile/route.ts',
];

routes.forEach(route => {
  write(`app/${route}`, `
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  return NextResponse.json({ message: 'GET method not implemented' });
}

export async function POST(request: Request) {
  return NextResponse.json({ message: 'POST method not implemented' });
}

export async function PUT(request: Request) {
  return NextResponse.json({ message: 'PUT method not implemented' });
}

export async function DELETE(request: Request) {
  return NextResponse.json({ message: 'DELETE method not implemented' });
}
  `);
});

// Overwrite Clerk Webhook with real implementation stub
write('app/api/webhook/clerk/route.ts', `
import { Webhook } from 'svix';
import { headers } from 'next/headers';
import { WebhookEvent } from '@clerk/nextjs/server';
import connectToDatabase from '@/lib/mongodb';
import User from '@/lib/models/User';
import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  const WEBHOOK_SECRET = process.env.CLERK_WEBHOOK_SECRET;

  if (!WEBHOOK_SECRET) {
    throw new Error('Please add CLERK_WEBHOOK_SECRET from Clerk Dashboard to .env or .env.local');
  }

  const headerPayload = headers();
  const svix_id = headerPayload.get("svix-id");
  const svix_timestamp = headerPayload.get("svix-timestamp");
  const svix_signature = headerPayload.get("svix-signature");

  if (!svix_id || !svix_timestamp || !svix_signature) {
    return new Response('Error occured -- no svix headers', {
      status: 400
    });
  }

  const payload = await req.json();
  const body = JSON.stringify(payload);
  const wh = new Webhook(WEBHOOK_SECRET);
  let evt: WebhookEvent;

  try {
    evt = wh.verify(body, {
      "svix-id": svix_id,
      "svix-timestamp": svix_timestamp,
      "svix-signature": svix_signature,
    }) as WebhookEvent;
  } catch (err) {
    console.error('Error verifying webhook:', err);
    return new Response('Error occured', {
      status: 400
    });
  }

  const eventType = evt.type;

  await connectToDatabase();

  if (eventType === 'user.created') {
    const { id, email_addresses, image_url, first_name, last_name } = evt.data;
    const user = new User({
      clerkId: id,
      email: email_addresses[0].email_address,
      photo: image_url,
      firstName: first_name,
      lastName: last_name,
    });
    await user.save();
  }

  if (eventType === 'user.updated') {
    const { id, email_addresses, image_url, first_name, last_name } = evt.data;
    await User.findOneAndUpdate(
      { clerkId: id },
      {
        email: email_addresses[0].email_address,
        photo: image_url,
        firstName: first_name,
        lastName: last_name,
      }
    );
  }

  if (eventType === 'user.deleted') {
    const { id } = evt.data;
    await User.findOneAndDelete({ clerkId: id });
  }

  return NextResponse.json({ message: 'OK' });
}
`);

// 3. Pages
const pages = [
  '(auth)/sign-in/[[...sign-in]]/page.tsx',
  '(auth)/sign-up/[[...sign-up]]/page.tsx',
  '(dashboard)/layout.tsx',
  '(dashboard)/page.tsx',
  '(dashboard)/trips/page.tsx',
  '(dashboard)/trips/new/page.tsx',
  '(dashboard)/trips/[tripId]/page.tsx',
  '(dashboard)/trips/[tripId]/build/page.tsx',
  '(dashboard)/trips/[tripId]/notes/page.tsx',
  '(dashboard)/trips/[tripId]/checklist/page.tsx',
  '(dashboard)/trips/[tripId]/invoice/page.tsx',
  'search/cities/page.tsx',
  'search/activities/page.tsx',
  'community/page.tsx',
  'profile/page.tsx',
  'admin/page.tsx',
];

pages.forEach(page => {
  if (page.endsWith('layout.tsx')) {
    write(`app/${page}`, `
export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-teal-50">
      {/* Dashboard Nav/Header will go here */}
      <main>{children}</main>
    </div>
  );
}
    `);
  } else if (page.includes('sign-in')) {
    write(`app/${page}`, `
import { SignIn } from "@clerk/nextjs";

export default function Page() {
  return <div className="flex justify-center py-24"><SignIn /></div>;
}
    `);
  } else if (page.includes('sign-up')) {
    write(`app/${page}`, `
import { SignUp } from "@clerk/nextjs";

export default function Page() {
  return <div className="flex justify-center py-24"><SignUp /></div>;
}
    `);
  } else {
    write(`app/${page}`, `
export default function Page() {
  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold text-teal-800">Page Content</h1>
    </div>
  );
}
    `);
  }
});

console.log('Project structure generated successfully!');
