import { NextResponse } from 'next/server'

export async function POST() {
  // Password changes must happen through Supabase's verified recovery session
  // in /reset-password. This endpoint used to allow password takeover by
  // anyone who knew a magical name.
  return NextResponse.json(
    { error: 'Password resets require a verified recovery link.' },
    { status: 410 }
  )
}
