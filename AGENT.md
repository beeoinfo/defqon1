# AGENT.md

## Purpose

This file is the project-specific operating guide for the coding agent.
It exists to preserve consistency, reduce regressions, and keep long-term decisions stable across the whole project.

Follow this file as the repo-level source of truth for agent behavior.
If a new stable convention appears during the project, update this file so the convention is preserved.

## General Principles

- `AGENT.md` must be followed strictly.
- Do not treat `AGENT.md` as optional guidance or as a loose interpretation space.
- If a decision, shortcut, or implementation idea conflicts with `AGENT.md`, `AGENT.md` wins.
- Preserve existing behavior unless the requested change explicitly alters it.
- Prefer clarity, consistency, and safe iteration over clever or fragile implementations.
- Avoid hidden side effects.
- When a change has structural impact, keep the implementation easy to understand and easy to extend.
- If a rule here conflicts with a temporary shortcut, the rule wins.

## Code Documentation

- Document code only where it adds real value.
- Comments must be written in English.
- Prefer JSDoc style for important functions, shared utilities, exported helpers, and non-trivial business logic.
- Keep comments short and useful.
- Comment complex logic, important decisions, constraints, side effects, and assumptions.
- Do not comment obvious code or restate what the code already says clearly.
- Do not over-document simple functions.
- When editing old code, improve documentation only where it helps future maintenance.

## Supabase

### Canonical SQL File

`supabase_rebuild.sql` is the canonical and versioned source of truth for the app database model.

It must always reflect the current intended state of:

- tables
- columns
- constraints
- indexes
- triggers
- functions / RPC
- RLS policies
- grants
- storage bucket setup and storage policies
- data backfills required for compatibility
- important SQL comments explaining non-obvious business rules

### Required Guarantees

Any modification to `supabase_rebuild.sql` must preserve all of the following:

- The script must be safe to run on an existing database without degrading it.
- The script must be safe to run more than once.
- The script must allow running only specific sections when needed.
- The script must allow bootstrapping a new Supabase project with the same app behavior.
- The script must not create duplicate objects, duplicate policies, duplicate constraints, or conflicting definitions.
- The script must not silently loosen security or remove protections unless explicitly requested.
- The script must not destroy existing data or require a destructive reset to apply normal project evolution.

### SQL Authoring Rules

When updating `supabase_rebuild.sql`, always prefer additive or idempotent patterns such as:

- `create table if not exists`
- `create index if not exists`
- `drop ... if exists`
- `create or replace function`
- `alter table ... add column if not exists`
- `insert ... on conflict do update`

The expected mindset is "add or update", never "duplicate or replace destructively".

If a change cannot be made safely in a rerunnable and non-destructive way, stop and make that risk explicit before changing the file.

### Maintenance Discipline

- Treat every Supabase-related change as high-risk work.
- Double-check SQL, RLS, grants, RPC behavior, storage rules, auth flows, and relevant dashboard settings before changing anything.
- Never make speculative Supabase changes based on incomplete assumptions.
- If a Supabase issue may come from project settings and not from code or SQL, verify that first before changing the codebase.
- Every schema-related app change must trigger a review of `supabase_rebuild.sql`.
- Every auth, storage, RPC, or RLS change must be reflected in `supabase_rebuild.sql`.
- The SQL file must remain readable and structured by concern.
- Non-obvious app rules should be documented directly in SQL comments where they matter.
- Keep ordering stable when possible so diffs stay understandable.

## Supabase Non-SQL Settings

Some Supabase behavior is configured outside SQL and must still be tracked here.
If one of these settings changes, update this section in the same work cycle.

### Current Known Settings

- Email confirmation is disabled for sign-up.

### Maintenance Rule

- Do not assume Supabase dashboard settings are self-documenting.
- If the app depends on a dashboard or project setting, record it here.
- If a feature relies on a manual Supabase configuration step, document it clearly.

## React / Frontend Best Practices

- Keep components focused and readable.
- Prefer explicit data flow and explicit state transitions.
- Avoid unnecessary abstraction until complexity justifies it.
- Extract reusable business logic into shared utilities or dedicated modules when duplication starts to appear.
- Keep Supabase integration logic consistent with the existing project structure.
- Do not introduce large stylistic shifts unless requested.
- Preserve established UI behavior unless the task explicitly changes product behavior.
- Avoid performance micro-optimizations unless there is a proven need.
- Add comments only for complex UI logic, data synchronization logic, or non-obvious rendering decisions.

## Heading Semantics

