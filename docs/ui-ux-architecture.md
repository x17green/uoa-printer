# UI/UX Architecture and Product Design Plan

## 1. Objective
Create an enterprise-grade, scalable Payroll Print System for University of African using a conservative professional palette, University brand tokens, and HeroUI component library.

- Convert existing minimal payroll print flow into a dedicated print workflow system.
- Emphasize maintainability, accessibility (a11y), responsive design, and governance for educational institutions.
- Support agent automation, infra docs, and design-system usage.

## 2. Product Foundations
### 2.1 User Roles and Journeys
- HR Admin / Payroll Officer
- Compliance Auditor
- System Operator

Core user journeys:
1. Upload Payroll Data
2. Validate entries (row-level, schema, RLS)
3. Review Payroll Runs
4. Build Print Jobs (batch/single)
5. Execute and track print queue
6. Reprint / audit trail

### 2.2 Success Metrics
- 90% reduction of invalid print job submissions
- < 2 seconds nav between runs & detail views
- 4.5:1 contrast ratio for text
- 100% keyboard navigation on all key functions

## 3. Existing Implementation Snapshot
- App shell in `app/layout.tsx`: static sidebar + header + footer.
- Payroll runs view in `app/payroll/page.tsx` (table + free-text filter).
- Run detail in `app/payroll/[id]/page.tsx` (record table, validation list, print options).
- Print mode in `components/payroll/print-dialog.tsx` (all/single + html/pdf).
- Shared component usage: `@heroui/react` components, Tailwind utility classes.

## 4. New Architecture Proposal
### 4.1 Page structure
- `/` (Dashboard)
- `/payroll` (Run list)
- `/payroll/:id` (Run detail)
- `/payroll/:id/print` (Print job builder and queue)
- `/upload` (Upload/validate)
- `/validation` (validation dashboard)
- `/admin/users` (roles / RBAC)

### 4.2 Component architecture
- `components/ui` (core reusable patterns)
- `components/payroll/*` (business unit screens)
- `components/print/*` (print job flow, queue, templates)
- `components/audit/*` (timeline, logs, compliance cards)

### 4.3 UX/flow extensions
- Multi-step job builder (Wizard): 1) Scope, 2) Template, 3) Options, 4) Preview, 5) Submit.
- Queue manager: in-progress, completed, failed with retry.
- Persisted templates (company-wide and personal).

### 4.4 HeroUI design tokens and brand mapping
- Primary: `#00274D`
- Accent: `#0B5FFF`
- Highlight: `#F9A825`
- Surface: `#F8FAFC`, border: `#E2E8F0`
- Text: `#102A43`, muted: `#64748B`

Create `styles/theme.ts` / `styles/theme.css` tokens and update Providers for custom theme in `components/providers.tsx`.

## 5. Key UI Patterns (HeroUI)
- Navigation: `Sidebar`, `Tabs`, `Breadcrumbs`, responsive `Drawer`.
- Data grids: `Table` + `Pagination` + filters.
- Form controls: `Input`, `Select`, `DateField`, `Switch`, `RadioGroup`.
- Modals: `Dialog`, `AlertDialog` for confirmation.
- Feedback: `Toast` innovations for print events.

## 6. Print System from UX Design
### 6.1 PrintJobBuilder
- Target: run, department, staff batch
- output: HTML / PDF, includes footers, pagination.
- options: envelope printing, duplex, password-protect.

### 6.2 PrintQueue
- status: queued, processing, finished, failed
- retry, cancel, reprint action.
- includes historical audit and file name/ID.

### 6.3 Template Configuration
- `PrintTemplateEditor` with tokens: `{{staffName}}`, `{{netPay}}`, `{{department}}`.
- Preview pane + inline variable set.

## 7. Documentation and Agents Support
- Add annotated `docs/ui-spec.md` and this architecture document.
- Agent hints in docs (Context7 MCP integration):
  - Component metadata (name, path, states, usages).
  - Vector with examples from existing code.
  - Code snippet references for auto-generated component catalogs.

### 7.1 `docs/ui-ux-architecture.md` status
- comprehensive plan captured
- ready for agents and contributors

## 8. QA & accessibility checklist
- WCAG 2.1 AA
- keyboard only walkthrough
- screen reader labels
- reduced motion switch
- major breakpoint checks (mobile, tablet, desktop)

## 9. Next implementation steps (developer tasks)
1. Add `app/print` routes and placeholders.
2. Build `PrintJobWizard` and `PrintQueue` using heroui components.
3. Update `app/layout.tsx` to include new nav links and responsive drawer pattern.
4. Author `docs/ui-spec.md` mapping current components + proposed components.
5. Add storybook (optional) for each new component.

---

> Notes for agents: use this markdown as a reference for automated code health analysis, UI rewrites, and low-level context extraction. Maintain mapping between doc sections and code paths in JSON form (e.g., "PayrollRunsPage" -> `app/payroll/page.tsx`).