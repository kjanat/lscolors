# PROJECT KNOWLEDGE BASE

**Generated:** 2026-02-10 **Commit:** 156bbaea (master)

## OVERVIEW

Web app converting between macOS/BSD `LSCOLORS` and GNU `LS_COLORS` terminal
color formats. TypeScript + Vite SPA deployed to GitHub Pages.

## STRUCTURE

```tree
./
├── index.html           # Vite entry point
├── src/
│   ├── main.ts          # App bootstrap (DOM wiring, event listeners)
│   ├── index.ts         # Library barrel (unused by app -- dead code)
│   ├── types.ts         # Domain types: BsdSlot, Style, Rgb, Direction
│   ├── bsd.ts           # BSD LSCOLORS parse/stringify
│   ├── gnu.ts           # GNU LS_COLORS parse/stringify
│   ├── sgr.ts           # ANSI SGR code parse/stringify
│   ├── convert.ts       # Bidirectional conversion + CSS color mapping
│   ├── *.test.ts        # Co-located unit tests
│   └── ui/
│       ├── dom.ts       # Typed DOM accessors (instanceof narrowing, never casts)
│       ├── clipboard.ts # Clipboard API wrapper
│       ├── hash.ts      # URL fragment encode/decode for permalink state
│       └── preview.ts   # Color preview swatch renderer
├── scripts/
│   └── gnu2bsd.py       # Standalone Python converter (uv run --script)
└── .github/workflows/
    └── deploy.yml       # Build + deploy to GitHub Pages
```

## WHERE TO LOOK

| Task                       | Location             | Notes                             |
| -------------------------- | -------------------- | --------------------------------- |
| Add conversion logic       | `src/convert.ts`     | Bidirectional BSD<->GNU           |
| Modify BSD format handling | `src/bsd.ts`         | 22 chars, 11 slot pairs           |
| Modify GNU format handling | `src/gnu.ts`         | Colon-delimited key=value         |
| Change SGR code parsing    | `src/sgr.ts`         | ANSI escape sequences             |
| Add/change domain types    | `src/types.ts`       | All shared types + constants      |
| Modify UI behavior         | `src/main.ts`        | Event handlers, init logic        |
| DOM element access         | `src/ui/dom.ts`      | Type-safe accessors               |
| URL permalink state        | `src/ui/hash.ts`     | Fragment encode/decode            |
| Color preview swatches     | `src/ui/preview.ts`  | Renders colored boxes             |
| CI/deployment              | `.github/workflows/` | Bun build -> GitHub Pages         |
| Python CLI converter       | `scripts/gnu2bsd.py` | Separate tool, not part of TS app |

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

### Formatting (dprint)

- **Tabs** for indentation
- **Single quotes** for strings
- **LF** line endings
- Local config: `dprint.jsonc` at project root
- Run: `bun run format` (`dprint fmt .`)

### Linting (Biome)

- Formatter **disabled** in Biome (dprint handles formatting)
- Recommended rules + `organizeImports: "on"`
- Run: `bun run lint` (`biome check`)

### Testing (Vitest)

- Co-located `*.test.ts` next to source
- BDD style: `describe` / `it` (not `test`)
- Explicit vitest imports: `{ describe, expect, it }`
- **Round-trip identity** is the primary correctness pattern:
  `parse -> stringify === identity`
- Zero mocks, zero fixtures, zero setup/teardown -- pure input/output
- Only pure logic is tested; UI/DOM code has no tests
- Run: `bun run test` (`vitest run`)

### DOM Access

- `src/ui/dom.ts` uses `instanceof` narrowing with `throw` on mismatch
- Never use `as HTMLElement` or similar casts

## ANTI-PATTERNS (THIS PROJECT)

- **No type assertions (`as`)** -- use proper narrowing
- **No `any`** -- always type explicitly
- **No non-null assertions (`!`)** -- handle undefined
- **No lint suppressions** -- fix the code, don't suppress
- **No `console.log`** -- removed before commit
- **Re-entrant event guard**: `main.ts` uses `converting` flag to prevent
  infinite loops when setting input values triggers input events -- maintain
  this pattern

## COMMANDS

```bash
bun run dev        # Vite dev server
bun run build      # Production build -> dist/
bun run preview    # Preview production build
bun run test       # Vitest run (single pass)
bun run test:watch # Vitest watch mode
bun run lint       # Biome check
bun run format     # dprint fmt .
```

## NOTES

- `src/index.ts` barrel is dead code -- not imported by app, no npm publish
  target (`"private": true`). Exists for potential library extraction.
- CI (`deploy.yml`) only builds + deploys. **No tests, no lint, no typecheck in
  CI.**
- `scripts/gnu2bsd.py` is a standalone Python predecessor/reference
  implementation. Not part of the TS build.
- `@typescript/native-preview` is in devDeps -- experimental TS native compiler.
- Bun is the package manager (`bun.lock` committed); Volta pins Node 25.6.0 as
  fallback.
- `main.ts` calls `init()` immediately at module scope (no `DOMContentLoaded`
  listener) -- relies on `<script>` placement at bottom of `<body>`.
- `bsd.ts` has an internal integrity assertion: throws on invariant violation
  for invalid LSCOLORS length.
