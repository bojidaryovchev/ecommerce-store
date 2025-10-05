# Abandoned Cart Recovery - Cron Job Setup

## Overview

The abandoned cart recovery system uses AWS Lambda and EventBridge (CloudWatch Events) to automatically detect and send reminder emails to customers who have abandoned their shopping carts.

## Architecture

```
EventBridge (every hour)
    ↓
Lambda Function (abandoned-cart-cron.ts)
    ↓
Next.js API Route (/api/cron/abandoned-carts)
    ↓
1. Detect abandoned carts (abandoned-cart-detector.ts)
2. Generate recovery tokens
3. Send emails via AWS SES
4. Update database records
```

## Setup Instructions

### 1. Generate CRON_SECRET

Generate a secure random token for authenticating cron requests:

```bash
node scripts/generate-cron-secret.mjs
```

Add the generated token to your `.env` file:

```env
CRON_SECRET="your-generated-token-here"
```

### 2. Configure AWS SES

The system uses AWS SES (Simple Email Service) for sending emails. The SST configuration automatically sets up the necessary email identities.

#### Verify Email Domain (Production)

1. The domain identity is created automatically by SST
2. Add the DNS records shown in the SST output to your domain
3. Wait for verification (usually takes 5-15 minutes)

#### Verify Email Addresses (Development)

For testing in development:

```bash
# Using AWS CLI
aws ses verify-email-identity --email-address test@example.com --region us-east-1
```

Or use the AWS Console:

1. Go to Amazon SES → Verified Identities
2. Create Identity → Email Address
3. Enter your test email
4. Check your email for verification link

### 3. Deploy with SST

The cron job is automatically deployed when you deploy your SST application:

```bash
# Deploy to development
sst deploy

# Deploy to production
sst deploy --stage prod
```

This creates:

- Lambda function: `AbandonedCartCron`
- EventBridge rule: `AbandonedCartSchedule` (runs every hour)
- Necessary IAM permissions for SES

### 4. Add Environment Variables

Ensure these environment variables are set in your deployment:

```env
# Required
DATABASE_URL="postgresql://..."
CRON_SECRET="your-secret-token"
NEXT_PUBLIC_APP_URL="https://your-domain.com"
```

## Configuration

### Email Reminder Schedule

Default configuration (in `abandoned-cart-detector.ts`):

```typescript
const DEFAULT_ABANDONMENT_CONFIG = {
  thresholdHours: 1, // Consider cart abandoned after 1 hour
  minimumCartValue: 10, // Only send for carts ≥ $10
  maxReminders: 3, // Send up to 3 reminder emails
  reminderIntervals: [1, 24, 72], // Send at 1hr, 24hr, 72hr
};
```

### Email Templates

Three email templates are sent in sequence:

1. **First Reminder (1 hour)**: Gentle reminder
2. **Second Reminder (24 hours)**: Urgency + social proof
3. **Final Reminder (72 hours)**: Last chance + 10% discount code

Templates are in `src/lib/email-templates/abandoned-cart-email.tsx`

### Discount Codes

The final reminder includes a discount code (default: `COMEBACK10` for 10% off). Configure in `/api/cron/abandoned-carts/route.ts`:

```typescript
discountCode: reminderNumber === 3 ? "COMEBACK10" : undefined,
discountAmount: reminderNumber === 3 ? 10 : undefined,
```

**Note**: You need to create the discount code in Stripe separately.

## Testing

### Test Locally

1. Generate a CRON_SECRET:

   ```bash
   node scripts/generate-cron-secret.mjs
   ```

2. Add it to `.env`:

   ```env
   CRON_SECRET="your-secret"
   ```

3. Start your development server:

   ```bash
   npm run dev
   ```

4. Trigger the cron manually:
   ```bash
   curl -X POST http://localhost:3000/api/cron/abandoned-carts \
     -H "Authorization: Bearer your-secret" \
     -H "Content-Type: application/json"
   ```

### Test in Production

You can manually trigger the Lambda function:

