# lscolors

Convert between macOS/BSD `LSCOLORS` and GNU `LS_COLORS` (dircolors) formats.

**[Live site](https://kjanat.github.io/lscolors/)**

## What it does

`LSCOLORS` (BSD/macOS) and `LS_COLORS` (GNU/Linux) both control how `ls`
colorizes file listings, but use completely different formats:

|        | LSCOLORS (BSD)                        | LS_COLORS (GNU)                          |
| ------ | ------------------------------------- | ---------------------------------------- |
| Format | 22-character string                   | `key=value` pairs separated by `:`       |
| Colors | 16 colors via chars `a-h`, `A-H`, `x` | Full ANSI SGR codes (16, 256, truecolor) |
| Slots  | 11 fixed file types                   | Arbitrary keys + file extensions         |

This tool converts between them in both directions with live preview.

## Features

- Bidirectional live conversion as you type
- Color preview swatches for all 11 BSD slots
- 256-color to 16-color approximation (Euclidean RGB distance)
- Copy to clipboard
- Shareable permalink via URL hash
- Responsive down to 375px
- Zero runtime dependencies

## Supported slots

| Char pair | Key  | Description             |
| --------- | ---- | ----------------------- |
| 1-2       | `di` | Directory               |
| 3-4       | `ln` | Symbolic link           |
| 5-6       | `so` | Socket                  |
| 7-8       | `pi` | Pipe (FIFO)             |
| 9-10      | `ex` | Executable              |
| 11-12     | `bd` | Block device            |
| 13-14     | `cd` | Character device        |
| 15-16     | `su` | Setuid (u+s)            |
| 17-18     | `sg` | Setgid (g+s)            |
| 19-20     | `tw` | Sticky + other-writable |
| 21-22     | `ow` | Other-writable          |

## Limitations

- **GNU -> BSD is lossy**: `LS_COLORS` supports file extension keys (`*.tar`),
  bold, underline, blink, 256-color, and truecolor. These don't exist in
  `LSCOLORS` and are dropped or approximated.
- **256-color approximation**: Mapped to nearest of the 16 basic ANSI colors.
  Close enough for a preview, not pixel-perfect.
- **Only the 11 overlapping keys** are preserved when converting GNU to BSD.

## Development

```sh
bun install
bun run dev       # dev server
bun test          # run tests
bun run build     # production build -> dist/
bun run format    # format with dprint
```

## Stack

TypeScript, Vite, Vitest. No runtime dependencies. Hosted on GitHub Pages.
