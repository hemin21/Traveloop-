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
