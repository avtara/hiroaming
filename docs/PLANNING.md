# HIROAM - eSIM Selling Platform

## Technical Planning Document

---

## Table of Contents

1. [Project Overview](#1-project-overview)
2. [System Architecture](#2-system-architecture)
3. [Database Schema](#3-database-schema)
4. [Price Management System](#4-price-management-system)
5. [Discount System](#5-discount-system)
6. [Edge Functions](#6-edge-functions)
7. [API Integrations](#7-api-integrations)
8. [Purchase Flow](#8-purchase-flow)
9. [Points System](#9-points-system)
10. [Webhook Handling](#10-webhook-handling)
11. [90-Day eSIM Refund System](#11-90-day-esim-refund-system)
12. [Security](#12-security)
13. [Email System (SendGrid)](#13-email-system-sendgrid)
14. [Error Handling & Resilience](#14-error-handling--resilience)
15. [Rate Limiting](#15-rate-limiting)
16. [Monitoring & Observability](#16-monitoring--observability)
17. [Testing Strategy](#17-testing-strategy)
18. [Shared Utilities](#18-shared-utilities)
19. [Implementation Phases](#19-implementation-phases)
20. [Backup & Disaster Recovery](#20-backup--disaster-recovery)
21. [Security Checklist](#21-security-checklist)
22. [Incident Response](#22-incident-response)
23. [CI/CD Pipeline](#23-cicd-pipeline)
24. [Data Retention & Compliance](#24-data-retention--compliance)

---

## 1. Project Overview

### 1.1 Business Requirements

| Requirement | Description |
|-------------|-------------|
| eSIM Provider | eSIM Access API |
| Payment Gateway | Paddle (USD only, custom pricing) |
| Guest Checkout | Users can purchase without authentication |
| User Benefits | Authenticated users earn points on purchase |
| Multi-Currency Display | USD and IDR pricing |
| Discounts | Product-level discounts + Checkout promo codes |
| Cart | Single item or multiple items purchase |

### 1.2 Tech Stack

| Component | Technology |
|-----------|------------|
| Database | Supabase PostgreSQL |
| Authentication | Supabase Auth |
| Backend | Supabase Edge Functions (Deno) |
| Payment | Paddle Billing API |
| eSIM Provider | eSIM Access API |

---

## 2. System Architecture

### 2.1 Dual Architecture Pattern

| Layer | Access Method | Use Case |
|-------|---------------|----------|
| **Frontend/Client** | Edge Functions | Public product listing, checkout, user orders |
| **Admin Dashboard** | Direct Supabase | Package management, pricing, discounts, orders |

### 2.2 Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                              CLIENT APPLICATIONS                                  │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                   │
│  ┌─────────────────────────────────────────┐   ┌─────────────────────────────┐  │
│  │        CUSTOMER FRONTEND (Next.js)       │   │   ADMIN DASHBOARD (Next.js) │  │
│  │                                          │   │                             │  │
│  │  ┌──────────┐  ┌──────────┐  ┌───────┐  │   │  ┌─────────┐  ┌─────────┐  │  │
│  │  │ Product  │  │ Checkout │  │ User  │  │   │  │Packages │  │Discounts│  │  │
│  │  │ Catalog  │  │   Page   │  │Orders │  │   │  │ Pricing │  │ Orders  │  │  │
│  │  └────┬─────┘  └────┬─────┘  └───┬───┘  │   │  └────┬────┘  └────┬────┘  │  │
│  │       │             │            │       │   │       │            │       │  │
│  │       └─────────────┼────────────┘       │   │       └──────┬─────┘       │  │
│  │                     │                    │   │              │             │  │
│  │                     ▼                    │   │              ▼             │  │
│  │         ┌───────────────────┐           │   │   ┌───────────────────┐    │  │
│  │         │   Edge Functions  │           │   │   │ Supabase Client   │    │  │
│  │         │   (service_role)  │           │   │   │  (anon + JWT)     │    │  │
│  │         └─────────┬─────────┘           │   │   └─────────┬─────────┘    │  │
│  │                   │                      │   │             │              │  │
│  └───────────────────┼──────────────────────┘   └─────────────┼──────────────┘  │
│                      │                                        │                  │
└──────────────────────┼────────────────────────────────────────┼──────────────────┘
                       │                                        │
                       │ HTTPS                                  │ HTTPS + RLS
                       │                                        │
                       ▼                                        ▼
┌──────────────────────────────────────────────────────────────────────────────────┐
│                              SUPABASE PLATFORM                                    │
├──────────────────────────────────────────────────────────────────────────────────┤
│                                                                                   │
│  ┌─────────────────────────────────┐    ┌─────────────────────────────────────┐ │
│  │     EDGE FUNCTIONS (Deno)       │    │          DATABASE (PostgreSQL)       │ │
│  │                                  │    │                                      │ │
│  │  • packages-list                 │    │  RLS Policies:                       │ │
│  │  • checkout-create               │    │  ├─ Public: read active packages     │ │
│  │  • checkout-validate-discount    │◄───┼──┤  ├─ Users: own orders/profile     │ │
│  │  • orders-query                  │    │  ├─ Admin: is_admin() → full access  │ │
│  │  • orders-detail                 │    │  └─ Service: service_role → all      │ │
│  │  • webhook-paddle                │    │                                      │ │
│  │  • webhook-esim                  │    │  Tables:                             │ │
│  │  • cron-sync-packages            │    │  ├─ esim_packages                    │ │
│  │                                  │    │  ├─ price_schedules                  │ │
│  └─────────────────────────────────┘    │  ├─ orders / order_items             │ │
│                                          │  ├─ discount_codes                   │ │
│                                          │  ├─ user_profiles / user_roles       │ │
│                                          │  └─ admin_audit_log                  │ │
│                                          └─────────────────────────────────────┘ │
└──────────────────────────────────────────────────────────────────────────────────┘
                       │                                        │
                       │                                        │
           ┌───────────┴───────────┐                            │
           ▼                       ▼                            │
    ┌─────────────┐         ┌─────────────┐                     │
    │   Paddle    │         │ eSIM Access │                     │
    │    API      │         │    API      │                     │
    └─────────────┘         └─────────────┘                     │
           │                       │                            │
           │       Webhooks        │                            │
           └───────────────────────┘                            │
```

### 2.3 Access Flow Summary

```
CUSTOMER FLOW:
  Browser → Edge Function → Database (via service_role)
           → Paddle API (checkout)
           → eSIM Access API (order fulfillment)

ADMIN FLOW:
  Browser → Direct Supabase Client → Database (via RLS + user JWT)
           └─ RLS checks: is_admin() OR has_permission()
```

---

## 3. Database Schema

### 3.1 Core Tables

```sql
-- =====================================================
-- PRODUCTS & PRICING
-- =====================================================

-- eSIM packages synced from eSIM Access API
CREATE TABLE esim_packages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- ========== FROM ESIM ACCESS (SYNCED) ==========
    package_code VARCHAR(50) UNIQUE NOT NULL,          -- e.g., "JC016"
    slug VARCHAR(100) UNIQUE,                          -- e.g., "AU_1_7"
    name VARCHAR(255) NOT NULL,
    description TEXT,

    -- Data specifications
    volume_bytes BIGINT NOT NULL,                      -- Data in bytes
    duration INTEGER NOT NULL,                         -- Duration value
    duration_unit VARCHAR(20) DEFAULT 'DAY',           -- DAY/MONTH
    data_type INTEGER DEFAULT 1,                       -- 1=Fixed, 2=Daily Pass
    speed VARCHAR(50),                                 -- "3G/4G"

    -- Coverage
    location_codes TEXT[],                             -- ["JP", "KR", "TH"]
    location_names JSONB,                              -- {"JP": "Japan", ...}
    operator_list JSONB,                               -- Network operators
    ip_export VARCHAR(10),                             -- Exit country

    -- Features from provider
    sms_status INTEGER DEFAULT 0,                      -- SMS support
    support_topup BOOLEAN DEFAULT false,
    active_type INTEGER DEFAULT 1,                     -- 1=Install, 2=Network

    -- Provider pricing (cost)
    base_price_cents INTEGER NOT NULL,                 -- Cost from eSIM Access (USD cents)
    retail_price_cents INTEGER,                        -- Suggested retail from provider

    -- ========== OUR BASE PRICING (MANAGED BY ADMIN) ==========
    -- Base prices (default when no scheduled price is active)
    price_usd_cents INTEGER NOT NULL,                  -- Base selling price USD (cents)
    price_idr INTEGER NOT NULL,                        -- Base selling price IDR

    -- Note: Discounts and scheduled prices are managed in `price_schedules` table
    -- This allows multiple scheduled promotions per product

    -- ========== AVAILABILITY (MANAGED BY ADMIN) ==========
    is_available BOOLEAN DEFAULT true,                 -- Can be purchased
    unavailable_reason VARCHAR(255),                   -- "Out of stock", "Coming soon"
    available_from TIMESTAMPTZ,                        -- Scheduled availability
    available_until TIMESTAMPTZ,                       -- Limited time offer

    -- Stock management (optional)
    stock_type VARCHAR(20) DEFAULT 'unlimited',        -- 'unlimited' | 'limited'
    stock_quantity INTEGER,                            -- If limited
    max_per_order INTEGER DEFAULT 10,                  -- Max quantity per order

    -- ========== DISPLAY METADATA (MANAGED BY ADMIN) ==========
    display_name VARCHAR(255),                         -- Custom display name
    custom_description TEXT,                           -- Custom description
    is_active BOOLEAN DEFAULT true,                    -- Show/hide in catalog
    is_featured BOOLEAN DEFAULT false,                 -- Featured products
    is_bestseller BOOLEAN DEFAULT false,               -- Bestseller badge
    is_new BOOLEAN DEFAULT false,                      -- New arrival badge
    category VARCHAR(50),                              -- "asia", "europe", "global"
    tags TEXT[],                                       -- ["popular", "best-value"]
    sort_order INTEGER DEFAULT 0,
    image_url TEXT,                                    -- Custom image

    -- ========== SYNC METADATA ==========
    synced_at TIMESTAMPTZ,
    sync_status VARCHAR(20) DEFAULT 'active',          -- active, discontinued, error
    sync_error TEXT,

    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- PRICE SCHEDULES (SCHEDULED DISCOUNTS & PRICING)
-- =====================================================

-- Scheduled prices/discounts for products
-- Allows planning promotions by date range (Christmas, New Year, Flash Sales, etc.)
CREATE TABLE price_schedules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    package_id UUID REFERENCES esim_packages(id) ON DELETE CASCADE,

    -- Schedule identification
    schedule_name VARCHAR(100) NOT NULL,              -- "Christmas Sale 2024", "New Year Flash"
    schedule_type VARCHAR(20) DEFAULT 'discount',     -- 'discount' | 'price_override'

    -- Discount configuration (when schedule_type = 'discount')
    discount_type VARCHAR(20),                        -- 'percentage' | 'fixed'
    discount_value INTEGER,                           -- Value (percentage * 100 or cents)

    -- Price override (when schedule_type = 'price_override')
    override_price_usd_cents INTEGER,                 -- Override USD price
    override_price_idr INTEGER,                       -- Override IDR price

    -- Validity period
    starts_at TIMESTAMPTZ NOT NULL,
    ends_at TIMESTAMPTZ NOT NULL,

    -- Priority for overlapping schedules (higher = takes precedence)
    priority INTEGER DEFAULT 0,

    -- Display
    badge_text VARCHAR(50),                           -- "🎄 Christmas Sale", "⚡ Flash Deal"
    badge_color VARCHAR(20),                          -- "red", "green", "#FF5733"

    -- Status
    is_active BOOLEAN DEFAULT true,

    -- Metadata
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),

    -- Constraints
    CONSTRAINT valid_schedule_dates CHECK (ends_at > starts_at),
    CONSTRAINT valid_discount CHECK (
        (schedule_type = 'discount' AND discount_type IS NOT NULL AND discount_value IS NOT NULL)
        OR
        (schedule_type = 'price_override' AND override_price_usd_cents IS NOT NULL)
    )
);

-- Index for efficient schedule lookups
CREATE INDEX idx_price_schedules_active ON price_schedules(package_id, is_active, starts_at, ends_at)
    WHERE is_active = true;
CREATE INDEX idx_price_schedules_current ON price_schedules(package_id, priority DESC)
    WHERE is_active = true AND starts_at <= NOW() AND ends_at > NOW();

-- =====================================================
-- PRICE HISTORY (AUDIT TRAIL)
-- =====================================================

CREATE TABLE price_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    package_id UUID REFERENCES esim_packages(id) ON DELETE CASCADE,

    -- Price change record
    field_changed VARCHAR(50) NOT NULL,                -- 'price_usd_cents', 'price_idr', 'discount_value'
    old_value TEXT,
    new_value TEXT,

    -- Who changed it
    changed_by UUID REFERENCES auth.users(id),
    change_reason TEXT,

    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- REGIONAL PRICING (OPTIONAL - FOR FUTURE USE)
-- =====================================================

CREATE TABLE regional_pricing (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    package_id UUID REFERENCES esim_packages(id) ON DELETE CASCADE,
    country_code VARCHAR(2) NOT NULL,                  -- User's country

    price_local_cents INTEGER NOT NULL,                -- Price in local currency
    currency_code VARCHAR(3) NOT NULL,                 -- EUR, GBP, etc.

    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),

    UNIQUE(package_id, country_code)
);

-- =====================================================
-- CHECKOUT DISCOUNT CODES (PROMO CODES)
-- =====================================================

CREATE TABLE discount_codes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code VARCHAR(50) UNIQUE NOT NULL,                  -- Promo code e.g., "SAVE20"
    name VARCHAR(100) NOT NULL,
    description TEXT,

    -- Discount configuration
    discount_type VARCHAR(20) NOT NULL,                -- 'percentage' | 'fixed'
    discount_value INTEGER NOT NULL,                   -- cents or percentage * 100
    currency_code VARCHAR(3) DEFAULT 'USD',            -- For fixed discounts

    -- Constraints
    min_purchase_cents INTEGER DEFAULT 0,              -- Minimum order value
    max_discount_cents INTEGER,                        -- Cap for percentage discounts
    max_uses INTEGER,                                  -- Total uses allowed (NULL = unlimited)
    max_uses_per_user INTEGER DEFAULT 1,               -- Per user/email limit

    -- Validity period
    starts_at TIMESTAMPTZ DEFAULT NOW(),
    expires_at TIMESTAMPTZ,

    -- Restrictions
    applicable_packages UUID[],                        -- NULL = all packages
    excluded_packages UUID[],                          -- Exclude specific packages
    first_purchase_only BOOLEAN DEFAULT false,
    authenticated_only BOOLEAN DEFAULT false,          -- Only for logged-in users

    -- Stacking rules
    stackable_with_product_discount BOOLEAN DEFAULT true, -- Can combine with product discount

    -- Tracking
    current_uses INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,

    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Track discount code usage
CREATE TABLE discount_code_usage (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    discount_id UUID REFERENCES discount_codes(id),
    order_id UUID,                                     -- Set after order completed
    user_id UUID REFERENCES auth.users(id),            -- NULL for guest
    guest_email VARCHAR(255),                          -- For guest tracking

    discount_amount_cents INTEGER NOT NULL,            -- Actual discount applied

    used_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- ORDERS
-- =====================================================

CREATE TABLE orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_number VARCHAR(50) UNIQUE NOT NULL,          -- "ORD-20241207-XXXXX"

    -- Customer
    user_id UUID REFERENCES auth.users(id),            -- NULL for guest
    customer_email VARCHAR(255) NOT NULL,
    customer_name VARCHAR(255),

    -- Order pricing breakdown
    currency_code VARCHAR(3) DEFAULT 'USD',
    subtotal_cents INTEGER NOT NULL,                   -- Before any discounts
    product_discount_cents INTEGER DEFAULT 0,          -- From product-level discounts
    code_discount_cents INTEGER DEFAULT 0,             -- From promo code
    total_discount_cents INTEGER DEFAULT 0,            -- Total discounts
    total_cents INTEGER NOT NULL,                      -- Final amount charged

    -- Discount references
    discount_code_id UUID REFERENCES discount_codes(id),
    discount_code_used VARCHAR(50),                    -- Snapshot of code

    -- Status tracking
    status VARCHAR(50) DEFAULT 'pending',              -- pending, paid, processing, completed, failed, cancelled, refunded
    payment_status VARCHAR(50) DEFAULT 'pending',      -- pending, completed, failed, refunded
    esim_status VARCHAR(50) DEFAULT 'pending',         -- pending, ordered, delivered, failed

    -- Payment (Paddle)
    paddle_transaction_id VARCHAR(100),
    paddle_customer_id VARCHAR(100),
    paddle_checkout_url TEXT,

    -- Points
    points_earned INTEGER DEFAULT 0,
    points_applied BOOLEAN DEFAULT false,

    -- Metadata
    metadata JSONB,                                    -- Additional order data

    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    paid_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Order items (supports multiple items per order)
-- NOTE: When quantity > 1, each eSIM profile is stored in esim_profiles table
CREATE TABLE order_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
    package_id UUID REFERENCES esim_packages(id),

    -- Snapshot at purchase time
    package_code VARCHAR(50) NOT NULL,
    package_name VARCHAR(255) NOT NULL,
    quantity INTEGER DEFAULT 1,

    -- Pricing snapshot
    unit_price_cents INTEGER NOT NULL,                 -- Original unit price
    product_discount_cents INTEGER DEFAULT 0,          -- Product discount per unit
    final_unit_price_cents INTEGER NOT NULL,           -- After product discount
    total_cents INTEGER NOT NULL,                      -- final_unit_price * quantity

    -- eSIM Access order tracking (for the batch order)
    esim_order_no VARCHAR(100),                        -- eSIM Access orderNo (may cover multiple profiles)
    transaction_id VARCHAR(100),                       -- Our transactionId sent to eSIM Access

    -- Aggregated status (reflects overall status of all profiles)
    status VARCHAR(50) DEFAULT 'pending',              -- pending, ordered, partial, completed, cancelled
    profiles_ordered INTEGER DEFAULT 0,                -- Count of profiles ordered
    profiles_delivered INTEGER DEFAULT 0,              -- Count of profiles with got_resource
    profiles_cancelled INTEGER DEFAULT 0,              -- Count of cancelled/refunded profiles

    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- ESIM PROFILES (Individual eSIM instances)
-- =====================================================

-- Each row represents one actual eSIM profile
-- Handles quantity > 1 by creating multiple profiles per order_item
CREATE TABLE esim_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_item_id UUID REFERENCES order_items(id) ON DELETE CASCADE,
    order_id UUID REFERENCES orders(id) ON DELETE CASCADE,

    -- eSIM Access identifiers
    esim_tran_no VARCHAR(100) UNIQUE,                  -- eSIM Access esimTranNo (unique per profile)
    esim_order_no VARCHAR(100),                        -- eSIM Access orderNo
    iccid VARCHAR(50),                                 -- eSIM ICCID

    -- eSIM Profile data (from GOT_RESOURCE webhook)
    qr_code TEXT,                                      -- QR code data/URL
    sm_dp_address TEXT,                                -- SM-DP+ server address
    activation_code TEXT,                              -- Activation code for manual entry
    manual_code TEXT,                                  -- Full manual entry code

    -- Status tracking
    esim_status VARCHAR(50) DEFAULT 'pending',         -- pending, ordered, got_resource, in_use, used_up, expired, cancelled
    smdp_status VARCHAR(50) DEFAULT 'pending',         -- pending, released, downloaded, installed, enabled, deleted

    -- SMDP Event timestamps (from SMDP_EVENT webhook)
    resource_ready_at TIMESTAMPTZ,                     -- When GOT_RESOURCE received
    downloaded_at TIMESTAMPTZ,                         -- When user downloaded (SMDP: DOWNLOAD)
    installed_at TIMESTAMPTZ,                          -- When user installed (SMDP: INSTALLED)
    enabled_at TIMESTAMPTZ,                            -- When profile enabled (SMDP: ENABLED)

    -- Usage tracking (from DATA_USAGE/ESIM_STATUS webhooks)
    data_used_bytes BIGINT DEFAULT 0,                  -- Data consumed
    data_total_bytes BIGINT,                           -- Total data allowance
    usage_percentage INTEGER DEFAULT 0,                -- 0-100
    expires_at TIMESTAMPTZ,                            -- When eSIM expires

    -- 90-Day Refund System
    refund_eligible_at TIMESTAMPTZ,                    -- resource_ready_at + 90 days
    refund_status VARCHAR(20) DEFAULT 'not_eligible',  -- not_eligible, eligible, processing, refunded, not_refundable
    refunded_at TIMESTAMPTZ,                           -- When refund was processed
    refund_amount_cents INTEGER,                       -- Amount refunded (in USD cents)

    -- Metadata
    profile_index INTEGER DEFAULT 1,                   -- Index within order_item (1, 2, 3...)
    metadata JSONB,                                    -- Additional provider data

    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for esim_profiles
CREATE INDEX idx_esim_profiles_order_item ON esim_profiles(order_item_id);
CREATE INDEX idx_esim_profiles_order ON esim_profiles(order_id);
CREATE INDEX idx_esim_profiles_iccid ON esim_profiles(iccid);
CREATE INDEX idx_esim_profiles_esim_tran_no ON esim_profiles(esim_tran_no);
CREATE INDEX idx_esim_profiles_status ON esim_profiles(esim_status);

-- Index for 90-day refund cron job (efficient query for eligible refunds)
CREATE INDEX idx_esim_profiles_refund_eligible ON esim_profiles(refund_eligible_at, refund_status, smdp_status)
    WHERE refund_status = 'eligible' AND smdp_status = 'released';

-- =====================================================
-- USERS & ROLES
-- =====================================================

CREATE TABLE user_profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id),
    full_name VARCHAR(255),
    phone VARCHAR(50),

    -- Points system
    points_balance INTEGER DEFAULT 0,
    total_points_earned INTEGER DEFAULT 0,
    total_points_spent INTEGER DEFAULT 0,

    -- Stats
    total_orders INTEGER DEFAULT 0,
    total_spent_cents INTEGER DEFAULT 0,
    first_order_at TIMESTAMPTZ,
    last_order_at TIMESTAMPTZ,

    -- Preferences
    preferred_currency VARCHAR(3) DEFAULT 'USD',
    email_notifications BOOLEAN DEFAULT true,

    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- User roles for admin access control
-- Used by Next.js Admin Dashboard for direct database access
CREATE TABLE user_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,

    role VARCHAR(20) NOT NULL DEFAULT 'user',         -- 'user' | 'admin' | 'super_admin'

    -- Admin permissions (granular control)
    can_manage_packages BOOLEAN DEFAULT false,        -- Edit packages, prices, schedules
    can_manage_discounts BOOLEAN DEFAULT false,       -- CRUD discount codes
    can_manage_orders BOOLEAN DEFAULT false,          -- View/update orders
    can_view_analytics BOOLEAN DEFAULT false,         -- Access dashboard analytics
    can_manage_users BOOLEAN DEFAULT false,           -- User management (super_admin)

    -- Metadata
    granted_by UUID REFERENCES auth.users(id),
    granted_at TIMESTAMPTZ DEFAULT NOW(),

    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for fast role lookups
CREATE INDEX idx_user_roles_user ON user_roles(user_id);
CREATE INDEX idx_user_roles_role ON user_roles(role);

-- =====================================================
-- POINTS SYSTEM
-- =====================================================

CREATE TABLE points_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id),

    type VARCHAR(50) NOT NULL,                         -- 'earned' | 'spent' | 'expired' | 'adjusted'
    amount INTEGER NOT NULL,                           -- Positive for earn, negative for spend
    balance_after INTEGER NOT NULL,

    order_id UUID REFERENCES orders(id),
    description TEXT,
    expires_at TIMESTAMPTZ,                            -- For points expiry

    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- WEBHOOK LOGS
-- =====================================================

CREATE TABLE webhook_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    source VARCHAR(50) NOT NULL,                       -- 'paddle' | 'esim_access'
    event_type VARCHAR(100) NOT NULL,
    payload JSONB NOT NULL,

    processed BOOLEAN DEFAULT false,
    processed_at TIMESTAMPTZ,
    error_message TEXT,
    retry_count INTEGER DEFAULT 0,

    order_id UUID REFERENCES orders(id),

    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- ADMIN AUDIT LOG
-- =====================================================

CREATE TABLE admin_audit_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    admin_id UUID REFERENCES auth.users(id),

    action VARCHAR(100) NOT NULL,                      -- 'update_price', 'toggle_availability', etc.
    entity_type VARCHAR(50) NOT NULL,                  -- 'package', 'discount', 'order'
    entity_id UUID,

    old_values JSONB,
    new_values JSONB,

    ip_address INET,
    user_agent TEXT,

    created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### 3.2 Database Indexes

```sql
-- Performance indexes
CREATE INDEX idx_packages_active ON esim_packages(is_active, is_available)
    WHERE is_active = true AND is_available = true;
CREATE INDEX idx_packages_featured ON esim_packages(is_featured, sort_order)
    WHERE is_featured = true;
CREATE INDEX idx_packages_category ON esim_packages(category);
CREATE INDEX idx_packages_location ON esim_packages USING GIN(location_codes);

-- Note: Package discounts are now managed via price_schedules table
-- See idx_price_schedules_active and idx_price_schedules_current indexes

CREATE INDEX idx_orders_user ON orders(user_id) WHERE user_id IS NOT NULL;
CREATE INDEX idx_orders_email ON orders(customer_email);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_orders_paddle_txn ON orders(paddle_transaction_id);
CREATE INDEX idx_order_items_esim ON order_items(esim_order_no);

CREATE INDEX idx_discount_codes_active ON discount_codes(code)
    WHERE is_active = true;
CREATE INDEX idx_discount_usage_user ON discount_code_usage(user_id);
CREATE INDEX idx_discount_usage_email ON discount_code_usage(guest_email);
```

### 3.3 Database Functions

```sql
-- =====================================================
-- GET ACTIVE PRICE SCHEDULE FOR A PACKAGE
-- =====================================================

-- Returns the currently active price schedule for a package
-- Priority is used to resolve conflicts when multiple schedules overlap
CREATE OR REPLACE FUNCTION get_active_price_schedule(p_package_id UUID)
RETURNS TABLE (
    schedule_id UUID,
    schedule_name VARCHAR(100),
    schedule_type VARCHAR(20),
    discount_type VARCHAR(20),
    discount_value INTEGER,
    override_price_usd_cents INTEGER,
    override_price_idr INTEGER,
    badge_text VARCHAR(50),
    badge_color VARCHAR(20),
    ends_at TIMESTAMPTZ
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        ps.id,
        ps.schedule_name,
        ps.schedule_type,
        ps.discount_type,
        ps.discount_value,
        ps.override_price_usd_cents,
        ps.override_price_idr,
        ps.badge_text,
        ps.badge_color,
        ps.ends_at
    FROM price_schedules ps
    WHERE ps.package_id = p_package_id
      AND ps.is_active = true
      AND ps.starts_at <= NOW()
      AND ps.ends_at > NOW()
    ORDER BY ps.priority DESC, ps.created_at ASC
    LIMIT 1;
END;
$$ LANGUAGE plpgsql STABLE;

-- =====================================================
-- CALCULATE FINAL PRICE WITH SCHEDULED DISCOUNTS
-- =====================================================

-- Returns the final price for a package considering active schedules
CREATE OR REPLACE FUNCTION get_package_final_price(p_package_id UUID)
RETURNS TABLE (
    original_price_usd_cents INTEGER,
    original_price_idr INTEGER,
    final_price_usd_cents INTEGER,
    final_price_idr INTEGER,
    has_discount BOOLEAN,
    discount_percentage INTEGER,
    savings_usd_cents INTEGER,
    savings_idr INTEGER,
    schedule_name VARCHAR(100),
    badge_text VARCHAR(50),
    badge_color VARCHAR(20),
    discount_ends_at TIMESTAMPTZ
) AS $$
DECLARE
    pkg RECORD;
    schedule RECORD;
BEGIN
    -- Get base package prices
    SELECT price_usd_cents, price_idr INTO pkg
    FROM esim_packages WHERE id = p_package_id;

    IF pkg IS NULL THEN
        RETURN;
    END IF;

    -- Get active schedule
    SELECT * INTO schedule FROM get_active_price_schedule(p_package_id);

    IF schedule.schedule_id IS NOT NULL THEN
        -- Calculate based on schedule type
        IF schedule.schedule_type = 'price_override' THEN
            -- Direct price override
            RETURN QUERY SELECT
                pkg.price_usd_cents,
                pkg.price_idr,
                COALESCE(schedule.override_price_usd_cents, pkg.price_usd_cents),
                COALESCE(schedule.override_price_idr, pkg.price_idr),
                true,
                CASE WHEN pkg.price_usd_cents > 0 THEN
                    ((pkg.price_usd_cents - schedule.override_price_usd_cents) * 100 / pkg.price_usd_cents)::INTEGER
                ELSE 0 END,
                pkg.price_usd_cents - COALESCE(schedule.override_price_usd_cents, pkg.price_usd_cents),
                pkg.price_idr - COALESCE(schedule.override_price_idr, pkg.price_idr),
                schedule.schedule_name,
                schedule.badge_text,
                schedule.badge_color,
                schedule.ends_at;
        ELSE
            -- Discount calculation
            IF schedule.discount_type = 'percentage' THEN
                RETURN QUERY SELECT
                    pkg.price_usd_cents,
                    pkg.price_idr,
                    (pkg.price_usd_cents - (pkg.price_usd_cents * schedule.discount_value / 10000))::INTEGER,
                    (pkg.price_idr - (pkg.price_idr * schedule.discount_value / 10000))::INTEGER,
                    true,
                    (schedule.discount_value / 100)::INTEGER,
                    (pkg.price_usd_cents * schedule.discount_value / 10000)::INTEGER,
                    (pkg.price_idr * schedule.discount_value / 10000)::INTEGER,
                    schedule.schedule_name,
                    schedule.badge_text,
                    schedule.badge_color,
                    schedule.ends_at;
            ELSE
                -- Fixed discount (in cents)
                RETURN QUERY SELECT
                    pkg.price_usd_cents,
                    pkg.price_idr,
                    GREATEST(0, pkg.price_usd_cents - schedule.discount_value)::INTEGER,
                    GREATEST(0, pkg.price_idr - (schedule.discount_value * 160))::INTEGER, -- Assuming ~16000 IDR/USD
                    true,
                    CASE WHEN pkg.price_usd_cents > 0 THEN
                        (schedule.discount_value * 100 / pkg.price_usd_cents)::INTEGER
                    ELSE 0 END,
                    LEAST(schedule.discount_value, pkg.price_usd_cents)::INTEGER,
                    LEAST(schedule.discount_value * 160, pkg.price_idr)::INTEGER,
                    schedule.schedule_name,
                    schedule.badge_text,
                    schedule.badge_color,
                    schedule.ends_at;
            END IF;
        END IF;
    ELSE
        -- No active schedule, return base price
        RETURN QUERY SELECT
            pkg.price_usd_cents,
            pkg.price_idr,
            pkg.price_usd_cents,
            pkg.price_idr,
            false,
            0::INTEGER,
            0::INTEGER,
            0::INTEGER,
            NULL::VARCHAR(100),
            NULL::VARCHAR(50),
            NULL::VARCHAR(20),
            NULL::TIMESTAMPTZ;
    END IF;
END;
$$ LANGUAGE plpgsql STABLE;

-- =====================================================
-- GET ALL UPCOMING SCHEDULES FOR A PACKAGE
-- =====================================================

-- Returns all scheduled promotions (active and upcoming)
CREATE OR REPLACE FUNCTION get_package_schedules(p_package_id UUID)
RETURNS TABLE (
    schedule_id UUID,
    schedule_name VARCHAR(100),
    schedule_type VARCHAR(20),
    discount_type VARCHAR(20),
    discount_value INTEGER,
    override_price_usd_cents INTEGER,
    override_price_idr INTEGER,
    starts_at TIMESTAMPTZ,
    ends_at TIMESTAMPTZ,
    priority INTEGER,
    badge_text VARCHAR(50),
    is_active BOOLEAN,
    is_current BOOLEAN
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        ps.id,
        ps.schedule_name,
        ps.schedule_type,
        ps.discount_type,
        ps.discount_value,
        ps.override_price_usd_cents,
        ps.override_price_idr,
        ps.starts_at,
        ps.ends_at,
        ps.priority,
        ps.badge_text,
        ps.is_active,
        (ps.starts_at <= NOW() AND ps.ends_at > NOW()) AS is_current
    FROM price_schedules ps
    WHERE ps.package_id = p_package_id
      AND ps.ends_at > NOW()  -- Only future and current
    ORDER BY ps.starts_at ASC, ps.priority DESC;
END;
$$ LANGUAGE plpgsql STABLE;

-- Function to check product availability
CREATE OR REPLACE FUNCTION is_package_purchasable(package_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
    pkg RECORD;
BEGIN
    SELECT * INTO pkg FROM esim_packages WHERE id = package_id;

    IF pkg IS NULL THEN RETURN false; END IF;
    IF pkg.is_active = false THEN RETURN false; END IF;
    IF pkg.is_available = false THEN RETURN false; END IF;
    IF pkg.available_from IS NOT NULL AND pkg.available_from > NOW() THEN RETURN false; END IF;
    IF pkg.available_until IS NOT NULL AND pkg.available_until < NOW() THEN RETURN false; END IF;
    IF pkg.stock_type = 'limited' AND COALESCE(pkg.stock_quantity, 0) <= 0 THEN RETURN false; END IF;

    RETURN true;
END;
$$ LANGUAGE plpgsql;
```

### 3.4 Row Level Security (RLS)

```sql
-- =====================================================
-- HELPER FUNCTIONS FOR RLS
-- =====================================================

-- Check if current user is an admin
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM user_roles
        WHERE user_id = auth.uid()
        AND role IN ('admin', 'super_admin')
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- Check if current user has specific permission
CREATE OR REPLACE FUNCTION has_permission(permission_name TEXT)
RETURNS BOOLEAN AS $$
DECLARE
    user_role RECORD;
BEGIN
    SELECT * INTO user_role FROM user_roles WHERE user_id = auth.uid();

    IF user_role IS NULL THEN
        RETURN FALSE;
    END IF;

    -- Super admin has all permissions
    IF user_role.role = 'super_admin' THEN
        RETURN TRUE;
    END IF;

    -- Check specific permission
    CASE permission_name
        WHEN 'manage_packages' THEN RETURN user_role.can_manage_packages;
        WHEN 'manage_discounts' THEN RETURN user_role.can_manage_discounts;
        WHEN 'manage_orders' THEN RETURN user_role.can_manage_orders;
        WHEN 'view_analytics' THEN RETURN user_role.can_view_analytics;
        WHEN 'manage_users' THEN RETURN user_role.can_manage_users;
        ELSE RETURN FALSE;
    END CASE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- =====================================================
-- ENABLE RLS ON ALL TABLES
-- =====================================================

ALTER TABLE esim_packages ENABLE ROW LEVEL SECURITY;
ALTER TABLE price_schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE esim_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE points_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE discount_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE discount_code_usage ENABLE ROW LEVEL SECURITY;
ALTER TABLE price_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE webhook_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_audit_log ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- PUBLIC ACCESS POLICIES (Frontend via Edge Functions)
-- =====================================================

-- Public can read active packages
CREATE POLICY "Public read packages" ON esim_packages
    FOR SELECT USING (is_active = true);

-- Public can read active price schedules
CREATE POLICY "Public read price schedules" ON price_schedules
    FOR SELECT USING (is_active = true);

-- Public can read active discount codes (for validation)
CREATE POLICY "Public read active discounts" ON discount_codes
    FOR SELECT USING (is_active = true);

-- =====================================================
-- AUTHENTICATED USER POLICIES
-- =====================================================

-- Users can view their own orders
CREATE POLICY "Users view own orders" ON orders
    FOR SELECT USING (auth.uid() = user_id);

-- Users can view their own order items
CREATE POLICY "Users view own order items" ON order_items
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM orders
            WHERE orders.id = order_items.order_id
            AND orders.user_id = auth.uid()
        )
    );

-- Users can view their own eSIM profiles
CREATE POLICY "Users view own esim profiles" ON esim_profiles
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM orders
            WHERE orders.id = esim_profiles.order_id
            AND orders.user_id = auth.uid()
        )
    );

-- Users can view and update their profile
CREATE POLICY "Users manage own profile" ON user_profiles
    FOR ALL USING (auth.uid() = id);

-- Users can view their points
CREATE POLICY "Users view own points" ON points_transactions
    FOR SELECT USING (auth.uid() = user_id);

-- Users can view their own role (but not modify)
CREATE POLICY "Users view own role" ON user_roles
    FOR SELECT USING (auth.uid() = user_id);

-- =====================================================
-- ADMIN POLICIES (Next.js Admin Dashboard Direct Access)
-- =====================================================

-- Admin: Full access to packages
CREATE POLICY "Admin manage packages" ON esim_packages
    FOR ALL USING (is_admin() OR has_permission('manage_packages'));

-- Admin: Full access to price schedules
CREATE POLICY "Admin manage price schedules" ON price_schedules
    FOR ALL USING (is_admin() OR has_permission('manage_packages'));

-- Admin: Full access to discount codes
CREATE POLICY "Admin manage discounts" ON discount_codes
    FOR ALL USING (is_admin() OR has_permission('manage_discounts'));

-- Admin: View discount usage
CREATE POLICY "Admin view discount usage" ON discount_code_usage
    FOR SELECT USING (is_admin() OR has_permission('manage_discounts'));

-- Admin: Full access to orders (view, update status)
CREATE POLICY "Admin manage orders" ON orders
    FOR ALL USING (is_admin() OR has_permission('manage_orders'));

-- Admin: Full access to order items
CREATE POLICY "Admin manage order items" ON order_items
    FOR ALL USING (is_admin() OR has_permission('manage_orders'));

-- Admin: Full access to eSIM profiles
CREATE POLICY "Admin manage esim profiles" ON esim_profiles
    FOR ALL USING (is_admin() OR has_permission('manage_orders'));

-- Admin: View all user profiles
CREATE POLICY "Admin view all profiles" ON user_profiles
    FOR SELECT USING (is_admin() OR has_permission('manage_users'));

-- Admin: View all points transactions
CREATE POLICY "Admin view all points" ON points_transactions
    FOR SELECT USING (is_admin() OR has_permission('view_analytics'));

-- Admin: View price history
CREATE POLICY "Admin view price history" ON price_history
    FOR SELECT USING (is_admin() OR has_permission('manage_packages'));

-- Admin: Insert price history (auto-logged on changes)
CREATE POLICY "Admin insert price history" ON price_history
    FOR INSERT WITH CHECK (is_admin() OR has_permission('manage_packages'));

-- Admin: View webhook logs
CREATE POLICY "Admin view webhooks" ON webhook_logs
    FOR SELECT USING (is_admin());

-- Admin: Full access to audit log
CREATE POLICY "Admin manage audit log" ON admin_audit_log
    FOR ALL USING (is_admin());

-- Super Admin: Manage user roles
CREATE POLICY "Super admin manage roles" ON user_roles
    FOR ALL USING (has_permission('manage_users'));

-- =====================================================
-- SERVICE ROLE POLICIES (Edge Functions)
-- =====================================================

-- Service role bypasses RLS by default, but explicit policies for clarity
CREATE POLICY "Service role packages" ON esim_packages
    FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Service role price_schedules" ON price_schedules
    FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Service role orders" ON orders
    FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Service role order_items" ON order_items
    FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Service role esim_profiles" ON esim_profiles
    FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Service role discount_codes" ON discount_codes
    FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Service role discount_usage" ON discount_code_usage
    FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Service role user_profiles" ON user_profiles
    FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Service role points" ON points_transactions
    FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Service role webhooks" ON webhook_logs
    FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Service role audit" ON admin_audit_log
    FOR ALL USING (auth.role() = 'service_role');
```

---

## 4. Price Management System

### 4.1 Scheduled Pricing Overview

The pricing system uses a **schedule-based approach** that allows planning promotions by date range for events like Christmas, New Year, Flash Sales, etc.

```
PRODUCT: Japan eSIM 1GB 7 Days
├── Base Price: $9.99
│
└── SCHEDULED PRICES:
    📅 Dec 20-26: "🎄 Christmas Sale" - 25% OFF → $7.49
    📅 Dec 31:    "🎉 New Year Flash" - 40% OFF → $5.99
    📅 Jan 15-20: "❄️ Winter Sale"   - $2 OFF  → $7.99
```

### 4.2 Price Schedule Configuration

| Field | Type | Description |
|-------|------|-------------|
| `schedule_name` | String | "Christmas Sale 2024", "New Year Flash" |
| `schedule_type` | String | 'discount' or 'price_override' |
| `discount_type` | String | 'percentage' or 'fixed' (for discount type) |
| `discount_value` | Integer | Percentage * 100 or cents |
| `override_price_usd_cents` | Integer | Direct price override (USD) |
| `override_price_idr` | Integer | Direct price override (IDR) |
| `starts_at` | DateTime | When promotion begins |
| `ends_at` | DateTime | When promotion ends |
| `priority` | Integer | Higher = takes precedence on overlap |
| `badge_text` | String | "🎄 Christmas Sale", "⚡ Flash Deal" |
| `badge_color` | String | Badge display color |

### 4.3 Schedule Types

**Discount Type** - Apply percentage or fixed discount to base price:
```sql
-- 25% off Christmas Sale
INSERT INTO price_schedules (package_id, schedule_name, schedule_type, discount_type, discount_value, starts_at, ends_at, badge_text)
VALUES ('pkg-uuid', 'Christmas Sale 2024', 'discount', 'percentage', 2500, '2024-12-20', '2024-12-27', '🎄 25% OFF');

-- $2 off Winter Sale
INSERT INTO price_schedules (package_id, schedule_name, schedule_type, discount_type, discount_value, starts_at, ends_at, badge_text)
VALUES ('pkg-uuid', 'Winter Sale', 'discount', 'fixed', 200, '2025-01-15', '2025-01-21', '❄️ $2 OFF');
```

**Price Override Type** - Set a specific price for the period:
```sql
-- Flash sale with specific price
INSERT INTO price_schedules (package_id, schedule_name, schedule_type, override_price_usd_cents, override_price_idr, starts_at, ends_at, badge_text)
VALUES ('pkg-uuid', 'New Year Flash', 'price_override', 599, 95000, '2024-12-31 00:00', '2025-01-01 00:00', '🎉 FLASH DEAL');
```

### 4.4 Priority & Overlap Handling

When multiple schedules overlap, the one with the **highest priority** wins:

```
Timeline: ─────────────────────────────────────────────────►

Dec 15   │◀──────── Holiday Season (priority: 1) ────────▶│ Jan 5
         │     20% OFF                                      │
         │                                                  │
Dec 24   │    │◀── Christmas Week (priority: 2) ──▶│       │ Dec 27
         │    │     30% OFF (WINS on Dec 24-27)    │       │
         │    │                                    │       │
Dec 31   │    │          │◀ NYE Flash (p:3) ▶│    │       │
         │    │          │  40% OFF (WINS)   │    │       │
```

### 4.5 Base Price Configuration (esim_packages)

| Field | Type | Description |
|-------|------|-------------|
| `base_price_cents` | Integer | Cost from eSIM Access (synced) |
| `price_usd_cents` | Integer | Our base selling price in USD |
| `price_idr` | Integer | Our base selling price in IDR |

**Note:** Final prices are calculated dynamically using `get_package_final_price()` function.

### 4.6 Availability Configuration

| Field | Type | Description |
|-------|------|-------------|
| `is_active` | Boolean | Show in catalog |
| `is_available` | Boolean | Can be purchased |
| `unavailable_reason` | String | "Out of stock", "Coming soon" |
| `available_from` | DateTime | Scheduled availability start |
| `available_until` | DateTime | Limited time offer end |
| `stock_type` | String | 'unlimited' or 'limited' |
| `stock_quantity` | Integer | Available stock if limited |
| `max_per_order` | Integer | Maximum quantity per order |

### 4.7 Price Display Logic

```typescript
interface PackagePrice {
  originalPrice: number;
  finalPrice: number;
  hasDiscount: boolean;
  discountPercentage?: number;
  savingsAmount?: number;
  scheduleName?: string;
  badgeText?: string;
  badgeColor?: string;
  discountEndsAt?: Date;
}

// Fetch price with active schedule from database
const getPackagePrice = async (
  packageId: string,
  currency: 'USD' | 'IDR'
): Promise<PackagePrice> => {
  // Call database function
  const { data } = await supabase
    .rpc('get_package_final_price', { p_package_id: packageId })
    .single();

  if (!data) {
    throw new Error('Package not found');
  }

  const originalPrice = currency === 'USD'
    ? data.original_price_usd_cents
    : data.original_price_idr;

  const finalPrice = currency === 'USD'
    ? data.final_price_usd_cents
    : data.final_price_idr;

  const savingsAmount = currency === 'USD'
    ? data.savings_usd_cents
    : data.savings_idr;

  return {
    originalPrice,
    finalPrice,
    hasDiscount: data.has_discount,
    discountPercentage: data.discount_percentage,
    savingsAmount,
    scheduleName: data.schedule_name,
    badgeText: data.badge_text,
    badgeColor: data.badge_color,
    discountEndsAt: data.discount_ends_at ? new Date(data.discount_ends_at) : undefined
  };
};
```

### 4.8 Admin: View Upcoming Schedules

```typescript
// Get all scheduled promotions for a package (current + upcoming)
const getUpcomingSchedules = async (packageId: string) => {
  const { data } = await supabase
    .rpc('get_package_schedules', { p_package_id: packageId });

  return data.map(schedule => ({
    ...schedule,
    status: schedule.is_current ? 'active' : 'upcoming',
    countdown: schedule.is_current
      ? `Ends ${formatDistanceToNow(schedule.ends_at)}`
      : `Starts ${formatDistanceToNow(schedule.starts_at)}`
  }));
};

/*
Example output:
[
  { schedule_name: "Christmas Sale", status: "active", countdown: "Ends in 3 days" },
  { schedule_name: "New Year Flash", status: "upcoming", countdown: "Starts in 5 days" },
  { schedule_name: "Winter Sale", status: "upcoming", countdown: "Starts in 20 days" }
]
*/
```

### 4.9 Availability Check Logic

```typescript
interface AvailabilityStatus {
  isPurchasable: boolean;
  reason?: string;
  availableAt?: Date;
  stockRemaining?: number;
}

const checkAvailability = (pkg: Package): AvailabilityStatus => {
  if (!pkg.is_active) {
    return { isPurchasable: false, reason: 'Product not available' };
  }

  if (!pkg.is_available) {
    return { isPurchasable: false, reason: pkg.unavailable_reason || 'Not available' };
  }

  if (pkg.available_from && new Date(pkg.available_from) > new Date()) {
    return {
      isPurchasable: false,
      reason: 'Coming soon',
      availableAt: new Date(pkg.available_from)
    };
  }

  if (pkg.available_until && new Date(pkg.available_until) < new Date()) {
    return { isPurchasable: false, reason: 'Offer expired' };
  }

  if (pkg.stock_type === 'limited' && pkg.stock_quantity <= 0) {
    return { isPurchasable: false, reason: 'Out of stock' };
  }

  return {
    isPurchasable: true,
    stockRemaining: pkg.stock_type === 'limited' ? pkg.stock_quantity : undefined
  };
};
```

---

## 5. Discount System

### 5.1 Two Types of Discounts

| Type | Scope | Applied At | Example |
|------|-------|------------|---------|
| **Product Discount** | Single product | Product catalog | "20% off Japan eSIM" |
| **Promo Code** | Entire order | Checkout | "SAVE10" for $10 off |

### 5.2 Discount Stacking Rules

```
Order Subtotal: $50.00
├── Product Discount (10% on Item A): -$5.00
├── Subtotal after product discount: $45.00
├── Promo Code (SAVE10 - $10 off): -$10.00
└── Final Total: $35.00
```

**Stacking Logic:**
1. Product discounts are applied first (per item)
2. Promo codes are applied to subtotal (after product discounts)
3. `stackable_with_product_discount` flag controls if promo can stack

### 5.3 Discount Validation

```typescript
interface DiscountValidation {
  isValid: boolean;
  error?: string;
  discountAmount: number;
  discountDetails?: {
    type: 'percentage' | 'fixed';
    value: number;
    maxDiscount?: number;
  };
}

const validateDiscountCode = async (
  code: string,
  subtotalCents: number,
  userId?: string,
  email?: string,
  hasProductDiscounts: boolean = false
): Promise<DiscountValidation> => {
  const discount = await getDiscountByCode(code);

  if (!discount) {
    return { isValid: false, error: 'Invalid discount code', discountAmount: 0 };
  }

  if (!discount.is_active) {
    return { isValid: false, error: 'This code is no longer active', discountAmount: 0 };
  }

  if (discount.starts_at && new Date(discount.starts_at) > new Date()) {
    return { isValid: false, error: 'This code is not yet active', discountAmount: 0 };
  }

  if (discount.expires_at && new Date(discount.expires_at) < new Date()) {
    return { isValid: false, error: 'This code has expired', discountAmount: 0 };
  }

  if (discount.max_uses && discount.current_uses >= discount.max_uses) {
    return { isValid: false, error: 'This code has reached its usage limit', discountAmount: 0 };
  }

  if (subtotalCents < discount.min_purchase_cents) {
    const minPurchase = (discount.min_purchase_cents / 100).toFixed(2);
    return {
      isValid: false,
      error: `Minimum purchase of $${minPurchase} required`,
      discountAmount: 0
    };
  }

  if (discount.authenticated_only && !userId) {
    return { isValid: false, error: 'This code is for registered users only', discountAmount: 0 };
  }

  if (hasProductDiscounts && !discount.stackable_with_product_discount) {
    return {
      isValid: false,
      error: 'This code cannot be combined with other discounts',
      discountAmount: 0
    };
  }

  // Check per-user usage
  const userUsage = await getDiscountUsage(discount.id, userId, email);
  if (userUsage >= discount.max_uses_per_user) {
    return { isValid: false, error: 'You have already used this code', discountAmount: 0 };
  }

  // Calculate discount amount
  let discountAmount = 0;
  if (discount.discount_type === 'percentage') {
    discountAmount = Math.floor(subtotalCents * discount.discount_value / 10000);
    if (discount.max_discount_cents) {
      discountAmount = Math.min(discountAmount, discount.max_discount_cents);
    }
  } else {
    discountAmount = Math.min(discount.discount_value, subtotalCents);
  }

  return {
    isValid: true,
    discountAmount,
    discountDetails: {
      type: discount.discount_type,
      value: discount.discount_value,
      maxDiscount: discount.max_discount_cents
    }
  };
};
```

---

## 6. Edge Functions (Frontend/Client Only)

> **Architecture Note:** Edge Functions are used exclusively for frontend/client applications.
> Admin Dashboard uses direct Supabase database access via Next.js (see Section 6.5).

### 6.1 Function List

| Function | Method | Auth | Description |
|----------|--------|------|-------------|
| **Public Endpoints** ||||
| `packages-list` | GET | No | List available packages with pricing |
| `checkout-create` | POST | No | Create Paddle checkout session |
| `checkout-validate-discount` | POST | No | Validate promo code |
| **User Endpoints** ||||
| `orders-query` | GET | User | Get user's order history |
| `orders-detail` | GET | User | Get order details with eSIM info |
| `user-points` | GET | User | Get user's points balance |
| **Webhook Endpoints** ||||
| `webhook-paddle` | POST | Signature | Handle Paddle payment webhooks |
| `webhook-esim` | POST | IP Whitelist | Handle eSIM Access webhooks |
| **Background Jobs** ||||
| `cron-sync-packages` | POST | Cron | Sync packages from eSIM Access (every 6h) |
| `cron-expire-points` | POST | Cron | Handle points expiration |
| `cron-process-esim-refunds` | POST | Cron | Process 90-day unused eSIM refunds (daily) |

### 6.2 packages-list Endpoint

```typescript
// GET /functions/v1/packages-list
// Query params: category, region, featured, minPrice, maxPrice

interface PackageListResponse {
  packages: Package[];
  total: number;
  filters: {
    categories: string[];
    regions: string[];
    priceRange: { min: number; max: number };
  };
}

const handler = async (req: Request): Promise<Response> => {
  const url = new URL(req.url);
  const category = url.searchParams.get('category');
  const region = url.searchParams.get('region');
  const featured = url.searchParams.get('featured') === 'true';

  let query = supabase
    .from('esim_packages')
    .select('*')
    .eq('is_active', true)
    .eq('is_available', true)
    .order('sort_order', { ascending: true });

  if (category) query = query.eq('category', category);
  if (region) query = query.contains('location_codes', [region]);
  if (featured) query = query.eq('is_featured', true);

  const { data, error } = await query;

  // Transform data with calculated prices and availability
  const packages = data.map(pkg => ({
    ...pkg,
    pricing: getPackagePrice(pkg, 'USD'),
    availability: checkAvailability(pkg)
  }));

  return new Response(JSON.stringify({ packages }));
};
```

### 6.3 checkout-create Endpoint

```typescript
// POST /functions/v1/checkout-create
interface CheckoutRequest {
  items: Array<{
    package_id: string;
    quantity: number;
  }>;
  customer_email: string;
  customer_name?: string;
  discount_code?: string;
  user_id?: string;  // If authenticated
}

interface CheckoutResponse {
  order_id: string;
  order_number: string;
  checkout_url: string;
  pricing: {
    subtotal: number;
    product_discount: number;
    code_discount: number;
    total: number;
  };
}

const handler = async (req: Request): Promise<Response> => {
  const body: CheckoutRequest = await req.json();

  // 1. Validate all packages exist and are purchasable
  const packages = await validatePackages(body.items);

  // 2. Calculate pricing
  let subtotal = 0;
  let productDiscount = 0;

  const orderItems = packages.map(pkg => {
    const item = body.items.find(i => i.package_id === pkg.id);
    const quantity = item.quantity;

    const unitPrice = pkg.price_usd_cents;
    const finalUnitPrice = pkg.final_price_usd_cents;
    const itemProductDiscount = (unitPrice - finalUnitPrice) * quantity;

    subtotal += unitPrice * quantity;
    productDiscount += itemProductDiscount;

    return {
      package_id: pkg.id,
      package_code: pkg.package_code,
      package_name: pkg.name,
      quantity,
      unit_price_cents: unitPrice,
      product_discount_cents: unitPrice - finalUnitPrice,
      final_unit_price_cents: finalUnitPrice,
      total_cents: finalUnitPrice * quantity
    };
  });

  const subtotalAfterProductDiscount = subtotal - productDiscount;

  // 3. Validate and apply promo code
  let codeDiscount = 0;
  let discountCodeId = null;

  if (body.discount_code) {
    const validation = await validateDiscountCode(
      body.discount_code,
      subtotalAfterProductDiscount,
      body.user_id,
      body.customer_email,
      productDiscount > 0
    );

    if (!validation.isValid) {
      return new Response(JSON.stringify({ error: validation.error }), { status: 400 });
    }

    codeDiscount = validation.discountAmount;
    discountCodeId = (await getDiscountByCode(body.discount_code)).id;
  }

  const total = subtotalAfterProductDiscount - codeDiscount;

  // 4. Create order in database
  const orderNumber = generateOrderNumber();
  const { data: order } = await supabase
    .from('orders')
    .insert({
      order_number: orderNumber,
      user_id: body.user_id,
      customer_email: body.customer_email,
      customer_name: body.customer_name,
      subtotal_cents: subtotal,
      product_discount_cents: productDiscount,
      code_discount_cents: codeDiscount,
      total_discount_cents: productDiscount + codeDiscount,
      total_cents: total,
      discount_code_id: discountCodeId,
      discount_code_used: body.discount_code,
      status: 'pending'
    })
    .select()
    .single();

  // 5. Create order items
  await supabase.from('order_items').insert(
    orderItems.map(item => ({
      ...item,
      order_id: order.id,
      transaction_id: `${orderNumber}-${item.package_code}`
    }))
  );

  // 6. Create Paddle transaction with inline pricing
  const paddleTransaction = await createPaddleTransaction({
    items: orderItems.map(item => ({
      quantity: item.quantity,
      price: {
        description: item.package_name,
        name: `eSIM - ${item.package_name}`,
        unit_price: {
          amount: String(item.final_unit_price_cents),
          currency_code: 'USD'
        },
        product: {
          name: item.package_name,
          tax_category: 'standard',
          description: `eSIM Data Package`
        }
      }
    })),
    currency_code: 'USD',
    custom_data: {
      order_id: order.id,
      order_number: orderNumber
    }
  });

  // 7. Update order with Paddle info
  await supabase
    .from('orders')
    .update({
      paddle_transaction_id: paddleTransaction.data.id,
      paddle_checkout_url: paddleTransaction.data.checkout.url
    })
    .eq('id', order.id);

  return new Response(JSON.stringify({
    order_id: order.id,
    order_number: orderNumber,
    checkout_url: paddleTransaction.data.checkout.url,
    pricing: {
      subtotal,
      product_discount: productDiscount,
      code_discount: codeDiscount,
      total
    }
  }));
};
```

### 6.5 Admin Dashboard (Direct Supabase Access)

> **Important:** Admin Dashboard does NOT use Edge Functions.
> It connects directly to Supabase using the authenticated admin user's session.

#### Architecture Pattern

```
┌─────────────────────────────────────────────────────────────────┐
│                    ADMIN DASHBOARD (Next.js)                     │
│                                                                  │
│  ┌────────────────┐  ┌────────────────┐  ┌────────────────┐    │
│  │   Packages     │  │   Discounts    │  │   Orders       │    │
│  │   Management   │  │   Management   │  │   Management   │    │
│  └───────┬────────┘  └───────┬────────┘  └───────┬────────┘    │
│          │                   │                   │              │
│          └───────────────────┼───────────────────┘              │
│                              ▼                                   │
│                   ┌──────────────────┐                          │
│                   │ Supabase Client  │                          │
│                   │ (anon key + JWT) │                          │
│                   └─────────┬────────┘                          │
└─────────────────────────────┼───────────────────────────────────┘
                              │ Direct DB Access
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                    SUPABASE DATABASE                             │
│                                                                  │
│  RLS Policies check: is_admin() OR has_permission('...')        │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

#### Admin Supabase Client Setup (Next.js)

```typescript
// lib/supabase/admin-client.ts
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { Database } from '@/types/supabase';

// Uses the authenticated user's session (no service_role key needed)
export const createAdminClient = () => {
  return createClientComponentClient<Database>();
};

// Server-side admin client
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

export const createServerAdminClient = () => {
  return createServerComponentClient<Database>({ cookies });
};
```

#### Admin Authentication Flow

```typescript
// middleware.ts - Protect admin routes
import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function middleware(req: NextRequest) {
  const res = NextResponse.next();
  const supabase = createMiddlewareClient({ req, res });

  // Get session
  const { data: { session } } = await supabase.auth.getSession();

  if (!session) {
    return NextResponse.redirect(new URL('/admin/login', req.url));
  }

  // Check if user is admin (RLS will also enforce this)
  const { data: role } = await supabase
    .from('user_roles')
    .select('role')
    .eq('user_id', session.user.id)
    .single();

  if (!role || !['admin', 'super_admin'].includes(role.role)) {
    return NextResponse.redirect(new URL('/unauthorized', req.url));
  }

  return res;
}

export const config = {
  matcher: '/admin/:path*',
};
```

#### Admin CRUD Examples

```typescript
// app/admin/packages/actions.ts
'use server';

import { createServerAdminClient } from '@/lib/supabase/admin-client';
import { revalidatePath } from 'next/cache';

// List all packages (admin sees all, including inactive)
export async function listPackages() {
  const supabase = createServerAdminClient();

  const { data, error } = await supabase
    .from('esim_packages')
    .select(`
      *,
      active_schedule:price_schedules(*)
    `)
    .order('sort_order');

  if (error) throw error;
  return data;
}

// Update package pricing
export async function updatePackagePrice(
  packageId: string,
  priceUsdCents: number,
  priceIdr: number
) {
  const supabase = createServerAdminClient();

  // Get current values for audit
  const { data: current } = await supabase
    .from('esim_packages')
    .select('price_usd_cents, price_idr')
    .eq('id', packageId)
    .single();

  // Update package
  const { error } = await supabase
    .from('esim_packages')
    .update({
      price_usd_cents: priceUsdCents,
      price_idr: priceIdr,
      updated_at: new Date().toISOString()
    })
    .eq('id', packageId);

  if (error) throw error;

  // Log to price history
  const { data: { user } } = await supabase.auth.getUser();
  await supabase.from('price_history').insert({
    package_id: packageId,
    field_changed: 'price_usd_cents',
    old_value: String(current?.price_usd_cents),
    new_value: String(priceUsdCents),
    changed_by: user?.id,
    change_reason: 'Admin price update'
  });

  revalidatePath('/admin/packages');
}

// Create price schedule
export async function createPriceSchedule(data: {
  package_id: string;
  schedule_name: string;
  schedule_type: 'discount' | 'price_override';
  discount_type?: 'percentage' | 'fixed';
  discount_value?: number;
  override_price_usd_cents?: number;
  override_price_idr?: number;
  starts_at: string;
  ends_at: string;
  priority?: number;
  badge_text?: string;
}) {
  const supabase = createServerAdminClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { error } = await supabase
    .from('price_schedules')
    .insert({
      ...data,
      created_by: user?.id
    });

  if (error) throw error;
  revalidatePath('/admin/packages');
}

// Toggle package availability
export async function togglePackageAvailability(
  packageId: string,
  isAvailable: boolean,
  reason?: string
) {
  const supabase = createServerAdminClient();

  const { error } = await supabase
    .from('esim_packages')
    .update({
      is_available: isAvailable,
      unavailable_reason: isAvailable ? null : reason,
      updated_at: new Date().toISOString()
    })
    .eq('id', packageId);

  if (error) throw error;
  revalidatePath('/admin/packages');
}

// Manage discount codes
export async function createDiscountCode(data: {
  code: string;
  name: string;
  discount_type: 'percentage' | 'fixed';
  discount_value: number;
  starts_at?: string;
  expires_at?: string;
  max_uses?: number;
  min_purchase_cents?: number;
}) {
  const supabase = createServerAdminClient();

  const { error } = await supabase
    .from('discount_codes')
    .insert(data);

  if (error) throw error;
  revalidatePath('/admin/discounts');
}

// View orders with full details
export async function getOrderDetails(orderId: string) {
  const supabase = createServerAdminClient();

  const { data, error } = await supabase
    .from('orders')
    .select(`
      *,
      items:order_items(*),
      user:user_profiles(full_name, phone),
      discount:discount_codes(code, name)
    `)
    .eq('id', orderId)
    .single();

  if (error) throw error;
  return data;
}

// Update order status
export async function updateOrderStatus(
  orderId: string,
  status: string
) {
  const supabase = createServerAdminClient();

  const { error } = await supabase
    .from('orders')
    .update({
      status,
      updated_at: new Date().toISOString()
    })
    .eq('id', orderId);

  if (error) throw error;
  revalidatePath('/admin/orders');
}
```

#### Admin Dashboard Features

| Feature | Table Access | Permission |
|---------|--------------|------------|
| Package Management | `esim_packages`, `price_schedules`, `price_history` | `can_manage_packages` |
| Discount Management | `discount_codes`, `discount_code_usage` | `can_manage_discounts` |
| Order Management | `orders`, `order_items` | `can_manage_orders` |
| User Management | `user_profiles`, `user_roles` | `can_manage_users` |
| Analytics | All tables (read) | `can_view_analytics` |
| Audit Logs | `admin_audit_log`, `webhook_logs` | `admin` role |

---

## 7. API Integrations

### 7.1 eSIM Access API

**Base URL:** `https://api.esimaccess.com`

**Authentication Headers:**
```
RT-AccessCode: {accessCode}
RT-Signature: HMAC-SHA256(timestamp + requestId + accessCode + body, secretKey)
RT-Timestamp: {unix_timestamp_ms}
RT-RequestID: {uuid_v4}
```

**Key Endpoints:**

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/v1/open/package/list` | POST | List all packages |
| `/api/v1/open/esim/order` | POST | Order eSIM profiles |
| `/api/v1/open/esim/query` | POST | Query order status |
| `/api/v1/open/esim/cancel` | POST | Cancel order |
| `/api/v1/open/balance/query` | POST | Check balance |

**Webhook Events:**

| Event | Description |
|-------|-------------|
| `ORDER_STATUS` | eSIM ready for download (GOT_RESOURCE) |
| `ESIM_STATUS` | Status change (IN_USE, USED_UP, EXPIRED) |
| `DATA_USAGE` | Data usage alerts (50%, 80%, 90%) |
| `VALIDITY_USAGE` | 1 day before expiry |
| `SMDP_EVENT` | SM-DP+ events (DOWNLOAD, ENABLED, etc.) |

### 7.2 Paddle API

**Base URL:**
- Sandbox: `https://sandbox-api.paddle.com`
- Production: `https://api.paddle.com`

**Authentication:**
```
Authorization: Bearer {api_key}
```

**Non-Catalog Item Transaction:**
```json
{
  "items": [
    {
      "quantity": 1,
      "price": {
        "description": "eSIM Japan 7 Days 1GB",
        "name": "Japan eSIM",
        "unit_price": {
          "amount": "999",
          "currency_code": "USD"
        },
        "product": {
          "name": "Japan eSIM 1GB",
          "tax_category": "standard",
          "description": "7 Days eSIM for Japan"
        }
      }
    }
  ],
  "currency_code": "USD",
  "custom_data": {
    "order_id": "uuid",
    "order_number": "ORD-20241207-XXXXX"
  }
}
```

**Key Webhook Events:**

| Event | Description |
|-------|-------------|
| `transaction.completed` | Payment successful |
| `transaction.payment_failed` | Payment failed |
| `transaction.updated` | Transaction status changed |

---

## 8. Purchase Flow

### 8.1 Complete Flow Diagram

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                              PURCHASE FLOW                                       │
└─────────────────────────────────────────────────────────────────────────────────┘

┌──────────┐     ┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│  Browse  │────▶│    Add to    │────▶│   Checkout   │────▶│   Payment    │
│ Products │     │    Cart      │     │    Page      │     │   (Paddle)   │
└──────────┘     └──────────────┘     └──────────────┘     └──────────────┘
                                             │                      │
                                             ▼                      │
                                      ┌──────────────┐              │
                                      │ Apply Promo  │              │
                                      │    Code      │              │
                                      └──────────────┘              │
                                                                    ▼
┌──────────┐     ┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│  Email   │◀────│   Deliver    │◀────│  Order eSIM  │◀────│   Webhook    │
│  w/ QR   │     │    eSIM      │     │ from Provider│     │   Payment    │
└──────────┘     └──────────────┘     └──────────────┘     │   Success    │
                        │                                   └──────────────┘
                        ▼
                 ┌──────────────┐
                 │  Add Points  │
                 │ (if authed)  │
                 └──────────────┘
```

### 8.2 Status Transitions

```
ORDER STATUS:
pending ──▶ paid ──▶ processing ──▶ completed
    │         │           │
    ▼         ▼           ▼
 cancelled  failed      failed

PAYMENT STATUS:
pending ──▶ completed ──▶ refunded
    │
    ▼
  failed

ESIM STATUS:
pending ──▶ ordered ──▶ got_resource ──▶ in_use ──▶ used_up/expired
    │          │              │
    ▼          ▼              ▼
 cancelled  failed         failed
```

---

## 9. Points System

### 9.1 Earning Rules

| Action | Points | Condition |
|--------|--------|-----------|
| Purchase | $1 = 10 points | Authenticated user |
| First Purchase | +50 bonus | First order only |
| Referral | +100 points | Future feature |

### 9.2 Points Calculation

```typescript
const calculatePointsEarned = async (
  userId: string,
  orderTotalCents: number
): Promise<number> => {
  // Base: 10 points per $1 (100 cents)
  const basePoints = Math.floor(orderTotalCents / 10);

  // Check if first purchase
  const profile = await getUserProfile(userId);
  const isFirstPurchase = profile.total_orders === 0;
  const bonus = isFirstPurchase ? 50 : 0;

  return basePoints + bonus;
};

const creditPoints = async (
  userId: string,
  orderId: string,
  points: number
): Promise<void> => {
  const profile = await getUserProfile(userId);
  const newBalance = profile.points_balance + points;

  // Create transaction record
  await supabase.from('points_transactions').insert({
    user_id: userId,
    type: 'earned',
    amount: points,
    balance_after: newBalance,
    order_id: orderId,
    description: `Points earned from order`
  });

  // Update balance
  await supabase
    .from('user_profiles')
    .update({
      points_balance: newBalance,
      total_points_earned: profile.total_points_earned + points,
      total_orders: profile.total_orders + 1
    })
    .eq('id', userId);
};
```

---

## 10. Webhook Handling

### 10.1 Paddle Webhook Handler

```typescript
// POST /functions/v1/webhook-paddle

const handler = async (req: Request): Promise<Response> => {
  const signature = req.headers.get('Paddle-Signature');
  const body = await req.text();

  // Verify webhook signature
  if (!verifyPaddleSignature(body, signature)) {
    return new Response('Invalid signature', { status: 401 });
  }

  const event = JSON.parse(body);

  // Log webhook
  await logWebhook('paddle', event.event_type, event);

  switch (event.event_type) {
    case 'transaction.completed':
      await handlePaymentSuccess(event.data);
      break;
    case 'transaction.payment_failed':
      await handlePaymentFailed(event.data);
      break;
  }

  return new Response('OK');
};

const handlePaymentSuccess = async (transaction: PaddleTransaction) => {
  const orderId = transaction.custom_data.order_id;

  // Update order status
  await supabase
    .from('orders')
    .update({
      status: 'paid',
      payment_status: 'completed',
      paddle_customer_id: transaction.customer_id,
      paid_at: new Date().toISOString()
    })
    .eq('id', orderId);

  // Get order items
  const { data: items } = await supabase
    .from('order_items')
    .select('*')
    .eq('order_id', orderId);

  // Order eSIM for each item
  for (const item of items) {
    await orderEsimFromProvider(item);
  }

  // Update discount code usage
  const { data: order } = await supabase
    .from('orders')
    .select('discount_code_id')
    .eq('id', orderId)
    .single();

  if (order.discount_code_id) {
    await supabase.rpc('increment_discount_usage', {
      discount_id: order.discount_code_id
    });
  }
};
```

### 10.2 eSIM Access Webhook Handler

```typescript
// POST /functions/v1/webhook-esim

const ALLOWED_IPS = [
  '3.1.131.226', '54.254.74.88', '18.136.190.97',
  '18.136.60.197', '18.136.19.137'
];

const handler = async (req: Request): Promise<Response> => {
  // Verify IP
  const clientIP = req.headers.get('x-forwarded-for')?.split(',')[0];
  if (!ALLOWED_IPS.includes(clientIP)) {
    return new Response('Forbidden', { status: 403 });
  }

  const event = await req.json();
  await logWebhook('esim_access', event.notifyType, event);

  switch (event.notifyType) {
    case 'ORDER_STATUS':
      if (event.content.orderStatus === 'GOT_RESOURCE') {
        await handleEsimReady(event.content);
      }
      break;
    case 'ESIM_STATUS':
      await handleEsimStatusChange(event.content);
      break;
    case 'DATA_USAGE':
      await handleDataUsageAlert(event.content);
      break;
  }

  return new Response('OK');
};

const handleEsimReady = async (content: EsimOrderContent) => {
  // Query eSIM details
  const esimDetails = await queryEsimDetails(content.orderNo);

  // Update order item with eSIM data
  await supabase
    .from('order_items')
    .update({
      status: 'got_resource',
      iccid: esimDetails.iccid,
      qr_code: esimDetails.qrCodeUrl,
      sm_dp_address: esimDetails.smdpAddress,
      activation_code: esimDetails.activationCode
    })
    .eq('esim_order_no', content.orderNo);

  // Check if all items delivered
  const order = await checkOrderCompletion(content.orderNo);

  if (order.allItemsDelivered) {
    // Update order status
    await supabase
      .from('orders')
      .update({
        status: 'completed',
        esim_status: 'delivered',
        completed_at: new Date().toISOString()
      })
      .eq('id', order.id);

    // Credit points if authenticated user
    if (order.user_id) {
      const points = await calculatePointsEarned(order.user_id, order.total_cents);
      await creditPoints(order.user_id, order.id, points);
    }

    // Send delivery email
    await sendDeliveryEmail(order);
  }
};
```

---

## 11. 90-Day eSIM Refund System

### 11.1 Overview

Business Rule: eSIM profiles that remain unused (not installed/activated) for 90 days after becoming ready are automatically expired and refunded to eSIM Access.

```
TIMELINE:
Purchase → Payment → Order eSIM → GOT_RESOURCE → 90 Days → Auto-Cancel & Refund
                                       │
                                       ├─ User installs eSIM → NOT eligible for refund
                                       │   (SMDP_EVENT: DOWNLOAD/INSTALLED/ENABLED)
                                       │
                                       └─ User doesn't install → ELIGIBLE for refund
                                           (smdp_status remains 'released')
```

### 11.2 eSIM Access Cancel API

**Endpoint:** `POST /api/v1/open/esim/cancel`

**Request:**
```json
{
  "esimTranNo": "23120118156818"
}
```

**Cancelability Conditions:**
| Condition | Required Value |
|-----------|----------------|
| `esimStatus` | `GOT_RESOURCE` |
| `smdpStatus` | `RELEASED` |

**Effect:** The eSIM price is refunded to merchant's eSIM Access balance.

**Not Cancelable When:**
- User has downloaded the eSIM (smdpStatus = `DOWNLOADED`)
- User has installed the eSIM (smdpStatus = `INSTALLED`)
- User has enabled the eSIM (smdpStatus = `ENABLED`)
- eSIM is in use, expired, or already cancelled

### 11.3 SMDP Event Tracking

The SMDP_EVENT webhook tracks user's eSIM installation lifecycle:

| Event | Description | smdp_status |
|-------|-------------|-------------|
| `RELEASED` | eSIM ready for download | `released` |
| `DOWNLOAD` | User initiated download | `downloaded` |
| `INSTALLED` | Profile installed on device | `installed` |
| `ENABLED` | Profile activated/enabled | `enabled` |
| `DELETED` | Profile deleted from device | `deleted` |

**Webhook Handler Update:**

```typescript
// Handle SMDP_EVENT webhook
const handleSmdpEvent = async (content: SmdpEventContent) => {
  const { esimTranNo, smdpStatus } = content;

  const updateData: Record<string, any> = {
    smdp_status: smdpStatus.toLowerCase(),
    updated_at: new Date().toISOString()
  };

  // Track timestamps for each status change
  switch (smdpStatus) {
    case 'DOWNLOAD':
      updateData.downloaded_at = new Date().toISOString();
      updateData.refund_status = 'not_refundable'; // User downloaded, no longer eligible
      break;
    case 'INSTALLED':
      updateData.installed_at = new Date().toISOString();
      updateData.refund_status = 'not_refundable';
      break;
    case 'ENABLED':
      updateData.enabled_at = new Date().toISOString();
      updateData.refund_status = 'not_refundable';
      break;
  }

  await supabase
    .from('esim_profiles')
    .update(updateData)
    .eq('esim_tran_no', esimTranNo);
};
```

### 11.4 Refund Status Flow

```
REFUND STATUS TRANSITIONS:

not_eligible ──► eligible ──► processing ──► refunded
     │               │              │
     │               │              └─► failed (retry later)
     │               │
     │               └─► not_refundable (user installed eSIM)
     │
     └─► (set to 'eligible' when resource_ready_at + 90 days reached)
```

**Status Definitions:**

| Status | Description |
|--------|-------------|
| `not_eligible` | Less than 90 days since resource ready |
| `eligible` | 90 days passed, smdp_status is still 'released' |
| `processing` | Cancel API call in progress |
| `refunded` | Successfully refunded to eSIM Access balance |
| `not_refundable` | User installed eSIM, cannot be cancelled |
| `failed` | Cancel API failed, will retry |

### 11.5 Refund Eligibility Logic

```typescript
// Set refund_eligible_at when eSIM becomes ready
const handleEsimReady = async (content: EsimOrderContent) => {
  const esimDetails = await queryEsimDetails(content.orderNo);
  const now = new Date();
  const refundEligibleAt = new Date(now.getTime() + 90 * 24 * 60 * 60 * 1000); // 90 days

  // Create esim_profile record
  await supabase.from('esim_profiles').insert({
    order_item_id: orderItem.id,
    order_id: orderItem.order_id,
    esim_tran_no: esimDetails.esimTranNo,
    esim_order_no: content.orderNo,
    iccid: esimDetails.iccid,
    qr_code: esimDetails.qrCodeUrl,
    sm_dp_address: esimDetails.smdpAddress,
    activation_code: esimDetails.activationCode,
    esim_status: 'got_resource',
    smdp_status: 'released',
    resource_ready_at: now.toISOString(),
    refund_eligible_at: refundEligibleAt.toISOString(),
    refund_status: 'not_eligible',
    data_total_bytes: esimDetails.totalVolume,
    expires_at: esimDetails.expireDate,
    profile_index: profileIndex
  });
};
```

### 11.6 Daily Refund Cron Job

**Edge Function:** `cron-process-esim-refunds`
**Schedule:** Daily at 00:00 UTC

```typescript
// POST /functions/v1/cron-process-esim-refunds

const handler = async (req: Request): Promise<Response> => {
  const now = new Date();

  // 1. Update eligible status for profiles that reached 90 days
  await supabase
    .from('esim_profiles')
    .update({
      refund_status: 'eligible',
      updated_at: now.toISOString()
    })
    .eq('refund_status', 'not_eligible')
    .eq('smdp_status', 'released')
    .eq('esim_status', 'got_resource')
    .lte('refund_eligible_at', now.toISOString());

  // 2. Get all profiles eligible for refund (batched)
  const { data: eligibleProfiles } = await supabase
    .from('esim_profiles')
    .select('*')
    .eq('refund_status', 'eligible')
    .limit(100); // Process in batches

  const results = {
    processed: 0,
    refunded: 0,
    failed: 0,
    not_cancelable: 0
  };

  for (const profile of eligibleProfiles || []) {
    results.processed++;

    try {
      // Mark as processing
      await supabase
        .from('esim_profiles')
        .update({ refund_status: 'processing' })
        .eq('id', profile.id);

      // Call eSIM Access Cancel API
      const cancelResult = await cancelEsimProfile(profile.esim_tran_no);

      if (cancelResult.success) {
        // Get the refund amount from package info
        const refundAmount = await getPackageBasePriceCents(profile.order_item_id);

        await supabase
          .from('esim_profiles')
          .update({
            refund_status: 'refunded',
            refunded_at: now.toISOString(),
            refund_amount_cents: refundAmount,
            esim_status: 'cancelled'
          })
          .eq('id', profile.id);

        // Update order_item cancelled count
        await supabase.rpc('increment_profile_cancelled', {
          item_id: profile.order_item_id
        });

        results.refunded++;

        // Log successful refund
        await logRefundEvent(profile, 'success', refundAmount);
      } else {
        // Cancel failed - profile may no longer be cancelable
        const newStatus = cancelResult.reason === 'NOT_CANCELABLE'
          ? 'not_refundable'
          : 'failed';

        await supabase
          .from('esim_profiles')
          .update({ refund_status: newStatus })
          .eq('id', profile.id);

        if (newStatus === 'not_refundable') {
          results.not_cancelable++;
        } else {
          results.failed++;
        }

        await logRefundEvent(profile, 'failed', null, cancelResult.error);
      }
    } catch (error) {
      await supabase
        .from('esim_profiles')
        .update({ refund_status: 'failed' })
        .eq('id', profile.id);

      results.failed++;
      await logRefundEvent(profile, 'error', null, error.message);
    }
  }

  return new Response(JSON.stringify({
    success: true,
    results,
    timestamp: now.toISOString()
  }));
};

// Helper: Call eSIM Access Cancel API
const cancelEsimProfile = async (esimTranNo: string): Promise<{
  success: boolean;
  reason?: string;
  error?: string;
}> => {
  try {
    const response = await fetch(`${ESIM_API_URL}/api/v1/open/esim/cancel`, {
      method: 'POST',
      headers: getEsimAccessHeaders(),
      body: JSON.stringify({ esimTranNo })
    });

    const result = await response.json();

    if (result.success || result.code === '0') {
      return { success: true };
    }

    // Check if not cancelable (user already downloaded)
    if (result.code === 'ESIM_NOT_CANCELABLE' || result.code === '1001') {
      return { success: false, reason: 'NOT_CANCELABLE', error: result.message };
    }

    return { success: false, error: result.message };
  } catch (error) {
    return { success: false, error: error.message };
  }
};
```

### 11.7 Database Helper Function

```sql
-- Increment cancelled profile count on order_item
CREATE OR REPLACE FUNCTION increment_profile_cancelled(item_id UUID)
RETURNS VOID AS $$
BEGIN
    UPDATE order_items
    SET profiles_cancelled = profiles_cancelled + 1,
        updated_at = NOW()
    WHERE id = item_id;
END;
$$ LANGUAGE plpgsql;

-- Get summary of refund-eligible profiles
CREATE OR REPLACE FUNCTION get_refund_summary()
RETURNS TABLE (
    status VARCHAR(20),
    count BIGINT,
    total_value_cents BIGINT
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        ep.refund_status,
        COUNT(*)::BIGINT,
        COALESCE(SUM(ep.refund_amount_cents), 0)::BIGINT
    FROM esim_profiles ep
    WHERE ep.refund_status IN ('eligible', 'processing', 'refunded', 'failed')
    GROUP BY ep.refund_status;
END;
$$ LANGUAGE plpgsql;
```

### 11.8 Admin Dashboard: Refund Monitoring

```typescript
// View refund statistics
export async function getRefundStats() {
  const supabase = createServerAdminClient();

  // Get summary counts
  const { data: summary } = await supabase.rpc('get_refund_summary');

  // Get recent refunds
  const { data: recentRefunds } = await supabase
    .from('esim_profiles')
    .select(`
      *,
      order_item:order_items(package_name),
      order:orders(order_number, customer_email)
    `)
    .in('refund_status', ['refunded', 'processing', 'failed'])
    .order('updated_at', { ascending: false })
    .limit(50);

  // Get upcoming refund-eligible profiles
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 7);

  const { data: upcoming } = await supabase
    .from('esim_profiles')
    .select('*')
    .eq('refund_status', 'not_eligible')
    .eq('smdp_status', 'released')
    .lte('refund_eligible_at', tomorrow.toISOString())
    .order('refund_eligible_at');

  return { summary, recentRefunds, upcoming };
}

// Manual trigger for specific profile
export async function manualRefundProfile(profileId: string) {
  const supabase = createServerAdminClient();

  // Get profile and verify it's eligible
  const { data: profile } = await supabase
    .from('esim_profiles')
    .select('*')
    .eq('id', profileId)
    .single();

  if (!profile || profile.smdp_status !== 'released') {
    throw new Error('Profile not eligible for refund');
  }

  // Trigger refund (same logic as cron job)
  // ... implementation
}
```

### 11.9 Notification System (Optional)

```typescript
// Notify admin when refunds are processed
const notifyRefundSummary = async (results: RefundResults) => {
  if (results.refunded > 0 || results.failed > 0) {
    // Send Slack/Email notification to admin
    await sendAdminNotification({
      type: 'REFUND_SUMMARY',
      data: {
        date: new Date().toISOString(),
        processed: results.processed,
        refunded: results.refunded,
        failed: results.failed,
        not_cancelable: results.not_cancelable
      }
    });
  }
};

// Warn customers before refund (optional - 7 days before)
const warnPendingRefund = async () => {
  const warningDate = new Date();
  warningDate.setDate(warningDate.getDate() + 7);

  const { data: profiles } = await supabase
    .from('esim_profiles')
    .select(`
      *,
      order:orders(customer_email, customer_name)
    `)
    .eq('refund_status', 'not_eligible')
    .eq('smdp_status', 'released')
    .lte('refund_eligible_at', warningDate.toISOString())
    .gt('refund_eligible_at', new Date().toISOString());

  for (const profile of profiles || []) {
    await sendCustomerEmail({
      to: profile.order.customer_email,
      template: 'esim-expiry-warning',
      data: {
        customerName: profile.order.customer_name,
        expiryDate: profile.refund_eligible_at,
        qrCode: profile.qr_code
      }
    });
  }
};
```

---

## 12. Security

### 12.1 Authentication & Authorization

| Role | Access Method | Permissions |
|------|---------------|-------------|
| **Public** | Edge Functions | Read active packages, create checkout |
| **Guest** | Edge Functions | Complete purchases (no auth required) |
| **Authenticated User** | Edge Functions | View own orders, points, profile |
| **Admin** | Direct Supabase | Manage packages, pricing, discounts, orders |
| **Super Admin** | Direct Supabase | All admin + user role management |

### 12.2 Role-Based Access Control (RBAC)

```typescript
// user_roles table defines granular permissions
interface UserRole {
  role: 'user' | 'admin' | 'super_admin';

  // Granular permissions
  can_manage_packages: boolean;   // Edit packages, prices, schedules
  can_manage_discounts: boolean;  // CRUD discount codes
  can_manage_orders: boolean;     // View/update orders
  can_view_analytics: boolean;    // Access dashboard analytics
  can_manage_users: boolean;      // User & role management (super_admin)
}

// RLS helper functions enforce access
// is_admin() - Checks if user has admin or super_admin role
// has_permission(name) - Checks specific permission flag
```

### 12.3 Access Patterns

| Pattern | Client | Auth | Database Access |
|---------|--------|------|-----------------|
| **Frontend** | Customer Website | Optional (JWT) | Via Edge Functions (service_role) |
| **Admin** | Admin Dashboard | Required (JWT) | Direct via RLS (is_admin check) |
| **Webhooks** | External Services | Signature/IP | Via Edge Functions (service_role) |
| **Cron Jobs** | Scheduled | Service Key | Via Edge Functions (service_role) |

### 12.4 Webhook Verification

**Paddle:**
```typescript
const verifyPaddleSignature = (
  payload: string,
  signature: string
): boolean => {
  const [timestampPart, hashPart] = signature.split(';');
  const timestamp = timestampPart.split('=')[1];
  const hash = hashPart.split('=')[1];

  const signedPayload = `${timestamp}:${payload}`;
  const expectedHash = crypto
    .createHmac('sha256', PADDLE_WEBHOOK_SECRET)
    .update(signedPayload)
    .digest('hex');

  return hash === expectedHash;
};
```

**eSIM Access:**
```typescript
const verifyEsimWebhook = (clientIP: string): boolean => {
  return ALLOWED_IPS.includes(clientIP);
};
```

### 12.5 API Key Management

```env
# Supabase
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_ANON_KEY=xxx
SUPABASE_SERVICE_ROLE_KEY=xxx

# Paddle
PADDLE_API_KEY=xxx
PADDLE_WEBHOOK_SECRET=xxx
PADDLE_ENVIRONMENT=sandbox

# eSIM Access
ESIM_ACCESS_CODE=xxx
ESIM_SECRET_KEY=xxx
ESIM_API_URL=https://api.esimaccess.com

# App
APP_URL=https://hiroam.com
```

---

## 13. Email System (SendGrid)

### 13.1 Overview

Email is a critical component for eSIM delivery and customer communication. We use SendGrid for transactional emails.

```
EMAIL FLOW:
┌─────────────────────────────────────────────────────────────┐
│                      EMAIL TRIGGERS                          │
├─────────────────────────────────────────────────────────────┤
│  Order Confirmed   → Order confirmation email               │
│  eSIM Ready        → eSIM delivery email (QR code)          │
│  7 Days to Refund  → Expiry warning email                   │
│  eSIM Refunded     → Refund notification email              │
│  Data Usage Alert  → Usage notification (50%, 80%, 90%)     │
│  eSIM Expiring     → 1 day before expiry reminder           │
└─────────────────────────────────────────────────────────────┘
```

### 13.2 SendGrid Configuration

**Environment Variables:**
```env
# SendGrid
SENDGRID_API_KEY=SG.xxxxxxxxxxxxxxxxxxxx
SENDGRID_FROM_EMAIL=noreply@hiroam.com
SENDGRID_FROM_NAME=HIROAM
SENDGRID_TEMPLATE_ORDER_CONFIRMATION=d-xxxxxxxxxxxx
SENDGRID_TEMPLATE_ESIM_DELIVERY=d-xxxxxxxxxxxx
SENDGRID_TEMPLATE_EXPIRY_WARNING=d-xxxxxxxxxxxx
SENDGRID_TEMPLATE_USAGE_ALERT=d-xxxxxxxxxxxx
```

### 13.3 Email Templates

#### Template IDs & Dynamic Data

| Template | Purpose | Dynamic Variables |
|----------|---------|-------------------|
| `order_confirmation` | Order placed, pending payment | `order_number`, `customer_name`, `items[]`, `total`, `checkout_url` |
| `esim_delivery` | eSIM ready for installation | `customer_name`, `package_name`, `qr_code_url`, `manual_code`, `sm_dp_address`, `activation_code`, `instructions_url` |
| `expiry_warning` | 7 days before 90-day refund | `customer_name`, `package_name`, `qr_code_url`, `expiry_date`, `days_remaining` |
| `refund_notification` | eSIM was refunded | `customer_name`, `package_name`, `refund_reason` |
| `usage_alert` | Data usage threshold reached | `customer_name`, `package_name`, `usage_percentage`, `data_remaining` |
| `expiry_reminder` | eSIM expiring in 1 day | `customer_name`, `package_name`, `expiry_date` |

### 13.4 SendGrid Client Implementation

```typescript
// supabase/functions/_shared/sendgrid.ts

const SENDGRID_API_KEY = Deno.env.get('SENDGRID_API_KEY')!;
const SENDGRID_FROM_EMAIL = Deno.env.get('SENDGRID_FROM_EMAIL') || 'noreply@hiroam.com';
const SENDGRID_FROM_NAME = Deno.env.get('SENDGRID_FROM_NAME') || 'HIROAM';

interface SendGridEmailRequest {
  to: string;
  templateId: string;
  dynamicData: Record<string, any>;
  subject?: string;
}

interface SendGridResponse {
  success: boolean;
  messageId?: string;
  error?: string;
}

export const sendEmail = async (request: SendGridEmailRequest): Promise<SendGridResponse> => {
  try {
    const response = await fetch('https://api.sendgrid.com/v3/mail/send', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${SENDGRID_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        personalizations: [
          {
            to: [{ email: request.to }],
            dynamic_template_data: request.dynamicData,
          },
        ],
        from: {
          email: SENDGRID_FROM_EMAIL,
          name: SENDGRID_FROM_NAME,
        },
        template_id: request.templateId,
      }),
    });

    if (response.status === 202) {
      const messageId = response.headers.get('X-Message-Id');
      return { success: true, messageId: messageId || undefined };
    }

    const errorBody = await response.text();
    console.error('SendGrid error:', errorBody);
    return { success: false, error: errorBody };
  } catch (error) {
    console.error('SendGrid exception:', error);
    return { success: false, error: error.message };
  }
};

// Convenience functions for each email type
export const sendOrderConfirmation = async (
  email: string,
  data: {
    orderNumber: string;
    customerName: string;
    items: Array<{ name: string; quantity: number; price: number }>;
    total: number;
    checkoutUrl: string;
  }
) => {
  return sendEmail({
    to: email,
    templateId: Deno.env.get('SENDGRID_TEMPLATE_ORDER_CONFIRMATION')!,
    dynamicData: {
      order_number: data.orderNumber,
      customer_name: data.customerName,
      items: data.items,
      total: (data.total / 100).toFixed(2),
      checkout_url: data.checkoutUrl,
    },
  });
};

export const sendEsimDelivery = async (
  email: string,
  data: {
    customerName: string;
    packageName: string;
    qrCodeUrl: string;
    manualCode: string;
    smDpAddress: string;
    activationCode: string;
    iccid: string;
  }
) => {
  return sendEmail({
    to: email,
    templateId: Deno.env.get('SENDGRID_TEMPLATE_ESIM_DELIVERY')!,
    dynamicData: {
      customer_name: data.customerName,
      package_name: data.packageName,
      qr_code_url: data.qrCodeUrl,
      manual_code: data.manualCode,
      sm_dp_address: data.smDpAddress,
      activation_code: data.activationCode,
      iccid: data.iccid,
      instructions_url: `${Deno.env.get('APP_URL')}/help/install-esim`,
    },
  });
};

export const sendExpiryWarning = async (
  email: string,
  data: {
    customerName: string;
    packageName: string;
    qrCodeUrl: string;
    expiryDate: string;
    daysRemaining: number;
  }
) => {
  return sendEmail({
    to: email,
    templateId: Deno.env.get('SENDGRID_TEMPLATE_EXPIRY_WARNING')!,
    dynamicData: {
      customer_name: data.customerName,
      package_name: data.packageName,
      qr_code_url: data.qrCodeUrl,
      expiry_date: data.expiryDate,
      days_remaining: data.daysRemaining,
    },
  });
};

export const sendUsageAlert = async (
  email: string,
  data: {
    customerName: string;
    packageName: string;
    usagePercentage: number;
    dataRemaining: string;
  }
) => {
  return sendEmail({
    to: email,
    templateId: Deno.env.get('SENDGRID_TEMPLATE_USAGE_ALERT')!,
    dynamicData: {
      customer_name: data.customerName,
      package_name: data.packageName,
      usage_percentage: data.usagePercentage,
      data_remaining: data.dataRemaining,
    },
  });
};
```

### 13.5 Email Logging Table

```sql
-- Track all sent emails for debugging and analytics
CREATE TABLE email_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- Recipient
    to_email VARCHAR(255) NOT NULL,

    -- Email details
    template_id VARCHAR(100) NOT NULL,
    template_name VARCHAR(50) NOT NULL,        -- 'order_confirmation', 'esim_delivery', etc.

    -- Related entities
    order_id UUID REFERENCES orders(id),
    esim_profile_id UUID REFERENCES esim_profiles(id),

    -- SendGrid response
    sendgrid_message_id VARCHAR(100),
    status VARCHAR(20) DEFAULT 'sent',          -- 'sent', 'delivered', 'bounced', 'failed'

    -- Error tracking
    error_message TEXT,
    retry_count INTEGER DEFAULT 0,

    -- Metadata
    dynamic_data JSONB,

    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_email_logs_order ON email_logs(order_id);
CREATE INDEX idx_email_logs_template ON email_logs(template_name);
CREATE INDEX idx_email_logs_status ON email_logs(status);

-- RLS
ALTER TABLE email_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Service role email_logs" ON email_logs
    FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Admin view email_logs" ON email_logs
    FOR SELECT USING (is_admin());
```

### 13.6 Email Edge Function

```typescript
// supabase/functions/email-send/index.ts
// Internal function called by other Edge Functions

import { sendEmail, sendEsimDelivery, sendOrderConfirmation } from '../_shared/sendgrid.ts';
import { createClient } from '../_shared/supabase.ts';

interface EmailRequest {
  type: 'order_confirmation' | 'esim_delivery' | 'expiry_warning' | 'usage_alert';
  to: string;
  data: Record<string, any>;
  orderId?: string;
  esimProfileId?: string;
}

const handler = async (req: Request): Promise<Response> => {
  // Verify internal call (from other Edge Functions)
  const authHeader = req.headers.get('Authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    return new Response('Unauthorized', { status: 401 });
  }

  const body: EmailRequest = await req.json();
  const supabase = createClient();

  let result;
  let templateName = body.type;

  switch (body.type) {
    case 'order_confirmation':
      result = await sendOrderConfirmation(body.to, body.data);
      break;
    case 'esim_delivery':
      result = await sendEsimDelivery(body.to, body.data);
      break;
    // ... other types
    default:
      return new Response(JSON.stringify({ error: 'Unknown email type' }), { status: 400 });
  }

  // Log email
  await supabase.from('email_logs').insert({
    to_email: body.to,
    template_id: Deno.env.get(`SENDGRID_TEMPLATE_${body.type.toUpperCase()}`),
    template_name: templateName,
    order_id: body.orderId,
    esim_profile_id: body.esimProfileId,
    sendgrid_message_id: result.messageId,
    status: result.success ? 'sent' : 'failed',
    error_message: result.error,
    dynamic_data: body.data,
  });

  if (!result.success) {
    return new Response(JSON.stringify({ error: result.error }), { status: 500 });
  }

  return new Response(JSON.stringify({ success: true, messageId: result.messageId }));
};

Deno.serve(handler);
```

---

## 14. Error Handling & Resilience

### 14.1 Error Handling Strategy

```
ERROR HANDLING LAYERS:
┌─────────────────────────────────────────────────────────────┐
│  Layer 1: Input Validation (Zod schemas)                    │
│  ├── Validate request body structure                        │
│  └── Return 400 with specific validation errors             │
├─────────────────────────────────────────────────────────────┤
│  Layer 2: Business Logic Errors                             │
│  ├── Check preconditions (package available, discount valid)│
│  └── Return 4xx with business error codes                   │
├─────────────────────────────────────────────────────────────┤
│  Layer 3: External API Errors (Paddle, eSIM Access)         │
│  ├── Retry with exponential backoff                         │
│  ├── Circuit breaker for persistent failures                │
│  └── Return 503 with retry-after header                     │
├─────────────────────────────────────────────────────────────┤
│  Layer 4: Unexpected Errors                                 │
│  ├── Log full error details                                 │
│  ├── Return generic 500 (no internal details exposed)       │
│  └── Alert monitoring system                                │
└─────────────────────────────────────────────────────────────┘
```

### 14.2 Standard Error Response Format

```typescript
// Error response structure
interface ErrorResponse {
  success: false;
  error: {
    code: string;           // Machine-readable code
    message: string;        // Human-readable message
    details?: any;          // Additional context (validation errors, etc.)
    requestId?: string;     // For debugging
  };
}

// Error codes
const ERROR_CODES = {
  // Validation errors (400)
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  INVALID_PACKAGE: 'INVALID_PACKAGE',
  INVALID_QUANTITY: 'INVALID_QUANTITY',
  INVALID_DISCOUNT: 'INVALID_DISCOUNT',

  // Business errors (4xx)
  PACKAGE_UNAVAILABLE: 'PACKAGE_UNAVAILABLE',
  DISCOUNT_EXPIRED: 'DISCOUNT_EXPIRED',
  DISCOUNT_LIMIT_REACHED: 'DISCOUNT_LIMIT_REACHED',
  ORDER_NOT_FOUND: 'ORDER_NOT_FOUND',
  INSUFFICIENT_STOCK: 'INSUFFICIENT_STOCK',

  // Auth errors (401, 403)
  UNAUTHORIZED: 'UNAUTHORIZED',
  FORBIDDEN: 'FORBIDDEN',

  // External API errors (502, 503)
  PADDLE_ERROR: 'PADDLE_ERROR',
  ESIM_API_ERROR: 'ESIM_API_ERROR',
  EMAIL_ERROR: 'EMAIL_ERROR',

  // Server errors (500)
  INTERNAL_ERROR: 'INTERNAL_ERROR',
  DATABASE_ERROR: 'DATABASE_ERROR',
} as const;
```

### 14.3 Retry Logic with Exponential Backoff

```typescript
// supabase/functions/_shared/retry.ts

interface RetryOptions {
  maxRetries: number;
  baseDelayMs: number;
  maxDelayMs: number;
  retryableStatuses?: number[];
}

const DEFAULT_OPTIONS: RetryOptions = {
  maxRetries: 3,
  baseDelayMs: 1000,
  maxDelayMs: 10000,
  retryableStatuses: [408, 429, 500, 502, 503, 504],
};

export const withRetry = async <T>(
  fn: () => Promise<T>,
  options: Partial<RetryOptions> = {}
): Promise<T> => {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  let lastError: Error | null = null;

  for (let attempt = 0; attempt <= opts.maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;

      // Check if we should retry
      const isRetryable = error instanceof Response
        ? opts.retryableStatuses?.includes(error.status)
        : true;

      if (!isRetryable || attempt === opts.maxRetries) {
        throw error;
      }

      // Calculate delay with exponential backoff + jitter
      const delay = Math.min(
        opts.baseDelayMs * Math.pow(2, attempt) + Math.random() * 1000,
        opts.maxDelayMs
      );

      console.log(`Retry attempt ${attempt + 1}/${opts.maxRetries} after ${delay}ms`);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }

  throw lastError;
};

// Specialized retry for external APIs
export const withApiRetry = <T>(fn: () => Promise<T>) =>
  withRetry(fn, { maxRetries: 3, baseDelayMs: 1000 });

export const withWebhookRetry = <T>(fn: () => Promise<T>) =>
  withRetry(fn, { maxRetries: 5, baseDelayMs: 2000, maxDelayMs: 30000 });
```

### 14.4 Circuit Breaker Pattern

```typescript
// supabase/functions/_shared/circuit-breaker.ts

interface CircuitBreakerState {
  failures: number;
  lastFailure: number;
  state: 'closed' | 'open' | 'half-open';
}

// In-memory circuit state (per Edge Function instance)
const circuits = new Map<string, CircuitBreakerState>();

const FAILURE_THRESHOLD = 5;
const RESET_TIMEOUT_MS = 60000; // 1 minute

export const withCircuitBreaker = async <T>(
  circuitName: string,
  fn: () => Promise<T>
): Promise<T> => {
  let circuit = circuits.get(circuitName);

  if (!circuit) {
    circuit = { failures: 0, lastFailure: 0, state: 'closed' };
    circuits.set(circuitName, circuit);
  }

  // Check if circuit is open
  if (circuit.state === 'open') {
    const timeSinceFailure = Date.now() - circuit.lastFailure;

    if (timeSinceFailure < RESET_TIMEOUT_MS) {
      throw new Error(`Circuit ${circuitName} is open. Retry after ${RESET_TIMEOUT_MS - timeSinceFailure}ms`);
    }

    // Try half-open
    circuit.state = 'half-open';
  }

  try {
    const result = await fn();

    // Success - reset circuit
    circuit.failures = 0;
    circuit.state = 'closed';

    return result;
  } catch (error) {
    circuit.failures++;
    circuit.lastFailure = Date.now();

    if (circuit.failures >= FAILURE_THRESHOLD) {
      circuit.state = 'open';
      console.error(`Circuit ${circuitName} opened after ${circuit.failures} failures`);
    }

    throw error;
  }
};
```

### 14.5 Idempotency Keys

```sql
-- Idempotency tracking table
CREATE TABLE idempotency_keys (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    idempotency_key VARCHAR(100) UNIQUE NOT NULL,

    -- Request info
    endpoint VARCHAR(100) NOT NULL,
    request_hash VARCHAR(64) NOT NULL,          -- SHA256 of request body

    -- Response
    response_status INTEGER,
    response_body JSONB,

    -- Tracking
    created_at TIMESTAMPTZ DEFAULT NOW(),
    expires_at TIMESTAMPTZ DEFAULT NOW() + INTERVAL '24 hours'
);

-- Index for lookup
CREATE INDEX idx_idempotency_key ON idempotency_keys(idempotency_key);

-- Auto-cleanup expired keys
CREATE INDEX idx_idempotency_expires ON idempotency_keys(expires_at);
```

```typescript
// supabase/functions/_shared/idempotency.ts

import { createClient } from './supabase.ts';
import { createHash } from 'https://deno.land/std/crypto/mod.ts';

interface IdempotentResult<T> {
  isReplay: boolean;
  data: T;
}

export const withIdempotency = async <T>(
  idempotencyKey: string | null,
  endpoint: string,
  requestBody: any,
  fn: () => Promise<T>
): Promise<IdempotentResult<T>> => {
  // If no idempotency key, just execute
  if (!idempotencyKey) {
    return { isReplay: false, data: await fn() };
  }

  const supabase = createClient();

  // Hash the request body for verification
  const encoder = new TextEncoder();
  const data = encoder.encode(JSON.stringify(requestBody));
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const requestHash = Array.from(new Uint8Array(hashBuffer))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');

  // Check for existing key
  const { data: existing } = await supabase
    .from('idempotency_keys')
    .select('*')
    .eq('idempotency_key', idempotencyKey)
    .single();

  if (existing) {
    // Verify request hash matches
    if (existing.request_hash !== requestHash) {
      throw new Error('Idempotency key reused with different request');
    }

    // Return cached response
    return { isReplay: true, data: existing.response_body as T };
  }

  // Execute function
  const result = await fn();

  // Store result
  await supabase.from('idempotency_keys').insert({
    idempotency_key: idempotencyKey,
    endpoint,
    request_hash: requestHash,
    response_status: 200,
    response_body: result,
  });

  return { isReplay: false, data: result };
};
```

### 14.6 Error Logging

```typescript
// supabase/functions/_shared/logger.ts

interface LogEntry {
  level: 'debug' | 'info' | 'warn' | 'error';
  message: string;
  context?: Record<string, any>;
  error?: Error;
  requestId?: string;
  timestamp: string;
}

export const logger = {
  debug: (message: string, context?: Record<string, any>) =>
    log('debug', message, context),

  info: (message: string, context?: Record<string, any>) =>
    log('info', message, context),

  warn: (message: string, context?: Record<string, any>) =>
    log('warn', message, context),

  error: (message: string, error?: Error, context?: Record<string, any>) =>
    log('error', message, { ...context, error: error?.stack }),
};

const log = (level: LogEntry['level'], message: string, context?: Record<string, any>) => {
  const entry: LogEntry = {
    level,
    message,
    context,
    timestamp: new Date().toISOString(),
  };

  // Structured JSON logging for production
  console.log(JSON.stringify(entry));
};

// Request context middleware
export const createRequestLogger = (requestId: string) => ({
  debug: (msg: string, ctx?: Record<string, any>) =>
    logger.debug(msg, { ...ctx, requestId }),
  info: (msg: string, ctx?: Record<string, any>) =>
    logger.info(msg, { ...ctx, requestId }),
  warn: (msg: string, ctx?: Record<string, any>) =>
    logger.warn(msg, { ...ctx, requestId }),
  error: (msg: string, err?: Error, ctx?: Record<string, any>) =>
    logger.error(msg, err, { ...ctx, requestId }),
});
```

---

## 15. Rate Limiting

### 15.1 Rate Limiting Strategy

```
RATE LIMITS BY ENDPOINT:
┌────────────────────────────────────────────────────────────┐
│  Endpoint                    │ Limit      │ Window        │
├────────────────────────────────────────────────────────────┤
│  packages-list               │ 100 req    │ 1 minute      │
│  checkout-create             │ 10 req     │ 1 minute      │
│  checkout-validate-discount  │ 20 req     │ 1 minute      │
│  orders-query                │ 30 req     │ 1 minute      │
│  orders-detail               │ 30 req     │ 1 minute      │
│  webhook-* (internal)        │ No limit   │ -             │
└────────────────────────────────────────────────────────────┘

RATE LIMIT KEYS:
- Anonymous: IP address
- Authenticated: User ID
- Checkout: IP + Email combination
```

### 15.2 In-Memory Rate Limiter (Simple)

```typescript
// supabase/functions/_shared/rate-limiter.ts

interface RateLimitConfig {
  maxRequests: number;
  windowMs: number;
}

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

// In-memory store (per Edge Function instance)
const store = new Map<string, RateLimitEntry>();

export const rateLimit = (
  key: string,
  config: RateLimitConfig
): { allowed: boolean; remaining: number; resetAt: number } => {
  const now = Date.now();
  const entry = store.get(key);

  // Clean expired entry
  if (entry && entry.resetAt < now) {
    store.delete(key);
  }

  const current = store.get(key);

  if (!current) {
    // First request in window
    store.set(key, {
      count: 1,
      resetAt: now + config.windowMs,
    });
    return { allowed: true, remaining: config.maxRequests - 1, resetAt: now + config.windowMs };
  }

  if (current.count >= config.maxRequests) {
    // Rate limit exceeded
    return { allowed: false, remaining: 0, resetAt: current.resetAt };
  }

  // Increment count
  current.count++;
  return { allowed: true, remaining: config.maxRequests - current.count, resetAt: current.resetAt };
};

// Rate limit configurations by endpoint
export const RATE_LIMITS: Record<string, RateLimitConfig> = {
  'packages-list': { maxRequests: 100, windowMs: 60000 },
  'checkout-create': { maxRequests: 10, windowMs: 60000 },
  'checkout-validate-discount': { maxRequests: 20, windowMs: 60000 },
  'orders-query': { maxRequests: 30, windowMs: 60000 },
  'orders-detail': { maxRequests: 30, windowMs: 60000 },
};

// Extract rate limit key from request
export const getRateLimitKey = (req: Request, userId?: string): string => {
  if (userId) {
    return `user:${userId}`;
  }

  // Fallback to IP
  const forwarded = req.headers.get('x-forwarded-for');
  const ip = forwarded ? forwarded.split(',')[0].trim() : 'unknown';
  return `ip:${ip}`;
};
```

### 15.3 Rate Limit Middleware

```typescript
// supabase/functions/_shared/middleware.ts

import { rateLimit, RATE_LIMITS, getRateLimitKey } from './rate-limiter.ts';

export const withRateLimit = (
  endpoint: string,
  handler: (req: Request) => Promise<Response>
) => {
  return async (req: Request): Promise<Response> => {
    const config = RATE_LIMITS[endpoint];

    if (!config) {
      // No rate limit configured
      return handler(req);
    }

    const key = getRateLimitKey(req);
    const result = rateLimit(`${endpoint}:${key}`, config);

    // Add rate limit headers
    const headers = new Headers();
    headers.set('X-RateLimit-Limit', String(config.maxRequests));
    headers.set('X-RateLimit-Remaining', String(result.remaining));
    headers.set('X-RateLimit-Reset', String(Math.ceil(result.resetAt / 1000)));

    if (!result.allowed) {
      headers.set('Retry-After', String(Math.ceil((result.resetAt - Date.now()) / 1000)));

      return new Response(JSON.stringify({
        success: false,
        error: {
          code: 'RATE_LIMIT_EXCEEDED',
          message: 'Too many requests. Please try again later.',
        },
      }), {
        status: 429,
        headers,
      });
    }

    // Execute handler and add rate limit headers to response
    const response = await handler(req);

    // Clone response with additional headers
    const newHeaders = new Headers(response.headers);
    headers.forEach((value, key) => newHeaders.set(key, value));

    return new Response(response.body, {
      status: response.status,
      headers: newHeaders,
    });
  };
};
```

### 15.4 Distributed Rate Limiting (Upstash Redis - Optional)

For production with multiple Edge Function instances, use Upstash Redis:

```typescript
// supabase/functions/_shared/rate-limiter-redis.ts

const UPSTASH_REDIS_REST_URL = Deno.env.get('UPSTASH_REDIS_REST_URL');
const UPSTASH_REDIS_REST_TOKEN = Deno.env.get('UPSTASH_REDIS_REST_TOKEN');

interface RateLimitConfig {
  maxRequests: number;
  windowMs: number;
}

export const rateLimitRedis = async (
  key: string,
  config: RateLimitConfig
): Promise<{ allowed: boolean; remaining: number; resetAt: number }> => {
  const now = Date.now();
  const windowKey = `ratelimit:${key}:${Math.floor(now / config.windowMs)}`;

  // INCR and EXPIRE in one call
  const response = await fetch(`${UPSTASH_REDIS_REST_URL}/pipeline`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${UPSTASH_REDIS_REST_TOKEN}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify([
      ['INCR', windowKey],
      ['PEXPIRE', windowKey, config.windowMs],
    ]),
  });

  const [[incrResult]] = await response.json();
  const count = incrResult;

  const resetAt = (Math.floor(now / config.windowMs) + 1) * config.windowMs;
  const remaining = Math.max(0, config.maxRequests - count);

  return {
    allowed: count <= config.maxRequests,
    remaining,
    resetAt,
  };
};
```

---

## 16. Monitoring & Observability

### 16.1 Monitoring Stack

```
MONITORING ARCHITECTURE:
┌─────────────────────────────────────────────────────────────┐
│                    DATA SOURCES                              │
├─────────────────────────────────────────────────────────────┤
│  Supabase Dashboard  │  Edge Function Logs  │  Paddle       │
│  - DB metrics        │  - Request logs      │  - Payments   │
│  - Auth events       │  - Error traces      │  - Webhooks   │
│  - Storage usage     │  - Performance       │  - Revenue    │
└─────────────────────┬───────────────────────┴───────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────────────┐
│                    AGGREGATION                               │
├─────────────────────────────────────────────────────────────┤
│  Log Aggregation    │  Metrics Collection   │  Alerting     │
│  - Structured JSON  │  - Custom counters    │  - Slack      │
│  - Request IDs      │  - Response times     │  - Email      │
│  - Error grouping   │  - Success rates      │  - PagerDuty  │
└─────────────────────────────────────────────────────────────┘
```

### 16.2 Key Metrics

```typescript
// Metrics to track

interface Metrics {
  // Business Metrics
  orders: {
    created: number;
    completed: number;
    failed: number;
    averageValue: number;
  };

  // API Metrics
  api: {
    requestCount: number;
    errorRate: number;
    p50LatencyMs: number;
    p95LatencyMs: number;
    p99LatencyMs: number;
  };

  // External API Health
  external: {
    paddle: { successRate: number; avgLatencyMs: number };
    esimAccess: { successRate: number; avgLatencyMs: number };
    sendgrid: { successRate: number; deliveryRate: number };
  };

  // System Health
  system: {
    edgeFunctionErrors: number;
    databaseConnections: number;
    webhookBacklog: number;
  };
}
```

### 16.3 Application Metrics Table

```sql
-- Custom metrics storage
CREATE TABLE app_metrics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    metric_name VARCHAR(100) NOT NULL,
    metric_value DECIMAL NOT NULL,

    -- Dimensions
    dimensions JSONB DEFAULT '{}',          -- {"endpoint": "checkout", "status": "success"}

    -- Time
    timestamp TIMESTAMPTZ DEFAULT NOW(),

    -- For aggregation
    period VARCHAR(20) DEFAULT 'minute'     -- 'minute', 'hour', 'day'
);

-- Efficient time-based queries
CREATE INDEX idx_metrics_name_time ON app_metrics(metric_name, timestamp DESC);
CREATE INDEX idx_metrics_dimensions ON app_metrics USING GIN(dimensions);

-- Partition by time (optional for high volume)
-- CREATE TABLE app_metrics_YYYYMM PARTITION OF app_metrics FOR VALUES FROM (...) TO (...);
```

### 16.4 Metrics Collector

```typescript
// supabase/functions/_shared/metrics.ts

import { createClient } from './supabase.ts';

interface MetricPoint {
  name: string;
  value: number;
  dimensions?: Record<string, string>;
}

class MetricsCollector {
  private buffer: MetricPoint[] = [];
  private flushInterval: number;

  constructor(flushIntervalMs = 10000) {
    this.flushInterval = flushIntervalMs;
  }

  record(name: string, value: number, dimensions?: Record<string, string>) {
    this.buffer.push({ name, value, dimensions });

    // Flush if buffer is large
    if (this.buffer.length >= 100) {
      this.flush();
    }
  }

  increment(name: string, dimensions?: Record<string, string>) {
    this.record(name, 1, dimensions);
  }

  timing(name: string, durationMs: number, dimensions?: Record<string, string>) {
    this.record(name, durationMs, { ...dimensions, unit: 'ms' });
  }

  async flush() {
    if (this.buffer.length === 0) return;

    const supabase = createClient();
    const points = [...this.buffer];
    this.buffer = [];

    await supabase.from('app_metrics').insert(
      points.map(p => ({
        metric_name: p.name,
        metric_value: p.value,
        dimensions: p.dimensions || {},
      }))
    );
  }
}

export const metrics = new MetricsCollector();

// Convenience functions
export const recordApiCall = (
  endpoint: string,
  status: 'success' | 'error',
  durationMs: number
) => {
  metrics.increment(`api.${endpoint}.${status}`, { endpoint, status });
  metrics.timing(`api.${endpoint}.latency`, durationMs, { endpoint });
};

export const recordOrder = (status: 'created' | 'completed' | 'failed', valueCents: number) => {
  metrics.increment(`orders.${status}`);
  if (valueCents > 0) {
    metrics.record('orders.value', valueCents);
  }
};

export const recordExternalApi = (
  api: 'paddle' | 'esim_access' | 'sendgrid',
  success: boolean,
  durationMs: number
) => {
  metrics.increment(`external.${api}.${success ? 'success' : 'failure'}`, { api });
  metrics.timing(`external.${api}.latency`, durationMs, { api });
};
```

### 16.5 Health Check Endpoint

```typescript
// supabase/functions/health/index.ts

import { createClient } from '../_shared/supabase.ts';

interface HealthStatus {
  status: 'healthy' | 'degraded' | 'unhealthy';
  timestamp: string;
  checks: {
    database: { status: string; latencyMs: number };
    esimAccess: { status: string; latencyMs?: number };
    paddle: { status: string };
  };
  version: string;
}

const handler = async (req: Request): Promise<Response> => {
  const startTime = Date.now();
  const checks: HealthStatus['checks'] = {
    database: { status: 'unknown', latencyMs: 0 },
    esimAccess: { status: 'unknown' },
    paddle: { status: 'unknown' },
  };

  let overallStatus: HealthStatus['status'] = 'healthy';

  // Check database
  try {
    const dbStart = Date.now();
    const supabase = createClient();
    await supabase.from('esim_packages').select('id').limit(1);
    checks.database = { status: 'healthy', latencyMs: Date.now() - dbStart };
  } catch (error) {
    checks.database = { status: 'unhealthy', latencyMs: 0 };
    overallStatus = 'unhealthy';
  }

  // Check eSIM Access (lightweight balance check)
  try {
    const esimStart = Date.now();
    const response = await fetch(`${Deno.env.get('ESIM_API_URL')}/api/v1/open/balance/query`, {
      method: 'POST',
      headers: getEsimAccessHeaders(),
    });
    checks.esimAccess = {
      status: response.ok ? 'healthy' : 'degraded',
      latencyMs: Date.now() - esimStart,
    };
    if (!response.ok) overallStatus = 'degraded';
  } catch {
    checks.esimAccess = { status: 'unhealthy' };
    overallStatus = 'degraded';
  }

  // Paddle status (just check API is reachable)
  try {
    const paddleResponse = await fetch('https://api.paddle.com/health');
    checks.paddle = { status: paddleResponse.ok ? 'healthy' : 'degraded' };
  } catch {
    checks.paddle = { status: 'unknown' };
  }

  const health: HealthStatus = {
    status: overallStatus,
    timestamp: new Date().toISOString(),
    checks,
    version: Deno.env.get('APP_VERSION') || '1.0.0',
  };

  return new Response(JSON.stringify(health), {
    status: overallStatus === 'unhealthy' ? 503 : 200,
    headers: { 'Content-Type': 'application/json' },
  });
};

Deno.serve(handler);
```

### 16.6 Alert Rules

```yaml
# alerts.yaml (for external alerting system like PagerDuty/OpsGenie)

alerts:
  - name: HighErrorRate
    condition: api.error_rate > 5%
    window: 5m
    severity: critical
    channels: [slack, pagerduty]

  - name: SlowResponses
    condition: api.p95_latency > 3000ms
    window: 5m
    severity: warning
    channels: [slack]

  - name: PaymentFailures
    condition: orders.failed > 10
    window: 15m
    severity: critical
    channels: [slack, pagerduty, email]

  - name: ExternalApiDown
    condition: external.*.success_rate < 90%
    window: 5m
    severity: critical
    channels: [slack, pagerduty]

  - name: WebhookBacklog
    condition: webhook_logs.unprocessed > 100
    window: 10m
    severity: warning
    channels: [slack]

  - name: LowEsimBalance
    condition: esim_access.balance < 100
    window: 1h
    severity: warning
    channels: [slack, email]
```

---

## 17. Testing Strategy

### 17.1 Testing Pyramid

```
                    ┌─────────────┐
                    │    E2E      │  ~10% (Playwright)
                    │   Tests     │  Critical user flows
                    ├─────────────┤
                    │ Integration │  ~30% (Vitest + Supabase)
                    │   Tests     │  API + Database
                    ├─────────────┤
                    │    Unit     │  ~60% (Vitest)
                    │   Tests     │  Business logic, utilities
                    └─────────────┘
```

### 17.2 Testing Tools

| Tool | Purpose | Configuration |
|------|---------|---------------|
| **Vitest** | Unit & Integration tests | Fast, ESM-native |
| **Playwright** | E2E tests | Cross-browser |
| **k6** | Load testing | Performance validation |
| **Supabase CLI** | Local development | `supabase start` |

### 17.3 Unit Tests (Vitest)

```typescript
// tests/unit/pricing.test.ts

import { describe, it, expect } from 'vitest';
import { calculateOrderTotal, validateDiscountCode } from '../../src/lib/pricing';

describe('calculateOrderTotal', () => {
  it('calculates subtotal correctly for single item', () => {
    const items = [
      { packageId: '1', quantity: 1, unitPrice: 999, productDiscount: 0 },
    ];

    const result = calculateOrderTotal(items);

    expect(result.subtotal).toBe(999);
    expect(result.productDiscount).toBe(0);
    expect(result.total).toBe(999);
  });

  it('applies product discount correctly', () => {
    const items = [
      { packageId: '1', quantity: 2, unitPrice: 999, productDiscount: 200 },
    ];

    const result = calculateOrderTotal(items);

    expect(result.subtotal).toBe(1998);
    expect(result.productDiscount).toBe(400);
    expect(result.total).toBe(1598);
  });

  it('applies promo code discount after product discount', () => {
    const items = [
      { packageId: '1', quantity: 1, unitPrice: 1000, productDiscount: 100 },
    ];
    const promoDiscount = { type: 'fixed', value: 200 };

    const result = calculateOrderTotal(items, promoDiscount);

    expect(result.subtotal).toBe(1000);
    expect(result.productDiscount).toBe(100);
    expect(result.codeDiscount).toBe(200);
    expect(result.total).toBe(700);
  });
});

describe('validateDiscountCode', () => {
  it('rejects expired discount code', async () => {
    const discount = {
      code: 'EXPIRED',
      expiresAt: new Date('2020-01-01'),
      isActive: true,
    };

    const result = await validateDiscountCode(discount, 1000);

    expect(result.isValid).toBe(false);
    expect(result.error).toContain('expired');
  });

  it('rejects code below minimum purchase', async () => {
    const discount = {
      code: 'SAVE10',
      minPurchaseCents: 5000,
      isActive: true,
    };

    const result = await validateDiscountCode(discount, 2000);

    expect(result.isValid).toBe(false);
    expect(result.error).toContain('Minimum purchase');
  });
});
```

### 17.4 Integration Tests

```typescript
// tests/integration/checkout.test.ts

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

describe('Checkout Flow', () => {
  let testPackageId: string;

  beforeAll(async () => {
    // Create test package
    const { data } = await supabase
      .from('esim_packages')
      .insert({
        package_code: 'TEST_PKG',
        name: 'Test Package',
        price_usd_cents: 999,
        price_idr: 15000,
        volume_bytes: 1073741824,
        duration: 7,
        is_active: true,
        is_available: true,
      })
      .select()
      .single();

    testPackageId = data!.id;
  });

  afterAll(async () => {
    // Cleanup
    await supabase.from('esim_packages').delete().eq('id', testPackageId);
  });

  it('creates order successfully', async () => {
    const response = await fetch(`${process.env.EDGE_FUNCTION_URL}/checkout-create`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        items: [{ package_id: testPackageId, quantity: 1 }],
        customer_email: 'test@example.com',
      }),
    });

    expect(response.status).toBe(200);

    const data = await response.json();
    expect(data.order_id).toBeDefined();
    expect(data.checkout_url).toContain('paddle.com');
    expect(data.pricing.total).toBe(999);
  });

  it('applies discount code correctly', async () => {
    // Create test discount
    const { data: discount } = await supabase
      .from('discount_codes')
      .insert({
        code: 'TEST20',
        name: 'Test 20% Off',
        discount_type: 'percentage',
        discount_value: 2000,
        is_active: true,
      })
      .select()
      .single();

    const response = await fetch(`${process.env.EDGE_FUNCTION_URL}/checkout-create`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        items: [{ package_id: testPackageId, quantity: 1 }],
        customer_email: 'test@example.com',
        discount_code: 'TEST20',
      }),
    });

    const data = await response.json();
    expect(data.pricing.code_discount).toBe(199); // 20% of 999
    expect(data.pricing.total).toBe(800);

    // Cleanup
    await supabase.from('discount_codes').delete().eq('id', discount!.id);
  });
});
```

### 17.5 E2E Tests (Playwright)

```typescript
// tests/e2e/purchase.spec.ts

import { test, expect } from '@playwright/test';

test.describe('Purchase Flow', () => {
  test('guest can complete purchase', async ({ page }) => {
    // Go to product catalog
    await page.goto('/packages');

    // Select a package
    await page.click('[data-testid="package-japan-1gb"]');

    // Add to cart
    await page.click('[data-testid="add-to-cart"]');

    // Go to checkout
    await page.click('[data-testid="checkout-button"]');

    // Fill customer info
    await page.fill('[name="email"]', 'test@example.com');
    await page.fill('[name="name"]', 'Test User');

    // Apply discount (optional)
    await page.fill('[name="discount_code"]', 'SAVE10');
    await page.click('[data-testid="apply-discount"]');
    await expect(page.locator('[data-testid="discount-applied"]')).toBeVisible();

    // Proceed to payment
    await page.click('[data-testid="proceed-to-payment"]');

    // Should redirect to Paddle checkout
    await expect(page).toHaveURL(/paddle.com/);
  });

  test('authenticated user sees points', async ({ page }) => {
    // Login
    await page.goto('/login');
    await page.fill('[name="email"]', 'user@example.com');
    await page.fill('[name="password"]', 'password');
    await page.click('[type="submit"]');

    // Check points displayed
    await page.goto('/account');
    await expect(page.locator('[data-testid="points-balance"]')).toBeVisible();
  });
});
```

### 17.6 Load Tests (k6)

```javascript
// tests/load/checkout.js

import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate, Trend } from 'k6/metrics';

// Custom metrics
const errorRate = new Rate('errors');
const checkoutDuration = new Trend('checkout_duration');

export const options = {
  stages: [
    { duration: '1m', target: 10 },   // Ramp up
    { duration: '3m', target: 50 },   // Stay at 50 users
    { duration: '1m', target: 100 },  // Peak
    { duration: '1m', target: 0 },    // Ramp down
  ],
  thresholds: {
    http_req_duration: ['p(95)<3000'],  // 95% of requests under 3s
    errors: ['rate<0.05'],               // Error rate under 5%
  },
};

const BASE_URL = __ENV.BASE_URL || 'https://hiroam.com/api';

export default function () {
  // List packages
  const packagesRes = http.get(`${BASE_URL}/packages-list`);
  check(packagesRes, {
    'packages status is 200': (r) => r.status === 200,
    'packages has data': (r) => JSON.parse(r.body).packages.length > 0,
  });

  sleep(1);

  // Create checkout
  const startTime = Date.now();
  const checkoutRes = http.post(
    `${BASE_URL}/checkout-create`,
    JSON.stringify({
      items: [{ package_id: 'test-package-id', quantity: 1 }],
      customer_email: `load-test-${__VU}@example.com`,
    }),
    { headers: { 'Content-Type': 'application/json' } }
  );

  checkoutDuration.add(Date.now() - startTime);

  const checkoutSuccess = check(checkoutRes, {
    'checkout status is 200': (r) => r.status === 200,
    'checkout has order_id': (r) => JSON.parse(r.body).order_id !== undefined,
  });

  errorRate.add(!checkoutSuccess);

  sleep(2);
}
```

### 17.7 Test Configuration

```typescript
// vitest.config.ts

import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: ['tests/**/*.test.ts'],
    exclude: ['tests/e2e/**'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: ['tests/**', '**/*.d.ts'],
    },
    setupFiles: ['./tests/setup.ts'],
  },
});
```

```typescript
// playwright.config.ts

import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  use: {
    baseURL: process.env.BASE_URL || 'http://localhost:3000',
    trace: 'on-first-retry',
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
    { name: 'firefox', use: { ...devices['Desktop Firefox'] } },
    { name: 'Mobile Safari', use: { ...devices['iPhone 12'] } },
  ],
});
```

---

## 18. Shared Utilities

### 18.1 Utility Functions

```typescript
// supabase/functions/_shared/utils.ts

import { nanoid } from 'https://deno.land/x/nanoid/mod.ts';

// Generate order number: ORD-YYYYMMDD-XXXXX
export const generateOrderNumber = (): string => {
  const date = new Date();
  const dateStr = date.toISOString().slice(0, 10).replace(/-/g, '');
  const randomPart = nanoid(5).toUpperCase();
  return `ORD-${dateStr}-${randomPart}`;
};

// Generate transaction ID for eSIM Access
export const generateTransactionId = (orderNumber: string, packageCode: string): string => {
  return `${orderNumber}-${packageCode}-${nanoid(4)}`;
};

// Format bytes to human readable
export const formatBytes = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
};

// Format cents to currency string
export const formatCurrency = (cents: number, currency = 'USD'): string => {
  const amount = cents / 100;
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
  }).format(amount);
};

// Safe JSON parse
export const safeJsonParse = <T>(json: string, fallback: T): T => {
  try {
    return JSON.parse(json) as T;
  } catch {
    return fallback;
  }
};

// Generate request ID
export const generateRequestId = (): string => {
  return `req_${nanoid(16)}`;
};

// Calculate percentage
export const calculatePercentage = (value: number, total: number): number => {
  if (total === 0) return 0;
  return Math.round((value / total) * 100);
};

// Validate email format
export const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

// Sleep utility
export const sleep = (ms: number): Promise<void> => {
  return new Promise(resolve => setTimeout(resolve, ms));
};
```

### 18.2 Supabase Client

```typescript
// supabase/functions/_shared/supabase.ts

import { createClient as createSupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2';
import type { Database } from './database.types.ts';

export const createClient = () => {
  return createSupabaseClient<Database>(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  );
};

// For user context (from JWT)
export const createUserClient = (authHeader: string) => {
  const token = authHeader.replace('Bearer ', '');

  return createSupabaseClient<Database>(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_ANON_KEY')!,
    {
      global: {
        headers: { Authorization: `Bearer ${token}` },
      },
    }
  );
};
```

### 18.3 eSIM Access Client

```typescript
// supabase/functions/_shared/esim-access.ts

import { createHmac } from 'https://deno.land/std/crypto/mod.ts';
import { withRetry } from './retry.ts';
import { withCircuitBreaker } from './circuit-breaker.ts';
import { logger } from './logger.ts';

const ESIM_ACCESS_CODE = Deno.env.get('ESIM_ACCESS_CODE')!;
const ESIM_SECRET_KEY = Deno.env.get('ESIM_SECRET_KEY')!;
const ESIM_API_URL = Deno.env.get('ESIM_API_URL') || 'https://api.esimaccess.com';

interface EsimAccessResponse<T> {
  success: boolean;
  code: string;
  message: string;
  data?: T;
}

const generateSignature = (timestamp: string, requestId: string, body: string): string => {
  const signData = timestamp + requestId + ESIM_ACCESS_CODE + body;
  const hmac = createHmac('sha256', ESIM_SECRET_KEY);
  hmac.update(signData);
  return hmac.digest('hex');
};

export const getEsimAccessHeaders = (body = ''): HeadersInit => {
  const timestamp = Date.now().toString();
  const requestId = crypto.randomUUID();
  const signature = generateSignature(timestamp, requestId, body);

  return {
    'Content-Type': 'application/json',
    'RT-AccessCode': ESIM_ACCESS_CODE,
    'RT-Signature': signature,
    'RT-Timestamp': timestamp,
    'RT-RequestID': requestId,
  };
};

export const esimAccessRequest = async <T>(
  endpoint: string,
  body: Record<string, any> = {}
): Promise<EsimAccessResponse<T>> => {
  const bodyStr = JSON.stringify(body);

  return withCircuitBreaker('esim-access', async () => {
    return withRetry(async () => {
      const startTime = Date.now();

      const response = await fetch(`${ESIM_API_URL}${endpoint}`, {
        method: 'POST',
        headers: getEsimAccessHeaders(bodyStr),
        body: bodyStr,
      });

      const duration = Date.now() - startTime;
      logger.info(`eSIM Access ${endpoint}`, { duration, status: response.status });

      if (!response.ok) {
        throw new Error(`eSIM Access API error: ${response.status}`);
      }

      return await response.json();
    });
  });
};

// Convenience methods
export const listPackages = () =>
  esimAccessRequest<any[]>('/api/v1/open/package/list');

export const orderEsim = (transactionId: string, packageCode: string, quantity = 1) =>
  esimAccessRequest('/api/v1/open/esim/order', {
    transactionId,
    packageCode,
    quantity,
  });

export const queryOrder = (orderNo: string) =>
  esimAccessRequest('/api/v1/open/esim/query', { orderNo });

export const cancelEsim = (esimTranNo: string) =>
  esimAccessRequest('/api/v1/open/esim/cancel', { esimTranNo });

export const queryBalance = () =>
  esimAccessRequest('/api/v1/open/balance/query');
```

### 18.4 Paddle Client

```typescript
// supabase/functions/_shared/paddle.ts

import { withRetry } from './retry.ts';
import { logger } from './logger.ts';

const PADDLE_API_KEY = Deno.env.get('PADDLE_API_KEY')!;
const PADDLE_ENVIRONMENT = Deno.env.get('PADDLE_ENVIRONMENT') || 'sandbox';

const PADDLE_API_URL = PADDLE_ENVIRONMENT === 'production'
  ? 'https://api.paddle.com'
  : 'https://sandbox-api.paddle.com';

interface PaddleResponse<T> {
  data: T;
  meta?: any;
}

export const paddleRequest = async <T>(
  method: string,
  endpoint: string,
  body?: Record<string, any>
): Promise<PaddleResponse<T>> => {
  return withRetry(async () => {
    const startTime = Date.now();

    const response = await fetch(`${PADDLE_API_URL}${endpoint}`, {
      method,
      headers: {
        'Authorization': `Bearer ${PADDLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: body ? JSON.stringify(body) : undefined,
    });

    const duration = Date.now() - startTime;
    logger.info(`Paddle ${method} ${endpoint}`, { duration, status: response.status });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Paddle API error: ${response.status} - ${error}`);
    }

    return await response.json();
  });
};

interface CreateTransactionParams {
  items: Array<{
    quantity: number;
    price: {
      description: string;
      name: string;
      unit_price: { amount: string; currency_code: string };
      product: { name: string; tax_category: string; description: string };
    };
  }>;
  currency_code: string;
  custom_data: Record<string, any>;
  customer_email?: string;
}

export const createTransaction = (params: CreateTransactionParams) =>
  paddleRequest<{ id: string; checkout: { url: string } }>(
    'POST',
    '/transactions',
    {
      items: params.items,
      currency_code: params.currency_code,
      custom_data: params.custom_data,
      collection_mode: 'automatic',
      checkout: {
        url: `${Deno.env.get('APP_URL')}/checkout/complete`,
      },
    }
  );

export const getTransaction = (transactionId: string) =>
  paddleRequest<any>('GET', `/transactions/${transactionId}`);
```

### 18.5 Input Validation (Zod)

```typescript
// supabase/functions/_shared/validation.ts

import { z } from 'https://deno.land/x/zod/mod.ts';

// Checkout request schema
export const CheckoutRequestSchema = z.object({
  items: z.array(z.object({
    package_id: z.string().uuid(),
    quantity: z.number().int().min(1).max(10),
  })).min(1).max(10),
  customer_email: z.string().email(),
  customer_name: z.string().min(1).max(100).optional(),
  discount_code: z.string().max(50).optional(),
  user_id: z.string().uuid().optional(),
  idempotency_key: z.string().max(100).optional(),
});

export type CheckoutRequest = z.infer<typeof CheckoutRequestSchema>;

// Validate discount code request
export const ValidateDiscountSchema = z.object({
  code: z.string().min(1).max(50),
  subtotal_cents: z.number().int().min(0),
  user_id: z.string().uuid().optional(),
  email: z.string().email().optional(),
});

// Order query params
export const OrderQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(10),
  status: z.enum(['pending', 'paid', 'completed', 'failed', 'cancelled']).optional(),
});

// Validation helper
export const validateRequest = <T>(
  schema: z.ZodSchema<T>,
  data: unknown
): { success: true; data: T } | { success: false; error: string; details: z.ZodError['issues'] } => {
  const result = schema.safeParse(data);

  if (result.success) {
    return { success: true, data: result.data };
  }

  return {
    success: false,
    error: 'Validation failed',
    details: result.error.issues,
  };
};
```

### 18.6 CORS Configuration

```typescript
// supabase/functions/_shared/cors.ts

const ALLOWED_ORIGINS = [
  'https://hiroam.com',
  'https://www.hiroam.com',
  'https://admin.hiroam.com',
  // Development
  'http://localhost:3000',
  'http://localhost:3001',
];

export const corsHeaders = (origin?: string | null): HeadersInit => {
  const allowedOrigin = origin && ALLOWED_ORIGINS.includes(origin)
    ? origin
    : ALLOWED_ORIGINS[0];

  return {
    'Access-Control-Allow-Origin': allowedOrigin,
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Idempotency-Key',
    'Access-Control-Max-Age': '86400',
  };
};

export const handleCors = (req: Request): Response | null => {
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: corsHeaders(req.headers.get('Origin')),
    });
  }
  return null;
};
```

---

## 19. Implementation Phases

### Phase 1: Foundation (Week 1)
- [ ] Setup Supabase project
- [ ] Create database schema and migrations
- [ ] Configure RLS policies
- [ ] Setup environment variables

### Phase 2: Core Functions (Week 2)
- [ ] `packages-list` - List available packages
- [ ] `packages-sync` - Sync from eSIM Access
- [ ] Setup pg_cron for automatic sync

### Phase 3: Checkout & Payment (Week 3)
- [ ] `checkout-create` - Create checkout session
- [ ] `checkout-validate-discount` - Validate promo codes
- [ ] `webhook-paddle` - Handle payment webhooks

### Phase 4: eSIM Delivery (Week 4)
- [ ] `webhook-esim` - Handle eSIM webhooks
- [ ] Email delivery system
- [ ] Order status tracking

### Phase 5: User Features (Week 5)
- [ ] `orders-query` - List user orders
- [ ] `orders-detail` - Order details with eSIM
- [ ] Points system implementation

### Phase 6: Admin Dashboard (Week 6)
- [ ] Price management UI
- [ ] Product availability management
- [ ] Discount code management
- [ ] Order management

### Phase 7: Testing & Launch
- [ ] End-to-end testing
- [ ] Load testing
- [ ] Security audit
- [ ] Production deployment

---

## 20. Backup & Disaster Recovery

### 20.1 Recovery Objectives

| Metric | Target | Description |
|--------|--------|-------------|
| **RTO** (Recovery Time Objective) | < 1 hour | Maximum acceptable downtime |
| **RPO** (Recovery Point Objective) | < 5 minutes | Maximum data loss window |
| **Backup Frequency** | Continuous | PITR enabled via Supabase |
| **Retention Period** | 7 days (free) / 30 days (Pro) | Point-in-time recovery window |

### 20.2 Supabase Backup Configuration

```yaml
# Supabase automatically handles backups
# Pro Plan includes:
backup:
  type: "Point-in-Time Recovery (PITR)"
  retention: "30 days"
  frequency: "Continuous (WAL archiving)"
  location: "Same region as project"

