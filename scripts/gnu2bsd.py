#!/usr/bin/env -S uv run --script
# /// script
# requires-python = ">=3.13"
# dependencies = []
# ///
"""Convert GNU LS_COLORS to BSD LSCOLORS and print the result.

BSD's LSCOLORS is a string of color designator pairs, where the Nth pair
configures the Nth file type in FILE_TYPE_LABELS.  Each pair has the form
"<f><b>", where <f> and <b> are letters in [a-h] for foreground and background
colors respectively.  A foreground letter can be capitalized to indicate bold.
Either position can be 'x' for the default color.  See BSD ``man ls``.

This program uses a simplified subset of GNU's LS_COLORS syntax, since BSD
only supports a fraction of GNU's features.  In GNU, LS_COLORS is a
colon-delimited list of '<label>=<sequence>' pairs:

  <label>: A file type identifier.  Only labels present in FILE_TYPE_LABELS
    are used; all others (including file extensions) are ignored.

  <sequence>: A semicolon-delimited list of ANSI SGR codes.  Only the subset
    representable in BSD LSCOLORS is used; see ANSI_FG_TO_BSD and
    ANSI_BG_TO_BSD.  All other codes are ignored.

Typical usage example:

  $ LS_COLORS='di=01;34:ln=01;36' ./scripts/gnu2bsd.py
  ExGxxxxxxxxxxxxxxxxxxx

Adapted from: https://github.com/lucas-flowers/gnu2bsd
"""

import os
from typing import Final, Literal, NamedTuple

# BSD color designator: a-h for colors, x for default.
type BsdColor = Literal["a", "b", "c", "d", "e", "f", "g", "h", "x"]


class ColorState(NamedTuple):
    """Accumulated state from processing an ANSI SGR code sequence.

    Attributes:
      pos: Current index into the ANSI code list.
      bold: Whether bold is active for the foreground color.
      swap: Whether foreground and background are swapped.
      fg: BSD foreground color designator.
      bg: BSD background color designator.
    """

    pos: int
    bold: bool
    swap: bool
    fg: BsdColor
    bg: BsdColor


# GNU file type labels in the order BSD expects them.  The Nth color designator
# pair in BSD's LSCOLORS configures the Nth file type in this list.
FILE_TYPE_LABELS: Final = [
    "di",  # directory
    "ln",  # symbolic link
    "so",  # socket
    "pi",  # pipe
    "ex",  # executable
    "bd",  # block device
    "cd",  # character device
    "su",  # executable, setuid set
    "sg",  # executable, setgid set
    "tw",  # directory, writable by others, sticky bit set
    "ow",  # directory, writable by others, sticky bit unset
]

# ANSI foreground codes to BSD color designators.
ANSI_FG_TO_BSD: Final[dict[int, BsdColor]] = {
    30: "a",  # black
    31: "b",  # red
    32: "c",  # green
    33: "d",  # brown
    34: "e",  # blue
    35: "f",  # magenta
    36: "g",  # cyan
    37: "h",  # light grey
}

# ANSI background codes to BSD color designators.
ANSI_BG_TO_BSD: Final[dict[int, BsdColor]] = {
    40: "a",  # black
    41: "b",  # red
    42: "c",  # green
    43: "d",  # brown
    44: "e",  # blue
    45: "f",  # magenta
    46: "g",  # cyan
    47: "h",  # light grey
}

# ANSI SGR attribute codes.
ANSI_RESET: Final = 0
ANSI_BOLD: Final = 1
ANSI_NEGATIVE: Final = 7  # swap fg and bg
ANSI_BOLD_OFF: Final = 21
ANSI_REGULAR: Final = 22  # bold off
ANSI_POSITIVE: Final = 27  # undo swap
ANSI_FG_EXTENDED: Final = 38
ANSI_BG_EXTENDED: Final = 48

# Maps an extended-color type code to the number of parameters that follow it.
# Although gnu2bsd ignores extended colors, it must know how many codes to skip.
ANSI_COLOR_TYPE_PARAMS: Final[dict[int, int]] = {
    5: 1,  # 256-color palette index
    2: 3,  # RGB triplet
}

# ANSI codes in this range are valid but have no BSD equivalent.
ANSI_IGNORE: Final = range(0, 65 + 1)


def _skip_extended_color(ansi_codes: list[int], pos: int) -> int:
    """Advance past an extended color sequence (code 38 or 48).

    Args:
      ansi_codes: Full list of parsed ANSI SGR codes.
      pos: Index of the extended color introducer (38 or 48).

    Returns:
      The index of the last parameter consumed by the extended sequence.

    Raises:
      ValueError: The extended color sequence is malformed or truncated.
    """
    try:
        pos += 1
        ansi_color_type = ansi_codes[pos]
        return pos + ANSI_COLOR_TYPE_PARAMS[ansi_color_type]
    except (IndexError, KeyError):
        raise ValueError("Invalid extended color sequence")


def _parse_ansi_codes(ansi_sequence: str) -> list[int]:
    """Parse a semicolon-delimited ANSI SGR sequence into integer codes.

    An implicit ANSI_RESET is prepended so that the returned list always starts
    from a known default state.  If ``ansi_sequence`` contains non-integer
    tokens, the parse is abandoned and only the leading reset is returned.

    Args:
      ansi_sequence: Raw SGR string, e.g. ``"01;34;42"``.

    Returns:
      A list of integer ANSI codes, always starting with ANSI_RESET.
    """
    codes: list[int] = [ANSI_RESET]
    if ansi_sequence:
        try:
            codes.extend(int(c) for c in ansi_sequence.split(";"))
        except ValueError:
            pass  # Malformed tokens; fall back to defaults.
    return codes


