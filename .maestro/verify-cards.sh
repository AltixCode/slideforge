#!/usr/bin/env bash
# Re-reads the cards SlideForge wrote and fails if they are not exactly the
# size Instagram and LinkedIn expect.
#
# Dimensions are the whole product here. Skia snapshots at the device pixel
# ratio, so a canvas sized in design units exports 3x too large on a @3x phone;
# and snapshotting the on-screen preview captures only what the view actually
# drew, so a card scrolled out of sight comes out short. Both produce a file
# that opens fine and is wrong.
#
# Usage: .maestro/verify-cards.sh <simulator-udid> <expected-count>
set -euo pipefail
UDID="${1:?usage: verify-cards.sh <udid> <count>}"
WANT="${2:-3}"
DCIM="$HOME/Library/Developer/CoreSimulator/Devices/$UDID/data/Media/DCIM/100APPLE"
BIN="$(mktemp -d)/content-box"
swiftc -O "$(dirname "$0")/content-box.swift" -o "$BIN"

mapfile -t CARDS < <(ls -t "$DCIM"/*.PNG 2>/dev/null | head -"$WANT")
[ "${#CARDS[@]}" -eq "$WANT" ] || { echo "FAIL: expected $WANT cards, found ${#CARDS[@]}"; exit 1; }

fail=0
for f in "${CARDS[@]}"; do
  read -r w h < <(sips -g pixelWidth -g pixelHeight "$f" 2>/dev/null \
    | awk '/pixelWidth/{w=$2} /pixelHeight/{h=$2} END{print w, h}')
  if [ "$w" != "1080" ] || [ "$h" != "1350" ]; then
    echo "FAIL $(basename "$f"): ${w}x${h}, expected 1080x1350"; fail=1
  else
    echo "ok   $(basename "$f"): ${w}x${h}"
  fi
done

# A card of the right size that is blank is still a broken export, so confirm
# the drawing actually covers the canvas.
"$BIN" "${CARDS[@]}" | while read -r line; do
  case "$line" in *"ALL-WHITE"*) echo "FAIL blank card: $line"; exit 1;; esac
done

[ "$fail" -eq 0 ] && echo "RESULT: PASS - every card is exactly 1080x1350 with content drawn"
exit "$fail"