# Manual backup via CLI (for migrations)
manual_backup:
  command: "supabase db dump -f backup_$(date +%Y%m%d).sql"
  schedule: "Before major deployments"
  storage: "Secure cloud storage (encrypted)"
```

### 20.3 Backup Strategy by Data Type

```
┌─────────────────────────────────────────────────────────────────┐
│                    BACKUP PRIORITY MATRIX                        │
├─────────────────────────────────────────────────────────────────┤
│  CRITICAL (RPO: 0)           │  IMPORTANT (RPO: 5 min)          │
│  ├── orders                   │  ├── esim_packages              │
│  ├── order_items              │  ├── price_schedules            │
│  ├── esim_profiles            │  ├── discount_codes             │
│  ├── user_profiles            │  └── user_points                │
│  └── payment_transactions     │                                  │
├─────────────────────────────────────────────────────────────────┤
│  STANDARD (RPO: 1 hour)       │  LOW (RPO: 24 hours)            │
│  ├── email_logs               │  ├── app_metrics                │
│  ├── idempotency_keys         │  └── admin_audit_log            │
│  └── webhook_logs             │                                  │
└─────────────────────────────────────────────────────────────────┘
```

### 20.4 Disaster Recovery Procedures

```typescript
// DR Runbook: Database Recovery

