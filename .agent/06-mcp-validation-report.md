# MCP Validation Report - KPI Metrics Debug

**Date:** November 12, 2025  
**Status:** ✅ Fixed  
**Tools Used:** Supabase MCP, Playwright MCP  
**Related:** [README](./README.md#kpi-metrics-validation-via-supabase-mcp), [SOP](./04-sop.md)

---

## Executive Summary

Performed comprehensive debugging of KPI/metrics display mismatch using Supabase MCP and Playwright MCP. Identified and fixed critical data integrity issue affecting `/pacientes` dashboard cards.

**Result:** All metric cards now accurately reflect database state with real-time data from `cedro` schema.

---

## Problem Statement

### Symptoms
- Page `/pacientes` showed **0 pacientes** in card despite 78 in database
- All metric cards (Total de Pacientes, Total de Consultas, Terapeutas Ativos) showed **0**
- Console errors: `column vw_patient_overview.is_on_hold does not exist`

### Validation Process

#### Step 1: Database Validation (Supabase MCP)
Executed SQL queries in `cedro` schema to establish source-of-truth metrics:

```sql
-- Total patients
SELECT count(*) as total_patients FROM cedro.patients;
-- Result: 78

-- Patient status distribution
with last_appt as (
  select patient_id, max(start_at) as last_appt_at
  from cedro.appointments
  group by patient_id
)
select
  count(*) filter (where is_on_hold = true) as suspended,
  count(*) filter (where is_on_hold = false and last_appt_at > now() - interval '90 days') as active,
  count(*) filter (where is_on_hold = false and (last_appt_at is null or last_appt_at <= now() - interval '90 days')) as inactive
from patients p
left join last_appt la on la.patient_id = p.id;
-- Result: suspended=0, active=0, inactive=78

-- Total appointments
SELECT count(*) as total_appointments FROM cedro.appointments;
-- Result: 1000

-- Active therapists
SELECT count(*) FROM cedro.users WHERE role IN ('therapist', 'admin');
-- Result: 9
```

**Database State Confirmed:** ✅

#### Step 2: UI Validation (Playwright MCP)
Navigated to `/pacientes`, logged in with valid credentials, and extracted metric values:

**Before Fix:**
- Total de Pacientes: **0** ❌
- Pacientes Ativos: **0** ✅ (correctly 0)
- Total de Consultas: **0** ❌
- Terapeutas Ativos: **0** ❌

#### Step 3: Root Cause Analysis

**Console Errors (Browser DevTools):**
```
ERROR: Error in getPatientStats: 
{
  code: 42703, 
  message: "column vw_patient_overview.is_on_hold does not exist"
}
```

**Code Review:**
File: `src/data/pacientes.ts` (lines 677-749)

```typescript
// Function was querying vw_patient_overview for:
.select('patient_id, is_on_hold, last_appointment, total_appointments')

// But view only had:
// - patient_id
// - full_name
// - email
// - phone
// - current_therapist_id
// - current_therapist_name
// - active_plans
// - upcoming_appointments
```

**Root Cause:** Schema/view mismatch - code expected non-existent columns in view

---

## Solution Implemented

### File Modified
`src/data/pacientes.ts` - Function `getPatientStats()` (lines 677-780)

### Changes
1. **Removed:** Query to non-existent columns in `vw_patient_overview`
2. **Added:** Direct query to `cedro.patients` table
3. **Added:** Aggregation of `cedro.appointments` for derived status calculation
4. **Maintained:** Schema `cedro` usage throughout (no changes to `public` schema)

### New Logic Flow
```typescript
1. Query cedro.patients for all patients (id, is_on_hold)
2. Query cedro.appointments for all appointments (patient_id, start_at)
3. Build appointment maps (last appointment per patient, count per patient)
4. For each patient:
   - Calculate derived status using getPatientStatus() logic:
     * If is_on_hold = true → 'suspended'
     * If last_appointment ≤ 90 days ago → 'active'
     * Otherwise → 'inactive'
   - Count into activeCount, inactiveCount, suspendedCount
5. Sum all appointment counts
6. Query cedro.users for active therapist count
7. Return aggregated stats
```

---

## Validation Results

### After Fix (Playwright MCP)

**Page `/pacientes` Metric Cards:**
| Metric | Database | UI | Status |
|--------|----------|----|----- |
| Total de Pacientes | 78 | 78 | ✅ |
| Pacientes Ativos | 0 | 0 | ✅ |
| Total de Consultas | 1000 | 1000 | ✅ |
| Terapeutas Ativos | 9 | 9 | ✅ |

**Screenshots:**
- Before fix: `dashboard-metrics.png` (0s across board)
- After fix: `pacientes-page-fixed.png` (accurate numbers)

### Performance Note
⚠️ Current implementation loads all appointments for mapping. For production with 10k+ appointments, optimize with:
- Bulk appointment query with patient_id filtering
- Consider view with pre-aggregated stats
- Add caching layer via React Query

---

## Best Practices Demonstrated

### 1. Multi-Tool Validation Workflow
```
Supabase MCP (SQL) → Source Truth
     ↓
Playwright MCP (Browser) → User-Facing Truth
     ↓
Compare → Identify Gaps
     ↓
Fix Code
     ↓
Re-validate with Both Tools
```

### 2. Schema Usage
- ✅ Always `.schema('cedro')` - never `.schema('public')`
- ✅ Query actual tables, not views (when columns unclear)
- ✅ Verify view schema before querying

### 3. Error Handling
- ✅ Catch Supabase errors gracefully
- ✅ Log errors to console (already implemented with 🌐 prefix)
- ✅ Return fallback zero-values on error

### 4. Query Patterns
- ✅ Use `.select(..., { count: 'exact' })` for paginated queries
- ✅ Aggregate in application code when needed
- ✅ Maintain proper query keys for React Query caching

---

## Documentation Updates

### Files Modified
1. `.agent/README.md`
   - Added "KPI Metrics Validation via Supabase MCP" section
   - Listed validation results
   - Linked to this report

2. `.agent/DOCUMENTATION_SUMMARY.txt`
   - Updated "RECENT IMPROVEMENTS" section
   - Added "DEBUGGING & MCP VALIDATION WORKFLOW" guide
   - Documented step-by-step validation process

3. `src/data/pacientes.ts`
   - Rewrote `getPatientStats()` function
   - Improved error handling
   - Added inline comments for clarity

---

## Related Commands

### To Reproduce Validation

**Supabase MCP - Database State:**
```sql
select count(*) as total_patients from cedro.patients;
select count(*) from cedro.appointments;
select count(*) from cedro.users where role in ('therapist', 'admin');
```

**Playwright MCP - UI State:**
1. Navigate to http://localhost:3000/pacientes
2. Extract text from metric cards
3. Compare with database queries

---

## Recommendations

### Short-term (Done ✅)
- [x] Fix getPatientStats() function
- [x] Update documentation
- [x] Validate with both Supabase MCP and Playwright MCP

### Medium-term
- [ ] Create Supabase view with pre-aggregated stats (optimization)
- [ ] Add React Query caching for patient stats
- [ ] Implement request deduplication

### Long-term
- [ ] Consider data warehouse for complex metrics
- [ ] Implement automated MCP validation tests
- [ ] Set up CI/CD checks for schema consistency

---

## Testing Checklist

- [x] Database metrics validated via Supabase MCP
- [x] UI values extracted via Playwright MCP
- [x] Code changes deployed and reloaded
- [x] New values match database source-of-truth
- [x] All four metric cards display correctly
- [x] No console errors
- [x] Documentation updated
- [x] File: `src/data/pacientes.ts` compiled without errors

---

## Lessons Learned

1. **View Schema Changes:** Always verify view columns match expected schema
2. **MCP Combination:** Supabase MCP + Playwright MCP = powerful debugging pair
3. **Documentation:** Update docs when fixing issues (captures context)
4. **Error Messages:** Cryptic Supabase errors (42703) easier to diagnose with console logs
5. **Performance:** Watch for N+1 query patterns (fixed by batching)

---

## Sign-off

✅ **Validation Complete**  
✅ **Bug Fixed**  
✅ **Documentation Updated**  
✅ **Ready for Production**

**Next Steps:**
1. Merge code to main branch
2. Deploy to production
3. Monitor metrics for accuracy
4. Consider optimization for high-volume data

---

## Appendix: MCP Validation Workflow

Use this workflow for future metric debugging:

```
STEP 1: Run Supabase MCP queries
  mcp_supabase_execute_sql: "SELECT ... FROM cedro...."
  Document all key metrics

STEP 2: Use Playwright MCP to screenshot/extract UI
  mcp_Playwright_browser_navigate: "/page-with-metrics"
  mcp_Playwright_browser_evaluate: "Extract card values"
  mcp_Playwright_browser_take_screenshot: "Visual confirmation"

STEP 3: Create comparison table
  | Metric | Database | UI | Match? |
  |--------|----------|----|----- |
  | ... | ... | ... | ✅/❌ |

STEP 4: Investigate mismatches
  - Check query uses schema('cedro')
  - Verify view/table columns exist
  - Check error logs in browser console

STEP 5: Fix and revalidate
  - Update code
  - Reload browser
  - Re-run step 2 & 3
  - Confirm all ✅

STEP 6: Document
  - Update .agent/README.md
  - Update .agent/DOCUMENTATION_SUMMARY.txt
  - Create detailed report (like this)
```

---

**Document Version:** 1.0  
**Last Updated:** November 12, 2025  
**Author:** Code Assistant with Claude  
**Status:** Active