- Always respect real `h1` to `h6` hierarchy.
- Do not choose a heading tag for visual appearance alone.
- If the visual style and semantic level differ, use the semantic HTML tag and map the visual style separately.
- For the local `Title` component, `component` controls semantics and `variant` controls visual appearance.
- Do not start a section with `h2`, `h3`, or deeper headings unless the surrounding heading hierarchy already justifies it.
- If a heading should not participate in document outline semantics, use a non-heading element such as `span` with the desired visual variant.

## Project Structure

### Component Families

- `src/components/primitives/` contains low-level UI primitives only.
- `src/components/layout/` contains layout-level building blocks only.
- Other reusable components must live in a dedicated general-purpose area outside `primitives` and `layout`, using a clear folder structure by responsibility.
- Do not mix primitive, layout, and higher-level reusable components in the same folder.

### Component and View File Structure

- Each component must live in its own folder.
- Each view must live in its own folder.
- The expected default structure is:
- `ComponentName/index.jsx`
- `ComponentName/ComponentName.css`
- `ViewName/index.jsx`
- `ViewName/ViewName.css`
- Do not create flat sibling `jsx/css` files when the component or view should be grouped in a dedicated folder.

### Reuse Before Creation

- Always reuse an existing component before creating a new one.
- If no suitable component exists, stop and ask for validation before creating a new component.
- Do not create intermediate wrappers, helper components, or structural abstractions unless they are explicitly requested or clearly necessary.
- In layout and primitive code, do not write raw `<div>` wrappers.
- Use the existing `Box` component instead.
- Prefer `Box` and flexbox layouts by default.
- The standalone `Grid` layout component is intentionally not part of the current design system.
- For row, column, wrap, alignment, and gap layout needs, use `Box` flex props.
- For masonry-like column stacking, use `Box layout="columns"` and `maxColumns`.
- Do not recreate a `Grid` component unless the user explicitly asks to reintroduce one for a real grid layout.
- If a semantic wrapper such as `section`, `aside`, `header`, `main`, or `footer` is needed, prefer using `Box` with the appropriate `component` prop instead of introducing a raw wrapper.

### Layout Breakpoints

- Use the project layout breakpoint scale consistently.
- The current layout breakpoints are Bootstrap-like: desktop `>= 1200px`, large `>= 992px`, medium `>= 768px`, then mobile below `768px`.
- When writing `max-width` media queries for these thresholds, use the non-overlapping values `1199.98px`, `991.98px`, and `767.98px`.
- CSS custom properties must not be used as breakpoint tokens inside `@media` queries because they are not reliable for that use in standard CSS.
- Until a build-time token system such as custom media, PostCSS, or SCSS is explicitly introduced, breakpoint values are centralized by this documented convention and repeated exactly where needed.
- `Box` column layouts must never exceed 4 columns.
- `Box` column layouts should reduce from 4 to 3 to 2 to 1 columns across those breakpoints.

### Tokens and Shared Styling

- Centralize design tokens as much as possible.
- Centralize common layout classes and shared style patterns as much as possible.
- Reuse existing tokens, variables, shared classes, and existing component APIs before introducing new ones.
- Do not create a token for a value that is only local to a single component part.
- A token must represent a value with real shared design-system scope, or a value that is intentionally expected to be reused across multiple components or screens.
- If a value is only relevant inside one component and has no clear shared scope, keep it local to that component instead of promoting it to a token.
- If a needed token, class, or reusable styling primitive does not exist, explicitly state that it did not already exist and justify the creation.
- Never duplicate the same layout container logic across multiple components if it can be shared cleanly.

### CSS Rules

- Do not patch or mask CSS behavior.
- Every CSS declaration must have a real purpose.
- Do not add defensive or habitual CSS lines "just in case".
- Before adding a CSS property, check that it solves an actual layout, sizing, overflow, alignment, or interaction need already present in the component.
- If the usefulness of a CSS line is not clear, do not add it.
- Avoid code pollution from low-signal CSS such as speculative resets or speculative sizing constraints.
- Avoid `none`-based masking fixes and avoid `!important` in normal work.
- `!important` or similar CSS escape hatches are forbidden by default.
- They may be used only if they clearly reduce complexity and are genuinely the least bad option.
- When using such an exception, explicitly mention it and justify why the existing structure could not be kept clean otherwise.
- The expected standard is to avoid these escape hatches in 99.99% of cases.

## Best Coding Practices

To be documented and maintained later.

Suggested future content:

- naming rules
- refactor policy
- testing expectations
- error handling conventions
- async patterns
- state management conventions
- review checklist