/**
 * SCENARIO 1: Point-in-Time Recovery (Data Corruption)
 *
 * 1. Identify corruption timestamp from logs
 * 2. Contact Supabase support or use Dashboard
 * 3. Restore to timestamp BEFORE corruption
 * 4. Verify data integrity
 * 5. Replay valid transactions if needed
 */

/**
 * SCENARIO 2: Complete Database Restore
 *
 * 1. Create new Supabase project (if needed)
 * 2. Restore from latest backup
 * 3. Update environment variables
 * 4. Verify Edge Functions connectivity
 * 5. Run integration tests
 * 6. Switch DNS/traffic to new instance
 */

/**
 * SCENARIO 3: Edge Function Failure
 *
 * 1. Check Supabase Dashboard for function status
 * 2. Review function logs for errors
 * 3. Rollback to previous deployment: supabase functions deploy --rollback
 * 4. If persistent, redeploy from git: supabase functions deploy
 * 5. Verify function health via /health endpoint
 */
```

### 20.5 External Service Failover

```typescript
// Failover strategies for external dependencies

const FAILOVER_CONFIG = {
  paddle: {
    // Paddle has no failover - queue payments for retry
    strategy: 'queue_and_retry',
    maxRetryHours: 24,
    alertAfterMinutes: 15,
  },

  esimAccess: {
    // eSIM Access has no failover - queue orders
    strategy: 'queue_and_retry',
    maxRetryHours: 48,
    alertAfterMinutes: 30,
  },

  sendgrid: {
    // SendGrid has backup provider option
    strategy: 'failover_provider',
    backupProvider: 'resend', // Alternative: Postmark, AWS SES
    switchAfterFailures: 3,
  },
};

