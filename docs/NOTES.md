  1. EDGE FUNCTIONS INVENTORY (26 Functions)

  1.1 Overview by Category

  | Category           | Count | Functions                                                                    |
  |--------------------|-------|------------------------------------------------------------------------------|
  | Checkout & Payment | 4     | create-checkout, checkout-create, checkout-validate-discount, webhook-paddle |
  | Package Management | 2     | packages-list, packages-sync                                                 |
  | eSIM Operations    | 5     | esim-cancel, esim-topup, esim-sms, esim-usage, webhook-esim                  |
  | Topup              | 4     | topup-packages, topup-checkout, topup-packages-guest, topup-checkout-guest   |
  | Orders             | 3     | orders-query, orders-detail, order-lookup                                    |
  | User & Points      | 2     | user-points, cron-expire-points                                              |
  | Email              | 1     | email-send                                                                   |
  | Auth               | 1     | auth-webhook                                                                 |
  | System             | 3     | health, cron-process-esim-refunds, provider-balance-sync                     |

  1.2 Authentication Matrix

  | Function             | JWT Required | Public Access            |
  |----------------------|--------------|--------------------------|
  | webhook-esim         | ❌ No         | ✅ (RT-AccessCode header) |
  | webhook-paddle       | ✅ Yes        | Signature verification   |
  | topup-packages-guest | ❌ No         | ✅ Order verification     |
  | topup-checkout-guest | ❌ No         | ✅ Email verification     |
  | auth-webhook         | ❌ No         | ✅ (Supabase Auth)        |
  | All others           | ✅ Yes        | -                        |

  1.3 Function Details

  Core Purchase Flow

  ┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
  │ create-checkout │───▶│  webhook-paddle │───▶│   webhook-esim  │
  │   (Paddle TX)   │    │  (Payment OK)   │    │ (Status Updates)│
  └─────────────────┘    └─────────────────┘    └─────────────────┘
           │                      │                      │
           ▼                      ▼                      ▼
     Creates Order          Orders eSIM           Updates Profile
     in DB + Paddle         from Provider         Status/Usage

  Topup Flow

  ┌───────────────────┐    ┌─────────────────┐    ┌─────────────────┐
  │ topup-packages    │───▶│ topup-checkout  │───▶│   esim-topup    │
  │ (List Available)  │    │  (Paddle TX)    │    │ (Apply to eSIM) │
  └───────────────────┘    └─────────────────┘    └─────────────────┘
          │                        │
          ▼                        ▼
    Validates Status         Creates Topup Order
    (got_resource/in_use)    Links to Profile

  ---
  2. DATABASE SCHEMA (21 Tables)

  2.1 Core Business Tables

  | Table         | Rows  | Purpose                       | RLS |
  |---------------|-------|-------------------------------|-----|
  | esim_packages | 1,851 | Package catalog from provider | ✅   |
  | orders        | 0     | Customer orders               | ✅   |
  | order_items   | 0     | Line items per order          | ✅   |
  | esim_profiles | 0     | Purchased eSIM profiles       | ✅   |

  2.2 Pricing & Discounts

  | Table               | Rows | Purpose                  |
  |---------------------|------|--------------------------|
  | price_schedules     | 0    | Time-based pricing rules |
  | price_history       | 0    | Price change audit trail |
  | regional_pricing    | 0    | Multi-currency support   |
  | discount_codes      | 0    | Promo codes              |
  | discount_code_usage | 0    | Usage tracking           |

  2.3 User Management

  | Table               | Rows | Purpose                     |
  |---------------------|------|-----------------------------|
  | user_profiles       | 0    | Extended user data + points |
  | user_roles          | 2    | Admin permissions           |
  | user_consents       | 0    | GDPR compliance             |
  | points_transactions | 0    | Points earn/redeem history  |

  2.4 System & Logs

  | Table                 | Rows | Purpose                      |
  |-----------------------|------|------------------------------|
  | webhook_logs          | 2    | Webhook audit trail          |
  | email_logs            | 0    | Email delivery tracking      |
  | admin_audit_log       | 8    | Admin action history         |
  | app_metrics           | 0    | Business metrics             |
  | idempotency_keys      | 0    | Duplicate request prevention |
  | provider_balance      | 1    | eSIM Access balance cache    |
  | system_settings       | 4    | Configurable settings        |
  | data_retention_policy | 10   | GDPR data retention rules    |

  2.3 Entity Relationship Diagram

  ┌──────────────────┐
  │   auth.users     │
  └────────┬─────────┘
           │ 1:1
           ▼
  ┌──────────────────┐     1:N     ┌──────────────────┐
  │  user_profiles   │◄────────────│ points_transactions│
  └────────┬─────────┘             └──────────────────┘
           │ 1:N                            │
           ▼                                │
  ┌──────────────────┐                      │
  │     orders       │◄─────────────────────┘
  └────────┬─────────┘
           │ 1:N
           ▼
  ┌──────────────────┐     N:1     ┌──────────────────┐
  │   order_items    │────────────▶│   esim_packages  │
  └────────┬─────────┘             └──────────────────┘
           │ 1:N
           ▼
  ┌──────────────────┐
  │  esim_profiles   │
  └──────────────────┘

  ---
  3. CRON JOBS (7 Active Jobs)

  3.1 Job Schedule Overview

  | Job ID | Name                     | Schedule                   | Purpose                        |
  |--------|--------------------------|----------------------------|--------------------------------|
  | 1      | cleanup-webhook-logs     | 0 3 * * * (daily 3AM)      | Delete processed logs >30 days |
  | 2      | cleanup-idempotency-keys | 0 * * * * (hourly)         | Remove expired keys            |
  | 3      | cancel-abandoned-orders  | */15 * * * * (every 15min) | Cancel unpaid orders >24h      |
  | 4      | expire-points            | 0 1 * * * (daily 1AM)      | Deduct expired points          |
  | 5      | cleanup-email-logs       | 0 4 * * 0 (weekly Sunday)  | Delete email logs >90 days     |
  | 6      | cleanup-admin-audit-logs | 0 5 1 * * (monthly)        | Delete admin logs >365 days    |
  | 7      | daily-metrics-snapshot   | 0 0 * * * (midnight)       | Capture daily metrics          |

  3.2 Job Details

  Job 3: cancel-abandoned-orders ⚠️ Important

  UPDATE orders
  SET status = 'cancelled', payment_status = 'expired', updated_at = NOW()
  WHERE status = 'pending' AND payment_status = 'pending'
  AND created_at < NOW() - INTERVAL '24 hours';

  Job 4: expire-points

  WITH expired_points AS (
    SELECT user_id, SUM(amount) as total_expired
    FROM points_transactions
    WHERE type = 'earned' AND expires_at < NOW() AND expires_at > NOW() - INTERVAL '1 day'
    GROUP BY user_id
  )
  UPDATE user_profiles up
  SET points_balance = GREATEST(0, up.points_balance - ep.total_expired)
  FROM expired_points ep WHERE up.id = ep.user_id;

  Job 7: daily-metrics-snapshot

  -- Orders by status
  INSERT INTO app_metrics (metric_name, metric_value, dimensions, timestamp)
  SELECT 'daily_orders', COUNT(*)::numeric, jsonb_build_object('status', status), NOW()
  FROM orders WHERE created_at >= NOW() - INTERVAL '1 day' GROUP BY status;

  -- Revenue by currency
  INSERT INTO app_metrics (metric_name, metric_value, dimensions, timestamp)
  SELECT 'daily_revenue_cents', COALESCE(SUM(total_cents), 0)::numeric,
         jsonb_build_object('currency', currency_code), NOW()
  FROM orders WHERE payment_status = 'paid' AND paid_at >= NOW() - INTERVAL '1 day'
  GROUP BY currency_code;

  ---
  4. EXTENSIONS INSTALLED

  | Extension          | Version | Purpose                 |
  |--------------------|---------|-------------------------|
  | plpgsql            | 1.0     | Procedural language     |
  | pg_graphql         | 1.5.11  | GraphQL API support     |
  | pg_net             | 0.19.5  | Async HTTP requests     |
  | pg_cron            | 1.6.4   | Job scheduler           |
  | pgcrypto           | 1.3     | Cryptographic functions |
  | pg_stat_statements | 1.11    | Query performance stats |
  | supabase_vault     | 0.3.1   | Secret management       |
  | uuid-ossp          | 1.1     | UUID generation         |

  ---
  5. SYSTEM SETTINGS

  | Key                        | Purpose                  | Default |
  |----------------------------|--------------------------|---------|
  | exchange_rate_package_sync | USD→IDR for new packages | 15,500  |
  | exchange_rate_points       | USD→IDR for points calc  | 17,000  |
  | idr_per_point              | IDR value per point      | 500     |
  | points_expiry_days         | Points validity period   | 365     |

  ---
  6. SECURITY ANALYSIS

  6.1 ✅ Implemented Security Measures

  | Feature            | Implementation                   |
  |--------------------|----------------------------------|
  | RLS                | Enabled on all 21 tables         |
  | JWT Verification   | 22/26 edge functions             |
  | Webhook Signatures | Paddle HMAC-SHA256 verification  |
  | Access Codes       | eSIM Access RT-AccessCode header |
  | Idempotency        | Duplicate request prevention     |
  | Audit Logging      | Admin actions tracked            |

  6.2 ⚠️ Potential Security Gaps

  | Issue                            | Risk   | Recommendation        |
  |----------------------------------|--------|-----------------------|
  | Guest functions no rate limiting | Medium | Add rate limiting     |
  | No IP-based blocking             | Low    | Consider for webhooks |
  | Points manipulation              | Low    | Add transaction locks |

  ---
  7. BUSINESS FLOW SUMMARY

  7.1 Purchase Flow

  1. Customer selects packages → packages-list
  2. Creates checkout → create-checkout (Paddle)
  3. Payment webhook → webhook-paddle
  4. Orders eSIM → eSIM Access API
  5. Profile created → esim_profiles table
  6. Status updates → webhook-esim (from provider)
  7. Points awarded → points_transactions

  7.2 Points System

  Earn:  purchase_usd × 17000 / 500 = points
         (e.g., $10 = 10 × 17000 / 500 = 340 points)

  Redeem: points × 500 / 17000 = usd_discount
          (e.g., 340 points = 340 × 500 / 17000 = $10)

  7.3 eSIM Lifecycle

  pending → got_resource → in_use → used_up/expired
      │           │           │
      └───────────┴───────────┴───▶ Can Topup (if support_topup=true)

  ---
  8. GAPS & RECOMMENDATIONS

  8.1 Missing Features

  | Gap                       | Impact | Priority                           |
  |---------------------------|--------|------------------------------------|
  | No eSIM expiry cron job   | Medium | 🟡 Add local expiry check          |
  | No failed webhook retry   | Medium | 🟡 Implement retry queue           |
  | No package sync scheduler | Low    | 🟢 Add cron for packages-sync      |
  | No balance alert          | Medium | 🟡 Alert when provider balance low |

  8.2 Recommended Additions

  Add eSIM Expiry Cron Job

  -- Mark expired profiles (for topup prevention)
  UPDATE esim_profiles
  SET esim_status = 'expired', updated_at = NOW()
  WHERE esim_status IN ('got_resource', 'in_use')
    AND expires_at < NOW();

  Add Package Sync Scheduler

  -- Daily package sync at 2 AM
  SELECT cron.schedule('daily-package-sync', '0 2 * * *', $$
    SELECT net.http_post(
      url := current_setting('app.settings.supabase_url') || '/functions/v1/packages-sync',
      headers := jsonb_build_object('Authorization', 'Bearer ' || current_setting('app.settings.service_key'))
    );
  $$);

  ---
  9. SUMMARY STATISTICS

  | Metric                | Value |
  |-----------------------|-------|
  | Total Edge Functions  | 26    |
  | Total Database Tables | 21    |
  | Total Cron Jobs       | 7     |
  | Packages in Catalog   | 1,851 |
  | RLS Coverage          | 100%  |
  | Extensions Active     | 8     |
  | System Settings       | 4     |

  ---
  10. NEXT ACTIONS

  1. ⚠️ Add expired eSIM cron job - Prevent topup for expired profiles locally
  2. ⚠️ Add package-sync scheduler - Keep catalog updated automatically
  3. 🟡 Implement webhook retry - Handle failed webhook processing
  4. 🟡 Add provider balance alerting - Notify when balance is low
  5. 🟢 Consider rate limiting - For guest checkout endpoints