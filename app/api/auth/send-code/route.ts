import { NextRequest, NextResponse } from 'next/server';
import { isValidEmail, generateVerificationCode, storeVerificationCode } from '@/lib/auth';
import { sendVerificationEmail } from '@/lib/email';

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json();

    if (!email) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      );
    }

    // Validate email domain
    if (!isValidEmail(email)) {
      return NextResponse.json(
        { error: 'Email must be from @unilinktransportation.com domain' },
        { status: 403 }
      );
    }

    // Generate and store code
    const code = generateVerificationCode();
    storeVerificationCode(email, code);

    // Send email
    const result = await sendVerificationEmail(email, code);

    if (!result.success) {
      return NextResponse.json(
        { error: 'Failed to send verification code. Please contact IT support.' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Verification code sent to your email',
    });
  } catch (error: any) {
    console.error('Send code error:', error);
    return NextResponse.json(
      { error: 'Failed to send verification code' },
      { status: 500 }
    );
  }
}