// Order queue for payment/eSIM failures
interface FailedOrderQueue {
  orderId: string;
  failureType: 'payment' | 'esim_provision' | 'email';
  failedAt: Date;
  retryCount: number;
  lastError: string;
  status: 'pending_retry' | 'manual_intervention' | 'resolved';
}
```

### 20.6 Backup Verification

```sql
-- Weekly backup verification job
-- Run on staging environment

-- 1. Restore latest backup to staging
-- 2. Run verification queries:

-- Check critical table row counts
SELECT
  'orders' as table_name, COUNT(*) as row_count FROM orders
UNION ALL
SELECT 'order_items', COUNT(*) FROM order_items
UNION ALL
SELECT 'esim_profiles', COUNT(*) FROM esim_profiles
UNION ALL
SELECT 'user_profiles', COUNT(*) FROM user_profiles;

-- Check data integrity
SELECT COUNT(*) as orphaned_items
FROM order_items oi
LEFT JOIN orders o ON oi.order_id = o.id
WHERE o.id IS NULL;

-- Check recent data exists
SELECT COUNT(*) as recent_orders
FROM orders
WHERE created_at > NOW() - INTERVAL '24 hours';
```

---

## 21. Security Checklist

### 21.1 Pre-Production Security Audit

```yaml
# Security checklist before going to production

