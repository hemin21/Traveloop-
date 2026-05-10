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
