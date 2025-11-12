# Cedro

> A comprehensive clinic management system for therapy practices

Cedro is a modern, full-featured clinic management system built with Next.js 14, designed specifically for therapy practices. It streamlines patient management, appointment scheduling, medical records, CRM workflows, and includes AI-powered audio transcription of therapy sessions.

## Features

### Core Features

- **Patient Management** - Complete CRUD operations for patient records, demographics, and medical history
- **Appointment Scheduling** - Intuitive agenda system for managing therapy sessions
- **Medical Records (Prontuários)** - Secure, comprehensive medical record management
- **CRM & Leads** - Track and manage potential clients through your pipeline
- **Audio Transcription** - Record and automatically transcribe therapy sessions using AI
- **Role-Based Access Control** - Support for admin, therapist, and patient roles
- **Real-time Updates** - Live data synchronization across the application

### Technical Highlights

- **Modern Tech Stack** - Built with Next.js 14 App Router and TypeScript
- **Optimized Data Fetching** - Standardized React Query patterns with intelligent caching
- **Scalable Architecture** - Feature-based component organization with lazy loading
- **Comprehensive Testing** - Unit and integration tests with Vitest
- **Type Safety** - Full TypeScript coverage with strict mode
- **Responsive Design** - Mobile-first UI built with Radix UI and Tailwind CSS

## Tech Stack

### Frontend
- **Next.js 14** - App Router with TypeScript
- **React 18** - Modern React with Server Components
- **React Query** (TanStack Query) - Data fetching and state management
- **Radix UI** - Accessible component primitives
- **Tailwind CSS** - Utility-first styling
- **Shadcn/ui** - Pre-built component library
- **Lucide React** - Icon system

### Backend & Infrastructure
- **Supabase** - PostgreSQL database with authentication
- **MinIO** - Object storage for audio files
- **FFmpeg** - Server-side audio processing
- **OpenAI/Groq APIs** - AI-powered transcription

### Development Tools
- **TypeScript** - Type safety and IntelliSense
- **Vitest** - Fast unit testing framework
- **React Testing Library** - Component testing
- **ESLint** - Code linting
- **React Hook Form** - Form management
- **Zod** - Schema validation

## Quick Start

```bash
# Clone the repository
git clone <repository-url>
cd cedro-so-master

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env.local
# Edit .env.local with your configuration

# Run the development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the application.

## Installation

### Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** 18.x or higher
- **npm** or **yarn**
- **FFmpeg** and **FFprobe** (required for audio processing)
- **PostgreSQL** (via Supabase) or local instance

### FFmpeg Installation

**macOS:**
```bash
brew install ffmpeg
```

**Ubuntu/Debian:**
```bash
sudo apt update
sudo apt install ffmpeg
```

**Windows:**
Download from [ffmpeg.org](https://ffmpeg.org/download.html) and add to PATH.

### Database Setup

1. Create a Supabase project at [supabase.com](https://supabase.com)
2. Run the database migrations to create the `cedro` schema and tables
3. Configure authentication settings in your Supabase dashboard

### Environment Configuration

Create a `.env.local` file in the project root:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your-supabase-project-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key

# MinIO Configuration (Object Storage)
MINIO_ENDPOINT=your-minio-endpoint
MINIO_ACCESS_KEY=your-access-key
MINIO_SECRET_KEY=your-secret-key
MINIO_BUCKET=audio-files

# AI APIs (for transcription)
OPENAI_API_KEY=your-openai-key
GROQ_API_KEY=your-groq-key

# Application Settings
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

## Development

### Available Scripts

```bash
# Start development server with hot reload
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Run ESLint
npm run lint

# Run TypeScript type checking
npm run typecheck

# Run all tests
npm run test

# Run tests with UI
npm run test:ui