authentication:
  - [ ] Supabase Auth configured correctly
  - [ ] JWT expiration set appropriately (default: 1 hour)
  - [ ] Refresh token rotation enabled
  - [ ] Password policy enforced (min 8 chars, complexity)
  - [ ] Rate limiting on auth endpoints

authorization:
  - [ ] RLS policies tested for all tables
  - [ ] is_admin() function works correctly
  - [ ] Service role key never exposed to client
  - [ ] Anon key permissions are minimal

api_security:
  - [ ] All Edge Functions validate input (Zod)
  - [ ] CORS whitelist configured
  - [ ] Rate limiting implemented
  - [ ] Request size limits set
  - [ ] SQL injection protection (parameterized queries)

secrets_management:
  - [ ] All secrets in environment variables
  - [ ] No secrets in code or git history
  - [ ] Secrets rotation procedure documented
  - [ ] Different secrets for staging/production

webhook_security:
  - [ ] Paddle webhook signature verification
  - [ ] eSIM Access IP whitelist
  - [ ] Webhook endpoints not publicly discoverable
  - [ ] Replay attack prevention (idempotency)
```

### 21.2 OWASP Top 10 Mitigation

```typescript
// OWASP Top 10 2021 - Mitigation Status

const OWASP_CHECKLIST = {
  'A01:2021 - Broken Access Control': {
    status: 'MITIGATED',
    measures: [
      'RLS policies on all tables',
      'JWT validation on all requests',
      'Role-based permissions (is_admin, has_permission)',
      'Resource ownership checks',
    ],
  },

  'A02:2021 - Cryptographic Failures': {
    status: 'MITIGATED',
    measures: [
      'HTTPS enforced (Supabase default)',
      'Passwords hashed with bcrypt (Supabase Auth)',
      'Sensitive data encrypted at rest',
      'No sensitive data in logs',
    ],
  },

  'A03:2021 - Injection': {
    status: 'MITIGATED',
    measures: [
      'Parameterized queries (Supabase client)',
      'Input validation with Zod schemas',
      'No dynamic SQL construction',
      'Content-Type validation',
    ],
  },

  'A04:2021 - Insecure Design': {
    status: 'MITIGATED',
    measures: [
      'Threat modeling completed',
      'Security requirements documented',
      'Defense in depth architecture',
      'Fail-secure defaults',
    ],
  },

  'A05:2021 - Security Misconfiguration': {
    status: 'MITIGATED',
    measures: [
      'Supabase managed infrastructure',
      'Environment-specific configurations',
      'Unused features disabled',
      'Security headers configured',
    ],
  },

  'A06:2021 - Vulnerable Components': {
    status: 'REQUIRES_MONITORING',
    measures: [
      'Dependabot enabled on repository',
      'Regular dependency updates',
      'npm audit in CI pipeline',
      'Minimal dependency footprint',
    ],
  },

  'A07:2021 - Auth Failures': {
    status: 'MITIGATED',
    measures: [
      'Supabase Auth handles authentication',
      'Rate limiting on login attempts',
      'Secure session management',
      'Multi-factor authentication available',
    ],
  },

  'A08:2021 - Data Integrity Failures': {
    status: 'MITIGATED',
    measures: [
      'Webhook signature verification',
      'Idempotency keys for payments',
      'Database constraints and triggers',
      'Audit logging enabled',
    ],
  },

  'A09:2021 - Logging Failures': {
    status: 'MITIGATED',
    measures: [
      'Structured logging implemented',
      'Security events logged',
      'Log retention configured',
      'No sensitive data in logs',
    ],
  },

  'A10:2021 - SSRF': {
    status: 'MITIGATED',
    measures: [
      'No user-controlled URLs in requests',
      'Allowlist for external API calls',
      'Internal network not exposed',
    ],
  },
};
```

### 21.3 Secrets Rotation Procedure

```typescript
// Secrets rotation schedule and procedure

