# AGENTS.md

## Mandatory startup behavior

- Read and apply this `AGENTS.md` before proposing code, file structure, refactors, commands, or architectural decisions.
- Follow this file as the repo-level source of truth for agent behavior.
- Do not treat `AGENTS.md` as optional guidance or as a loose interpretation space.
- Do not assume default framework, React, CSS, routing, or project conventions when this file defines a project convention.
- If a task conflicts with this file, stop and explain the conflict instead of bypassing the rule.
- If a new stable convention appears during the project, update this file so the convention is preserved.

## Purpose

This file is the project-specific operating guide for the coding agent.
It exists to preserve consistency, reduce regressions, and keep long-term decisions stable across the whole project.

## General Principles

- `AGENTS.md` must be followed strictly.
- If a decision, shortcut, or implementation idea conflicts with `AGENTS.md`, `AGENTS.md` wins.
- Preserve existing behavior unless the requested change explicitly alters it.
- Prefer clarity, consistency, and safe iteration over clever or fragile implementations.
- Avoid hidden side effects.
- When a change has structural impact, keep the implementation easy to understand and easy to extend.
- If a rule here conflicts with a temporary shortcut, the rule wins.

## Project stack

- This project uses JavaScript and JSX.
- This project uses plain CSS.
- Keep implementation consistent with the current stack.

## React and frontend priorities

- Prioritize code quality, readability, maintainability, and rendering behavior adapted to the real context of the app.
- Keep components focused and readable.
- Prefer explicit data flow and explicit state transitions.
- Avoid unnecessary abstraction until complexity justifies it.
- Extract reusable business logic into shared utilities or dedicated modules when duplication becomes real.
- Preserve established UI behavior unless the task explicitly changes product behavior.
- Do not introduce large stylistic shifts unless requested.
- Avoid hidden complexity in rendering, state, and synchronization logic.
- Add comments only for complex UI logic, data synchronization logic, or non-obvious rendering decisions.

## Naming conventions

- Use `PascalCase` for React component names.
- Use `camelCase` for variables, functions, hooks, and utilities.
- Use `UPPER_SNAKE_CASE` for stable shared constants only.
- Use `handleX` for internal event handlers.
- Use `onX` for callback props.
- Prefer explicit boolean names such as `isOpen`, `hasError`, `canEdit`, and `shouldRender`.

## Function and component conventions

- Use functional React components.
- Prefer arrow function components for consistency.
- The expected format is:
  - `const ComponentName = (props) => { ... }`
  - `export default ComponentName`
- Destructure props when it improves readability.
- Keep functions focused on a single responsibility.
- Use explicit names for helper functions and avoid abbreviated naming.

## React hooks conventions

- Use hooks with clear intent and in a way that fits the rendering constraints of the application.
- Rendering behavior must stay adapted to the real context of the app, including component depth, repeated lists, interactive areas, synchronized state, and expensive derived computations.
- Avoid both under-optimized render flows and unnecessary hook complexity.
- `useEffect` must be used only for real side effects or synchronization with external systems.
- `useMemo` must be used when memoization provides clear value for rendering stability or computation cost.
- `useCallback` must be used when callback stability matters for child rendering, dependencies, or shared logic.
- `useRef` should be used for DOM access, persistent mutable values, or instance-level references that must survive renders without triggering re-render.
- `useLayoutEffect` should be reserved for layout-sensitive behavior that must run before paint.
- `useImperativeHandle` should be reserved for cases where an imperative API is genuinely needed.
- Hook usage must stay intentional, readable, and justified by actual behavior.

## Custom hooks

- Custom hooks must live in `src/hooks/`.
- Each custom hook must live in its own dedicated file.
- Custom hook names must start with `use`.
- A custom hook must encapsulate reusable stateful logic, synchronization logic, or cross-component behavior.
- A custom hook must not contain presentational JSX.
- A custom hook must not hide important side effects or make control flow harder to understand.
- If a custom hook introduces too much indirection for a local use case, keep the logic in the component instead.

