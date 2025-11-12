# Cedro - Project Architecture

**Last Updated:** November 2025
**Related Docs:** [Database Schema](./02-database-schema.md), [Design System](./03-design-system.md), [SOP](./04-sop.md)

## Project Overview

**Cedro** (Sistema de Gestão de Clínica) is a comprehensive clinic management system designed for therapy practices. It enables therapists and clinic administrators to manage patients, appointments, medical records, CRM/leads, finances, and audio transcription of therapy sessions.

### Core Features

1. **Patient Management** - Comprehensive patient profiles with contact info, medical history, and therapist assignments
2. **Appointment Scheduling** - Full agenda system with therapist availability management and status tracking
3. **Medical Records (Prontuários)** - Digital health records with audio transcription and AI-generated notes
4. **CRM/Leads** - Lead management system with Kanban board for sales pipeline
5. **Financial Management** - Invoice generation, payment tracking, care plan billing
6. **Audio Transcription** - Therapy session recording with automatic transcription and medical record generation
7. **Chat Integration** - WhatsApp and other channels for patient communication
8. **Contracts** - Digital contract generation and management via Google Docs

---

## Technology Stack

### Frontend
- **Framework:** Next.js 14 with App Router
- **Language:** TypeScript (strict mode)
- **UI Library:** Radix UI + Tailwind CSS
- **State Management:** TanStack Query (React Query) v5.59.0
- **Form Handling:** react-hook-form + Zod validation
- **Icons:** Lucide React
- **Toast Notifications:** Sonner
- **Drag & Drop:** @dnd-kit (for CRM Kanban)
- **Date Handling:** date-fns

### Backend
- **API Server:** Next.js API Routes
- **Database:** Supabase (PostgreSQL with custom `cedro` schema)
- **Authentication:** Supabase Auth with PKCE flow
- **File Storage:** MinIO (S3-compatible)
- **LLM Integration:** OpenAI + Groq APIs
- **Workflow Automation:** n8n with multiple memory tables

### Development & Testing
- **Type Checking:** TypeScript 5+
- **Testing:** Vitest + React Testing Library
- **Code Quality:** ESLint + Next.js config
- **Build Tool:** Next.js with Vite

### Infrastructure & External Services
- **Audio Processing:** FFmpeg (server-side)
- **API Clients:** Supabase JS SDK, Groq SDK, OpenAI SDK
- **Payment Gateway:** Asaas (integrated via invoices)
- **Automation:** n8n (Agent workflows for CRM, Scheduling, Financial, Support)
- **Document Generation:** Google Docs API

---

## Directory Structure