# Maps ANSI bold/regular codes to their boolean bold value.
_BOLD_CODES: Final[dict[int, bool]] = {
    ANSI_BOLD: True,
    ANSI_BOLD_OFF: False,
    ANSI_REGULAR: False,
}

# Maps ANSI swap codes to their boolean swap value.
_SWAP_CODES: Final[dict[int, bool]] = {
    ANSI_NEGATIVE: True,
    ANSI_POSITIVE: False,
}

_EXTENDED_CODES: Final[frozenset[int]] = frozenset({ANSI_FG_EXTENDED, ANSI_BG_EXTENDED})


def _process_ansi_code(
    ansi_code: int, ansi_codes: list[int], state: ColorState
) -> ColorState:
    """Apply a single ANSI SGR code to the current color state.

    Args:
      ansi_code: The ANSI SGR code to process.
      ansi_codes: Full list of parsed codes (needed to skip extended colors).
      state: Current accumulated color state.

    Returns:
      A new ColorState reflecting the effect of ``ansi_code``.

    Raises:
      ValueError: ``ansi_code`` is not a recognized ANSI SGR code.
    """
    if ansi_code == ANSI_RESET:
        return ColorState(state.pos, bold=False, swap=False, fg="x", bg="x")
    if ansi_code in _BOLD_CODES:
        return state._replace(bold=_BOLD_CODES[ansi_code])
    if ansi_code in _SWAP_CODES:
        return state._replace(swap=_SWAP_CODES[ansi_code])
    if ansi_code in ANSI_FG_TO_BSD:
        return state._replace(fg=ANSI_FG_TO_BSD[ansi_code])
    if ansi_code in ANSI_BG_TO_BSD:
        return state._replace(bg=ANSI_BG_TO_BSD[ansi_code])
    if ansi_code in _EXTENDED_CODES:
        return state._replace(pos=_skip_extended_color(ansi_codes, state.pos))
    if ansi_code in ANSI_IGNORE:
        return state
    raise ValueError(f"Invalid ANSI SGR code: {ansi_code}")


def gnu_to_bsd_color(ansi_sequence: str) -> str:
    """Convert an ANSI SGR sequence into a BSD LSCOLORS color designator pair.

    Later codes in the sequence override earlier ones when they affect the same
    attribute.  Codes not representable in BSD are silently ignored.

    Args:
      ansi_sequence: Semicolon-delimited ANSI SGR string, e.g. ``"01;34"``.

    Returns:
      A two-character string ``"<fg><bg>"`` suitable for BSD LSCOLORS.

    Raises:
      ValueError: The sequence contains an unrecognized ANSI SGR code.

    Examples:

    >>> # Blue foreground, bold, blue background.
    >>> gnu_to_bsd_color('34;01;44')
    'Ee'
    >>> # Blue foreground overridden by magenta; no background.
    >>> gnu_to_bsd_color('34;35')
    'fx'
    >>> # Extended RGB background is ignored; green foreground wins.
    >>> gnu_to_bsd_color('34;42;48;2;255;255;255;32')
    'cc'
    >>> # Swap reverses blue foreground and green background.
    >>> gnu_to_bsd_color('34;42;7')
    'ce'
    """
    ansi_codes = _parse_ansi_codes(ansi_sequence)
    state = ColorState(pos=0, bold=False, swap=False, fg="x", bg="x")

    while state.pos < len(ansi_codes):
        state = _process_ansi_code(ansi_codes[state.pos], ansi_codes, state)
        state = state._replace(pos=state.pos + 1)

    fg: str = state.fg
    bg: str = state.bg

    if state.bold and fg != "x":
        fg = fg.upper()
    if state.swap:
        fg, bg = bg, fg

    return fg + bg


def LS_COLORS_to_LSCOLORS(LS_COLORS: str | None) -> str:
    """Convert a GNU LS_COLORS value to a BSD LSCOLORS value.

    Parses the colon-delimited GNU string into label/sequence pairs, converts
    each recognized file type label to its BSD color designator pair, and
    concatenates the results.  Unrecognized labels (including file extensions)
    are ignored.

    Args:
      LS_COLORS: The value of the GNU ``LS_COLORS`` environment variable, or
        None.

    Returns:
      A BSD LSCOLORS string with one two-character pair per file type in
      FILE_TYPE_LABELS.

    Examples:

    >>> LS_COLORS_to_LSCOLORS('rs=0:di=01;34:ln=01;36:mh=00:tw=40:*.txt=44')
    'ExGxxxxxxxxxxxxxxxxaxx'
    """
    raw: str = LS_COLORS or ""

    ls_colors: dict[str, str] = {}
    for item in filter(bool, raw.split(":")):
        label, ansi_sequence = item.split("=", 1)
        ls_colors[label] = ansi_sequence

    lscolors: list[str] = []
    for label in FILE_TYPE_LABELS:
        ansi_sequence = ls_colors.get(label, "")
        bsd_color_designators = gnu_to_bsd_color(ansi_sequence)
        lscolors.append(bsd_color_designators)

    return "".join(lscolors)


def main() -> None:
    """Read LS_COLORS from the environment and print the BSD equivalent."""
    ls_colors_env: str | None = os.environ.get("LS_COLORS")
    lscolors: str = LS_COLORS_to_LSCOLORS(ls_colors_env)
    print(lscolors)


if __name__ == "__main__":
    main()
