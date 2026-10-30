import { NextResponse } from 'next/server';

export async function GET() {
  const sandbox = (process.env.AT_USERNAME ?? 'sandbox') === 'sandbox';
  const configured = Boolean(process.env.AT_API_KEY);
  return NextResponse.json({ sandbox, configured });
}
