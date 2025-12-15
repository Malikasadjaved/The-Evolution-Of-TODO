# Implementation Plan: UI Components for Task Management

**Branch**: `002-ui-components` | **Date**: 2025-12-10 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/002-ui-components/spec.md`

## Summary

Build React UI components for Phase II web application to enable full task management functionality. Components include TaskList (display/filter/search/sort), TaskForm (create/edit with validation), TaskItem (individual task display), and supporting utilities (Modal, Toast, ConfirmDialog). All components integrate with existing API client (lib/api.ts) and Better Auth authentication system. Focus on accessibility, responsive design, and performance.

## Technical Context

**Language/Version**: TypeScript 5.x with strict mode
**Primary Dependencies**:
- React 19.x (Next.js 15 App Router)
- Tailwind CSS 3.4+ (existing theme)
- Better Auth (useSession hook for authentication)
- Existing API client (lib/api.ts)

**Storage**: N/A (frontend only - data via API)
**Testing**: React Testing Library + Jest (component tests), Playwright (E2E tests)
**Target Platform**: Web browsers (Chrome, Firefox, Safari, Edge) - Modern ES2020+
**Project Type**: Web application (frontend components in existing Next.js app)
**Performance Goals**:
- First Contentful Paint < 1.5s
- Time to Interactive < 3s
- Component render < 16ms (60fps)
- Search/filter operations < 300ms
- Supports 500+ tasks without performance degradation

**Constraints**:
- Must use existing Tailwind theme (no new design system)
- Must integrate with existing Better Auth session
- Must use existing API client (lib/api.ts) - no direct fetch calls
- All components must be keyboard accessible (WCAG 2.1 AA)
- Mobile-first responsive design (≥375px width)
- Zero breaking changes to existing code

**Scale/Scope**:
- 6 new components (TaskList, TaskForm, TaskItem, Modal, Toast, ConfirmDialog)
- ~800-1200 lines of component code
- ~400-600 lines of test code
- 3 contract files (component props, state shapes, API integration)

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

### From `.specify/memory/constitution.md`:

✅ **Clean Code & Pythonic Design**: N/A (TypeScript/React project)

✅ **Proper Project Structure**:
- Components in `frontend/components/`
- Existing structure maintained
- Clear separation: presentation (components) vs logic (hooks) vs API (lib/api.ts)

✅ **Test-First Development (TDD)**:
- Component tests required before implementation
- Test coverage ≥85% for all new components
- React Testing Library for unit tests
- Playwright for E2E tests
- **GATE REQUIREMENT**: Write tests in Red phase, get approval, then implement

✅ **Reusable Intelligence & Agent-Driven Development**:
- Use parallel agents for component implementation
- Create reusable component skill for future features
- Document patterns in component library

✅ **Enhanced User Experience & Error Handling**:
- All error states have user-friendly messages
- Loading states for all async operations
- Accessibility built-in (ARIA, keyboard nav, focus management)
- Toast notifications for success/error feedback

**Constitution Compliance**: ✅ **PASS** - No violations. All principles applicable to frontend development are followed.

## Project Structure

### Documentation (this feature)

```text
specs/002-ui-components/
├── spec.md                    # Feature specification (✅ complete)
├── plan.md                    # This file (✅ in progress)
├── research.md                # Technology decisions & patterns
├── data-model.md              # Component prop types & state shapes
├── quickstart.md              # Quick start guide for developers
├── contracts/
│   ├── component-api.md       # Component prop interfaces
│   ├── state-management.md    # State patterns & hooks
│   └── integration.md         # API integration patterns
├── checklists/
│   └── requirements.md        # Spec validation (✅ complete)
└── tasks.md                   # Implementation tasks (/sp.tasks output)
```

### Source Code (repository root)

**Existing Structure** (frontend only - backend already complete):

```text
frontend/
├── app/
│   ├── layout.tsx             # ✅ Existing - Root layout with AuthProvider
│   ├── page.tsx               # ⚠️  Update - Add TaskList integration
│   ├── login/                 # ✅ Existing
│   └── signup/                # ✅ Existing
├── components/
│   ├── AuthProvider.tsx       # ✅ Existing
│   ├── TaskList.tsx           # 🆕 NEW - Main task list with filters
│   ├── TaskForm.tsx           # 🆕 NEW - Create/edit task form
│   ├── TaskItem.tsx           # 🆕 NEW - Individual task card
│   ├── Modal.tsx              # 🆕 NEW - Reusable modal dialog
│   ├── Toast.tsx              # 🆕 NEW - Toast notification system
│   ├── ConfirmDialog.tsx      # 🆕 NEW - Confirmation dialog
│   └── ui/                    # 🆕 NEW - Shared UI primitives
│       ├── Button.tsx
│       ├── Input.tsx
│       ├── Select.tsx
│       └── Badge.tsx
├── lib/
│   ├── api.ts                 # ✅ Existing - API client (7 methods)
│   ├── auth.ts                # ✅ Existing - Better Auth config
│   ├── auth-client.ts         # ✅ Existing - useSession hook
│   ├── types.ts               # ✅ Existing - Task, Priority, etc.
│   └── hooks/                 # 🆕 NEW - Custom React hooks
│       ├── useTasks.ts        # Fetch & manage tasks
│       ├── useTaskForm.ts     # Form state & validation
│       └── useToast.ts        # Toast notification state
├── __tests__/
│   └── components/            # 🆕 NEW - Component tests
│       ├── TaskList.test.tsx
│       ├── TaskForm.test.tsx
│       ├── TaskItem.test.tsx
│       ├── Modal.test.tsx
│       ├── Toast.test.tsx
│       └── ConfirmDialog.test.tsx
└── e2e/                       # 🆕 NEW - E2E tests
    └── task-management.spec.ts
