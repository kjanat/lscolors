# PROJECT KNOWLEDGE BASE

**Generated:** 2026-02-10 **Commit:** 35223af3 (master)

## OVERVIEW

Web app converting between macOS/BSD `LSCOLORS` and GNU `LS_COLORS` terminal
color formats. Svelte 5 + TypeScript + Vite SPA deployed to GitHub Pages.

## STRUCTURE

```tree
./
├── index.html                        # Vite entry point (<div id="app">)
├── svelte.config.js                  # Svelte config (vitePreprocess)
├── src/
│   ├── main.ts                       # Mount App.svelte to #app
│   ├── App.svelte                    # Root component: state, handlers, layout
│   ├── style.css                     # Global styles (reset, custom props, responsive)
│   ├── svelte-shims.d.ts            # TS module declaration for *.svelte
│   ├── types.ts                      # Domain types: BsdSlot, Style, Rgb, Direction
│   ├── bsd.ts                        # BSD LSCOLORS parse/stringify
│   ├── gnu.ts                        # GNU LS_COLORS parse/stringify
│   ├── sgr.ts                        # ANSI SGR code parse/stringify
│   ├── convert.ts                    # Bidirectional conversion + CSS color mapping
│   ├── *.test.ts                     # Co-located unit tests (pure logic)
│   ├── *.svelte.test.ts             # Co-located browser component tests
│   ├── components/
│   │   ├── BsdInput.svelte           # BSD LSCOLORS input field
│   │   ├── GnuInput.svelte           # GNU LS_COLORS textarea
│   │   ├── CopyButton.svelte         # Clipboard copy with feedback
│   │   ├── SwapControl.svelte        # Direction swap button + label
│   │   ├── ShareButton.svelte        # Permalink share (wraps CopyButton)
│   │   ├── PreviewTable.svelte       # 11-slot color preview table
│   │   ├── preview.ts                # Pure helpers for preview rendering
│   │   └── *.svelte.test.ts         # Component browser tests
│   └── ui/
│       └── hash.ts                   # URL fragment encode/decode (pure logic)
├── e2e/
│   └── demo.test.ts                  # Playwright e2e tests
├── scripts/
│   └── gnu2bsd.py                    # Standalone Python converter (uv run --script)
└── .github/workflows/
    └── deploy.yml                    # Build + deploy to GitHub Pages
```

## WHERE TO LOOK

| Task                       | Location                             | Notes                                 |
| -------------------------- | ------------------------------------ | ------------------------------------- |
| App state + handlers       | `src/App.svelte`                     | $state, $derived, $effect, mount init |
| Add conversion logic       | `src/convert.ts`                     | Bidirectional BSD<->GNU               |
| Modify BSD format handling | `src/bsd.ts`                         | 22 chars, 11 slot pairs               |
| Modify GNU format handling | `src/gnu.ts`                         | Colon-delimited key=value             |
| Change SGR code parsing    | `src/sgr.ts`                         | ANSI escape sequences                 |
| Add/change domain types    | `src/types.ts`                       | All shared types + constants          |
| BSD input UI               | `src/components/BsdInput.svelte`     | bind:value, oninput, error display    |
| GNU input UI               | `src/components/GnuInput.svelte`     | bind:value, oninput, error display    |
| Clipboard / copy           | `src/components/CopyButton.svelte`   | Reusable, 1200ms feedback timeout     |
| Direction swap             | `src/components/SwapControl.svelte`  | Icon + label, onswap callback         |
| Share permalink            | `src/components/ShareButton.svelte`  | Wraps CopyButton                      |
| Preview swatches           | `src/components/PreviewTable.svelte` | 11 BSD slots, colored table           |
| Preview helpers (pure)     | `src/components/preview.ts`          | SLOT_SAMPLE_TEXT, bsdCharsToSgr, etc. |
| URL permalink state        | `src/ui/hash.ts`                     | Fragment encode/decode (pure logic)   |
| E2E tests                  | `e2e/demo.test.ts`                   | Playwright, 19 tests                  |
| CI/deployment              | `.github/workflows/`                 | Bun build -> GitHub Pages             |
| Python CLI converter       | `scripts/gnu2bsd.py`                 | Separate tool, not part of TS app     |

## CONVENTIONS

### VCS

- **jj (Jujutsu)**, not git. `.jj/` present, colocated with git.
- Default branch: `master`

### TypeScript

- **Max strictness**: `strict` + `noUncheckedIndexedAccess` +
  `exactOptionalPropertyTypes`
- Imports use `.ts` extensions: `from './bsd.ts'`
- `readonly` on array types and interface properties
- Discriminated unions + `as const` for domain modeling
- Explicit `export type` for type-only re-exports
- **Zero `any`, zero `as` casts, zero `!` non-null assertions, zero
  `@ts-ignore`** -- this is enforced, not aspirational

### Svelte 5

- **Runes API**: `$state`, `$derived`, `$derived.by`, `$effect`, `$bindable`
- **No SvelteKit** -- plain Svelte + Vite SPA
- **Scoped styles**: component-specific CSS in `<style>` blocks; globals only in
  `src/style.css` (reset, custom properties, responsive breakpoints)
