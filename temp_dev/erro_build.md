09:11:41.188 Running build in Washington, D.C., USA (East) – iad1
09:11:41.189 Build machine configuration: 2 cores, 8 GB
09:11:41.339 Cloning github.com/procexaiedu/cedro-so (Branch: master, Commit: 265b2cb)
09:11:41.642 Cloning completed: 302.000ms
09:11:42.639 Restored build cache from previous deployment (xLHrekasr6z4RjApPupjvCHKF6W2)
09:11:44.434 Running "vercel build"
09:11:44.853 Vercel CLI 48.12.0
09:11:45.218 Installing dependencies...
09:11:47.163 
09:11:47.164 up to date in 2s
09:11:47.165 
09:11:47.166 301 packages are looking for funding
09:11:47.166   run `npm fund` for details
09:11:47.197 Detected Next.js version: 14.2.15
09:11:47.198 Running "npm run build"
09:11:47.315 
09:11:47.316 > cedro-v2@0.1.0 build
09:11:47.316 > next build
09:11:47.317 
09:11:48.045   ▲ Next.js 14.2.15
09:11:48.045 
09:11:48.107    Creating an optimized production build ...
09:12:45.559  ✓ Compiled successfully
09:12:45.561    Linting and checking validity of types ...
09:12:54.199 
09:12:54.200 ./src/app/agenda/page.tsx
09:12:54.201 94:9  Warning: The 'appointments' logical expression could make the dependencies of useMemo Hook (at line 174) change on every render. To fix this, wrap the initialization of 'appointments' in its own useMemo() Hook.  react-hooks/exhaustive-deps
09:12:54.201 
09:12:54.202 ./src/app/conversas/page.tsx
09:12:54.202 76:6  Warning: React Hook useEffect has a missing dependency: 'loadConversations'. Either include it or remove the dependency array.  react-hooks/exhaustive-deps
09:12:54.202 
09:12:54.203 ./src/app/dashboard/page.tsx
09:12:54.203 43:6  Warning: React Hook useEffect has a missing dependency: 'loadDashboardData'. Either include it or remove the dependency array.  react-hooks/exhaustive-deps
09:12:54.203 
09:12:54.204 ./src/app/disponibilidade/page.tsx
09:12:54.204 105:6  Warning: React Hook useCallback has a missing dependency: 'toast'. Either include it or remove the dependency array.  react-hooks/exhaustive-deps
09:12:54.204 139:6  Warning: React Hook useCallback has a missing dependency: 'toast'. Either include it or remove the dependency array.  react-hooks/exhaustive-deps
09:12:54.205 
09:12:54.205 ./src/app/financeiro/page.tsx
09:12:54.206 70:6  Warning: React Hook useEffect has a missing dependency: 'loadInvoices'. Either include it or remove the dependency array.  react-hooks/exhaustive-deps
09:12:54.207 75:6  Warning: React Hook useEffect has a missing dependency: 'loadInvoices'. Either include it or remove the dependency array.  react-hooks/exhaustive-deps
09:12:54.207 
09:12:54.207 ./src/app/prontuarios/page.tsx
09:12:54.208 69:6  Warning: React Hook useEffect has a missing dependency: 'loadData'. Either include it or remove the dependency array.  react-hooks/exhaustive-deps
09:12:54.208 
09:12:54.209 ./src/components/crm/lead-detail-drawer.tsx
09:12:54.209 70:6  Warning: React Hook useEffect has a missing dependency: 'loadActivities'. Either include it or remove the dependency array.  react-hooks/exhaustive-deps
09:12:54.209 
09:12:54.210 ./src/components/financeiro/invoice-detail-drawer.tsx
09:12:54.211 47:6  Warning: React Hook useEffect has a missing dependency: 'loadInvoiceDetails'. Either include it or remove the dependency array.  react-hooks/exhaustive-deps
09:12:54.212 
09:12:54.213 ./src/components/pacientes/patient-detail-drawer.tsx
09:12:54.213 62:6  Warning: React Hook useEffect has a missing dependency: 'loadPatientOverview'. Either include it or remove the dependency array.  react-hooks/exhaustive-deps
09:12:54.213 
09:12:54.214 ./src/components/pacientes/patient-form.tsx
09:12:54.214 110:6  Warning: React Hook useEffect has missing dependencies: 'form' and 'loadPatient'. Either include them or remove the dependency array.  react-hooks/exhaustive-deps
09:12:54.215 
09:12:54.216 ./src/components/prontuarios/new-record-modal.tsx
09:12:54.216 115:6  Warning: React Hook useEffect has a missing dependency: 'toast'. Either include it or remove the dependency array.  react-hooks/exhaustive-deps
09:12:54.216 125:6  Warning: React Hook useEffect has a missing dependency: 'resetForm'. Either include it or remove the dependency array.  react-hooks/exhaustive-deps
09:12:54.217 
09:12:54.217 ./src/hooks/use-audio-processing.ts
09:12:54.218 119:6  Warning: React Hook useEffect has a missing dependency: 'status'. Either include it or remove the dependency array.  react-hooks/exhaustive-deps
09:12:54.219 
09:12:54.220 ./src/providers/supabase-provider.tsx
09:12:54.220 208:6  Warning: React Hook useEffect has a missing dependency: 'safeMapAuthUserToCedroUser'. Either include it or remove the dependency array.  react-hooks/exhaustive-deps
09:12:54.222 
09:12:54.222 info  - Need to disable some ESLint rules? Learn more here: https://nextjs.org/docs/basic-features/eslint#disabling-rules
09:13:16.983 Failed to compile.
09:13:16.983 
09:13:16.984 ./src/app/api/cron/process-gcal-sync/route.ts:139:42
09:13:16.984 Type error: Conversion of type '{ id: any; summary: any; start_at: any; end_at: any; notes: any; patient_id: any; external_event_id: any; external_calendar_id: any; gcal_etag: any; therapist_id: any; therapist: { id: any; google_calendar_id: any; }[]; patient: { ...; }[]; }' to type 'AppointmentWithTherapist' may be a mistake because neither type sufficiently overlaps with the other. If this was intentional, convert the expression to 'unknown' first.
09:13:16.986   Types of property 'therapist' are incompatible.
09:13:16.987     Property 'google_calendar_id' is missing in type '{ id: any; google_calendar_id: any; }[]' but required in type '{ google_calendar_id: string; }'.
09:13:16.987 
09:13:16.987 [0m [90m 137 |[39m         }[0m
09:13:16.987 [0m [90m 138 |[39m[0m
09:13:16.987 [0m[31m[1m>[22m[39m[90m 139 |[39m         [36mconst[39m appointmentWithTherapist [33m=[39m appointment [36mas[39m [33mAppointmentWithTherapist[39m[33m;[39m[0m
09:13:16.987 [0m [90m     |[39m                                          [31m[1m^[22m[39m[0m
09:13:16.987 [0m [90m 140 |[39m[0m
09:13:16.987 [0m [90m 141 |[39m         [90m// Verificar se terapeuta tem Google Calendar configurado[39m[0m
09:13:16.987 [0m [90m 142 |[39m         [36mif[39m ([33m![39mappointmentWithTherapist[33m.[39mtherapist[33m?[39m[33m.[39mgoogle_calendar_id) {[0m
09:13:17.130 Error: Command "npm run build" exited with 1