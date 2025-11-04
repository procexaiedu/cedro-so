# CEDRO Testing Guide

## Automated Testing Setup

This project uses **Vitest** for fast, modern automated testing with full TypeScript and React support.

## Installation

Before running tests, install dependencies:

```bash
npm install
```

## Running Tests

### Run all tests (watch mode)
```bash
npm test
```

The watch mode automatically reruns affected tests when files change.

### Run tests with UI dashboard
```bash
npm run test:ui
```

Opens an interactive dashboard at `http://localhost:51204/__vitest__/` where you can:
- View test results visually
- Filter tests
- Run specific tests
- View file coverage
- Debug failures

### Generate coverage report
```bash
npm run test:coverage
```

Generates detailed coverage reports in:
- Terminal output (text summary)
- `coverage/index.html` (HTML report - open in browser)
- `coverage/lcov.info` (LCOV format for CI/CD)

## Test File Structure

Tests are organized alongside source files:

```
src/
├── lib/
│   └── api/
│       ├── appointments.ts
│       └── __tests__/
│           └── appointments.test.ts
└── hooks/
    ├── use-appointments-adapter.ts
    └── __tests__/
        └── use-appointments-adapter.test.ts
```

## Test Patterns

### API Layer Tests

Test database operations and external dependencies:

```typescript
describe('Appointments API', () => {
  it('should fetch all appointments', async () => {
    const result = await getAllAppointments()
    expect(result).toBeInstanceOf(Array)
    expect(result.length).toBeGreaterThanOrEqual(0)
  })
})
```

### Hook Tests

Test React Query hooks with `renderHook`:

```typescript
import { renderHook, waitFor } from '@testing-library/react'

it('should fetch data', async () => {
  const { result } = renderHook(() => useAppointments(startDate, endDate))

  await waitFor(() => {
    expect(result.current.isSuccess).toBe(true)
  })
})
```

## Current Test Coverage

### ✅ Appointments Module
- API layer tests: `src/lib/api/__tests__/appointments.test.ts`
- Hook tests: `src/hooks/__tests__/use-appointments-adapter.test.ts`

### 📋 TODO: Add Tests For
1. Medical Records module
2. Schedules module
3. CRM module
4. Invoices module
5. Care Plans module
6. Recording Jobs module
7. Component integration tests
8. End-to-end scenarios

## CI/CD Integration

### GitHub Actions Example

```yaml
name: Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: npm install
      - run: npm test -- --run
      - run: npm run test:coverage
```

## Debugging Tests

### Run single test file
```bash
npm test appointments.test.ts
```

### Run tests matching pattern
```bash
npm test -- --grep "useAppointments"
```

### Run with verbose output
```bash
npm test -- --reporter=verbose
```

### Debug in VS Code
Add to `.vscode/launch.json`:

```json
{
  "type": "node",
  "request": "launch",
  "name": "Debug Vitest",
  "runtimeExecutable": "npm",
  "runtimeArgs": ["run", "test:debug"],
  "console": "integratedTerminal",
  "internalConsoleOptions": "neverOpen"
}
```

## Best Practices

### 1. Test Data
Use factory functions for consistent test data:

```typescript
function createMockAppointment(overrides?: Partial<Appointment>) {
  return {
    id: 'apt-1',
    patient_id: 'p-1',
    therapist_id: 't-1',
    status: 'scheduled' as const,
    start_at: '2025-01-27T09:00:00Z',
    ...overrides
  }
}
```

### 2. Mocking External Dependencies
```typescript
vi.mock('@/lib/supabase', () => ({
  supabase: {
    schema: vi.fn(),
    from: vi.fn()
  }
}))
```

### 3. Async Operations
Always wait for async operations:

```typescript
await waitFor(() => {
  expect(result.current.data).toBeDefined()
})
```

### 4. Cleanup
Tests automatically clean up after each run, but you can manually:

```typescript
afterEach(() => {
  vi.clearAllMocks()
})
```

## Test Coverage Goals

| Module | Coverage | Status |
|--------|----------|--------|
| API Layer | 80%+ | 🟡 In Progress |
| React Query Hooks | 85%+ | 🟡 In Progress |
| Components | 75%+ | 🔴 Not Started |
| Integration | 70%+ | 🔴 Not Started |
| E2E Scenarios | 90%+ | 🔴 Not Started |

## Common Issues

### Tests timeout
Increase timeout in vitest.config.ts:
```typescript
test: {
  testTimeout: 10000 // 10 seconds
}
```

### Mock not working
Ensure mocks are defined BEFORE imports:
```typescript
vi.mock('@/lib/api', () => (...))

import { someFunction } from '@/lib/api'
```

### Can't find module
Check path aliases in `vitest.config.ts`:
```typescript
resolve: {
  alias: {
    '@': path.resolve(__dirname, './src')
  }
}
```

## Performance Tips

1. **Parallel testing**: Vitest runs tests in parallel by default
2. **Watch mode**: Only reruns affected tests
3. **Coverage snapshots**: Cache coverage between runs
4. **Browser pool**: Reuses browser instances for component tests

## Further Reading

- [Vitest Documentation](https://vitest.dev)
- [Testing Library Docs](https://testing-library.com)
- [React Query Testing](https://tanstack.com/query/latest/docs/react/testing)
- [TDD Best Practices](https://www.typescriptlang.org/docs/handbook/testing.html)

## Next Steps

1. ✅ Configure Vitest
2. ✅ Setup test files structure
3. 📋 Write comprehensive API tests
4. 📋 Write hook tests with mocks
5. 📋 Add component integration tests
6. 📋 Setup CI/CD pipeline
7. 📋 Achieve 80%+ coverage

---

**Status**: Ready to run tests!

```bash
npm install  # Install dependencies first
npm test     # Start testing!
```
