# Twilio Integration for Emergency Vet Notifications

This document explains how to configure Twilio for sending automated SMS and voice notifications to emergency vet clinics when finders are en route with injured animals.

## Overview

The PetNexus Mayday app uses Twilio to:
- Send SMS alerts to vet clinics when a finder is transporting an injured animal
- Make automated voice calls for critical emergencies
- Provide real-time notification status to users

## Setup Instructions

### 1. Create a Twilio Account

1. Sign up at [twilio.com](https://www.twilio.com)
2. Verify your phone number
3. Purchase a phone number (or use the trial number)

### 2. Configure Environment Variables

Add the following to your `.env.local` file:

```bash
# Twilio Configuration
TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_AUTH_TOKEN=your_auth_token_here
TWILIO_PHONE_NUMBER=+1xxxxxxxxxx
```

Get these values from your [Twilio Console](https://console.twilio.com):

- **Account SID**: Found on the main dashboard
- **Auth Token**: Click "Show" next to Account SID
- **Phone Number**: Your purchased Twilio number

### 3. Configure Voice Messages (Optional)

For automated voice calls, create a TwiML Bin:

1. Go to [Twilio Console → TwiML → Bins](https://console.twilio.com/twiml/bins)
2. Create a new TwiML Bin with this content:

```xml
<?xml version="1.0" encoding="UTF-8"?>
<Response>
    <Gather input="speech" timeout="3" numDigits="1">
        <Say voice="alice">
            Hello, this is an automated emergency alert from PetNexus. 
            A finder is currently en route to your clinic with an injured animal that requires immediate care. 
            Please prepare your emergency team. Press 1 to confirm you received this alert.
        </Say>
    </Gather>
    <Say>I didn&apos;t catch that. Goodbye.</Say>
</Response>
```

3. Copy the TwiML Bin URL and update it in `src/lib/services/twilio-service.ts`

## How It Works

### SMS Notifications

When a finder clicks "I'm En Route - Notify Vet":

1. The app sends a request to `/api/notifications/emergency-vet`
2. The API fetches the vet clinic's contact info
3. Twilio sends an SMS with:
   - Emergency alert header
   - Clinic name
   - Emergency details
   - Finder's location (if available)
   - Callback number
   - Request to confirm readiness

### Voice Calls

For critical emergencies (containing "CRITICAL" in the summary):

1. An automated voice call is placed to the clinic
2. The clinic hears a pre-recorded message
3. They can press 1 to acknowledge receipt

### Offline Support

- If the user is offline, notifications are queued
- They sync automatically when connection is restored
- Status is shown in the UI (queued, sent, failed)

## Testing

Without Twilio credentials, the system runs in "mock mode":
- SMS messages are logged to console
- Voice calls are logged to console
- Perfect for development and testing

Run tests with:
```bash
npm test __tests__/twilio-service.test.ts
```

## Cost Considerations

- **SMS**: ~$0.0079 per message in the US
- **Voice Calls**: ~$0.013 per minute + $0.001 per minute for carrier fees
- **Phone Number**: ~$1/month per number

For pilot scale (100 notifications/month):
- Estimated cost: <$5/month
- Well within typical pilot budgets

## Troubleshooting

### Common Issues

1. **"Twilio credentials not configured"**
   - Add environment variables to `.env.local`
   - Restart the development server

2. **SMS not sending**
   - Check phone number format (include +1 for US numbers)
   - Verify Twilio account has sufficient credits
   - Check recipient number can receive SMS

3. **Voice calls not working**
   - Verify TwiML Bin URL is accessible
   - Check phone number supports voice calls
   - Review Twilio error logs

### Monitoring

Check Twilio usage and logs at:
- [Twilio Console → Monitor → Logs](https://console.twilio.com/monitor/logs)
- [Twilio Console → Usage](https://console.twilio.com/usage)

## Security Notes

- Auth tokens are sensitive - never commit to version control
- Use environment variables in production
- Consider IP restrictions for additional security
- Monitor for unusual usage patterns

## Production Deployment

1. Set environment variables in your hosting platform (Vercel, etc.)
2. Upgrade from trial account to paid account
3. Configure error monitoring and alerting
4. Set up usage alerts to control costs
5. Test with real phone numbers before going live

## Support

- Twilio Documentation: [twilio.com/docs](https://www.twilio.com/docs)
- PetNexus Documentation: See project README
- For issues: Check GitHub Issues or contact development team
