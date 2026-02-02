# Environment Variable Validation

This document explains the environment variable validation system added to ensure the app fails fast with clear errors if misconfigured.

## Components

### 1. Environment Schema (`/src/lib/env.ts`)

A Zod schema that validates all required environment variables at runtime:

```typescript
import { env } from '@/lib/env'

// Access validated environment variables
const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL
const webhookSecret = env.WEBHOOK_SECRET
```

**Features:**
- Lazy validation (only validates when accessed)
- Type-safe environment variable access
- Clear error messages for invalid/missing variables
- Supports optional variables with defaults

**Validated Variables:**
- `NEXT_PUBLIC_SUPABASE_URL` - Required, must be valid URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Required
- `SUPABASE_SERVICE_ROLE_KEY` - Optional
- `NEXT_PUBLIC_APP_URL` - Optional, defaults to `http://localhost:3000`
- `WEBHOOK_SECRET` - Required
- `CRON_SECRET` - Required
- `NEXT_PUBLIC_ENABLE_ANALYTICS` - Optional, boolean flag
- `NODE_ENV` - Defaults to `development`

### 2. Client-Side Environment Check (`/src/components/env-check.tsx`)

A React component that validates client-side environment variables and displays a warning if any are missing:

```tsx
import { EnvCheck } from '@/components/env-check'

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        <EnvCheck required={[
          'NEXT_PUBLIC_SUPABASE_URL',
          'NEXT_PUBLIC_SUPABASE_ANON_KEY'
        ]} />
        {children}
      </body>
    </html>
  )
}
```

**Note:** This component only checks `NEXT_PUBLIC_*` variables since server-side variables are not available on the client.

### 3. Health Check Endpoint (`/src/app/api/health/route.ts`)

An API endpoint that reports the health of the application including environment configuration:

```bash
curl http://localhost:3000/api/health
```

**Response:**
```json
{
  "status": "healthy",
  "timestamp": "2026-02-02T14:52:54.164Z",
  "version": "0.1.0",
  "environment": "development",
  "checks": {
    "supabase_url": true,
    "supabase_key": true,
    "webhook_secret": true,
    "cron_secret": true
  }
}
```

Returns `503 Service Unavailable` if any required environment variables are missing.

## Setup

### 1. Copy Environment Template

```bash
cp .env.example .env.local
```

### 2. Fill in Required Values

Edit `.env.local` and replace placeholder values:

```bash
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
WEBHOOK_SECRET=your-webhook-secret
CRON_SECRET=your-cron-secret
```

### 3. Verify Configuration

Start the dev server:
```bash
npm run dev
```

Check the health endpoint:
```bash
curl http://localhost:3000/api/health
```

All checks should return `true`.

## Error Handling

### Server-Side Errors

If environment validation fails on the server:

```
❌ Invalid environment variables:
{
  WEBHOOK_SECRET: [ 'Invalid input: expected string, received undefined' ]
}
Error: Invalid environment variables
```

### Client-Side Errors

If environment validation fails on the client, the `EnvCheck` component displays:

```
⚠️ Configuration Error
Missing required environment variables:
• NEXT_PUBLIC_SUPABASE_URL
```

## Production Deployment

### Vercel

Set environment variables in Vercel dashboard:
1. Project Settings → Environment Variables
2. Add each required variable
3. Redeploy

### Docker

Pass environment variables in docker-compose.yml or via `-e` flags:

```yaml
services:
  app:
    environment:
      - NEXT_PUBLIC_SUPABASE_URL=${SUPABASE_URL}
      - NEXT_PUBLIC_SUPABASE_ANON_KEY=${SUPABASE_ANON_KEY}
      - WEBHOOK_SECRET=${WEBHOOK_SECRET}
      - CRON_SECRET=${CRON_SECRET}
```

## Testing

### Manual Testing

1. Remove an environment variable from `.env.local`
2. Try to start the server: `npm run dev`
3. Access any page that uses env variables
4. You should see a clear error message

### Health Check Monitoring

Use the health endpoint for:
- Container orchestration health checks
- Monitoring/alerting systems
- Pre-deployment validation

```bash
# Check health before deployment
if ! curl -f http://localhost:3000/api/health; then
  echo "❌ Health check failed"
  exit 1
fi
```

## Best Practices

1. **Never commit `.env.local`** - It's in `.gitignore`
2. **Always use `.env.example`** - Keep it up to date
3. **Validate early** - Import `env` at the top of files that need it
4. **Document new variables** - Update `.env.example` and this guide
5. **Test locally first** - Verify env setup works before deploying

## Troubleshooting

### "Invalid environment variables" on build

Check that all required variables are set in your environment. Run:

```bash
grep -E "SUPABASE|WEBHOOK|CRON" .env.local
```

### Health check returns 503

One or more required environment variables are missing. Check the `checks` object in the response to see which ones.

### TypeScript errors with env

Make sure you're importing from the correct location:

```typescript
// ✅ Correct
import { env } from '@/lib/env'

// ❌ Wrong
const url = process.env.NEXT_PUBLIC_SUPABASE_URL
```

The validated `env` object provides type safety and runtime validation.