```bash
aws lambda invoke \
  --function-name your-stack-AbandonedCartCron \
  --region us-east-1 \
  response.json

cat response.json
```

Or use the AWS Lambda console → Test tab.

## Monitoring

### CloudWatch Logs

View logs for the cron job:

```bash
# Lambda function logs
aws logs tail /aws/lambda/your-stack-AbandonedCartCron --follow

# Next.js API route logs (in CloudWatch)
# Look for "[Abandoned Cart Cron]" prefix
```

### Metrics to Monitor

1. **Email Delivery Rate**: Check SES console for bounce/complaint rates
2. **Recovery Rate**: Use `/api/cron/abandoned-carts` response or admin dashboard
3. **Error Rate**: Monitor CloudWatch for failed invocations

### SES Metrics (Optional)

To track email opens, clicks, bounces, and complaints:

1. Create a Configuration Set in AWS SES console
2. Add `ConfigurationSetName` parameter to `SendEmailCommand` in the code
3. Configure event destinations (CloudWatch, SNS, etc.)

## Troubleshooting

### Emails Not Sending

1. **Check SES verification**:

   ```bash
   aws ses list-identities --region us-east-1
   ```

2. **Check SES sending limits**:
   - Development: 200 emails/day (sandbox mode)
   - Production: Request limit increase in SES console

3. **Check IAM permissions**: Lambda needs `ses:SendEmail` permission

### Cron Not Running

1. **Check EventBridge rule**:

   ```bash
   aws events list-rules --name-prefix AbandonedCart
   ```

2. **Check Lambda logs**:

   ```bash
   aws logs tail /aws/lambda/your-stack-AbandonedCartCron --since 1h
   ```

3. **Verify CRON_SECRET** is set in Lambda environment

### Database Connection Issues

Ensure Lambda has:

- VPC access (if database is in VPC)
- Security group allows database access
- DATABASE_URL environment variable is set

## Cost Estimation

### AWS SES

- $0.10 per 1,000 emails sent
- Example: 1,000 abandoned carts/month × 3 emails = **$0.30/month**

### Lambda

- First 1M requests/month: FREE
- $0.20 per 1M requests after
- Example: 720 invocations/month (hourly) = **FREE**

### EventBridge

- First 1M events/month: FREE
- Example: 720 events/month = **FREE**

**Total estimated cost**: ~$0.30/month for 1,000 abandoned carts

## Security

### Authentication

- Cron endpoint requires `CRON_SECRET` in Authorization header
- Or validates `x-amz-source: aws:events` header from EventBridge
- Both checks prevent unauthorized access

### Email Safety

- Recovery tokens expire after 7 days
- Tokens are cryptographically secure (cuid)
- One-time use (marked as recovered after use)

### Rate Limiting

Consider adding rate limiting to the cron endpoint:

- Prevent brute force token guessing
- Limit email sending rate
- Use Redis or database for distributed rate limiting

## Advanced Configuration

### Custom Email Templates

Edit `src/lib/email-templates/abandoned-cart-email.tsx` to customize:

- Email design (HTML/CSS)
- Message content
- Discount offers
- Branding

### Change Schedule

Edit `sst.config.ts` to change the cron schedule:

```typescript
schedule: "rate(1 hour)",        // Every hour
schedule: "rate(30 minutes)",    // Every 30 minutes
schedule: "cron(0 9 * * ? *)",  // Daily at 9 AM UTC
```

[See AWS Schedule Expression syntax](https://docs.aws.amazon.com/eventbridge/latest/userguide/eb-create-rule-schedule.html)

### Disable Cron

Comment out the cron resources in `sst.config.ts`:

```typescript
// const abandonedCartCron = new sst.aws.Function("AbandonedCartCron", { ... });
// new sst.aws.Cron("AbandonedCartSchedule", { ... });
```

Then redeploy:

```bash
sst deploy
```

## Support

For issues or questions:

1. Check CloudWatch logs first
2. Review this README
3. Check `docs/ABANDONED_CART_RECOVERY.md` for full feature docs
4. Contact support@yourstore.com