const SECRETS_ROTATION = {
  // Rotate every 90 days
  quarterly: [
    {
      name: 'PADDLE_API_KEY',
      rotation: 'Generate new key in Paddle Dashboard → Update env → Verify → Revoke old',
      downtime: 'Zero (overlap period)',
    },
    {
      name: 'SENDGRID_API_KEY',
      rotation: 'Generate new key in SendGrid → Update env → Verify → Revoke old',
      downtime: 'Zero (overlap period)',
    },
  ],

  // Rotate every 180 days
  biannual: [
    {
      name: 'SUPABASE_SERVICE_ROLE_KEY',
      rotation: 'Contact Supabase support or regenerate in dashboard',
      downtime: 'Brief (redeploy Edge Functions)',
      warning: 'Requires redeploying all Edge Functions',
    },
    {
      name: 'ESIM_SECRET_KEY',
      rotation: 'Request new key from eSIM Access support',
      downtime: 'Zero (coordinate with provider)',
    },
  ],

  // Rotate immediately if compromised
  emergency: [
    'PADDLE_WEBHOOK_SECRET',
    'SUPABASE_SERVICE_ROLE_KEY',
    'All API keys',
  ],
};

// Rotation procedure
const rotateSecret = async (secretName: string) => {
  // 1. Generate new secret (provider-specific)
  // 2. Update in Supabase Dashboard (Edge Function secrets)
  // 3. Redeploy affected Edge Functions
  // 4. Verify functionality with test requests
  // 5. Revoke old secret after 24-hour overlap
  // 6. Document rotation in audit log
};
```

### 21.4 Security Headers

```typescript
// supabase/functions/_shared/security-headers.ts

