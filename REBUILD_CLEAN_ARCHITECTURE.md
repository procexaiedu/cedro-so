# 🏗️ CEDRO REBUILD - CLEAN ARCHITECTURE GUIDE

**Status**: Architecture Foundation Created ✅
**Date**: 2025-11-04
**Objective**: Create a maintainable, bug-free system from clean patterns

---

## 📚 WHAT'S BEEN CREATED

### 1. API Types Layer (`src/lib/api/types.ts`)
- Complete type definitions for all entities
- Standardized interfaces
- Type safety across the entire app
- Single source of truth for data shapes

### 2. API Client Layer (`src/lib/api/client.ts`)
- Unified Supabase wrapper
- Error handling and parsing
- Retry logic for failed queries
- Standard CRUD operations
- **NO MIXED PATTERNS** - one way to do things

### 3. React Query Patterns (`src/lib/api/react-query-patterns.ts`)
- Standardized query options for different data types
- Mutation options with proper error handling
- Query key factory (prevents typos, enables type-safe invalidation)
- Invalidation patterns for data synchronization
- Cache timing strategies

### 4. Example Implementation (`src/lib/api/patients.ts` + `src/hooks/use-patients-new.ts`)
- Shows the CORRECT way to implement a module
- No useState for data fetching
- No race conditions
- No dependency loops
- Proper error handling
- Ready to copy as template for other modules

---

## 🚀 HOW TO USE THIS ARCHITECTURE

### Phase 1: Understanding the Pattern (This is what we did)

```typescript
// DON'T DO THIS (OLD - BROKEN):
const [patients, setPatients] = useState([])
const [loading, setLoading] = useState(false)
useEffect(() => {
  loadPatients() // Callback hell, dependency loops
}, [])

// DO THIS (NEW - CLEAN):
const { data: patients = [], isLoading, error } = useAllPatients()
// That's it! React Query handles everything
```

### Phase 2: Implementing Other Modules

Each module follows this pattern:

```
src/lib/api/[module].ts
  ├── Queries (read operations)
  │   ├── getAll[Entity]()
  │   ├── get[Entity]ById(id)
  │   ├── get[Entity]sPaginated(page, pageSize)
  │   └── search[Entity](term)
  └── Mutations (write operations)
      ├── create[Entity](data)
      ├── update[Entity](id, data)
      └── delete[Entity](id)

src/hooks/use-[module]-new.ts
  ├── useAll[Entities]() - query hook
  ├── use[Entity](id) - query hook
  ├── useCreate[Entity]() - mutation hook
  ├── useUpdate[Entity](id) - mutation hook
  └── useDelete[Entity]() - mutation hook
```

---

## 📋 MODULES TO REBUILD (IN ORDER)

### Priority 1: Core Modules (40% of work)

#### 1.1 Pacientes ✅ (DONE)
- [x] `src/lib/api/patients.ts`
- [x] `src/hooks/use-patients-new.ts`
- [ ] Replace in `src/app/pacientes/page.tsx`
- [ ] Test thoroughly

#### 1.2 Appointments
- [ ] `src/lib/api/appointments.ts`
- [ ] `src/hooks/use-appointments-new.ts`
- [ ] Replace in `src/app/agenda/page.tsx`
- [ ] Test thoroughly

#### 1.3 Medical Records
- [ ] `src/lib/api/medical-records.ts`
- [ ] `src/hooks/use-medical-records-new.ts`
- [ ] Replace in `src/app/prontuarios/page.tsx`

### Priority 2: Secondary Modules (35% of work)

#### 2.1 Schedules (Disponibilidade)
- [ ] `src/lib/api/schedules.ts`
- [ ] `src/hooks/use-schedules-new.ts`
- [ ] Replace in `src/app/disponibilidade/page.tsx`

#### 2.2 CRM Leads
- [ ] `src/lib/api/crm.ts`
- [ ] `src/hooks/use-crm-new.ts`
- [ ] Replace in `src/app/crm/page.tsx`

#### 2.3 Invoices (Financeiro)
- [ ] `src/lib/api/invoices.ts`
- [ ] `src/hooks/use-invoices-new.ts`
- [ ] Replace in `src/app/financeiro/page.tsx`

### Priority 3: Dashboard & Utils (15% of work)

#### 3.1 Dashboard
- [ ] `src/lib/api/dashboard.ts`
- [ ] Refactor `src/app/dashboard/page.tsx`

#### 3.2 Utilities
- [ ] Form validation helpers
- [ ] Formatting utilities
- [ ] UI helpers

---

## 🎯 IMPLEMENTATION TEMPLATE

When rebuilding each module, follow this exact pattern:

### Step 1: Create API Functions (`src/lib/api/[module].ts`)

```typescript
// Query functions (async, just fetch data)
export async function getAll[Entities](): Promise<[Entity][]> {
  return api.executeQuery<[Entity]>('[table_name]', {
    columns: 'id, name, created_at, updated_at'
  })
}

// Mutation functions (create/update/delete)
export async function create[Entity](
  data: Omit<[Entity], 'id' | 'created_at' | 'updated_at'>
): Promise<[Entity]> {
  return api.insert<[Entity]>('[table_name]', data)
}
```

### Step 2: Create React Query Hooks (`src/hooks/use-[module]-new.ts`)