## React imports

- Import only the React APIs that are actually used by the file.
- Keep React imports explicit and minimal.
- Use the current project JSX setup consistently across files.

## Heading semantics

- Always respect real `h1` to `h6` hierarchy.
- Do not choose a heading tag for visual appearance alone.
- If the visual style and semantic level differ, use the semantic HTML tag and map the visual style separately.
- For the local `Title` component, `component` controls semantics and `variant` controls visual appearance.
- Do not start a section with `h2`, `h3`, or deeper headings unless the surrounding heading hierarchy already justifies it.
- If a heading should not participate in document outline semantics, use a non-heading element such as `span` with the desired visual variant.

## Project structure

### Component families

- `src/components/primitives/` contains low-level UI primitives only.
- `src/components/layout/` contains layout-level building blocks only.
- Other reusable components must live in a dedicated general-purpose area outside `primitives` and `layout`, using a clear folder structure by responsibility.
- Do not mix primitive, layout, and higher-level reusable components in the same folder.

### Component and view file structure

- Each new component must live in its own folder.
- Each new view should live in its own folder.
- The expected default structure is:
  - `ComponentName/ComponentName.jsx`
  - `ComponentName/ComponentName.css`
  - `ComponentName/index.js`
  - `ViewName/ViewName.jsx`
  - `ViewName/ViewName.css`
  - `ViewName/index.js`
- `index.js` is an export file only.
- Do not implement a component or view directly inside `index.js`.
- The component or view implementation must stay in the dedicated main file named after it.
- Do not create flat sibling `jsx/css` files for new components or new views when they should be grouped in a dedicated folder.

### Reuse before creation

- Always reuse an existing component before creating a new one.
- If no suitable component exists, stop and ask for validation before creating a new component.
- Do not create intermediate wrappers, helper components, or structural abstractions unless they are explicitly requested or clearly necessary.
- If an existing component becomes too large, mixes multiple responsibilities, or starts drifting away from its original purpose, do not split it automatically. Explicitly suggest creating a new component and wait for validation.

### Layout rules

- In layout and primitive code, do not write raw `<div>` wrappers.
- Use the existing `Box` component instead.
- Prefer `Box` and flexbox layouts by default.
- The standalone `Grid` layout component is intentionally not part of the current design system.
- For row, column, wrap, alignment, and gap layout needs, use `Box` flex props.
- For masonry-like column stacking, use `Box layout="columns"` and `maxColumns`.
- Do not recreate a `Grid` component unless the user explicitly asks to reintroduce one for a real grid layout.
- If a semantic wrapper such as `section`, `aside`, `header`, `main`, or `footer` is needed, prefer using `Box` with the appropriate `component` prop instead of introducing a raw wrapper.

### Layout breakpoints

- Use the project layout breakpoint scale consistently.
- The current layout breakpoints are tokenized for JavaScript in `src/theme/tokens.js`: tablet `>= 576px`, laptop `>= 891px`, and desktop `>= 1280px`.
- When writing `min-width` media queries for these thresholds, use `576px`, `891px`, and `1280px`.
- When writing `max-width` media queries for these thresholds, use the non-overlapping derived values `575.98px`, `890.98px`, and `1199.98px`.
- CSS custom properties must not be used as breakpoint tokens inside `@media` queries because they are not reliable for that use in standard CSS.
- Until a build-time token system such as custom media, PostCSS, or SCSS is explicitly introduced, breakpoint values are centralized in the theme JS tokens for JavaScript usage and repeated as literal CSS values where `@media` requires them.
- Visual CSS variables are declared in `src/theme/UiThemeScope.css`; do not duplicate the full visual token set in JavaScript unless a value is genuinely needed by runtime JS logic.
- `Box` column layouts must never exceed 4 columns.
- `Box` column layouts should reduce from 4 to 3 to 2 to 1 columns across desktop, laptop, tablet, and phone ranges.