- **Props pattern**: `interface Props` with `$props()` destructuring; use
  `$bindable()` for two-way binding; `...rest` spread for native attr forwarding
- **`class` prop**: `let { class: className = '' } = $props()` with
  `class="base {className}"` for CSS passthrough
- **Child component styling**: `:global()` scoped under a local parent selector
  (`.parent :global(.child-class)`), never bare `:global()`
- **Mount pattern**: `mount(App, { target })` where target is `<div id="app">`.
  Component renders `<main>` (no id) inside it
- **Reactive URLs**: `window.location.href` is NOT reactive in templates; derive
  URLs via `$derived` from the same state the `$effect` uses
- **svelte-check**: `bun run check` validates Svelte + TS types

### Formatting (dprint)

- **Tabs** for indentation
- **Single quotes** for strings
- **LF** line endings
- Local config: `dprint.jsonc` at project root
- markup_fmt plugin handles `.svelte` files
- Run: `bun run format` (`dprint fmt .`)

### Linting (Biome)

- Formatter **disabled** in Biome (dprint handles formatting)
- `.svelte` files **ignored** by Biome (false positives on Svelte patterns)
- Recommended rules + `organizeImports: "on"`
- Run: `bun run lint` (`biome check`)

### Testing

#### Unit tests (Vitest)

- Co-located `*.test.ts` next to source
- BDD style: `describe` / `it` (not `test`)
- Explicit vitest imports: `{ describe, expect, it }`
- **Round-trip identity** is the primary correctness pattern:
  `parse -> stringify === identity`
- Zero mocks, zero fixtures, zero setup/teardown -- pure input/output
- Tests only pure logic; component tests are separate
- `vitest.config.ts` excludes `*.svelte.test.ts` (browser-only)
- Run: `bun run test:unit` (`vitest`)

#### Component tests (vitest-browser-svelte)

- Co-located `*.svelte.test.ts` next to components
- Uses `render()` from `vitest-browser-svelte` + `page` from
  `@vitest/browser/context`
- Runs in chromium headless via `@vitest/browser-playwright`
- BDD style, explicit imports
- For form inputs: `getByRole('textbox', { name: /.../ })` (avoids label
  ambiguity with CopyButton aria-labels)
- For hidden/non-accessible elements: use `container.querySelectorAll()`
- Clipboard mocking: `vi.stubGlobal('navigator', { clipboard: { writeText } })`
- Run: `bun run test:unit` (vitest picks up browser project)

#### E2E tests (Playwright)

- Located in `e2e/` directory
- Config: `playwright.config.ts` (webServer: build + preview on port 4173)
- Run: `bun run test:e2e` (`playwright test`)

### All tests combined

- Run: `bun run test` (unit + component + e2e)

## ANTI-PATTERNS (THIS PROJECT)

- **No type assertions (`as`)** -- use proper narrowing
- **No `any`** -- always type explicitly
- **No non-null assertions (`!`)** -- handle undefined
- **No lint suppressions** -- fix the code, don't suppress
- **No `console.log`** -- removed before commit
- **No bare `:global()`** -- always scope under a local parent selector
- **No ID selectors in scoped styles** -- use class selectors; IDs only for
  `<label for=>` accessibility

## COMMANDS

```bash
bun run dev        # Vite dev server
bun run build      # Production build -> dist/
bun run preview    # Preview production build
bun run test       # All tests (unit + component + e2e)
bun run test:unit  # Vitest (unit + browser component tests)
bun run test:e2e   # Playwright e2e tests
bun run test:watch # Vitest watch mode
bun run lint       # Biome check
bun run format     # dprint fmt .
bun run check      # svelte-check (Svelte + TS type validation)
```

## NOTES

- CI (`deploy.yml`) only builds + deploys. **No tests, no lint, no typecheck in
  CI.**
- `scripts/gnu2bsd.py` is a standalone Python predecessor/reference
  implementation. Not part of the TS build.
- `@typescript/native-preview` is in devDeps -- experimental TS native compiler.
- Bun is the package manager (`bun.lock` committed); Volta pins Node 25.6.0 as
  fallback.
- `main.ts` mounts `App.svelte` with `instanceof HTMLElement` guard on the
  `#app` target. No `DOMContentLoaded` listener -- relies on `<script>` at
  bottom of `<body>`.
- `bsd.ts` has an internal integrity assertion: throws on invariant violation
  for invalid LSCOLORS length.
- **Pure logic layer** (`bsd.ts`, `gnu.ts`, `sgr.ts`, `convert.ts`, `types.ts`,
  `ui/hash.ts`) is framework-agnostic -- never modify for UI changes.
- `src/svelte-shims.d.ts` declares `*.svelte` module type for TS.
  `/// <reference types="svelte" />` alone doesn't work with svelte-check.
- Vite `base` is dynamic: `/lscolors/` on GitHub Actions, `/` locally.
