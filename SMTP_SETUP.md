# SMTP Email Configuration

The app needs SMTP credentials to send verification codes to users.

## Option 1: Gmail (Recommended for Testing)

1. **Create/Use a Gmail Account**
2. **Enable 2-Step Verification**:
   - Go to https://myaccount.google.com/security
   - Enable 2-Step Verification

3. **Generate App Password**:
   - Go to https://myaccount.google.com/apppasswords
   - Select "Mail" and "Other (Custom name)"
   - Name it "DAT Historical Archive"
   - Copy the 16-character password

4. **Update `.env.local`**:
   ```
   SMTP_HOST=smtp.gmail.com
   SMTP_PORT=587
   SMTP_USER=your-gmail@gmail.com
   SMTP_PASSWORD=your-16-char-app-password
   EMAIL_FROM="DAT Historical Archive <noreply@unilinktransportation.com>"
   ```

## Option 2: Microsoft 365 / Outlook

```
SMTP_HOST=smtp.office365.com
SMTP_PORT=587
SMTP_USER=your-email@unilinktransportation.com
SMTP_PASSWORD=your-password
EMAIL_FROM="DAT Historical Archive <noreply@unilinktransportation.com>"
```

## Option 3: SendGrid (Production Recommended)

1. Sign up at https://sendgrid.com
2. Create API Key
3. Configure:
```
SMTP_HOST=smtp.sendgrid.net
SMTP_PORT=587
SMTP_USER=apikey
SMTP_PASSWORD=your-sendgrid-api-key
EMAIL_FROM="DAT Historical Archive <noreply@unilinktransportation.com>"
```

## For Vercel Deployment

Add these as Environment Variables in Vercel Dashboard:
- `SMTP_HOST`
- `SMTP_PORT`
- `SMTP_USER`
- `SMTP_PASSWORD`
- `EMAIL_FROM`
- `ALLOWED_DOMAIN`
- `JWT_SECRET`
- `DATABASE_URL`