# Generate test coverage report
npm run test:coverage
```

### Development Workflow

1. **Create a feature branch** from `main`
2. **Make your changes** following the architectural patterns
3. **Add tests** for new functionality
4. **Run linting and type checking** before committing
5. **Create a pull request** with a clear description

## Project Structure

```
cedro-so-master/
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── api/               # API routes (audio, medical records)
│   │   ├── agenda/            # Appointment scheduling
│   │   ├── crm/               # Lead management
│   │   ├── dashboard/         # Main dashboard
│   │   ├── pacientes/         # Patient management
│   │   ├── prontuarios/       # Medical records
│   │   └── login/             # Authentication
│   ├── components/            # React components
│   │   ├── auth/             # Authentication components
│   │   ├── layout/           # Layout components (AppShell, Header)
│   │   ├── ui/               # Shadcn/Radix UI components
│   │   └── [feature]/        # Feature-specific components
│   ├── hooks/                # Custom React hooks
│   │   └── use-*-new.ts      # React Query wrappers
│   ├── lib/                  # Utility libraries
│   │   ├── api/              # API client layer
│   │   ├── supabase/         # Supabase configuration
│   │   └── audio-processing.ts
│   ├── providers/            # React context providers
│   └── data/                 # Static/mock data
├── __tests__/                # Test files
├── public/                   # Static assets
└── package.json
```

### Key Directories

- **`src/app/`** - Next.js pages and API routes using App Router
- **`src/components/`** - Feature-organized React components
- **`src/lib/api/`** - API client layer with standardized patterns
- **`src/hooks/`** - React Query hooks for data fetching
- **`src/providers/`** - Global state providers (Auth, React Query)

## Architecture

### Data Fetching Pattern

Cedro uses a standardized React Query pattern that separates concerns:

**API Layer** (`src/lib/api/[feature].ts`) - Pure functions that return promises:
```typescript
export async function getPatientById(id: string): Promise<Patient> {
  const supabase = createClient()
  const { data, error } = await supabase
    .schema('cedro')
    .from('patients')
    .select('*')
    .eq('id', id)
    .single()

  if (error) throw new CedroApiError(error.message)
  return data
}
```

**Hook Layer** (`src/hooks/use-[feature]-new.ts`) - React Query wrappers:
```typescript
export function usePatient(patientId: string | undefined) {
  return useQuery({
    queryKey: queryKeys.patients.detail(patientId),
    queryFn: () => getPatientById(patientId!),
    enabled: !!patientId,
    ...QUERY_OPTIONS_DETAIL
  })
}
```

### Query Key Management

All query keys are centralized in `src/lib/api/react-query-patterns.ts`:

```typescript
export const queryKeys = {
  patients: {
    all: ['patients'] as const,
    lists: () => [...queryKeys.patients.all, 'list'] as const,
    list: (filters: string) => [...queryKeys.patients.lists(), filters] as const,
    details: () => [...queryKeys.patients.all, 'detail'] as const,
    detail: (id: string) => [...queryKeys.patients.details(), id] as const,
  },
  // ... other features
}
```

### Database Integration

All database operations use the custom `cedro` schema:

```typescript
const { data, error } = await supabase
  .schema('cedro')  // Always specify schema
  .from('patients')
  .select('*')
```

**Important:** Never query the `public` schema. All tables use `cedro`.

### Audio Processing Pipeline

The audio processing system is asynchronous and job-based:

1. **Upload** - Client uploads audio file to `/api/audio/upload`
2. **Job Creation** - Creates `recording_job` entry with `pending` status
3. **Storage** - File stored in MinIO object storage
4. **Processing** - `/api/audio/process` splits audio into chunks
5. **Transcription** - Each chunk transcribed via Whisper API
6. **Medical Record** - AI generates structured medical record
7. **Status Polling** - Client polls `/api/audio/status/[id]` for completion

**Audio utilities** (`src/lib/audio-processing.ts`):
- Split audio into 20-minute chunks
- Convert formats for Whisper API compatibility
- Extract metadata (duration, format, codec)

### Authentication Flow

- **AuthGuard** component protects all authenticated routes
- **SupabaseProvider** manages global auth state
- **PKCE flow** for secure authentication
- **Role-based access** - admin, therapist, patient

### Component Patterns

- **Lazy loading** - Components can be lazy-loaded via `src/components/lazy/`
- **Shadcn/ui** - Pre-built accessible components in `src/components/ui/`
- **Form handling** - `react-hook-form` with Zod validation
- **Notifications** - Sonner toast library for user feedback

## Testing

### Running Tests

```bash
# Run all tests
npm run test

# Run tests in watch mode
npm run test:watch

# Run tests with UI
npm run test:ui

# Generate coverage report
npm run test:coverage
```

### Test Organization

Tests are colocated with the code they test:

```
src/
├── hooks/
│   ├── use-patients-new.ts
│   └── __tests__/
│       └── use-patients-new.test.ts
├── lib/
│   └── api/
│       ├── patients.ts
│       └── __tests__/
│           └── patients.test.ts
```

### Writing Tests

**Example hook test:**
```typescript
import { renderHook, waitFor } from '@testing-library/react'
import { usePatient } from '../use-patients-new'
import { wrapper } from './test-utils'

