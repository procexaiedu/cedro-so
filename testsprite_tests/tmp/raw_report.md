
# TestSprite AI Testing Report(MCP)

---

## 1️⃣ Document Metadata
- **Project Name:** cedro-so
- **Date:** 2025-10-27
- **Prepared by:** TestSprite AI Team

---

## 2️⃣ Requirement Validation Summary

#### Test TC001
- **Test Name:** Dashboard - Carregamento e Estatísticas
- **Test Code:** [TC001_Dashboard___Carregamento_e_Estatsticas.py](./TC001_Dashboard___Carregamento_e_Estatsticas.py)
- **Test Error:** The dashboard loaded correctly with all main statistics visible. However, the 'Novo Paciente' quick action button is non-functional and does not open the expected form or modal. This indicates a critical issue with dashboard interactivity. No console errors were visible, but the button's failure to respond suggests a bug. Task stopped due to this issue.
Browser Console Logs:
[ERROR] Failed to load resource: the server responded with a status of 404 () (at https://zinrqzsxvpqfoogohrwg.supabase.co/rest/v1/appointments_with_details?select=*&start_at=gte.2025-10-26T00%3A00%3A00.000Z&start_at=lte.2025-11-01T00%3A00%3A00.000Z&order=start_at.asc&therapist_id=eq.3d0828ce-9013-4e98-8482-9f87ebd21b0a:0:0)
[ERROR] Error fetching appointments: {code: PGRST205, details: null, hint: Perhaps you meant the table 'cedro.appointments', message: Could not find the table 'cedro.appointments_with_details' in the schema cache} (at webpack-internal:///(app-pages-browser)/./node_modules/next/dist/client/app-index.js:32:21)
[ERROR] Failed to load resource: the server responded with a status of 400 () (at https://zinrqzsxvpqfoogohrwg.supabase.co/rest/v1/appointments?select=*&date=eq.2025-10-27:0:0)
[ERROR] Failed to load resource: the server responded with a status of 400 () (at https://zinrqzsxvpqfoogohrwg.supabase.co/rest/v1/appointments?select=*&date=eq.2025-10-27:0:0)
[ERROR] Failed to load resource: the server responded with a status of 400 () (at https://zinrqzsxvpqfoogohrwg.supabase.co/rest/v1/appointments?select=id&date=eq.2025-10-27&start_time=lt.07%3A22&status=neq.completed:0:0)
[ERROR] Failed to load resource: the server responded with a status of 400 () (at https://zinrqzsxvpqfoogohrwg.supabase.co/rest/v1/appointments?select=*&date=eq.2025-10-26:0:0)
[ERROR] Failed to load resource: the server responded with a status of 400 () (at https://zinrqzsxvpqfoogohrwg.supabase.co/rest/v1/appointments?select=id&date=eq.2025-10-27&start_time=lt.07%3A22&status=neq.completed:0:0)
[ERROR] Failed to load resource: the server responded with a status of 400 () (at https://zinrqzsxvpqfoogohrwg.supabase.co/rest/v1/appointments?select=*&date=eq.2025-10-26:0:0)
[ERROR] Failed to load resource: the server responded with a status of 400 () (at https://zinrqzsxvpqfoogohrwg.supabase.co/rest/v1/appointments?select=patient_id&date=gte.2025-09-27:0:0)
[ERROR] Failed to load resource: the server responded with a status of 400 () (at https://zinrqzsxvpqfoogohrwg.supabase.co/rest/v1/appointments?select=patient_id&date=gte.2025-09-27:0:0)
[ERROR] Failed to load resource: the server responded with a status of 400 () (at https://zinrqzsxvpqfoogohrwg.supabase.co/rest/v1/appointments?select=patient_id&date=gte.2025-08-28&date=lt.2025-09-27:0:0)
[ERROR] Failed to load resource: the server responded with a status of 404 () (at https://zinrqzsxvpqfoogohrwg.supabase.co/rest/v1/invoices?select=amount&created_at=like.2025-10%25&status=eq.paid:0:0)
[ERROR] Failed to load resource: the server responded with a status of 400 () (at https://zinrqzsxvpqfoogohrwg.supabase.co/rest/v1/appointments?select=patient_id&date=gte.2025-08-28&date=lt.2025-09-27:0:0)
[ERROR] Failed to load resource: the server responded with a status of 404 () (at https://zinrqzsxvpqfoogohrwg.supabase.co/rest/v1/invoices?select=amount&created_at=like.2025-10%25&status=eq.paid:0:0)
[ERROR] Failed to load resource: the server responded with a status of 404 () (at https://zinrqzsxvpqfoogohrwg.supabase.co/rest/v1/invoices?select=amount&created_at=like.2025-09%25&status=eq.paid:0:0)
[ERROR] Failed to load resource: the server responded with a status of 404 () (at https://zinrqzsxvpqfoogohrwg.supabase.co/rest/v1/invoices?select=amount&created_at=like.2025-09%25&status=eq.paid:0:0)
[ERROR] Failed to load resource: the server responded with a status of 404 () (at https://zinrqzsxvpqfoogohrwg.supabase.co/rest/v1/therapist_schedules?select=*:0:0)
[ERROR] Failed to load resource: the server responded with a status of 404 () (at https://zinrqzsxvpqfoogohrwg.supabase.co/rest/v1/therapist_schedules?select=*:0:0)
- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/c26e6a10-c3ff-4ac3-b296-fd4144fc7660/83451dbb-f18f-4f6d-b39d-926402db4176
- **Status:** ❌ Failed
- **Analysis / Findings:** {{TODO:AI_ANALYSIS}}.
---

#### Test TC002
- **Test Name:** Pacientes - CRUD Completo
- **Test Code:** [TC002_Pacientes___CRUD_Completo.py](./TC002_Pacientes___CRUD_Completo.py)
- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/c26e6a10-c3ff-4ac3-b296-fd4144fc7660/b32e2254-f657-4bd4-8818-ad79f7cacd6e
- **Status:** ✅ Passed
- **Analysis / Findings:** {{TODO:AI_ANALYSIS}}.
---

#### Test TC003
- **Test Name:** Agenda - Visualização e Agendamento
- **Test Code:** [TC003_Agenda___Visualizao_e_Agendamento.py](./TC003_Agenda___Visualizao_e_Agendamento.py)
- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/c26e6a10-c3ff-4ac3-b296-fd4144fc7660/5518013b-19df-4926-bfe3-900b2dcc8841
- **Status:** ✅ Passed
- **Analysis / Findings:** {{TODO:AI_ANALYSIS}}.
---

#### Test TC004
- **Test Name:** Prontuários - Gestão de Registros Médicos
- **Test Code:** [TC004_Pronturios___Gesto_de_Registros_Mdicos.py](./TC004_Pronturios___Gesto_de_Registros_Mdicos.py)
- **Test Error:** Testing halted due to modal blocking navigation and inability to create patients or new prontuários. Issue reported.
Browser Console Logs:
[ERROR] Failed to load resource: the server responded with a status of 404 () (at https://zinrqzsxvpqfoogohrwg.supabase.co/rest/v1/appointments_with_details?select=*&start_at=gte.2025-10-26T00%3A00%3A00.000Z&start_at=lte.2025-11-01T00%3A00%3A00.000Z&order=start_at.asc&therapist_id=eq.3d0828ce-9013-4e98-8482-9f87ebd21b0a:0:0)
[ERROR] Error fetching appointments: {code: PGRST205, details: null, hint: Perhaps you meant the table 'cedro.appointments', message: Could not find the table 'cedro.appointments_with_details' in the schema cache} (at webpack-internal:///(app-pages-browser)/./node_modules/next/dist/client/app-index.js:32:21)
- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/c26e6a10-c3ff-4ac3-b296-fd4144fc7660/6a50e3c7-2245-47a4-9b64-62057212ffcd
- **Status:** ❌ Failed
- **Analysis / Findings:** {{TODO:AI_ANALYSIS}}.
---

#### Test TC005
- **Test Name:** Financeiro - Gestão de Faturas
- **Test Code:** [TC005_Financeiro___Gesto_de_Faturas.py](./TC005_Financeiro___Gesto_de_Faturas.py)
- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/c26e6a10-c3ff-4ac3-b296-fd4144fc7660/82ecc078-2198-47bd-b7d6-3cbcca49ad87
- **Status:** ✅ Passed
- **Analysis / Findings:** {{TODO:AI_ANALYSIS}}.
---

#### Test TC006
- **Test Name:** CRM - Gestão de Leads
- **Test Code:** [TC006_CRM___Gesto_de_Leads.py](./TC006_CRM___Gesto_de_Leads.py)
- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/c26e6a10-c3ff-4ac3-b296-fd4144fc7660/7c01aa55-0b26-4ddc-9b7f-6d3bd25dabed
- **Status:** ✅ Passed
- **Analysis / Findings:** {{TODO:AI_ANALYSIS}}.
---

#### Test TC007
- **Test Name:** Disponibilidade - Gestão de Horários
- **Test Code:** [TC007_Disponibilidade___Gesto_de_Horrios.py](./TC007_Disponibilidade___Gesto_de_Horrios.py)
- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/c26e6a10-c3ff-4ac3-b296-fd4144fc7660/7f3b0c0e-03af-4dd4-9ba6-9dcffc464d63
- **Status:** ✅ Passed
- **Analysis / Findings:** {{TODO:AI_ANALYSIS}}.
---

#### Test TC008
- **Test Name:** Navegação - Fluxo entre Módulos
- **Test Code:** [TC008_Navegao___Fluxo_entre_Mdulos.py](./TC008_Navegao___Fluxo_entre_Mdulos.py)
- **Test Error:** Testing completed with an issue found: The 'Ver todos os agendamentos' button on the Dashboard does not function as expected and does not navigate to the appointments list. All other navigation and layout consistency tests for main modules were successful. Please investigate the reported issue.
Browser Console Logs:
[ERROR] Failed to load resource: the server responded with a status of 404 () (at https://zinrqzsxvpqfoogohrwg.supabase.co/rest/v1/appointments_with_details?select=*&start_at=gte.2025-10-26T00%3A00%3A00.000Z&start_at=lte.2025-11-01T00%3A00%3A00.000Z&order=start_at.asc&therapist_id=eq.3d0828ce-9013-4e98-8482-9f87ebd21b0a:0:0)
[ERROR] Error fetching appointments: {code: PGRST205, details: null, hint: Perhaps you meant the table 'cedro.appointments', message: Could not find the table 'cedro.appointments_with_details' in the schema cache} (at webpack-internal:///(app-pages-browser)/./node_modules/next/dist/client/app-index.js:32:21)
[ERROR] Failed to load resource: the server responded with a status of 400 () (at https://zinrqzsxvpqfoogohrwg.supabase.co/rest/v1/appointments?select=*&date=eq.2025-10-27:0:0)
[ERROR] Failed to load resource: the server responded with a status of 400 () (at https://zinrqzsxvpqfoogohrwg.supabase.co/rest/v1/appointments?select=id&date=eq.2025-10-27&start_time=lt.07%3A22&status=neq.completed:0:0)
[ERROR] Failed to load resource: the server responded with a status of 400 () (at https://zinrqzsxvpqfoogohrwg.supabase.co/rest/v1/appointments?select=*&date=eq.2025-10-27:0:0)
[ERROR] Failed to load resource: the server responded with a status of 400 () (at https://zinrqzsxvpqfoogohrwg.supabase.co/rest/v1/appointments?select=*&date=eq.2025-10-26:0:0)
[ERROR] Failed to load resource: the server responded with a status of 400 () (at https://zinrqzsxvpqfoogohrwg.supabase.co/rest/v1/appointments?select=id&date=eq.2025-10-27&start_time=lt.07%3A22&status=neq.completed:0:0)
[ERROR] Failed to load resource: the server responded with a status of 400 () (at https://zinrqzsxvpqfoogohrwg.supabase.co/rest/v1/appointments?select=*&date=eq.2025-10-26:0:0)
[ERROR] Failed to load resource: the server responded with a status of 400 () (at https://zinrqzsxvpqfoogohrwg.supabase.co/rest/v1/appointments?select=patient_id&date=gte.2025-09-27:0:0)
[ERROR] Failed to load resource: the server responded with a status of 400 () (at https://zinrqzsxvpqfoogohrwg.supabase.co/rest/v1/appointments?select=patient_id&date=gte.2025-08-28&date=lt.2025-09-27:0:0)
[ERROR] Failed to load resource: the server responded with a status of 400 () (at https://zinrqzsxvpqfoogohrwg.supabase.co/rest/v1/appointments?select=patient_id&date=gte.2025-09-27:0:0)
[ERROR] Failed to load resource: the server responded with a status of 404 () (at https://zinrqzsxvpqfoogohrwg.supabase.co/rest/v1/invoices?select=amount&created_at=like.2025-10%25&status=eq.paid:0:0)
[ERROR] Failed to load resource: the server responded with a status of 400 () (at https://zinrqzsxvpqfoogohrwg.supabase.co/rest/v1/appointments?select=patient_id&date=gte.2025-08-28&date=lt.2025-09-27:0:0)
[ERROR] Failed to load resource: the server responded with a status of 404 () (at https://zinrqzsxvpqfoogohrwg.supabase.co/rest/v1/invoices?select=amount&created_at=like.2025-09%25&status=eq.paid:0:0)
[ERROR] Failed to load resource: the server responded with a status of 404 () (at https://zinrqzsxvpqfoogohrwg.supabase.co/rest/v1/invoices?select=amount&created_at=like.2025-10%25&status=eq.paid:0:0)
[ERROR] Failed to load resource: the server responded with a status of 404 () (at https://zinrqzsxvpqfoogohrwg.supabase.co/rest/v1/therapist_schedules?select=*:0:0)
[ERROR] Failed to load resource: the server responded with a status of 404 () (at https://zinrqzsxvpqfoogohrwg.supabase.co/rest/v1/invoices?select=amount&created_at=like.2025-09%25&status=eq.paid:0:0)
[ERROR] Failed to load resource: the server responded with a status of 404 () (at https://zinrqzsxvpqfoogohrwg.supabase.co/rest/v1/therapist_schedules?select=*:0:0)
[ERROR] Failed to load resource: the server responded with a status of 400 () (at https://zinrqzsxvpqfoogohrwg.supabase.co/rest/v1/appointments?select=*&date=eq.2025-10-27:0:0)
[ERROR] Failed to load resource: the server responded with a status of 400 () (at https://zinrqzsxvpqfoogohrwg.supabase.co/rest/v1/appointments?select=id&date=eq.2025-10-27&start_time=lt.07%3A24&status=neq.completed:0:0)
- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/c26e6a10-c3ff-4ac3-b296-fd4144fc7660/7e38f557-2806-4d6d-8422-9a3d2e49fed0
- **Status:** ❌ Failed
- **Analysis / Findings:** {{TODO:AI_ANALYSIS}}.
---


## 3️⃣ Coverage & Matching Metrics

- **62.50** of tests passed

| Requirement        | Total Tests | ✅ Passed | ❌ Failed  |
|--------------------|-------------|-----------|------------|
| ...                | ...         | ...       | ...        |
---


## 4️⃣ Key Gaps / Risks
{AI_GNERATED_KET_GAPS_AND_RISKS}
---