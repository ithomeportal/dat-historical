import { NextRequest, NextResponse } from 'next/server';
import { verifyCode, createSession } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    const { email, code } = await request.json();

    if (!email || !code) {
      return NextResponse.json(
        { error: 'Email and code are required' },
        { status: 400 }
      );
    }

    // Verify the code
    const isValid = await verifyCode(email, code);

    if (!isValid) {
      return NextResponse.json(
        { error: 'Invalid or expired verification code' },
        { status: 401 }
      );
    }

    // Create session
    const user = {
      email,
      name: email.split('@')[0], // Use part before @ as name
    };

    await createSession(user);

    return NextResponse.json({ success: true, user });
  } catch (error: any) {
    console.error('Verify code error:', error);
    return NextResponse.json(
      { error: 'Verification failed' },
      { status: 500 }
    );
  }
}