describe('usePatient', () => {
  it('fetches patient data', async () => {
    const { result } = renderHook(() => usePatient('123'), { wrapper })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data).toMatchObject({
      id: '123',
      name: 'John Doe'
    })
  })
})
```

### Test Configuration

- **Framework:** Vitest with jsdom environment
- **Setup file:** `vitest.setup.ts`
- **Coverage:** Istanbul/c8 with HTML reporter
- **Path alias:** `@/` resolves to `src/`

## Environment Variables

### Required Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL | `https://xxx.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anonymous key | `eyJhbGciOi...` |
| `OPENAI_API_KEY` | OpenAI API key for transcription | `sk-...` |
| `GROQ_API_KEY` | Groq API key (alternative) | `gsk_...` |

### Optional Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `MINIO_ENDPOINT` | MinIO server endpoint | - |
| `MINIO_ACCESS_KEY` | MinIO access key | - |
| `MINIO_SECRET_KEY` | MinIO secret key | - |
| `MINIO_BUCKET` | MinIO bucket name | `audio-files` |
| `NEXT_PUBLIC_APP_URL` | Application base URL | `http://localhost:3000` |

### Security Notes

- **Never commit** `.env.local` to version control
- Use **environment-specific** files (`.env.development`, `.env.production`)
- Store secrets in **secure vaults** for production deployments

## Common Gotchas

### 1. Realtime is Disabled
Supabase realtime is currently disabled in `src/lib/supabase.ts` to prevent infinite loading issues. If you need realtime features, enable cautiously and test thoroughly.

### 2. Schema Name Matters
Always use `.schema('cedro')` for all database queries. Queries to the `public` schema will fail:

```typescript
// Correct
await supabase.schema('cedro').from('patients').select('*')

// Wrong - will fail
await supabase.from('patients').select('*')
```

### 3. FFmpeg Dependency
Audio processing requires FFmpeg and FFprobe installed on the server. Missing FFmpeg will cause transcription jobs to fail silently.

### 4. Timeout Handling
Network requests use a 30-second default timeout via `fetchWithTimeout`. Long-running operations (like audio processing) are handled asynchronously with job polling.

### 5. TypeScript Strict Mode
Some files have `// @ts-nocheck` during migration. Remove this as you fix types to maintain type safety.

### 6. Path Aliases
Always use `@/` for imports instead of relative paths:

```typescript
// Correct
import { Button } from '@/components/ui/button'

// Avoid
import { Button } from '../../../components/ui/button'
```

### 7. Query Invalidation
Always use the `invalidationPatterns` from `src/lib/api/react-query-patterns.ts` when invalidating queries after mutations:

```typescript
import { invalidationPatterns } from '@/lib/api/react-query-patterns'

// After creating a patient
queryClient.invalidateQueries({ queryKey: queryKeys.patients.lists() })
```

## Contributing

We welcome contributions to Cedro! Please follow these guidelines:

### Development Process

1. **Fork the repository** and create a feature branch
2. **Follow the existing patterns** for data fetching, components, and file organization
3. **Write tests** for new functionality
4. **Update documentation** if you change APIs or add features
5. **Run linting and type checking** before submitting
6. **Create a pull request** with a clear description

### Coding Standards

- Use **TypeScript** for all new code
- Follow the **React Query patterns** in `src/lib/api/react-query-patterns.ts`
- Name new hooks with the `-new` suffix: `use-[feature]-new.ts`
- Use **kebab-case** for component files: `patient-form.tsx`
- Colocate **tests** with the code they test
- Use the **centralized query keys** from the `queryKeys` factory
- Always specify the **`cedro` schema** in database queries

### Commit Messages

Follow conventional commit format:

```
feat: add patient export functionality
fix: resolve audio upload timeout issue
docs: update installation instructions
test: add tests for appointment scheduling
```

### Pull Request Process

1. Update the README.md with details of changes if applicable
2. Ensure all tests pass and coverage is maintained
3. Request review from at least one maintainer
4. Address any feedback before merging

## License

This project is licensed under the **MIT License** - see the [LICENSE](LICENSE) file for details.

---

## Support

For questions, issues, or contributions:

- **Issues:** Open an issue on GitHub
- **Documentation:** Check the `/docs` folder for detailed guides
- **Project Info:** See `CLAUDE.md` for Claude Code integration details

---

**Built with care for therapy professionals** | Cedro Sistema de Gestão de Clínica
