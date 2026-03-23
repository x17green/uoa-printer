# UI/UX Revamp Execution Roadmap

## Priority 1: Foundation
1. Update global layout and responsive navigation
   - Current: sidebar with hardcoded anchors
   - Target: route-aware HeroUI navigation, mobile drawer.
2. Create dedicated print workflow route
   - Added: `app/payroll/[id]/print/page.tsx`
   - Added: `components/payroll/print-job-wizard.tsx`
3. Convert detail-level print actions to workflow path
   - `app/payroll/[id]/page.tsx` buttons updated
4. Enhance docs with context-aware architecture
   - Added: `docs/ui-ux-architecture.md`
   - Added: `docs/ui-ux-tasks.md`

## Priority 2: Dashboard and Data UX
1. Add KPI card grid and quick action CTA in `app/page.tsx`.
2. Add filtering, sorting, and row selection on `/payroll` view.
3. Add `app/print` route as shared PrintJobs workspace.

## Priority 3: Print system stabilization
1. Implement robust print API (already exists in `app/api/payroll/[id]/print/route.ts`).
2. Add `PrintQueue` component for tracking active job statuses.
3. Add `PrintHistory` component for audits and reprints.

## Priority 4: System-level polish
1. Add theming with UoA palette tokens in `styles/theme.css` and `components/providers.tsx`.
2. Ensure WCAG 2.1 AA compliance.
3. Add mobile screens and test breakpoints.
4. Add agent metadata comments for Context7 MCP.

## Priority 5: Next expansions
1. Add role-aware access (admin vs clerk vs auditor).
2. Add print template builder with visual editor.
3. Add templating tokens list from payroll schema.
4. Add integration with mail/print service APIs.

## DoD (Definition of Done)
- End-to-end print wizard path exists and is navigable.
- Stateful run data is loaded from API.
- User can choose mode and generate (PDF/HTML) output.
- Design tokens available and docs in place.
- Dashboard has clear hierarchy and readability.
