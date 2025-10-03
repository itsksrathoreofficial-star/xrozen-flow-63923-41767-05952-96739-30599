# Xrozen Workflow - Complete Subscription System Documentation

## Overview
यह एक complete subscription management system है जो Razorpay payment gateway के साथ integrate है। इसमें admin panel से full control मिलता है।

## Features Implemented ✅

### 1. Database Structure
- **subscription_plans** - सभी pricing plans manage करने के लिए
- **user_subscriptions** - users की subscription status track करने के लिए  
- **payment_transactions** - सभी payments का record
- **app_settings** - Global configuration (Free/Paid mode, Razorpay keys)
- **project_access_permissions** - Project level access control

### 2. Default Plans (Pre-loaded)

#### Editor Plans
- **Basic** - ₹499/month - Up to 5 Clients
- **Standard** - ₹699/month - Up to 10 Clients  
- **Premium** - ₹999/month - Unlimited Clients

#### Client Plans
- **Basic** - ₹499/month - Up to 5 Editors
- **Standard** - ₹699/month - Up to 10 Editors
- **Premium** - ₹999/month - Unlimited Editors

#### Agency Plans
- **Basic** - ₹699/month - 5 Clients + 5 Editors
- **Standard** - ₹999/month - 10 Clients + 10 Editors
- **Premium** - ₹1299/month - Unlimited Clients + Editors

### 3. User Flow

```
Signup → Subscription Selection → Payment (if paid mode) → Dashboard
         ↓
      Can Skip → Limited Free Access (view only shared projects)
```

### 4. Admin Controls

#### Admin Pages Created:
- `/admin/subscriptions` - View and manage all user subscriptions
- `/admin/plans-management` - Create/Edit/Delete subscription plans
- `/admin/settings` - Configure app mode and Razorpay

#### Admin Capabilities:
- ✅ Toggle Free/Paid mode globally
- ✅ Create custom subscription plans
- ✅ Edit plan pricing and limits
- ✅ Extend user subscriptions manually
- ✅ Change subscription status
- ✅ Configure Razorpay API keys
- ✅ View all payment transactions

### 5. Payment Integration

#### Razorpay Edge Functions:
- `create-razorpay-order` - Creates payment order
- `verify-razorpay-payment` - Verifies payment signature

#### Setup Steps:
1. Admin panel में जाएं → `/admin/settings`
2. Razorpay Key ID और Secret enter करें
3. "Save Razorpay Configuration" पर click करें

### 6. Access Control System

#### Subscription Guard Component:
```tsx
import { SubscriptionGuard } from "@/components/subscription/SubscriptionGuard";

// Wrap any protected component
<SubscriptionGuard requiredAccess="edit">
  <YourComponent />
</SubscriptionGuard>
```

#### Access Levels:
- **view** - Can only view projects
- **edit** - Can edit projects  
- **approve** - Can approve versions

### 7. App Modes

#### Free Mode (Default for Testing):
- No payment required
- All features unlocked
- Perfect for development
- Toggle from Admin Settings

#### Paid Mode (Production):
- Subscription required
- Payment via Razorpay
- Limits enforced per plan
- Toggle from Admin Settings

## How to Use

### For Testing (Development):
1. App free mode में already है
2. Users signup करें और कोई भी plan select करें
3. No payment required
4. Full access automatically granted

### For Production:
1. Admin panel → `/admin/settings`
2. "Paid Mode" toggle ON करें
3. Razorpay keys configure करें
4. अब users को payment करना होगा

## Authentication Flow Updates

### After Signup:
- User redirect होता है `/subscription-select` page पर
- Plan select करना mandatory है
- Skip option available (limited access)

### After Login:
- Check होता है subscription status
- No subscription → Redirect to plan selection
- Expired subscription → Warning + Renewal option

## Database Tables Schema

### subscription_plans
```sql
- id (uuid)
- name (text)
- user_category (editor/client/agency)
- price_inr (numeric)
- client_limit (integer, nullable)
- editor_limit (integer, nullable)  
- features (jsonb array)
- is_active (boolean)
```

### user_subscriptions
```sql
- id (uuid)
- user_id (uuid)
- plan_id (uuid, nullable)
- status (text: active/expired/cancelled/limited)
- start_date (timestamp)
- end_date (timestamp)
- payment_method (text)
- razorpay_subscription_id (text)
```

### payment_transactions
```sql
- id (uuid)
- user_id (uuid)
- subscription_id (uuid)
- amount (numeric)
- status (text)
- razorpay_payment_id (text)
- razorpay_order_id (text)
```

## API Routes

### Pages Added:
- `/subscription-select` - Plan selection page
- `/admin/subscriptions` - Manage subscriptions
- `/admin/plans-management` - Manage plans
- `/admin/settings` - App configuration

### Edge Functions:
- `create-razorpay-order` - POST - Creates payment order
- `verify-razorpay-payment` - POST - Verifies payment

## Security Features

✅ Row Level Security (RLS) enabled on all tables
✅ Admin-only access for management pages  
✅ Payment signature verification
✅ Server-side subscription validation
✅ Secure Razorpay key storage

## Future Enhancements

Possible additions:
- Email notifications for expiring subscriptions
- Prorated billing for upgrades/downgrades
- Trial period management
- Coupon/discount codes
- Subscription analytics dashboard
- Automated dunning management

## Support

For any issues:
1. Check console logs
2. Verify Razorpay configuration
3. Check database tables for data
4. Review edge function logs in Supabase

## Credits

Built for **Xrozen Workflow** - Professional Video Editing Project Management Platform

---

**Important Notes:**
- Always test payment flow in Razorpay Test Mode first
- Keep Razorpay keys secure
- Monitor subscription expiry dates
- Regular backups recommended
