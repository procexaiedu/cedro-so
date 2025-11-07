# Cedro Documentation Index

This is the central documentation hub for the Cedro clinic management system. Use this index to navigate all available documentation.

## Quick Links

- **[Project Architecture](./01-project-architecture.md)** - System overview, tech stack, and core architecture
- **[Database Schema](./02-database-schema.md)** - Supabase database structure and relationships
- **[Design System](./03-design-system.md)** - MotherDuck style guide and UI components
- **[Standard Operating Procedures](./04-sop.md)** - How to perform common development tasks

## Recent Updates

### November 2025
- ✅ Applied **MotherDuck Design System** across the application
  - New color palette: Dark, Teal, Beige, Blue
  - Typography system with Space Mono and Inter fonts
  - Standardized spacing and component styles
  - Design system page available at `/design-system` route

- ✅ **Dashboard Improvements**
  - Enhanced KPI cards with visual metrics
  - Added advanced charts (Revenue, Therapist Performance, CRM Funnel, Payments)
  - Implemented period selector for time-based filtering
  - New widgets: Paused Patients, Overdue Invoices, Leads Table

- 🚧 **Agenda Feature (In Development)**
  - Appointment modal component created
  - Integration with Supabase for appointment management
  - Therapist schedule management with exceptions
  - Status tracking: scheduled, confirmed, completed, cancelled, no_show, rescheduled

## Documentation Structure

### 01. Project Architecture
Comprehensive overview of:
- Project goals and features
- Technology stack breakdown
- Directory structure and component organization
- Key architectural patterns (React Query, Supabase, Audio Processing)
- Data flow and integration points

### 02. Database Schema
Complete database documentation:
- All table definitions in `cedro` schema
- Primary keys and foreign key relationships
- Field descriptions and constraints
- Entity relationship overview

### 03. Design System
MotherDuck style guide implementation:
- Color palette and values
- Typography scales and fonts
- Component guidelines
- Spacing system
- Button variants and states

### 04. Standard Operating Procedures (SOP)
Step-by-step guides for:
- Adding a new feature
- Database migrations
- Component creation
- Data fetching patterns
- Testing best practices

## Key Technologies

- **Frontend:** Next.js 14, React 18, TypeScript
- **Data Fetching:** TanStack Query (React Query)
- **Backend:** Supabase (PostgreSQL)
- **Storage:** MinIO
- **UI Framework:** Radix UI + Tailwind CSS
- **Testing:** Vitest + React Testing Library
- **Audio Processing:** FFmpeg

## Development Commands

```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run typecheck    # Type checking
npm run test         # Run tests
npm run test:ui      # Tests with UI
npm run lint         # Linting
```

## Important Notes

1. **Schema Name:** Always use `cedro` schema when querying Supabase (not `public`)
2. **Query Keys:** Use the `queryKeys` factory from `src/lib/api/react-query-patterns.ts`
3. **File Naming:**
   - Hooks: `use-[feature]-new.ts`
   - API files: `[feature].ts` in `src/lib/api/`
   - Components: kebab-case (e.g., `patient-form.tsx`)
4. **Realtime:** Currently disabled in Supabase config to prevent infinite loading
5. **FFmpeg:** Required for audio processing on the server

## Contacts & Support

For questions about the system architecture or documentation, refer to the relevant documentation files or check the project's CLAUDE.md file for additional development guidance.