## Styling conventions

### Tokens and shared styling

- Centralize design tokens as much as possible.
- Centralize common layout classes and shared style patterns as much as possible.
- Reuse existing tokens, variables, shared classes, and existing component APIs before introducing new ones.
- When composing a component from an existing component, do not overload or restyle the reused component's visual contract unless the user explicitly asks for that override.
- Inherited component states such as hover, focus, active, selected, pressed, and disabled must keep their base behavior by default.
- Local CSS around a reused component should be limited to composition needs such as placement, spacing, sizing, or layout integration unless an explicit visual override was requested.
- Do not create a token for a value that is only local to a single component part.
- A token must represent a value with real shared design-system scope, or a value that is intentionally expected to be reused across multiple components or screens.
- If a value is only relevant inside one component and has no clear shared scope, keep it local to that component instead of promoting it to a token.
- If a needed token, class, or reusable styling primitive does not exist, explicitly state that it did not already exist and justify the creation.
- Never duplicate the same layout container logic across multiple components if it can be shared cleanly.

### CSS rules

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

### CSS naming conventions

- Use kebab-case for CSS class names.
- Follow a BEM-like naming structure for reusable component styling.
- Keep class naming explicit and readable.
- Reuse existing naming patterns already established in the project when extending a component or feature area.

## Import conventions

- Keep imports grouped in a stable order:
  1. external libraries
  2. shared internal modules
  3. local modules
  4. styles
- Keep import ordering consistent inside each group.
- Avoid unused imports.
- Import only what is used by the file.

## Routing conventions

- Routing must be separated from `App.jsx`.
- The main route definition file should live in `src/routes/AppRoutes.jsx`.
- Route definitions should remain centralized and readable.
- App shell code and route declarations must stay separated.
- Browser history navigation must behave correctly with normal previous and next navigation.

## Storybook conventions

- Every new reusable component must be added to Storybook.
- A component is not considered complete until its Storybook story exists.
- Storybook stories should reflect the real component API and its main usage states.
- Add the meaningful states needed to understand, validate, and review the component behavior.

## Supabase priorities

- Treat every Supabase-related change as high-risk work.
- Keep Supabase integration logic consistent with the existing project structure.
- Never make speculative Supabase changes based on incomplete assumptions.
- If a Supabase issue may come from project settings and not from code or SQL, verify that first before changing the codebase.

## Supabase

### Canonical SQL file

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

### Required guarantees

Any modification to `supabase_rebuild.sql` must preserve all of the following:

- The script must be safe to run on an existing database without degrading it.
- The script must be safe to run more than once.
- The script must allow running only specific sections when needed.
- The script must allow bootstrapping a new Supabase project with the same app behavior.
- The script must not create duplicate objects, duplicate policies, duplicate constraints, or conflicting definitions.
- The script must not silently loosen security or remove protections unless explicitly requested.
- The script must not destroy existing data or require a destructive reset to apply normal project evolution.

### SQL authoring rules

When updating `supabase_rebuild.sql`, always prefer additive or idempotent patterns such as:

- `create table if not exists`
- `create index if not exists`
- `drop ... if exists`
- `create or replace function`
- `alter table ... add column if not exists`
- `insert ... on conflict do update`

The expected mindset is "add or update", never "duplicate or replace destructively".

If a change cannot be made safely in a rerunnable and non-destructive way, stop and make that risk explicit before changing the file.

### Maintenance discipline

- Double-check SQL, RLS, grants, RPC behavior, storage rules, auth flows, and relevant dashboard settings before changing anything.
- Every schema-related app change must trigger a review of `supabase_rebuild.sql`.
- Every auth, storage, RPC, or RLS change must be reflected in `supabase_rebuild.sql`.
- The SQL file must remain readable and structured by concern.
- Non-obvious app rules should be documented directly in SQL comments where they matter.
- Keep ordering stable when possible so diffs stay understandable.

