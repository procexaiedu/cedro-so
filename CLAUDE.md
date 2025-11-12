# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Cedro** is a clinic management system (Sistema de Gestão de Clínica) built with Next.js 14 (App Router) for therapy practices. It handles patient management, appointments, medical records, CRM/leads, and audio transcription of therapy sessions.

**Tech Stack:**
- Next.js 14 (App Router) with TypeScript
- React 18 with React Query (TanStack Query) for data fetching
- Supabase (PostgreSQL with custom `cedro` schema) for backend
- MinIO for object storage (audio files)
- Radix UI + Tailwind CSS for UI components
- Vitest + Testing Library for testing
- Audio processing with FFmpeg (server-side)

## Development Commands

```bash
# Development server
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Linting
npm run lint

# Type checking (no emit)
npm run typecheck

# Run all tests
npm run test

# Run tests with UI
npm run test:ui

# Run tests with coverage
npm run test:coverage
```

## Architecture

### Directory Structure

- **`src/app/`** - Next.js App Router pages and API routes
  - **`app/api/`** - API routes for server-side operations (audio processing, medical records, n8n callbacks)
  - **`app/[feature]/page.tsx`** - Feature pages (agenda, crm, dashboard, pacientes, prontuarios, etc.)
- **`src/components/`** - React components organized by feature
  - **`components/auth/`** - Authentication components (AuthGuard)
  - **`components/layout/`** - Layout components (AppShell, Header, Sidebar)
  - **`components/ui/`** - Shadcn/Radix UI components
  - **`components/[feature]/`** - Feature-specific components
- **`src/lib/`** - Utility libraries and API clients
  - **`lib/api/`** - API client layer with standardized patterns
  - **`lib/supabase/`** - Supabase client configuration
- **`src/hooks/`** - Custom React hooks (React Query wrappers)
- **`src/providers/`** - React context providers (QueryProvider, SupabaseProvider)
- **`src/data/`** - Static/mock data for development

### Key Architectural Patterns

#### 1. Data Fetching with React Query

The codebase uses **React Query** (TanStack Query) for all data fetching with standardized patterns:

- **Queries and mutations are separated** - hooks are in `src/hooks/use-[feature]-new.ts`
- **API layer is in `src/lib/api/[feature].ts`** - returns promises, no React dependencies
- **Query keys are centralized** in `src/lib/api/react-query-patterns.ts` using the `queryKeys` factory
- **Standard options** for different data types:
  - `QUERY_OPTIONS_LIST` - frequently changing data (1 min stale time)
  - `QUERY_OPTIONS_STATIC` - reference data (15 min stale time)
  - `QUERY_OPTIONS_DETAIL` - single record views (5 min stale time)

**Example pattern:**
```typescript
// In src/lib/api/patients.ts - pure API functions
export async function getPatientById(id: string): Promise<Patient> { ... }

// In src/hooks/use-patients-new.ts - React Query wrapper
export function usePatient(patientId: string | undefined) {
  return useQuery({
    queryKey: queryKeys.patients.detail(patientId),
    queryFn: () => getPatientById(patientId!),
    enabled: !!patientId,
    ...QUERY_OPTIONS_DETAIL
  })
}
```

#### 2. Supabase Integration

- **Custom schema:** All tables use the `cedro` schema (not `public`)
- **Client configuration:** `src/lib/supabase.ts` exports a configured client with:
  - PKCE auth flow
  - 30-second timeouts
  - Custom headers
  - Realtime currently disabled (may cause infinite loading)
- **Database types:** Type definitions for tables are in `src/lib/supabase.ts`
- **API wrapper:** `src/lib/api/client.ts` provides a standardized API client with error handling

#### 3. Audio Processing Pipeline

Audio processing is asynchronous and uses a job-based system:

1. **Upload** (`/api/audio/upload`) - creates `recording_job` entry, stores file in MinIO
2. **Process** (`/api/audio/process`) - splits audio, transcribes with Whisper, generates medical record
3. **Status** (`/api/audio/status/[id]`) - polls job status
4. Audio utilities in `src/lib/audio-processing.ts` use FFmpeg for:
   - Splitting audio into chunks (20-minute chunks by default)
   - Converting formats for Whisper API
   - Extracting metadata

**Dependencies:** Requires FFmpeg and FFprobe installed on server.

#### 4. Authentication Flow

- **AuthGuard component** (`src/components/auth/auth-guard.tsx`) protects routes
- **SupabaseProvider** manages auth state globally
- **Login page** at `/login` handles authentication
- User roles: `admin`, `therapist`, `patient`

#### 5. Component Patterns

- **Lazy loading:** Components can be lazy-loaded via `src/components/lazy/index.ts`
- **Shadcn/Radix UI:** Pre-built components in `src/components/ui/`
- **Form handling:** Uses `react-hook-form` with Zod validation
- **Toasts:** Sonner library via `src/components/ui/toaster.tsx`

## Testing

Tests are located in `__tests__` directories next to the code they test:
- `src/hooks/__tests__/` - Hook tests
- `src/lib/api/__tests__/` - API function tests

**Testing setup:**
- Vitest with jsdom environment
- React Testing Library
- Setup file: `vitest.setup.ts`
- Coverage configuration in `vitest.config.ts`

**Path alias:** Use `@/` for imports (e.g., `@/components/ui/button`)

## Important Conventions

### Query Key Management
- Always use the `queryKeys` factory from `src/lib/api/react-query-patterns.ts`
- Invalidate queries using the standardized patterns in `invalidationPatterns`

### Error Handling
- API errors use `CedroApiError` class from `src/lib/api/client.ts`
- Network timeouts are configured in `src/lib/network-config.ts`
- All mutations show toast notifications on success/error

### File Naming
- New hooks: `use-[feature]-new.ts` (the `-new` suffix indicates clean architecture)
- API files: `[feature].ts` in `src/lib/api/`
- Components: kebab-case (e.g., `patient-form.tsx`)

### Database Queries
- Always use `.schema('cedro')` when querying Supabase
- Use the API wrapper in `src/lib/api/client.ts` for standardized error handling

## Environment Variables

Required environment variables (create `.env.local`):
- `NEXT_PUBLIC_SUPABASE_URL` - Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Supabase anonymous key
- Additional env vars may be needed for MinIO, OpenAI/Groq APIs

## Common Gotchas

1. **Realtime is disabled** - The Supabase realtime config is commented out in `src/lib/supabase.ts` to prevent infinite loading issues
2. **Schema name matters** - Always use `schema('cedro')` for database queries
3. **TypeScript strict mode** - Some files have `// @ts-nocheck` during migration; remove as you fix types
4. **FFmpeg dependency** - Audio processing requires FFmpeg/FFprobe on the server
5. **Timeout handling** - Network requests use `fetchWithTimeout` wrapper with 30s default timeout
