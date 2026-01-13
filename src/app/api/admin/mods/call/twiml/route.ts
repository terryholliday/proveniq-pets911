import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const name = searchParams.get('name') || 'Volunteer';
  const reason = searchParams.get('reason') || 'dispatch assistance';

  const twiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say voice="alice">Hello ${name}. This is Pet 9 1 1 dispatch. We need your assistance with a ${reason} request. Please hold while we connect you with a moderator.</Say>
  <Dial>
    <Conference>pet911-dispatch</Conference>
  </Dial>
</Response>`;

  return new NextResponse(twiml, {
    headers: {
      'Content-Type': 'application/xml',
    },
  });
}

export async function POST(request: NextRequest) {
  return GET(request);
}
