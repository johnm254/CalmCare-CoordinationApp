import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '../../../lib/supabase-admin';

export async function POST(req: NextRequest) {
  try {
    const { userId, licenceNumber, cadre, registeringBody } = await req.json();

    if (!userId || !licenceNumber || !cadre || !registeringBody) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const { error } = await supabaseAdmin.from('clinician_verifications').insert({
      clinician_id: userId,
      licence_number: licenceNumber,
      cadre,
      registering_body: registeringBody,
      status: 'pending',
      method: 'manual',
    });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: 'An unexpected error occurred' }, { status: 500 });
  }
}
