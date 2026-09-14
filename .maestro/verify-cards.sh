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
# Usage: .maestro/verify-cards.sh <simulator-udid|android> <expected-count>
#
# The renderer is Skia on both platforms, but the export path is not: the
# snapshot, the pixel ratio and the save all differ, so one passing says
# nothing about the other.
set -euo pipefail
TARGET="${1:?usage: verify-cards.sh <udid|android> <count>}"
WANT="${2:-3}"
WORK="$(mktemp -d)"
BIN="$WORK/content-box"
swiftc -O "$(dirname "$0")/content-box.swift" -o "$BIN"

if [ "$TARGET" = android ]; then
  ADB="$HOME/Library/Android/sdk/platform-tools/adb"
  # Files written with MediaStore are invisible to `ls` until the volume is
  # rescanned, and invisible to the picker for the same reason.
  "$ADB" shell content call --uri content://media/ --method scan_volume --arg external_primary >/dev/null 2>&1 || true
  # Listed into a variable first. Piping adb straight into `head` closes the
  # pipe early, adb dies on SIGPIPE, and under `set -e` the whole script exits
  # with no output at all -- which looks exactly like a silent failure.
  listing="$("$ADB" shell "ls -t /sdcard/Pictures/*.png /sdcard/DCIM/*.png 2>/dev/null" 2>/dev/null | tr -d '\r' || true)"
  # Read line by line, not word by word: MediaStore appends " (1)" to a name
  # that already exists, and a `for` over command substitution splits that into
  # three paths that all fail to pull.
  count=0
  while IFS= read -r remote; do
    [ -n "$remote" ] || continue
    [ "$count" -ge "$WANT" ] && break
    "$ADB" pull "$remote" "$WORK/" >/dev/null 2>&1 || true
    count=$((count + 1))
  done <<< "$listing"
  mapfile -t CARDS < <(ls -t "$WORK"/*.png 2>/dev/null | head -"$WANT")
else
  DCIM="$HOME/Library/Developer/CoreSimulator/Devices/$TARGET/data/Media/DCIM/100APPLE"
  mapfile -t CARDS < <(ls -t "$DCIM"/*.PNG 2>/dev/null | head -"$WANT")
fi
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