```

**Structure Decision**: Web application (Option 2) - Frontend components only. Backend API already complete from previous phase. Components integrate with existing authentication (Better Auth), API client (lib/api.ts), and type definitions (lib/types.ts).

**Key Principles**:
1. **Colocation**: Tests colocated with components (`__tests__/components/`)
2. **Separation of Concerns**:
   - Components: Presentation only
   - Hooks: Business logic & state
   - lib/api.ts: API communication
3. **Reusability**: Shared UI primitives in `components/ui/`
4. **Type Safety**: All props/state fully typed with TypeScript

## Complexity Tracking

> **No violations detected** - All constitution principles followed.

No complexity justifications needed.

## Research & Technology Decisions

See [research.md](./research.md) for detailed analysis.

**Key Decisions**:

1. **Component Library**: Headless UI + Custom Tailwind components
   - Rationale: Accessibility built-in, full styling control, small bundle size
   - Alternatives: shadcn/ui (too opinionated), Radix UI (larger bundle)

2. **Form Management**: React Hook Form + Zod validation
   - Rationale: TypeScript-first, minimal re-renders, schema validation
   - Alternatives: Formik (larger, slower), vanilla React state (verbose)

3. **State Management**: React hooks (useState, custom hooks)
   - Rationale: No global state needed, all state component-scoped
   - Alternatives: Zustand (unnecessary for this scope), Context (overkill)

4. **Testing Strategy**: React Testing Library + Playwright
   - Rationale: User-centric testing, mirrors real usage
   - Alternatives: Enzyme (deprecated), Cypress (slower than Playwright)

## Component Architecture

### Component Hierarchy

```
app/page.tsx (Dashboard)
└── TaskList
    ├── SearchBar
    ├── FilterPanel
    ├── SortDropdown
    ├── TaskItem (multiple)
    │   ├── Checkbox
    │   ├── PriorityBadge
    │   ├── TagBadge (multiple)
    │   └── ActionButtons
    │       ├── EditButton → Modal + TaskForm
    │       └── DeleteButton → ConfirmDialog
    └── EmptyState / LoadingState / ErrorState

Modal (reusable)
├── Backdrop
├── Dialog
│   ├── Header (title + close button)
│   ├── Content (children)
│   └── Footer (optional)
└── FocusTrap

Toast (global singleton)
└── ToastItem (multiple, stacked)
    ├── Icon (success/error/warning/info)
    ├── Message
    └── CloseButton

ConfirmDialog (modal wrapper)
└── Modal
    ├── Warning Icon
    ├── Title & Message
    └── Action Buttons (Cancel + Confirm)
```

### Data Flow

```
User Action
    ↓
Component Event Handler
    ↓
Custom Hook (useTasks, useTaskForm)
    ↓
lib/api.ts (API Client)
    ↓
FastAPI Backend
    ↓
Response
    ↓
