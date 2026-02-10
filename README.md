# lscolors

Convert between macOS/BSD `LSCOLORS` and GNU/Linux `LS_COLORS` (dircolors)
formats.

<details open>
<summary>Screenshot</summary>
<div align="center">
  <a href="https://kjanat.github.io/lscolors/" target="_blank" rel="noopener noreferrer">
    <img src="https://github.com/kjanat/lscolors/raw/master/screenshot.png" alt="Try it online" width="600"><br>
  </a>
</div>
</details>

[**Try it online**][Site]

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
- 256-color and truecolor to 16-color approximation (Euclidean RGB distance)
- Copy to clipboard
- Shareable permalink via URL hash

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

- **GNU → BSD is lossy**: `LS_COLORS` supports file extension keys (`*.tar`),
  underline, blink, dim, italic, strikethrough, and other SGR attributes that
  have no BSD equivalent — these are silently dropped.
- **256-color and truecolor approximation**: Both 256-color (`38;5;N`) and
  truecolor (`38;2;r;g;b`) are mapped to the nearest of the 16 basic ANSI colors
  via Euclidean RGB distance. Close enough for a preview, not pixel-perfect.
- **Only the 11 overlapping keys** are preserved when converting GNU to BSD.
- **Bold (01) → uppercase**: GNU `01;34` (bold blue) produces uppercase `E` in
  the BSD output, matching BSD convention.
- **Last-wins**: If multiple fg/bg codes appear (e.g. `34;35`), the last code
  wins, consistent with terminal behavior.
- **Reverse video (07)**: ANSI code 7 swaps fg/bg in the BSD output.

## Why?

I was checking out [monokai.pro/zsh] and had some issues with their instructions
for setting up my zsh config with the monokai theme, but apparently their config
is macOS/BSD-oriented and I don't have a Mac. I got AI automation somewhat
working, so I threw together this little tool to convert their provided
`LSCOLORS` value into `LS_COLORS` format.\
Then I figured I might as well host it on GitHub for free.

## See also

- [lucas-flowers/gnu2bsd] -- Python CLI that converts GNU `LS_COLORS` to BSD
  `LSCOLORS` (one direction only). Handles bold-to-uppercase, last-wins
  overriding, and reverse video (code 7).
- [ggreer/lscolors] -- interactive `LSCOLORS` / `LS_COLORS` generator with color
  pickers.
- [sharkdp/vivid] -- themeable `LS_COLORS` generator with YAML config and
  truecolor support.

## Development

```sh
bun install
bun run dev       # dev server
bun test          # run tests
bun run build     # production build -> dist/
bun run format    # format with dprint
```

<!--link-definitions-->

[monokai.pro/zsh]: https://monokai.pro/zsh
[lucas-flowers/gnu2bsd]: https://github.com/lucas-flowers/gnu2bsd
[ggreer/lscolors]: https://github.com/ggreer/lscolors
[sharkdp/vivid]: https://github.com/sharkdp/vivid
[Site]: https://kjanat.github.io/lscolors/

<!--markdownlint-disable-file MD033-->
