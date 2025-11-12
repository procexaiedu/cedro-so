# Standard Operating Procedures (SOP)

**Last Updated:** November 2025
**Related Docs:** [Project Architecture](./01-project-architecture.md), [Database Schema](./02-database-schema.md), [Design System](./03-design-system.md)

---

## Table of Contents

1. [Adding a New Feature](#adding-a-new-feature)
2. [Database Migrations](#database-migrations)
3. [Creating React Components](#creating-react-components)
4. [Implementing Data Fetching](#implementing-data-fetching)
5. [Testing](#testing)
6. [Code Review Checklist](#code-review-checklist)

---

## Adding a New Feature

### Step 1: Create Database Schema (if needed)

```bash
# Create a migration
npm run db:migration add_feature_name

# Edit the migration file to define tables/columns
# Always use cedro schema
```

**Migration Template:**
```sql
-- Migration: add_feature_name
BEGIN;

CREATE TABLE cedro.feature_table (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  status text DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Optional: Add indexes for frequently queried columns
CREATE INDEX idx_feature_table_status ON cedro.feature_table(status);

COMMIT;
```

**Important:**
- Always use `cedro` schema, never `public`
- Include timestamps (`created_at`, `updated_at`)
- Use CHECK constraints for enums
- Add comments for complex fields
- Create indexes for foreign keys and frequently filtered columns

### Step 2: Create API Layer

**File:** `src/lib/api/feature-name.ts`

```typescript
import { supabase } from '@/lib/supabase';
import { CedroApiError } from './client';

export interface Feature {
  id: string;
  name: string;
  description?: string;
  status: 'active' | 'inactive';
  created_at: string;
  updated_at: string;
}

export async function getFeatures(): Promise<Feature[]> {
  try {
    const { data, error } = await supabase
      .schema('cedro')
      .from('feature_table')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  } catch (err) {
    throw new CedroApiError(err, 'Failed to fetch features');
  }
}

export async function getFeatureById(id: string): Promise<Feature> {
  try {
    const { data, error } = await supabase
      .schema('cedro')
      .from('feature_table')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;
    return data;
  } catch (err) {
    throw new CedroApiError(err, `Failed to fetch feature ${id}`);
  }
}

export async function createFeature(feature: Omit<Feature, 'id' | 'created_at' | 'updated_at'>): Promise<Feature> {
  try {
    const { data, error } = await supabase
      .schema('cedro')
      .from('feature_table')
      .insert([feature])
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (err) {
    throw new CedroApiError(err, 'Failed to create feature');
  }
}

export async function updateFeature(id: string, updates: Partial<Feature>): Promise<Feature> {
  try {
    const { data, error } = await supabase
      .schema('cedro')
      .from('feature_table')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (err) {
    throw new CedroApiError(err, 'Failed to update feature');
  }
}

export async function deleteFeature(id: string): Promise<void> {
  try {
    const { error } = await supabase
      .schema('cedro')
      .from('feature_table')
      .delete()
      .eq('id', id);

    if (error) throw error;
  } catch (err) {
    throw new CedroApiError(err, 'Failed to delete feature');
  }
}
```

**Key Points:**
- All functions are `async` and return promises (no React dependencies)
- Always use `schema('cedro')` in Supabase queries
- Throw `CedroApiError` for proper error handling
- Export TypeScript interfaces for types
- Include proper error messages

### Step 3: Create React Query Hooks

**File:** `src/hooks/use-feature-new.ts`

```typescript
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  getFeatures,
  getFeatureById,
  createFeature,
  updateFeature,
  deleteFeature,
  Feature,
} from '@/lib/api/feature-name';
import { queryKeys } from '@/lib/api/react-query-patterns';
import { QUERY_OPTIONS_LIST, QUERY_OPTIONS_DETAIL } from '@/lib/api/react-query-patterns';

// Queries
export function useFeatures() {
  return useQuery({
    queryKey: queryKeys.features.all(),
    queryFn: getFeatures,
    ...QUERY_OPTIONS_LIST,
  });
}

export function useFeature(id: string | undefined) {
  return useQuery({
    queryKey: queryKeys.features.detail(id),
    queryFn: () => getFeatureById(id!),
    enabled: !!id,
    ...QUERY_OPTIONS_DETAIL,
  });
}

// Mutations
export function useCreateFeature() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createFeature,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.features.all() });
      toast.success('Feature created successfully');
    },
    onError: (error) => {
      toast.error('Failed to create feature');
    },
  });
}

export function useUpdateFeature(id: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (updates: Partial<Feature>) => updateFeature(id, updates),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.features.detail(id) });
      queryClient.invalidateQueries({ queryKey: queryKeys.features.all() });
      toast.success('Feature updated successfully');
    },
    onError: (error) => {
      toast.error('Failed to update feature');
    },
  });
}

export function useDeleteFeature() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteFeature,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.features.all() });
      toast.success('Feature deleted successfully');
    },
    onError: (error) => {
      toast.error('Failed to delete feature');
    },
  });
}
```

**Key Points:**
- Separate queries and mutations
- Use `queryKeys` factory for consistency
- Use appropriate `QUERY_OPTIONS_*` based on data freshness
- Invalidate related queries on mutations
- Show toast notifications on success/error

### Step 4: Create Components

**Directory:** `src/components/feature-name/`

Create multiple files for organization:
- `feature-list.tsx` - List/table view
- `feature-form.tsx` - Create/edit form
- `feature-detail.tsx` - Detail view
- `feature-actions.tsx` - Action buttons

**Example: feature-form.tsx**
```tsx
'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useCreateFeature, useUpdateFeature } from '@/hooks/use-feature-new';
import { Feature } from '@/lib/api/feature-name';

const featureSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  description: z.string().optional(),
  status: z.enum(['active', 'inactive']),
});

type FeatureFormData = z.infer<typeof featureSchema>;

interface FeatureFormProps {
  feature?: Feature;
  onSuccess?: () => void;
}

export function FeatureForm({ feature, onSuccess }: FeatureFormProps) {
  const createMutation = useCreateFeature();
  const updateMutation = useUpdateFeature(feature?.id || '');

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FeatureFormData>({
    resolver: zodResolver(featureSchema),
    defaultValues: feature,
  });

  const onSubmit = async (data: FeatureFormData) => {
    if (feature) {
      await updateMutation.mutateAsync(data);
    } else {
      await createMutation.mutateAsync(data as Feature);
    }
    onSuccess?.();
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-spacing-m">
      <div>
        <label className="font-mono text-caption uppercase">Name</label>
        <Input {...register('name')} placeholder="Feature name" />
        {errors.name && <p className="text-red-500 text-sm mt-1">{errors.name.message}</p>}
      </div>

      <div>
        <label className="font-mono text-caption uppercase">Description</label>
        <Input {...register('description')} placeholder="Optional description" />
      </div>

      <Button type="submit" variant="teal" disabled={createMutation.isPending || updateMutation.isPending}>
        {feature ? 'Update' : 'Create'} Feature
      </Button>
    </form>
  );
}
```

### Step 5: Create Page Route

**File:** `src/app/feature-name/page.tsx`

```tsx
'use client';

import { useState } from 'react';
import { AppShell } from '@/components/layout/app-shell';
import { AuthGuard } from '@/components/auth/auth-guard';
import { FeatureList } from '@/components/feature-name/feature-list';
import { FeatureForm } from '@/components/feature-name/feature-form';
import { useFeatures } from '@/hooks/use-feature-new';

export default function FeaturePage() {
  const [showForm, setShowForm] = useState(false);
  const { data: features, isLoading } = useFeatures();

  return (
    <AuthGuard>
      <AppShell>
        <div className="space-y-spacing-l">
          <div className="text-center border-b-standard border-motherduck-dark pb-spacing-m">
            <h1 className="font-mono text-heading-1 font-bold text-motherduck-dark uppercase">
              Features
            </h1>
          </div>

          {showForm && (
            <FeatureForm onSuccess={() => setShowForm(false)} />
          )}

          {isLoading ? (
            <p>Loading...</p>
          ) : (
            <FeatureList features={features || []} />
          )}
        </div>
      </AppShell>
    </AuthGuard>
  );
}
```

---

## Database Migrations

### Creating a Migration

```bash
# Using Supabase CLI (if available)
npx supabase migration new add_feature_table

# Or manually create migration file:
# migrations/20250101120000_add_feature_table.sql
```

### Migration Checklist

- [ ] Use `cedro` schema
- [ ] Create tables with proper constraints
- [ ] Add primary keys (uuid)
- [ ] Add timestamps (created_at, updated_at)
- [ ] Add CHECK constraints for enums
- [ ] Create foreign key relationships
- [ ] Add indexes for performance
- [ ] Include comments for complex fields
- [ ] Wrap in BEGIN/COMMIT transaction

### Testing Migrations

```bash
# Type check to ensure types are valid
npm run typecheck

# Test the migration on development database
# Verify the schema in Supabase dashboard
```

---

## Creating React Components

### Component File Naming

- Use kebab-case: `feature-form.tsx`, `patient-list.tsx`
- Avoid camelCase: ❌ `featureForm.tsx`
- Organize by feature: `src/components/feature-name/`

### Component Structure

```tsx
'use client';

import { ReactNode } from 'react';
import { Button } from '@/components/ui/button';

interface ComponentProps {
  title: string;
  children?: ReactNode;
  onAction?: () => void;
}

export function MyComponent({ title, children, onAction }: ComponentProps) {
  return (
    <div className="space-y-spacing-m">
      <h2 className="font-mono text-heading-3 font-bold text-motherduck-dark uppercase">
        {title}
      </h2>
      {children}
      {onAction && (
        <Button variant="teal" onClick={onAction}>
          Action
        </Button>
      )}
    </div>
  );
}
```

### Using MotherDuck Design System

```tsx
// Colors
<div className="text-motherduck-dark bg-motherduck-beige border-2 border-motherduck-dark">
  Content
</div>

// Typography
<h1 className="font-mono text-heading-1 font-bold text-motherduck-dark uppercase">Title</h1>
<p className="text-body-lg text-motherduck-dark">Body text</p>

// Spacing
<div className="space-y-spacing-l p-spacing-m">Content</div>

// Buttons
<Button variant="teal">Primary Action</Button>
<Button variant="outline">Secondary Action</Button>

// Cards
<Card className="border-2 border-motherduck-dark">
  <CardHeader>
    <CardTitle className="text-motherduck-dark">Title</CardTitle>
  </CardHeader>
  <CardContent>Content</CardContent>
</Card>
```

---

## Implementing Data Fetching

### Pattern Overview

```
Component
   ↓
useQuery Hook (src/hooks/use-*.tsx)
   ↓
API Function (src/lib/api/*.ts)
   ↓
Supabase Client
   ↓
Database
```

### Query Key Management

**File:** `src/lib/api/react-query-patterns.ts`

```typescript
export const queryKeys = {
  features: {
    all: () => ['features'],
    lists: () => [...queryKeys.features.all(), 'list'],
    list: (filters?: object) => [...queryKeys.features.lists(), { filters }],
    details: () => [...queryKeys.features.all(), 'detail'],
    detail: (id?: string) => [...queryKeys.features.details(), id],
  },
} as const;
```

### Query Options

```typescript
// For frequently changing data
const QUERY_OPTIONS_LIST = {
  staleTime: 1 * 60 * 1000, // 1 minute
  gcTime: 5 * 60 * 1000, // 5 minutes
};

// For stable reference data
const QUERY_OPTIONS_STATIC = {
  staleTime: 15 * 60 * 1000, // 15 minutes
  gcTime: 24 * 60 * 60 * 1000, // 24 hours
};

// For single record detail views
const QUERY_OPTIONS_DETAIL = {
  staleTime: 5 * 60 * 1000, // 5 minutes
  gcTime: 10 * 60 * 1000, // 10 minutes
};
```

### Common Data Fetching Patterns

**Conditional Query:**
```typescript
export function usePatient(patientId: string | undefined) {
  return useQuery({
    queryKey: queryKeys.patients.detail(patientId),
    queryFn: () => getPatientById(patientId!),
    enabled: !!patientId, // Only run if patientId is truthy
    ...QUERY_OPTIONS_DETAIL,
  });
}

// Usage
const { data: patient } = usePatient(patientId); // undefined if patientId is undefined
```

**Mutation with Query Invalidation:**
```typescript
export function useCreatePatient() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createPatient,
    onSuccess: () => {
      // Invalidate all patient queries
      queryClient.invalidateQueries({ queryKey: queryKeys.patients.all() });
      toast.success('Patient created');
    },
  });
}
```

---

## Testing

### Unit Tests for Hooks

**File:** `src/hooks/__tests__/use-patients-new.test.ts`

```typescript
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { usePatients } from '@/hooks/use-patients-new';

const createWrapper = () => {
  const queryClient = new QueryClient();
  return ({ children }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
};

describe('usePatients', () => {
  it('should fetch patients', async () => {
    const { result } = renderHook(() => usePatients(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(result.current.data).toBeDefined();
  });
});
```

### Component Tests

**File:** `src/components/feature-name/__tests__/feature-form.test.tsx`

```typescript
import { render, screen, userEvent } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { FeatureForm } from '../feature-form';

describe('FeatureForm', () => {
  it('renders form fields', () => {
    render(
      <QueryClientProvider client={new QueryClient()}>
        <FeatureForm />
      </QueryClientProvider>
    );

    expect(screen.getByLabelText(/name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/description/i)).toBeInTheDocument();
  });

  it('submits form data', async () => {
    const user = userEvent.setup();
    const onSuccess = vi.fn();

    render(
      <QueryClientProvider client={new QueryClient()}>
        <FeatureForm onSuccess={onSuccess} />
      </QueryClientProvider>
    );

    await user.type(screen.getByLabelText(/name/i), 'Test Feature');
    await user.click(screen.getByRole('button', { name: /create/i }));

    // Add assertions
  });
});
```

### Running Tests

```bash
# Run all tests
npm run test

# Run with UI
npm run test:ui

# Run with coverage
npm run test:coverage

# Watch mode
npm run test -- --watch
```

---

## Code Review Checklist

### Architecture
- [ ] API functions in `src/lib/api/` (pure functions, no React)
- [ ] React hooks in `src/hooks/` using React Query
- [ ] Components in `src/components/[feature]/`
- [ ] Pages in `src/app/[feature]/page.tsx`
- [ ] Routes protected with `AuthGuard`

### Database
- [ ] Uses `cedro` schema (not `public`)
- [ ] All queries include error handling
- [ ] Proper TypeScript types for database records
- [ ] Migrations tested and reversible

### Data Fetching
- [ ] Uses React Query hooks for all data fetching
- [ ] Query keys from `queryKeys` factory
- [ ] Proper `enabled` conditions for conditional queries
- [ ] Query invalidation on mutations
- [ ] Loading and error states handled

### UI & Design
- [ ] Follows MotherDuck design system
- [ ] Uses Tailwind classes for styling
- [ ] Proper color palette (motherduck-*)
- [ ] Consistent spacing (spacing-*)
- [ ] Responsive design (mobile, tablet, desktop)

### Forms
- [ ] Uses `react-hook-form`
- [ ] Zod schema validation
- [ ] Error messages displayed
- [ ] Submit button disabled during mutation
- [ ] Toast notifications on success/error

### Testing
- [ ] Unit tests for hooks
- [ ] Component tests for forms
- [ ] API tests for functions
- [ ] Test coverage > 80%

### Code Quality
- [ ] TypeScript strict mode
- [ ] No `any` types without `@ts-ignore` comment
- [ ] No console.log (use proper logging)
- [ ] No hardcoded values (use constants)
- [ ] Proper error handling
- [ ] Comments for complex logic

### Security
- [ ] No sensitive data in components
- [ ] Authentication checks on protected routes
- [ ] Input validation on forms
- [ ] SQL injection prevention (using Supabase SDK)

---

## Useful Commands

```bash
# Development
npm run dev          # Start dev server at http://localhost:3000

# Type checking
npm run typecheck    # TypeScript type checking

# Testing
npm run test         # Run all tests
npm run test:ui      # Tests with interactive UI
npm run test:coverage # Coverage report

# Linting
npm run lint         # ESLint check

# Building
npm run build        # Production build
npm run start        # Start production server
```

---

## Related Documentation

- [Project Architecture](./01-project-architecture.md) - System design patterns
- [Database Schema](./02-database-schema.md) - Table definitions
- [Design System](./03-design-system.md) - UI/UX guidelines