```
src/
├── app/                              # Next.js App Router
│   ├── api/                          # API routes for backend operations
│   │   ├── audio/                    # Audio processing endpoints
│   │   │   ├── upload/route.ts       # Audio upload to MinIO
│   │   │   ├── process/route.ts      # Audio processing & transcription
│   │   │   ├── status/[id]/route.ts  # Job status polling
│   │   │   └── download/route.ts     # Audio file download
│   │   ├── medical-records/          # Medical record endpoints
│   │   ├── n8n/callback/route.ts     # n8n webhook callbacks
│   │   ├── recording-jobs/[id]/      # Recording job management
│   │   └── [other routes]
│   │
│   ├── agenda/page.tsx               # Appointment scheduling (in development)
│   ├── crm/page.tsx                  # Lead management & sales pipeline
│   ├── dashboard/page.tsx            # Analytics & business metrics
│   ├── pacientes/page.tsx            # Patient management
│   ├── prontuarios/page.tsx          # Medical records
│   ├── conversas/page.tsx            # Chat conversations
│   ├── disponibilidade/page.tsx      # Therapist availability management
│   ├── financeiro/page.tsx           # Finance & invoicing
│   ├── design-system/page.tsx        # Design system showcase
│   ├── login/page.tsx                # Authentication
│   ├── layout.tsx                    # Root layout
│   └── page.tsx                      # Home/dashboard redirect
│
├── components/                       # React components
│   ├── auth/
│   │   └── auth-guard.tsx            # Route protection
│   │
│   ├── layout/
│   │   ├── app-shell.tsx             # Main layout wrapper
│   │   ├── header.tsx                # Top navigation
│   │   ├── sidebar.tsx               # Navigation sidebar
│   │   └── footer.tsx
│   │
│   ├── ui/                           # Shadcn/Radix UI components
│   │   ├── button.tsx
│   │   ├── card.tsx
│   │   ├── input.tsx
│   │   ├── badge.tsx
│   │   ├── dialog.tsx
│   │   ├── dropdown-menu.tsx
│   │   ├── select.tsx
│   │   ├── tabs.tsx
│   │   ├── toaster.tsx
│   │   └── [other components]
│   │
│   ├── dashboard/                    # Dashboard feature components
│   │   ├── kpi-card.tsx              # KPI metric cards
│   │   ├── period-selector.tsx       # Time period filter
│   │   ├── paused-patients-widget.tsx # Paused patients list
│   │   ├── charts/
│   │   │   ├── revenue-chart.tsx     # Revenue metrics
│   │   │   ├── therapist-chart.tsx   # Therapist performance
│   │   │   ├── crm-funnel.tsx        # CRM sales funnel
│   │   │   └── payment-chart.tsx     # Payment status
│   │   └── tables/
│   │       ├── overdue-invoices.tsx  # Overdue invoices
│   │       └── leads-table.tsx       # Recent leads
│   │
│   ├── agenda/                       # Appointment scheduling components
│   │   └── appointment-modal.tsx     # Appointment creation/edit
│   │
│   ├── crm/                          # CRM/Lead management components
│   │   ├── kanban-board.tsx          # Kanban stage board
│   │   ├── lead-form.tsx             # Lead creation/edit
│   │   ├── lead-detail-drawer.tsx    # Lead detail view
│   │   └── lead-delete-dialog.tsx    # Delete confirmation
│   │
│   ├── [other features]/             # Feature-specific components
│   │
│   ├── decorative/                   # Decorative SVG components
│   │   ├── cloud.tsx
│   │   ├── diamond.tsx
│   │   └── cube-3d.tsx
│   │
│   └── lazy/                         # Lazy-loaded components
│       └── index.ts
│
├── hooks/                            # Custom React hooks
│   ├── use-patients-new.ts           # Patient data hooks
│   ├── use-appointments-new.ts       # Appointment hooks
│   ├── use-leads-new.ts              # CRM lead hooks
│   ├── use-audio-upload.ts           # Audio upload hooks
│   ├── [other hooks]
│   └── __tests__/
│       └── [hook tests]
│
├── lib/                              # Utility libraries & API clients
│   ├── api/
│   │   ├── client.ts                 # Standardized API client with error handling
│   │   ├── patients.ts               # Patient API functions
│   │   ├── appointments.ts           # Appointment API functions
│   │   ├── leads.ts                  # CRM/Lead API functions
│   │   ├── audio.ts                  # Audio processing API
│   │   ├── medical-records.ts        # Medical record API
│   │   ├── invoices.ts               # Invoice/Financial API
│   │   ├── react-query-patterns.ts   # Query key factory & options
│   │   └── __tests__/
│   │       └── [API tests]
│   │
│   ├── supabase/
│   │   ├── client.ts                 # Supabase client configuration
│   │   ├── auth.ts                   # Authentication utilities
│   │   └── schema-types.ts           # Database type definitions
│   │
│   ├── audio-processing.ts           # FFmpeg audio utilities
│   ├── network-config.ts             # Request timeout & retry config
│   ├── constants.ts                  # Application constants
│   └── [other utilities]
│
├── providers/                        # React context providers
│   ├── query-provider.tsx            # TanStack Query provider
│   ├── supabase-provider.tsx         # Auth state provider
│   └── [other providers]
│
├── data/                             # Static & mock data
│   └── [development fixtures]
│
└── env.d.ts                          # Environment variable types

```