export const SECURITY_HEADERS = {
  'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'X-XSS-Protection': '1; mode=block',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
  'Content-Security-Policy': "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'",
};

export const addSecurityHeaders = (response: Response): Response => {
  const headers = new Headers(response.headers);

  Object.entries(SECURITY_HEADERS).forEach(([key, value]) => {
    headers.set(key, value);
  });

  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
};
```

### 21.5 Dependency Scanning

```yaml
# .github/workflows/security-scan.yml

name: Security Scan

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]
  schedule:
    - cron: '0 0 * * 1'  # Weekly on Monday

jobs:
  dependency-scan:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Run npm audit
        run: npm audit --audit-level=high

      - name: Run Snyk scan
        uses: snyk/actions/node@master
        env:
          SNYK_TOKEN: ${{ secrets.SNYK_TOKEN }}
        with:
          args: --severity-threshold=high

      - name: Check for secrets in code
        uses: trufflesecurity/trufflehog@main
        with:
          path: ./
          base: main
          head: HEAD
```

---

## 22. Incident Response

### 22.1 Incident Severity Levels

| Level | Name | Description | Response Time | Examples |
|-------|------|-------------|---------------|----------|
| **P1** | Critical | Complete service outage | < 15 min | Payment processing down, Database unreachable |
| **P2** | High | Major feature impacted | < 1 hour | eSIM delivery failing, Webhook processing stuck |
| **P3** | Medium | Minor feature impacted | < 4 hours | Email delivery delayed, Points not crediting |
| **P4** | Low | Minimal impact | < 24 hours | UI glitch, Non-critical logs missing |

### 22.2 Escalation Matrix

```yaml
escalation:
  P1_critical:
    initial: "On-call engineer"
    15_minutes: "Engineering lead"
    30_minutes: "CTO + affected team leads"
    1_hour: "Executive notification"

  P2_high:
    initial: "On-call engineer"
    1_hour: "Engineering lead"
    4_hours: "CTO notification"

  P3_medium:
    initial: "Assigned engineer"
    4_hours: "Team lead review"

  P4_low:
    initial: "Next available engineer"
    24_hours: "Team lead review"

communication_channels:
  primary: "Slack #incidents"
  secondary: "PagerDuty"
  customer_facing: "Status page update"
  internal: "Email to stakeholders"
```

### 22.3 Incident Runbooks

```typescript
// RUNBOOK: Payment Processing Failure (P1)

const RUNBOOK_PAYMENT_FAILURE = {
  symptoms: [
    'Paddle webhook returning errors',
    'Orders stuck in pending_payment status',
    'Customer complaints about failed payments',
  ],

  diagnostics: [
    '1. Check Supabase Dashboard → Edge Functions → webhook-paddle logs',
    '2. Check Paddle Dashboard → Developers → Events for failed deliveries',
    '3. Verify PADDLE_WEBHOOK_SECRET is correct',
    '4. Check database connectivity',
  ],

  resolution_steps: [
    '1. If webhook secret mismatch: Update secret and redeploy',
    '2. If database issue: Check Supabase status page',
    '3. If Paddle issue: Check Paddle status page',
    '4. Manually retry failed webhooks from Paddle Dashboard',
    '5. Process stuck orders manually if needed',
  ],

  verification: [
    '1. Create test checkout and complete payment',
    '2. Verify order status updates correctly',
    '3. Verify eSIM provisioning triggers',
  ],

  post_incident: [
    '1. Document root cause',
    '2. Update monitoring if gaps found',
    '3. Schedule post-mortem if P1/P2',
  ],
};

// RUNBOOK: eSIM Delivery Failure (P2)

const RUNBOOK_ESIM_FAILURE = {
  symptoms: [
    'Orders completed but eSIM not delivered',
    'webhook-esim returning errors',
    'Customer complaints about missing eSIM',
  ],

  diagnostics: [
    '1. Check webhook-esim logs for errors',
    '2. Verify eSIM Access API status',
    '3. Check esim_profiles table for stuck records',
    '4. Verify email delivery (email_logs table)',
  ],

  resolution_steps: [
    '1. If API down: Wait for recovery, orders will auto-retry',
    '2. If webhook missed: Manually trigger eSIM query for order',
    '3. If email failed: Manually resend eSIM delivery email',
    '4. Contact eSIM Access support if persistent',
  ],

  manual_esim_delivery: `
    -- Find order needing manual delivery
    SELECT o.id, o.order_number, oi.package_code, ep.*
    FROM orders o
    JOIN order_items oi ON o.id = oi.order_id
    LEFT JOIN esim_profiles ep ON oi.id = ep.order_item_id
    WHERE o.status = 'completed'
    AND ep.id IS NULL
    ORDER BY o.created_at DESC;

    -- Manually query eSIM Access for order details
    -- Then insert into esim_profiles and send email
  `,
};

// RUNBOOK: Database Performance Issues (P2)

const RUNBOOK_DB_PERFORMANCE = {
  symptoms: [
    'Slow API responses (>2s)',
    'Timeout errors in Edge Functions',
    'High database CPU in Supabase Dashboard',
  ],

  diagnostics: [
    '1. Check Supabase Dashboard → Database → Performance',
    '2. Review slow query logs',
    '3. Check for missing indexes',
    '4. Review recent schema changes',
  ],

  resolution_steps: [
    '1. Identify slow queries from logs',
    '2. Add missing indexes if needed',
    '3. Optimize problematic queries',
    '4. Consider connection pooling settings',
    '5. Scale database if needed (Supabase Pro)',
  ],

  quick_fixes: `
    -- Find slow queries
    SELECT query, calls, mean_time, total_time
    FROM pg_stat_statements
    ORDER BY mean_time DESC
    LIMIT 10;

    -- Check table sizes
    SELECT relname, pg_size_pretty(pg_total_relation_size(relid))
    FROM pg_catalog.pg_statio_user_tables
    ORDER BY pg_total_relation_size(relid) DESC;

    -- Check index usage
    SELECT indexrelname, idx_scan, idx_tup_read
    FROM pg_stat_user_indexes
    ORDER BY idx_scan ASC;
  `,
};
```

### 22.4 Communication Templates

```typescript
// Incident communication templates

const TEMPLATES = {
  initial_notification: `
🚨 **INCIDENT DETECTED**
**Severity**: {severity}
**Service**: {service}
**Impact**: {impact}
**Started**: {timestamp}
**Investigating**: {assignee}

Updates will follow every 15 minutes.
  `,

  status_update: `
🔄 **INCIDENT UPDATE** - {incident_id}
**Status**: {status}
**Duration**: {duration}
**Progress**: {progress}
**Next Update**: {next_update_time}
  `,

  resolution: `
✅ **INCIDENT RESOLVED** - {incident_id}
**Duration**: {total_duration}
**Root Cause**: {root_cause}
**Resolution**: {resolution}
**Post-mortem**: Scheduled for {postmortem_date}
  `,

  customer_facing: `
**Service Status Update**

We are currently experiencing {issue_description}.

**Impact**: {customer_impact}
**Status**: {status}
**ETA**: {eta}

We apologize for any inconvenience. Updates will be posted here.
  `,
};
```

### 22.5 Post-Incident Review Template

```markdown
# Post-Incident Review: {INCIDENT_ID}

## Summary
- **Date**: {date}
- **Duration**: {duration}
- **Severity**: {P1/P2/P3}
- **Services Affected**: {services}
- **Customer Impact**: {impact_description}

## Timeline
| Time | Event |
|------|-------|
| HH:MM | First alert triggered |
| HH:MM | On-call acknowledged |
| HH:MM | Root cause identified |
| HH:MM | Fix deployed |
| HH:MM | Service restored |
| HH:MM | All-clear declared |

## Root Cause
{Detailed technical explanation of what caused the incident}

## Resolution
{What was done to resolve the incident}

## What Went Well
- {positive_1}
- {positive_2}

## What Could Be Improved
- {improvement_1}
- {improvement_2}

## Action Items
| Action | Owner | Due Date | Status |
|--------|-------|----------|--------|
| {action_1} | {owner} | {date} | Open |
| {action_2} | {owner} | {date} | Open |

## Lessons Learned
{Key takeaways for preventing similar incidents}
```

---

## 23. CI/CD Pipeline

### 23.1 Pipeline Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                      CI/CD PIPELINE                              │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│   ┌──────────┐    ┌──────────┐    ┌──────────┐    ┌──────────┐ │
│   │  Commit  │───▶│   Test   │───▶│  Build   │───▶│  Deploy  │ │
│   └──────────┘    └──────────┘    └──────────┘    └──────────┘ │
│        │               │               │               │        │
│        ▼               ▼               ▼               ▼        │
│   ┌──────────┐    ┌──────────┐    ┌──────────┐    ┌──────────┐ │
│   │  Lint    │    │  Unit    │    │ Type     │    │ Staging  │ │
│   │  Format  │    │  Integ   │    │ Check    │    │ Preview  │ │
│   │  Secret  │    │  E2E     │    │ Bundle   │    │ Prod     │ │
│   └──────────┘    └──────────┘    └──────────┘    └──────────┘ │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### 23.2 GitHub Actions Workflow

```yaml
# .github/workflows/ci.yml

name: CI/CD Pipeline

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

env:
  SUPABASE_ACCESS_TOKEN: ${{ secrets.SUPABASE_ACCESS_TOKEN }}
  SUPABASE_PROJECT_ID: ${{ secrets.SUPABASE_PROJECT_ID }}

jobs:
  # ========================================
  # Stage 1: Code Quality
  # ========================================
  lint:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Run ESLint
        run: npm run lint

      - name: Run Prettier check
        run: npm run format:check

      - name: Check for secrets
        uses: trufflesecurity/trufflehog@main
        with:
          path: ./

  # ========================================
  # Stage 2: Type Check
  # ========================================
  typecheck:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Run TypeScript check
        run: npm run typecheck

  # ========================================
  # Stage 3: Unit Tests
  # ========================================
  test-unit:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Run unit tests
        run: npm run test:unit -- --coverage

      - name: Upload coverage
        uses: codecov/codecov-action@v3
        with:
          files: ./coverage/lcov.info

  # ========================================
  # Stage 4: Integration Tests
  # ========================================
  test-integration:
    runs-on: ubuntu-latest
    needs: [lint, typecheck]
    steps:
      - uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'

      - name: Setup Supabase CLI
        uses: supabase/setup-cli@v1
        with:
          version: latest

      - name: Start Supabase
        run: supabase start

      - name: Run migrations
        run: supabase db push

      - name: Install dependencies
        run: npm ci

      - name: Run integration tests
        run: npm run test:integration
        env:
          SUPABASE_URL: http://localhost:54321
          SUPABASE_ANON_KEY: ${{ secrets.SUPABASE_ANON_KEY_LOCAL }}
          SUPABASE_SERVICE_ROLE_KEY: ${{ secrets.SUPABASE_SERVICE_ROLE_KEY_LOCAL }}

      - name: Stop Supabase
        run: supabase stop

  # ========================================
  # Stage 5: Deploy to Staging
  # ========================================
  deploy-staging:
    runs-on: ubuntu-latest
    needs: [test-unit, test-integration]
    if: github.ref == 'refs/heads/develop'
    environment: staging
    steps:
      - uses: actions/checkout@v4

      - name: Setup Supabase CLI
        uses: supabase/setup-cli@v1
        with:
          version: latest

      - name: Link to staging project
        run: supabase link --project-ref ${{ secrets.SUPABASE_STAGING_PROJECT_ID }}

      - name: Push database changes
        run: supabase db push

      - name: Deploy Edge Functions
        run: supabase functions deploy

      - name: Notify Slack
        uses: slackapi/slack-github-action@v1
        with:
          payload: |
            {
              "text": "✅ Deployed to staging: ${{ github.sha }}"
            }
        env:
          SLACK_WEBHOOK_URL: ${{ secrets.SLACK_WEBHOOK_URL }}

  # ========================================
  # Stage 6: E2E Tests on Staging
  # ========================================
  test-e2e:
    runs-on: ubuntu-latest
    needs: [deploy-staging]
    steps:
      - uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Install Playwright browsers
        run: npx playwright install --with-deps

      - name: Run E2E tests
        run: npm run test:e2e
        env:
          BASE_URL: ${{ secrets.STAGING_URL }}

      - name: Upload test results
        uses: actions/upload-artifact@v3
        if: failure()
        with:
          name: playwright-report
          path: playwright-report/

  # ========================================
  # Stage 7: Deploy to Production
  # ========================================
  deploy-production:
    runs-on: ubuntu-latest
    needs: [test-e2e]
    if: github.ref == 'refs/heads/main'
    environment: production
    steps:
      - uses: actions/checkout@v4

      - name: Setup Supabase CLI
        uses: supabase/setup-cli@v1
        with:
          version: latest

      - name: Link to production project
        run: supabase link --project-ref ${{ secrets.SUPABASE_PROJECT_ID }}

      - name: Push database changes
        run: supabase db push

      - name: Deploy Edge Functions
        run: supabase functions deploy

      - name: Health check
        run: |
          response=$(curl -s -o /dev/null -w "%{http_code}" ${{ secrets.PRODUCTION_URL }}/functions/v1/health)
          if [ $response != "200" ]; then
            echo "Health check failed with status $response"
            exit 1
          fi

      - name: Notify Slack
        uses: slackapi/slack-github-action@v1
        with:
          payload: |
            {
              "text": "🚀 Deployed to production: ${{ github.sha }}"
            }
        env:
          SLACK_WEBHOOK_URL: ${{ secrets.SLACK_WEBHOOK_URL }}