## Supabase non-SQL settings

Some Supabase behavior is configured outside SQL and must still be tracked here.
If one of these settings changes, update this section in the same work cycle.

### Current known settings

- Email confirmation is disabled for sign-up.

### Maintenance rule

- Do not assume Supabase dashboard settings are self-documenting.
- If the app depends on a dashboard or project setting, record it here.
- If a feature relies on a manual Supabase configuration step, document it clearly.

## Third-party libraries and deprecations

### Phosphor Icons (@phosphor-icons/react)

The project uses Phosphor Icons for all icon components. As of Phosphor v2, all icon exports have been migrated to a `-Icon` suffix format.

**Deprecated API (❌ Do NOT use):**
- `Icon`, `Plus`, `Star`, `Users`, `X`, `Check`, `Warning`, `CaretDown`, `CaretUp`, `CaretLeft`, `CaretRight`, `MusicNote`, `MapTrifold`, `MagnifyingGlass`, `Sparkle`, `ArrowUp`, `UserCircle`, `QrCode`, `ShareNetwork`, `PencilSimple`, `ArrowCounterClockwise`, `CircleNotch`, etc.

**Current API (✅ Use these):**
- `IconIcon`, `PlusIcon`, `StarIcon`, `UsersIcon`, `XIcon`, `CheckIcon`, `WarningIcon`, `CaretDownIcon`, `CaretUpIcon`, `CaretLeftIcon`, `CaretRightIcon`, `MusicNoteIcon`, `MapTrifoldIcon`, `MagnifyingGlassIcon`, `SparkleIcon`, `ArrowUpIcon`, `UserCircleIcon`, `QrCodeIcon`, `ShareNetworkIcon`, `PencilSimpleIcon`, `ArrowCounterClockwiseIcon`, `CircleNotchIcon`, etc.

**Pattern:** All Phosphor icon imports must use the `-Icon` suffix. Always verify the installed package exports before adding new icons.

**Icon styling with Phosphor:**
- Use `weight="fill"` for filled variants: `<StarIcon weight="fill" />`
- Do not use `fill="currentColor"`; Phosphor uses the `weight` prop instead.
- Available weights include `"thin"`, `"light"`, `"regular"`, `"bold"`, `"fill"`, and `"duotone"`.

## Code documentation

- Document code only where it adds real value.
- Comments must be written in English.
- Prefer JSDoc style for important functions, shared utilities, exported helpers, and non-trivial business logic.
- Keep comments short and useful.
- Comment complex logic, important decisions, constraints, side effects, and assumptions.
- Do not comment obvious code or restate what the code already says clearly.
- Do not over-document simple functions.
- When editing old code, improve documentation only where it helps future maintenance.

## Refactor discipline

- Separate structural refactors from behavioral changes whenever possible.
- Keep refactors small, readable, and easy to review.
- Make structural impact explicit when a change affects multiple files, shared APIs, or component boundaries.
- Prefer local consistency in the edited area over broad normalization work.

## Error handling and async conventions

- Handle async flows explicitly when they affect UI state, data integrity, or debugging.
- Keep loading, success, and error states understandable from the component flow.
- Make user-facing fallback behavior clear.
- Keep technical failure handling readable and maintainable.
- Pay attention to duplicated submissions, repeated requests, and side effects caused by state changes.

## Agent response format

- For any creation involving new files, always start with the target file tree.
- The proposed structure must respect the project rules defined in `AGENTS.md`.
- For an existing feature update, return only the modified files or modified sections unless a full file is explicitly needed.
- Make structural changes explicit before providing code.
- When creating a new reusable component, include its Storybook file in the proposed file tree and implementation set.
- Do not place component or view implementation directly in `index.js`.
- Respect project structure, naming, and component creation rules in every response.
