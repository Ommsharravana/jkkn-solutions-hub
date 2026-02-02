# Audit Logging System - Usage Guide

## Overview

The audit logging system tracks important actions in the JKKN Solutions Hub for compliance, security, and accountability purposes.

## Files Created

1. **Service Layer**: `/src/services/audit.ts` - Core audit logging functions
2. **Database Migration**: `/supabase/migrations/20260202000001_audit_logs.sql` - Creates audit_logs table
3. **Type Definitions**: `/src/types/database.ts` - Updated with AuditLog interface

## Database Schema

```sql
CREATE TABLE audit_logs (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id),
  user_email TEXT,
  action TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id UUID,
  entity_name TEXT,
  details JSONB DEFAULT '{}',
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

## Permission Model

- **MD Role**: Can view all audit logs
- **All Users**: Can view their own audit logs
- **All Authenticated Users**: Can insert audit logs

## Usage Examples

### Basic Audit Logging

```typescript
import { logAuditEvent } from '@/services/audit'

// Log a simple action
await logAuditEvent({
  user_id: userId,
  action: 'create',
  entity_type: 'solution',
  entity_id: solutionId,
  entity_name: 'ERP System for XYZ Corp',
  details: {
    solution_type: 'software',
    base_price: 500000
  }
})
```

### Assignment Actions

```typescript
import { logAssignmentAction } from '@/services/audit'

// Log builder assignment
await logAssignmentAction(
  userId,
  'approve',
  'builder',
  assignmentId,
  'John Doe',
  { phase_name: 'Phase 1: MVP' }
)
```

### Payment Actions

```typescript
import { logPaymentAction } from '@/services/audit'

// Log payment received
await logPaymentAction(
  userId,
  'create',
  paymentId,
  150000,
  'ERP System - Phase 1',
  { payment_type: 'advance', percentage: 30 }
)
```

### Retrieving Audit Logs

```typescript
import { getRecentAuditLogs, getEntityAuditLogs } from '@/services/audit'

// Get recent logs (MD only)
const recentLogs = await getRecentAuditLogs(50)

// Get logs for a specific entity
const solutionLogs = await getEntityAuditLogs('solution', solutionId, 20)
```

## Actions Tracked

- `login` / `logout` - Authentication events
- `create` / `update` / `delete` - CRUD operations
- `approve` / `reject` - Approval workflows
- `assign` / `complete` - Assignment lifecycle
- `payment` - Financial transactions
- `export` - Data exports
- `view_sensitive` - Access to sensitive data

## Entity Types Tracked

- `user`, `client`, `solution`, `phase`
- `assignment`, `payment`, `builder`
- `cohort_member`, `production_learner`
- `department`, `session`, `report`

## Important Notes

1. **Non-Blocking**: Audit logging errors are logged to console but don't break the app
2. **Automatic User Info**: User email is automatically fetched if not provided
3. **JSONB Details**: Store additional context in the `details` field
4. **Indexing**: Optimized queries on user_id, entity, created_at, and action

## Integration Points

Add audit logging to these critical operations:

1. **Assignment Approval/Rejection** (HOD/MD approval flows)
2. **Payment Recording** (all financial transactions)
3. **Solution Status Changes** (lifecycle tracking)
4. **Builder Assignment** (team allocations)
5. **MOU Signing** (contract events)
6. **High-Value Approvals** (>3L software, >2L training)
7. **Data Exports** (compliance tracking)
8. **Sensitive Data Access** (privacy compliance)

## Running the Migration

To apply the audit logs table to the database:

```bash
# Push to Supabase
~/bin/supabase db push --project-ref <your-project-ref>

# Or link to local project and push
~/bin/supabase link --project-ref <your-project-ref>
~/bin/supabase db push
```

## Next Steps

1. Run the migration to create the audit_logs table
2. Integrate audit logging into critical workflows
3. Create an admin dashboard to view audit logs (MD only)
4. Set up alerts for suspicious patterns
5. Configure retention policies for compliance