---

## Key Architectural Patterns

### 1. React Query Data Fetching

All data fetching follows a **three-layer pattern**:

```typescript
// Layer 1: Pure API functions (src/lib/api/patients.ts)
export async function getPatientById(id: string): Promise<Patient> {
  return apiClient.get(`/cedro.patients?id=eq.${id}`);
}

// Layer 2: Query wrapper hooks (src/hooks/use-patients-new.ts)
export function usePatient(patientId: string | undefined) {
  return useQuery({
    queryKey: queryKeys.patients.detail(patientId),
    queryFn: () => getPatientById(patientId!),
    enabled: !!patientId,
    ...QUERY_OPTIONS_DETAIL
  });
}

// Layer 3: Component usage
function PatientDetail({ patientId }) {
  const { data: patient, isLoading } = usePatient(patientId);
  return <>{/* render patient */}</>;
}
```

**Query Options by Data Type:**
- `QUERY_OPTIONS_LIST` - Frequently changing data (1 min stale time)
- `QUERY_OPTIONS_STATIC` - Reference data (15 min stale time)
- `QUERY_OPTIONS_DETAIL` - Single record views (5 min stale time)

**Query Keys:**
All query keys are centralized in `src/lib/api/react-query-patterns.ts` using a factory pattern for consistency and easy invalidation.

### 2. Supabase Integration

**Configuration:**
- Custom schema: `cedro` (not `public`)
- PKCE authentication flow
- 30-second network timeout
- Custom headers for logging
- Realtime disabled (causes infinite loading issues)

**Database Access Pattern:**
```typescript
const { data } = await supabase
  .schema('cedro')  // Always use cedro schema
  .from('patients')
  .select('*')
  .eq('id', patientId);
```

**Error Handling:**
All API calls use the `CedroApiError` class from `src/lib/api/client.ts` for standardized error handling and user feedback.

### 3. Audio Processing Pipeline

Audio transcription is **asynchronous and job-based**:

```
1. Upload (POST /api/audio/upload)
   ↓ Creates recording_job, stores file in MinIO
   ↓
2. Process (POST /api/audio/process)
   ↓ Splits audio into 20-min chunks, transcribes with Whisper API
   ↓
3. Status (GET /api/audio/status/[id])
   ↓ Polls job progress
   ↓
4. Complete
   ↓ Generates medical record, updates database
```

**Key Fields in recording_jobs:**
- `status`: uploaded → processing → transcribing → generating_record → completed
- `audio_chunks_json`: Array of processed chunks with transcriptions
- `processed_chunks`: Progress tracking
- `medical_record`: Structured AI-generated record

**Dependencies:**
- FFmpeg and FFprobe (for audio splitting and format conversion)
- Whisper API (for transcription)
- LLM (Groq or OpenAI) for medical record generation

### 4. Authentication & Authorization

**Flow:**
1. User logs in at `/login` with Supabase Auth
2. Session stored via PKCE flow
3. `AuthGuard` component protects routes
4. `SupabaseProvider` manages global auth state
5. User roles: `admin`, `therapist`, `patient`

**Protected Routes:**
All feature pages are wrapped in `AuthGuard` to prevent unauthorized access.

### 5. Component Architecture

**Lazy Loading:**
Large components can be lazy-loaded via `src/components/lazy/index.ts` to optimize bundle size.

**Form Patterns:**
- Use `react-hook-form` for form state
- Use `zod` for schema validation
- Display toast notifications on success/error

**UI Components:**
All UI components come from Shadcn/Radix UI with Tailwind styling applied via the MotherDuck design system.

---

## Data Flow Overview

```
User Interaction (Component)
    ↓
React Hook (useQuery/useMutation)
    ↓
API Function (src/lib/api/[feature].ts)
    ↓
Supabase Client (with error handling)
    ↓
PostgreSQL Database (cedro schema)
    ↓
Response Data (with caching via React Query)
    ↓
Component Re-render
```