```typescript
// Query hook
export function useAll[Entities]() {
  return useQuery({
    queryKey: queryKeys.[entities].list(),
    queryFn: () => getAll[Entities](),
    ...QUERY_OPTIONS_LIST // Use appropriate option set
  })
}

// Mutation hook
export function useCreate[Entity]() {
  const queryClient = useQueryClient()
  const { toast } = useToast()

  return useMutation({
    mutationFn: (data: ...) => create[Entity](data),
    ...getMutationOptions<[Entity], Error>({
      onSuccess: () => {
        // Invalidate related queries
        queryClient.invalidateQueries({
          queryKey: queryKeys.[entities].all
        })
        toast({ ... })
      },
      onError: (error) => {
        toast({ ... })
      }
    })
  })
}
```

### Step 3: Update Component (`src/app/[module]/page.tsx`)

```typescript
// OLD (BROKEN):
const [data, setData] = useState([])
const [loading, setLoading] = useState(false)
useEffect(() => { ... }, [])

// NEW (CLEAN):
const { data = [], isLoading, error } = useAll[Entities]()
const { mutate: create } = useCreate[Entity]()

// Now use data, isLoading, error directly
// No useState management needed!
```

---

## ⚠️ COMMON MISTAKES TO AVOID

### ❌ DON'T: Use multiple useQuery calls for dependent data

```typescript
// WRONG:
const { data: patients } = usePatients()
const { data: therapists } = useTherapists() // May load before patients!
const { data: services } = useServices() // Race condition!
```

### ✅ DO: Load dependencies with proper enabled flags

```typescript
// RIGHT:
const { data: patients } = usePatients()
const { data: therapist } = useTherapist(
  patients?.[0]?.therapist_id,
  { enabled: !!patients?.[0]?.therapist_id } // Only load when needed
)
```

### ❌ DON'T: Put async functions in useEffect callbacks without cleanup

```typescript
// WRONG:
useEffect(() => {
  const load = async () => { ... }
  load() // Runs twice in dev, causes duplicate calls
}, [dependencies]) // Wrong deps -> infinite loop
```

### ✅ DO: Use React Query hooks instead

```typescript
// RIGHT:
const { data } = useQuery({
  queryKey: [...],
  queryFn: async () => { ... },
  ...options
})
```

### ❌ DON'T: Mix useState and useQuery

```typescript
// WRONG:
const { data: remoteData } = useQuery(...)
const [localData, setLocalData] = useState(remoteData) // Confusion!
// Which one is the source of truth?
```

### ✅ DO: Use one source of truth

```typescript
// RIGHT:
const { data } = useQuery(...) // Use this directly
// If you need to transform it, do it in render:
const transformed = data?.map(...) // Render time, not state
```

---

## 📊 QUALITY CHECKLIST

Before marking a module as complete:

- [ ] API functions created (`src/lib/api/[module].ts`)
- [ ] Hook layer created (`src/hooks/use-[module]-new.ts`)
- [ ] No useState for data fetching
- [ ] No useEffect for data loading
- [ ] Proper error handling (toast on error)
- [ ] Loading states working (showing skeleton/spinner)
- [ ] Mutations invalidate correct queries
- [ ] No race conditions (test fast switching)
- [ ] No infinite loops (test dependency arrays)
- [ ] TypeScript types are correct
- [ ] Component works without F5
- [ ] Component works with slow network (test with DevTools throttling)

---

## 🔄 MIGRATION STRATEGY

### For Each Module:

1. **Create new API functions** in `src/lib/api/`
2. **Create new hooks** in `src/hooks/`
3. **Test hooks independently** with React Query DevTools
4. **Update component** to use new hooks
5. **Test in browser** (no F5 needed!)
6. **Delete old code** (old data file, old hook)
7. **Commit** with message: `Rebuild [Module] with clean architecture`

---

## 🛠️ DEBUGGING HELPERS

### Use React Query DevTools

```typescript
// Already in your providers:
<ReactQueryDevtools initialIsOpen={false} />
```

- Open DevTools → TanStack Query tab
- See all queries and their state
- See cache hits/misses
- See mutation results
- Time travel through requests

### Enable API Logging

In `src/lib/api/client.ts`, logs are already there:
```typescript
console.error('🔴 API Error:', { message, code, status })
```

Look for these logs in DevTools Console when debugging.

---

## 🚀 NEXT STEPS

1. **Review** this document with team
2. **Implement Appointments module** (copy Patients pattern)
3. **Test thoroughly** with various scenarios
4. **Document** any issues found
5. **Proceed to Medical Records** (Priority 1.3)
6. **Then Secondary modules** (Priority 2)

---

## 📞 QUESTIONS?

If you hit any issues:

1. Check if you're following the pattern (see template above)
2. Look at `src/lib/api/patients.ts` for reference
3. Look at `src/hooks/use-patients-new.ts` for hook patterns
4. Check React Query docs: https://tanstack.com/query/docs/

---

**This architecture will eliminate:**
- ✅ Loading infinito issues
- ✅ Race conditions
- ✅ Dependency loops
- ✅ Inconsistent error handling
- ✅ Inefficient queries
- ✅ Stale data issues

**The system will finally be:**
- ✅ Predictable
- ✅ Maintainable
- ✅ Testable
- ✅ Fast
- ✅ Reliable