```

### 23.3 Database Migration Strategy

```yaml
# Migration workflow

migrations:
  # Development
  local:
    command: "supabase db push"
    description: "Push local changes to local Supabase"

  # Create new migration
  create:
    command: "supabase migration new {migration_name}"
    example: "supabase migration new add_user_preferences"

  # Apply to staging
  staging:
    command: "supabase db push --linked"
    requires: "supabase link --project-ref staging-project-id"

  # Apply to production
  production:
    command: "supabase db push --linked"
    requires: "supabase link --project-ref production-project-id"
    pre_check:
      - "Backup database"
      - "Review migration diff"
      - "Test on staging first"

rollback:
  # Supabase doesn't have automatic rollback
  # Create reverse migration manually
  procedure:
    1: "Identify failing migration"
    2: "Create reverse migration: supabase migration new rollback_{migration_name}"
    3: "Write SQL to undo changes"
    4: "Test on staging"
    5: "Apply to production"

  example_rollback: |
    -- Migration: add_column_to_users
    ALTER TABLE users ADD COLUMN preferences JSONB;

    -- Rollback migration: rollback_add_column_to_users
    ALTER TABLE users DROP COLUMN preferences;
```

### 23.4 Deployment Environments

```typescript
// Environment configuration

const ENVIRONMENTS = {
  development: {
    supabaseUrl: 'http://localhost:54321',
    supabaseAnonKey: 'local-anon-key',
    paddleEnvironment: 'sandbox',
    esimAccessUrl: 'https://api.esimaccess.com',  // Same for all
    logLevel: 'debug',
  },

  staging: {
    supabaseUrl: 'https://staging-project.supabase.co',
    supabaseAnonKey: process.env.STAGING_SUPABASE_ANON_KEY,
    paddleEnvironment: 'sandbox',
    esimAccessUrl: 'https://api.esimaccess.com',
    logLevel: 'info',
  },

  production: {
    supabaseUrl: 'https://production-project.supabase.co',
    supabaseAnonKey: process.env.SUPABASE_ANON_KEY,
    paddleEnvironment: 'live',
    esimAccessUrl: 'https://api.esimaccess.com',
    logLevel: 'warn',
  },
};

// Feature flags for gradual rollout
const FEATURE_FLAGS = {
  newCheckoutFlow: {
    development: true,
    staging: true,
    production: false,  // Enable when ready
  },
  enhancedLogging: {
    development: true,
    staging: true,
    production: true,
  },
};
```

### 23.5 Rollback Procedure

```bash
#!/bin/bash
# scripts/rollback.sh

# Rollback Edge Functions to previous version
rollback_functions() {
  echo "Rolling back Edge Functions..."

  # Get previous deployment
  PREVIOUS_VERSION=$(supabase functions list --json | jq -r '.[0].previous_version')

  # Rollback each function
  for func in packages-list checkout-create webhook-paddle webhook-esim; do
    supabase functions deploy $func --version $PREVIOUS_VERSION
  done

  echo "Functions rolled back to $PREVIOUS_VERSION"
}

# Rollback database (requires manual migration)
rollback_database() {
  echo "Database rollback requires manual intervention"
  echo "1. Identify the migration to rollback"
  echo "2. Create a reverse migration"
  echo "3. Apply the reverse migration"
  echo "4. Verify data integrity"
}

# Health check after rollback
health_check() {
  response=$(curl -s -o /dev/null -w "%{http_code}" $SUPABASE_URL/functions/v1/health)
  if [ $response == "200" ]; then
    echo "✅ Health check passed"
  else
    echo "❌ Health check failed with status $response"
    exit 1
  fi
}

# Main
case $1 in
  functions)
    rollback_functions
    health_check
    ;;
  database)
    rollback_database
    ;;
  *)
    echo "Usage: ./rollback.sh [functions|database]"
    exit 1
    ;;
esac
```

---

## 24. Data Retention & Compliance

### 24.1 Data Classification

```
┌─────────────────────────────────────────────────────────────────┐
│                    DATA CLASSIFICATION                           │
├─────────────────────────────────────────────────────────────────┤
│  HIGHLY SENSITIVE          │  SENSITIVE                         │
│  (Encryption required)      │  (Access controlled)               │
│  ├── Payment tokens         │  ├── Email addresses               │
│  ├── eSIM activation codes  │  ├── Order history                 │
│  └── API credentials        │  ├── User preferences              │
│                             │  └── Points balance                │
├─────────────────────────────────────────────────────────────────┤
│  INTERNAL                   │  PUBLIC                            │
│  (Staff access only)        │  (No restrictions)                 │
│  ├── Pricing data           │  ├── Package catalog               │
│  ├── Discount codes         │  ├── General availability          │
│  ├── Admin audit logs       │  └── Public documentation          │
│  └── System metrics         │                                    │
└─────────────────────────────────────────────────────────────────┘
```

### 24.2 Data Retention Policy

```sql
-- Data retention periods and cleanup

-- =====================================================
-- RETENTION POLICY TABLE
-- =====================================================

CREATE TABLE data_retention_policy (
    table_name VARCHAR(100) PRIMARY KEY,
    retention_days INTEGER NOT NULL,
    deletion_strategy VARCHAR(50) NOT NULL,  -- 'hard_delete', 'soft_delete', 'anonymize'
    last_cleanup_at TIMESTAMPTZ,
    notes TEXT
);

INSERT INTO data_retention_policy VALUES
-- Business critical - Long retention
('orders', 2555, 'soft_delete', NULL, '7 years for tax/legal'),
('order_items', 2555, 'soft_delete', NULL, '7 years for tax/legal'),
('esim_profiles', 2555, 'anonymize', NULL, '7 years, anonymize PII'),

-- User data - GDPR compliant
('user_profiles', NULL, 'on_request', NULL, 'Deleted on user request'),
('user_points', NULL, 'on_request', NULL, 'Deleted with user profile'),
('user_points_history', 365, 'hard_delete', NULL, '1 year retention'),

-- Operational data - Short retention
('email_logs', 90, 'hard_delete', NULL, '90 days for debugging'),
('idempotency_keys', 7, 'hard_delete', NULL, '7 days (auto-expire)'),
('app_metrics', 30, 'hard_delete', NULL, '30 days for metrics'),
('admin_audit_log', 365, 'hard_delete', NULL, '1 year for compliance'),

-- Temporary data - Very short retention
('webhook_logs', 30, 'hard_delete', NULL, '30 days for debugging'),
('rate_limit_cache', 1, 'hard_delete', NULL, '24 hours (auto-expire)');

-- =====================================================
-- CLEANUP CRON JOB
-- =====================================================

-- Schedule: Daily at 03:00 UTC
-- Edge Function: cron-data-cleanup

CREATE OR REPLACE FUNCTION cleanup_expired_data()
RETURNS JSONB AS $$
DECLARE
    result JSONB := '{}';
    deleted_count INTEGER;
BEGIN
    -- Clean idempotency keys (expired)
    DELETE FROM idempotency_keys WHERE expires_at < NOW();
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    result := result || jsonb_build_object('idempotency_keys', deleted_count);

    -- Clean old email logs (90 days)
    DELETE FROM email_logs WHERE created_at < NOW() - INTERVAL '90 days';
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    result := result || jsonb_build_object('email_logs', deleted_count);

    -- Clean old metrics (30 days)
    DELETE FROM app_metrics WHERE timestamp < NOW() - INTERVAL '30 days';
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    result := result || jsonb_build_object('app_metrics', deleted_count);

    -- Clean old points history (1 year)
    DELETE FROM user_points_history WHERE created_at < NOW() - INTERVAL '365 days';
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    result := result || jsonb_build_object('user_points_history', deleted_count);

    -- Update policy last cleanup
    UPDATE data_retention_policy
    SET last_cleanup_at = NOW()
    WHERE table_name IN ('idempotency_keys', 'email_logs', 'app_metrics', 'user_points_history');

    RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

### 24.3 GDPR Compliance

```typescript
// GDPR compliance features

// 1. Right to Access (Data Export)
const exportUserData = async (userId: string): Promise<UserDataExport> => {
  const supabase = createServiceClient();

  const [profile, orders, points, pointsHistory] = await Promise.all([
    supabase.from('user_profiles').select('*').eq('id', userId).single(),
    supabase.from('orders').select('*, order_items(*)').eq('user_id', userId),
    supabase.from('user_points').select('*').eq('user_id', userId).single(),
    supabase.from('user_points_history').select('*').eq('user_id', userId),
  ]);

  return {
    exportedAt: new Date().toISOString(),
    profile: profile.data,
    orders: orders.data,
    points: points.data,
    pointsHistory: pointsHistory.data,
  };
};

// 2. Right to Erasure (Data Deletion)
const deleteUserData = async (userId: string): Promise<DeletionResult> => {
  const supabase = createServiceClient();

  // Anonymize orders (keep for legal/tax)
  await supabase
    .from('orders')
    .update({
      customer_email: 'deleted@anonymized.local',
      customer_name: 'Deleted User',
      billing_details: null,
    })
    .eq('user_id', userId);

  // Delete points
  await supabase.from('user_points').delete().eq('user_id', userId);
  await supabase.from('user_points_history').delete().eq('user_id', userId);

  // Delete profile
  await supabase.from('user_profiles').delete().eq('id', userId);

  // Delete auth user
  await supabase.auth.admin.deleteUser(userId);

  // Log deletion for audit
  await supabase.from('admin_audit_log').insert({
    action: 'GDPR_DELETION',
    entity_type: 'user',
    entity_id: userId,
    performed_by: 'system',
    details: { reason: 'User requested data deletion' },
  });

  return { success: true, deletedAt: new Date().toISOString() };
};

// 3. Right to Rectification (Data Update)
const updateUserData = async (
  userId: string,
  updates: Partial<UserProfile>
): Promise<void> => {
  const supabase = createServiceClient();

  await supabase
    .from('user_profiles')
    .update({
      ...updates,
      updated_at: new Date().toISOString(),
    })
    .eq('id', userId);

  // Log update for audit
  await supabase.from('admin_audit_log').insert({
    action: 'USER_DATA_UPDATE',
    entity_type: 'user',
    entity_id: userId,
    performed_by: userId,
    details: { fields_updated: Object.keys(updates) },
  });
};

// 4. Consent Management
interface ConsentRecord {
  userId: string;
  consentType: 'marketing' | 'analytics' | 'terms';
  granted: boolean;
  timestamp: Date;
  ipAddress: string;
}

const recordConsent = async (consent: ConsentRecord): Promise<void> => {
  const supabase = createServiceClient();

  await supabase.from('user_consents').upsert({
    user_id: consent.userId,
    consent_type: consent.consentType,
    granted: consent.granted,
    consented_at: consent.timestamp.toISOString(),
    ip_address: consent.ipAddress,
  });
};
```

### 24.4 Privacy Policy Data Points

```yaml
# Data we collect and why (for Privacy Policy)

data_collection:
  account_data:
    collected: ["email", "name", "password_hash"]
    purpose: "Account creation and authentication"
    legal_basis: "Contract performance"
    retention: "Until account deletion"

  order_data:
    collected: ["order_details", "billing_info", "payment_reference"]
    purpose: "Order processing and fulfillment"
    legal_basis: "Contract performance"
    retention: "7 years (legal requirement)"

  esim_data:
    collected: ["iccid", "activation_code", "usage_data"]
    purpose: "eSIM delivery and support"
    legal_basis: "Contract performance"
    retention: "7 years (anonymized after 1 year)"

  usage_data:
    collected: ["page_views", "feature_usage", "device_info"]
    purpose: "Service improvement and analytics"
    legal_basis: "Legitimate interest"
    retention: "1 year"
    opt_out: "Available in account settings"

  marketing_data:
    collected: ["email", "preferences"]
    purpose: "Marketing communications"
    legal_basis: "Consent"
    retention: "Until consent withdrawn"
    opt_out: "Unsubscribe link in emails"

third_party_sharing:
  paddle:
    data_shared: ["email", "billing_details"]
    purpose: "Payment processing"
    privacy_policy: "https://paddle.com/privacy"

  esim_access:
    data_shared: ["order_details"]
    purpose: "eSIM provisioning"
    privacy_policy: "https://esimaccess.com/privacy"

  sendgrid:
    data_shared: ["email", "name"]
    purpose: "Transactional emails"
    privacy_policy: "https://sendgrid.com/privacy"
```

### 24.5 Data Processing Agreements

```yaml
# Required DPAs with third-party processors

data_processors:
  supabase:
    service: "Database and authentication"
    dpa_status: "Signed"
    dpa_url: "https://supabase.com/dpa"
    data_location: "US/EU (configurable)"

  paddle:
    service: "Payment processing"
    dpa_status: "Signed"
    dpa_url: "https://paddle.com/dpa"
    data_location: "EU (UK/Ireland)"
    pci_compliance: "Level 1"

  sendgrid:
    service: "Email delivery"
    dpa_status: "Signed"
    dpa_url: "https://sendgrid.com/dpa"
    data_location: "US"

  esim_access:
    service: "eSIM provisioning"
    dpa_status: "Required - Contact support"
    data_location: "Check with provider"

compliance_checklist:
  - [x] Privacy Policy published
  - [x] Cookie consent implemented
  - [x] Data export feature available
  - [x] Data deletion feature available
  - [x] Consent management implemented
  - [x] DPAs signed with all processors
  - [x] Data breach notification procedure
  - [ ] Annual privacy impact assessment
```

---

## Appendix A: File Structure

```
hiroam/
├── supabase/
│   ├── migrations/
│   │   ├── 001_initial_schema.sql
│   │   ├── 002_rls_policies.sql
│   │   ├── 003_functions.sql
│   │   ├── 004_indexes.sql
│   │   ├── 005_email_logs.sql
│   │   ├── 006_idempotency_keys.sql
│   │   └── 007_app_metrics.sql
│   ├── functions/
│   │   ├── _shared/
│   │   │   ├── cors.ts
│   │   │   ├── supabase.ts
│   │   │   ├── paddle.ts
│   │   │   ├── esim-access.ts
│   │   │   ├── sendgrid.ts
│   │   │   ├── utils.ts
│   │   │   ├── validation.ts
│   │   │   ├── logger.ts
│   │   │   ├── retry.ts
│   │   │   ├── circuit-breaker.ts
│   │   │   ├── idempotency.ts
│   │   │   ├── rate-limiter.ts
│   │   │   ├── middleware.ts
│   │   │   ├── metrics.ts
│   │   │   └── database.types.ts
│   │   ├── packages-list/
│   │   │   └── index.ts
│   │   ├── packages-sync/
│   │   │   └── index.ts
│   │   ├── checkout-create/
│   │   │   └── index.ts
│   │   ├── checkout-validate-discount/
│   │   │   └── index.ts
│   │   ├── webhook-paddle/
│   │   │   └── index.ts
│   │   ├── webhook-esim/
│   │   │   └── index.ts
│   │   ├── orders-query/
│   │   │   └── index.ts
│   │   ├── orders-detail/
│   │   │   └── index.ts
│   │   ├── user-points/
│   │   │   └── index.ts
│   │   ├── email-send/
│   │   │   └── index.ts
│   │   ├── health/
│   │   │   └── index.ts
│   │   ├── cron-sync-packages/
│   │   │   └── index.ts
│   │   ├── cron-expire-points/
│   │   │   └── index.ts
│   │   └── cron-process-esim-refunds/
│   │       └── index.ts
│   └── seed.sql
├── tests/
│   ├── unit/
│   │   ├── pricing.test.ts
│   │   └── validation.test.ts
│   ├── integration/
│   │   ├── checkout.test.ts
│   │   └── orders.test.ts
│   ├── e2e/
│   │   ├── purchase.spec.ts
│   │   └── auth.spec.ts
│   ├── load/
│   │   └── checkout.js
│   └── setup.ts
├── vitest.config.ts
├── playwright.config.ts
└── .env.example
```

---

## Appendix B: API Response Formats

### Package List Response
```json
{
  "success": true,
  "data": {
    "packages": [
      {
        "id": "uuid",
        "package_code": "JP_1_7",
        "name": "Japan 1GB 7 Days",
        "volume_bytes": 1073741824,
        "duration": 7,
        "duration_unit": "DAY",
        "location_codes": ["JP"],
        "pricing": {
          "originalPrice": 999,
          "finalPrice": 799,
          "hasDiscount": true,
          "discountLabel": "20% OFF",
          "savingsAmount": 200
        },
        "availability": {
          "isPurchasable": true,
          "stockRemaining": null
        },
        "is_featured": true,
        "category": "asia"
      }
    ],
    "total": 1
  }
}
```

### Checkout Response
```json
{
  "success": true,
  "data": {
    "order_id": "uuid",
    "order_number": "ORD-20241207-XXXXX",
    "checkout_url": "https://checkout.paddle.com/...",
    "pricing": {
      "subtotal": 999,
      "product_discount": 200,
      "code_discount": 100,
      "total": 699
    }
  }
}
```

### Error Response
```json
{
  "success": false,
  "error": {
    "code": "INVALID_DISCOUNT",
    "message": "This discount code has expired"
  }
}
```

---

*Document Version: 1.5*
*Last Updated: 2024-12-07*

### Changelog

**v1.5** - Operations, Security & Compliance (100% Production Ready)
- Added Section 20: Backup & Disaster Recovery
  - RTO/RPO targets (< 1 hour / < 5 minutes)
  - Supabase PITR configuration
  - Backup priority matrix by data type
  - DR procedures for database, Edge Functions, external services
  - Weekly backup verification queries
- Added Section 21: Security Checklist
  - Pre-production security audit checklist
  - OWASP Top 10 2021 mitigation status
  - Secrets rotation schedule (quarterly/biannual)
  - Security headers configuration
  - Dependency scanning with Snyk and TruffleHog
- Added Section 22: Incident Response
  - Severity levels (P1-P4) with response times
  - Escalation matrix and communication channels
  - Runbooks for: Payment failure, eSIM delivery failure, DB performance
  - Communication templates (initial, update, resolution)
  - Post-incident review template
- Added Section 23: CI/CD Pipeline
  - Complete GitHub Actions workflow (7 stages)
  - Lint, typecheck, unit tests, integration tests, E2E tests
  - Staging and production deployment automation
  - Database migration strategy with rollback procedures
  - Environment configuration (dev, staging, production)
  - Feature flags for gradual rollout
- Added Section 24: Data Retention & Compliance
  - Data classification matrix (highly sensitive → public)
  - Retention policy table with cleanup function
  - GDPR compliance (data export, deletion, rectification)
  - Consent management implementation
  - Privacy policy data points documentation
  - Data Processing Agreements (DPAs) checklist
- Updated Table of Contents with sections 20-24

**v1.4** - Production Readiness (Email, Error Handling, Monitoring, Testing)
- Added Section 13: Email System (SendGrid)
  - SendGrid client implementation with transactional email support
  - 6 email templates: order_confirmation, esim_delivery, esim_expiry_warning, refund_initiated, refund_completed, payment_failed
  - `email_logs` table for tracking email delivery
  - Edge function `email-send` with template selection
  - Scheduled reminders via `cron-send-esim-reminders`
- Added Section 14: Error Handling & Resilience
  - Standardized error codes (ERR-VAL-*, ERR-BIZ-*, ERR-EXT-*, ERR-SYS-*)
  - Retry logic with exponential backoff and jitter
  - Circuit breaker pattern for external APIs (eSIM Access, Paddle, SendGrid)
  - `idempotency_keys` table for preventing duplicate operations
  - Structured JSON logging with request IDs
- Added Section 15: Rate Limiting
  - In-memory rate limiting for simple deployments
  - Redis-based rate limiting for distributed systems
  - Configurable limits per endpoint (packages, checkout, orders, webhooks)
  - Rate limit middleware integration
- Added Section 16: Monitoring & Observability
  - `app_metrics` table for custom metrics collection
  - Health check endpoint (`/health`) monitoring DB, eSIM Access, and Paddle
  - Alert rules configuration for critical thresholds
  - Metrics dimensions for granular analysis
- Added Section 17: Testing Strategy
  - Unit testing with Vitest (60% coverage target)
  - Integration testing with Supabase test client
  - E2E testing with Playwright
  - Load testing with k6 (100 VUs, 5min duration)
  - Test configuration files and example test cases
- Added Section 18: Shared Utilities
  - Complete `_shared/` module implementations
  - utils.ts: generateOrderNumber, formatBytes, formatCurrency, delay, parseJSON
  - supabase.ts: Supabase client factory with service role support
  - esim-access.ts: API client with retry and error handling
  - paddle.ts: Webhook signature verification and API client
  - validation.ts: Zod schemas for all request types
  - cors.ts: Origin whitelist configuration
  - logger.ts: Structured logging with log levels
- Updated Appendix A: File Structure with all new files
- Renumbered Implementation Phases to Section 19

**v1.3** - eSIM Profiles Table & 90-Day Refund System
- Added `esim_profiles` table to properly handle multiple eSIMs per order item (quantity > 1)
- Refactored `order_items` table to track aggregated profile counts instead of single eSIM data
- Added RLS policies for `esim_profiles` table (user view own, admin full access)
- Added comprehensive 90-Day eSIM Refund System (Section 11):
  - SMDP Event tracking (DOWNLOAD, INSTALLED, ENABLED status)
  - Automatic refund eligibility after 90 days of non-use
  - Daily cron job (`cron-process-esim-refunds`) for processing refunds
  - Integration with eSIM Access Cancel API
  - Admin dashboard for refund monitoring
  - Optional customer notification system (7 days before expiry)
- Added database functions: `increment_profile_cancelled()`, `get_refund_summary()`
- Added indexed queries for efficient refund cron job execution

**v1.2** - Dual Architecture (Frontend Edge Functions + Admin Direct DB)
- Added `user_roles` table for admin access control with granular permissions
- Added RLS helper functions: `is_admin()`, `has_permission()`
- Added comprehensive admin RLS policies for all tables
- Updated System Architecture diagram (Section 2) with dual architecture pattern
- Updated Edge Functions section (Section 6) to clarify frontend-only use
- Added Admin Dashboard Access Pattern (Section 6.5) with:
  - Next.js middleware for admin authentication
  - Server actions for admin CRUD operations
  - Direct Supabase client setup
- Updated Security section (Section 12) with RBAC documentation
- Removed admin Edge Functions (admin now uses direct database access)

**v1.1** - Added Scheduled Pricing System
- Replaced inline product discounts with `price_schedules` table
- Added support for date-based promotions (Christmas, New Year, Flash Sales)
- Added priority system for overlapping schedules
- Added database functions: `get_active_price_schedule()`, `get_package_final_price()`, `get_package_schedules()`
- Updated Section 4 (Price Management System) with scheduled pricing documentation

**v1.0** - Initial planning document
