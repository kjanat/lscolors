#!/usr/bin/env bash
# Convert public/favicon.svg -> public/favicon.ico (16, 32, 48px)
# Requires ImageMagick (magick or convert).
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
ROOT_DIR="$(dirname "$SCRIPT_DIR")"
SVG="$ROOT_DIR/public/favicon.svg"
ICO="$ROOT_DIR/public/favicon.ico"

if ! command -v magick &>/dev/null && ! command -v convert &>/dev/null; then
	echo "Error: ImageMagick not found. Install it first:" >&2
	echo "  brew install imagemagick   # macOS" >&2
	echo "  sudo pacman -S imagemagick # Arch" >&2
	echo "  sudo apt install imagemagick # Debian/Ubuntu" >&2
	exit 1
fi

CMD="magick"
if ! command -v magick &>/dev/null; then
	CMD="convert"
fi

# Generate PNGs at each size, then combine into ICO
TMPDIR="$(mktemp -d)"
trap 'rm -rf "$TMPDIR"' EXIT

for size in 16 32 48; do
	"$CMD" -background none -density 256 "$SVG" -resize "${size}x${size}" "$TMPDIR/icon-${size}.png"
done

"$CMD" "$TMPDIR/icon-16.png" "$TMPDIR/icon-32.png" "$TMPDIR/icon-48.png" "$ICO"

echo "Created $ICO"
