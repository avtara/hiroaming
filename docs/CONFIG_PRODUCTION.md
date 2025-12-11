# HIROAM Production Configuration Guide

## Environment Secrets untuk Supabase Edge Functions

### 1. eSIM Access API (Provider)

| Secret | Deskripsi | Sumber |
|--------|-----------|--------|
| `ESIM_ACCESS_CODE` | Access code untuk autentikasi API | eSIM Access Dashboard |
| `ESIM_SECRET_KEY` | Secret key untuk HMAC signature | eSIM Access Dashboard |

```bash
supabase secrets set ESIM_ACCESS_CODE=your_access_code
supabase secrets set ESIM_SECRET_KEY=your_secret_key
```

### 2. Paddle Payment Gateway

| Secret | Deskripsi | Sumber |
|--------|-----------|--------|
| `PADDLE_API_KEY` | API key untuk create transactions | Paddle Dashboard → Developer Tools → API Keys |
| `PADDLE_WEBHOOK_SECRET` | Secret untuk verify webhook signature | Paddle Dashboard → Notifications → Webhook destinations |
| `PADDLE_SANDBOX` | Mode sandbox (`true`/`false`) | Set sesuai environment |

```bash
# Sandbox
supabase secrets set PADDLE_API_KEY=test_xxxxxxxxxxxxxxxx
supabase secrets set PADDLE_WEBHOOK_SECRET=pdl_ntfset_xxxxxxxx
supabase secrets set PADDLE_SANDBOX=true

# Production
supabase secrets set PADDLE_API_KEY=live_xxxxxxxxxxxxxxxx
supabase secrets set PADDLE_WEBHOOK_SECRET=pdl_ntfset_xxxxxxxx
supabase secrets set PADDLE_SANDBOX=false
```

### 3. Internal Security

| Secret | Deskripsi | Sumber |
|--------|-----------|--------|
| `CRON_SECRET` | Auth token untuk cron jobs | Generate random string |

```bash
# Generate random secret
openssl rand -hex 32

supabase secrets set CRON_SECRET=your_random_secret
```

### 4. Development/Testing (Opsional)

| Secret | Deskripsi | Default |
|--------|-----------|---------|
| `SKIP_IP_CHECK` | Skip IP whitelist untuk webhook eSIM | `false` |

```bash
# Hanya untuk development
supabase secrets set SKIP_IP_CHECK=true
```

---

## Secrets Otomatis dari Supabase

Tersedia otomatis di Edge Functions (tidak perlu set manual):

| Secret | Deskripsi |
|--------|-----------|
| `SUPABASE_URL` | Project URL |
| `SUPABASE_ANON_KEY` | Anon/public key |
| `SUPABASE_SERVICE_ROLE_KEY` | Service role key (full access) |

---

## Webhook URLs Configuration

### Paddle Webhook

**URL:** `https://ykfmdktecqaadbnrxekj.supabase.co/functions/v1/webhook-paddle`

**Events to subscribe:**
- `transaction.completed`
- `transaction.payment_failed`
- `transaction.updated`

**Setup di Paddle Dashboard:**
1. Go to Developer Tools → Notifications
2. Create new destination
3. Paste webhook URL
4. Select events above
5. Copy webhook secret to `PADDLE_WEBHOOK_SECRET`

### eSIM Access Webhook

**URL:** `https://ykfmdktecqaadbnrxekj.supabase.co/functions/v1/webhook-esim`

**Events received:**
- `ORDER_STATUS` - eSIM ready (GOT_RESOURCE)
- `ESIM_STATUS` - Status changes (IN_USE, USED_UP, EXPIRED)
- `DATA_USAGE` - Usage alerts (50%, 80%, 90%)
- `VALIDITY_USAGE` - 1 day before expiry
- `SMDP_EVENT` - SM-DP+ events (DOWNLOAD, INSTALLED, ENABLED)

**IP Whitelist (eSIM Access):**
```
3.1.131.226
54.254.74.88
18.136.190.97
18.136.60.197
18.136.19.137
```

---

## Cron Jobs Setup

### Package Sync (Every 6 hours)

**Endpoint:** `POST /functions/v1/packages-sync`

**Setup with cron-job.org or similar:**
```bash
curl -X POST \
  https://ykfmdktecqaadbnrxekj.supabase.co/functions/v1/packages-sync \
  -H "Authorization: Bearer YOUR_CRON_SECRET" \
  -H "Content-Type: application/json"
```

**Schedule:** `0 */6 * * *` (every 6 hours)

---

## Quick Setup Checklist

- [ ] Set `ESIM_ACCESS_CODE` dan `ESIM_SECRET_KEY`
- [ ] Set `PADDLE_API_KEY` dan `PADDLE_WEBHOOK_SECRET`
- [ ] Set `PADDLE_SANDBOX=true` untuk testing, `false` untuk production
- [ ] Generate dan set `CRON_SECRET`
- [ ] Configure Paddle webhook URL di Dashboard
- [ ] Configure eSIM Access webhook URL di Dashboard
- [ ] Setup cron job untuk packages-sync
- [ ] Test packages-sync untuk populate initial data

---

## API Endpoints Summary

| Endpoint | Method | Auth | Description |
|----------|--------|------|-------------|
| `/packages-list` | GET | Public | List available eSIM packages |
| `/packages-sync` | POST | Cron Secret | Sync packages from eSIM Access |
| `/checkout-create` | POST | Public | Create Paddle checkout session |
| `/webhook-paddle` | POST | Signature | Handle Paddle payment webhooks |
| `/webhook-esim` | POST | IP Whitelist | Handle eSIM Access webhooks |

---

## Testing Commands

```bash
# Test packages-list
curl https://ykfmdktecqaadbnrxekj.supabase.co/functions/v1/packages-list

# Test packages-sync (with cron secret)
curl -X POST \
  https://ykfmdktecqaadbnrxekj.supabase.co/functions/v1/packages-sync \
  -H "Authorization: Bearer YOUR_CRON_SECRET"

# Test checkout-create
curl -X POST \
  https://ykfmdktecqaadbnrxekj.supabase.co/functions/v1/checkout-create \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ANON_KEY" \
  -d '{
    "items": [{"package_id": "uuid", "quantity": 1}],
    "customer_email": "test@example.com"
  }'
```
