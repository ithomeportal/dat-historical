import nodemailer from 'nodemailer';

// Create reusable transporter
const transporter = nodemailer.createTransporter({
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.SMTP_PORT || '587'),
  secure: false, // true for 465, false for other ports
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASSWORD,
  },
});

export async function sendVerificationEmail(email: string, code: string) {
  const mailOptions = {
    from: process.env.EMAIL_FROM || 'DAT Historical Archive <noreply@unilinktransportation.com>',
    to: email,
    subject: 'Your Verification Code - DAT Historical Archive',
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
      </head>
      <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
          <h1 style="color: white; margin: 0; font-size: 28px;">DAT Historical Archive</h1>
        </div>

        <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px;">
          <h2 style="color: #333; margin-top: 0;">Your Verification Code</h2>

          <p style="font-size: 16px; color: #666;">
            Hello,
          </p>

          <p style="font-size: 16px; color: #666;">
            You requested access to the DAT Historical Archive system. Please use the verification code below to complete your login:
          </p>

          <div style="background: white; border: 2px solid #667eea; border-radius: 8px; padding: 20px; text-align: center; margin: 30px 0;">
            <p style="margin: 0; font-size: 14px; color: #666; text-transform: uppercase; letter-spacing: 1px;">Verification Code</p>
            <p style="margin: 15px 0 0 0; font-size: 36px; font-weight: bold; color: #667eea; letter-spacing: 8px; font-family: 'Courier New', monospace;">
              ${code}
            </p>
          </div>

          <p style="font-size: 14px; color: #999; border-left: 3px solid #667eea; padding-left: 15px; margin: 20px 0;">
            <strong>Security Notice:</strong> This code will expire in 10 minutes. If you didn't request this code, please ignore this email.
          </p>

          <hr style="border: none; border-top: 1px solid #ddd; margin: 30px 0;">

          <p style="font-size: 12px; color: #999; text-align: center;">
            Unilink Transportation - DAT Historical Archive<br>
            This is an automated email, please do not reply.
          </p>
        </div>
      </body>
      </html>
    `,
    text: `
DAT Historical Archive - Verification Code

Your verification code is: ${code}

This code will expire in 10 minutes.

If you didn't request this code, please ignore this email.

Unilink Transportation
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
    return { success: true };
  } catch (error: any) {
    console.error('Email send error:', error);
    return { success: false, error: error.message };
  }
}