Hook updates state
    ↓
Component re-renders
    ↓
Toast notification (success/error)
```

### State Management Pattern

**Local Component State** (`useState`, `useReducer`):
- Form input values
- Modal open/close state
- Loading/error states
- UI-only state (expand/collapse, hover)

**Custom Hooks** (shared logic):
- `useTasks()`: Fetch, cache, mutate task list
- `useTaskForm()`: Form state, validation, submission
- `useToast()`: Global toast notification state
- `useDebounce()`: Debounced search input

**No Global State**: All state component-scoped or via hooks. No Redux/Zustand needed.

## Implementation Phases

### Phase 0: Research ✅
- [x] Research React patterns for Next.js 15
- [x] Research form validation libraries
- [x] Research Tailwind component patterns
- [x] Document decisions in research.md

### Phase 1: Design & Contracts (Current)
- [ ] Define component prop interfaces (contracts/component-api.md)
- [ ] Define state shapes and hooks (contracts/state-management.md)
- [ ] Document API integration patterns (contracts/integration.md)
- [ ] Create data model (data-model.md)
- [ ] Write quickstart guide (quickstart.md)

### Phase 2: Implementation (Next - via /sp.tasks)
- [ ] Write component tests (TDD Red phase)
- [ ] Implement components (TDD Green phase)
- [ ] Refactor and optimize (TDD Refactor phase)
- [ ] Integration testing
- [ ] E2E testing

## Dependencies

**Existing** (✅ Already available):
- Next.js 15.1.0
- React 19.0.0
- TypeScript 5.7.x
- Tailwind CSS 3.4.1
- Better Auth 1.1.0
- API client (lib/api.ts)
- Type definitions (lib/types.ts)

**New** (🆕 To be added):
- @headlessui/react ^2.2.0 (accessible components)
- react-hook-form ^7.54.0 (form management)
- zod ^3.24.0 (schema validation)
- @testing-library/react ^16.1.0 (component testing)
- @playwright/test ^1.49.0 (E2E testing)

**Bundle Size Impact**: ~50KB gzipped (acceptable for functionality gained)

## Risks & Mitigations

| Risk | Impact | Probability | Mitigation |
|------|--------|-------------|------------|
| Performance degradation with 500+ tasks | High | Medium | Virtual scrolling (react-window), pagination fallback |
| Form validation complexity | Medium | Low | Use Zod schema, comprehensive test coverage |
| Accessibility gaps | High | Medium | Use Headless UI, manual keyboard testing, ARIA audit |
| Modal focus management bugs | Medium | Medium | Use focus-trap-react, test with keyboard navigation |
| Toast notification conflicts | Low | Low | Singleton pattern with queue, max 3 visible |
| Bundle size increase | Medium | Low | Code splitting, tree shaking, dynamic imports |

## Success Criteria Validation

From spec.md - All criteria measurable and testable:

- ✅ SC-001: Page load < 2s (Lighthouse CI in tests)
- ✅ SC-002: Task creation < 30s (E2E test timer)
- ✅ SC-003: Visual feedback < 100ms (React DevTools profiler)
- ✅ SC-004: Search < 300ms (Performance.now() in tests)
- ✅ SC-005: Filter/sort < 500ms (Performance.now() in tests)
- ✅ SC-006: Validation feedback < 100ms (React Testing Library assertions)
- ✅ SC-007: 95% success rate (E2E test pass rate)
- ✅ SC-008: 500 tasks supported (Load test with mock data)
- ✅ SC-009: Keyboard accessible (Playwright keyboard navigation tests)
- ✅ SC-010: Zero console errors (CI fails on console.error)
- ✅ SC-011: Responsive design (Playwright viewport tests)
- ✅ SC-012: No data loss (Optimistic update rollback tests)

## Next Steps

1. **Complete Phase 1**: Fill data-model.md and contracts/ (in progress)
2. **Run `/sp.tasks`**: Generate atomic, testable implementation tasks
3. **TDD Implementation**: Write tests → Get approval → Implement → Refactor
4. **Create Reusable Skills**: Document component patterns for future use
5. **E2E Testing**: Full user journey validation
6. **Create PHR**: Document implementation learnings

---

**Phase 1 Status**: 🚧 In Progress - Creating contracts and data models
**Ready for**: Phase 2 task generation after contracts complete