---

## Integration Points

### External Services

1. **Supabase**
   - Authentication
   - Database (PostgreSQL)
   - Real-time subscriptions (disabled)

2. **MinIO**
   - Audio file storage
   - Document storage
   - S3-compatible API

3. **AI & LLM Services**
   - OpenAI Whisper API: Audio transcription
   - Groq: Medical record generation
   - Chat completions for various features

4. **n8n Automation**
   - CRM agent workflow (memory table: `n8n_memoria_agente_crm`)
   - Scheduling agent (memory table: `n8n_memoria_agente_agendamento`)
   - Financial agent (memory table: `n8n_memoria_agente_financeiro`)
   - Support agent (memory table: `n8n_memoria_agente_atendimento`)

5. **Asaas (Payment Gateway)**
   - Invoice payment processing
   - Payment tracking
   - Customer management

6. **Google Docs**
   - Contract generation and management
   - Template-based document creation

7. **Chat Platforms**
   - WhatsApp integration
   - Message logging in `Message` table

---

## Database Schema Overview

The `cedro` schema contains these main entity groups:

### Core Entities
- **users** - Therapists and admin staff
- **patients** - Patient information and therapy relationships
- **appointments** - Scheduled therapy sessions
- **services** - Service types and pricing

### Financial
- **invoices** - Patient billing
- **payments** - Payment records
- **care_plans** - Treatment plans with pricing
- **account_credits** - Patient account credits

### Medical
- **medical_records** - SOAP notes, anamnesis, evolution records
- **recording_jobs** - Audio transcription jobs
- **patient_therapist_links** - Patient-therapist relationships

### Business
- **crm_leads** - Sales leads and prospects
- **conversations** - Chat messages and channels
- **contracts** - Service contracts

### Operations
- **therapist_schedules** - Recurring availability
- **therapist_schedule_exceptions** - Blocked/extra times
- **policies** - System configuration
- **audit_logs** - Change tracking

### AI & Automation
- **cerebro** - System prompts for LLM modules
- **n8n_memoria_*** - n8n agent memory tables
- **logs** - Application logs

See [Database Schema](./02-database-schema.md) for complete details.

---

## Environment Variables

**Required (`.env.local`):**
```
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

**Optional:**
- `GROQ_API_KEY` - For medical record generation
- `OPENAI_API_KEY` - For Whisper transcription and chat
- MinIO credentials
- Asaas API key
- n8n webhook URLs

---

## Development Workflow

### Adding a New Feature

1. **Create API functions** in `src/lib/api/[feature].ts`
2. **Create React Query hooks** in `src/hooks/use-[feature]-new.ts`
3. **Create components** in `src/components/[feature]/`
4. **Create page** in `src/app/[feature]/page.tsx`
5. **Add tests** in `__tests__/` directories

### Code Quality Standards

- **TypeScript strict mode** enabled
- **ESLint** for code style
- **Vitest** for unit and integration tests
- **React Testing Library** for component tests
- **Path aliases** via `@/` prefix

---

## Performance Considerations

1. **Query Caching** - React Query handles stale time and refetch
2. **Lazy Loading** - Components can be code-split
3. **Image Optimization** - Next.js Image component
4. **API Timeouts** - 30-second default timeout
5. **Request Batching** - n8n workflows batch operations

---

## Security & Best Practices

1. **Schema Safety** - Always use `schema('cedro')` for queries
2. **Error Handling** - Use standardized `CedroApiError` class
3. **Authentication** - PKCE flow with Supabase Auth
4. **Sensitive Data** - Store in environment variables
5. **Audit Logging** - All changes logged in audit_logs table

---

## Related Documentation

- [Database Schema](./02-database-schema.md) - Detailed table definitions
- [Design System](./03-design-system.md) - UI/UX guidelines
- [Standard Operating Procedures](./04-sop.md) - How-to guides
