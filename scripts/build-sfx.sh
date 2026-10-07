#!/usr/bin/env bash
# Builds public/sfx/*.wav: picks CC0 Kenney sounds (via the soundcn repo) and synthesizes the rest.
#
#   git clone --depth 1 https://github.com/kapishdima/soundcn /tmp/soundcn
#   scripts/build-sfx.sh /tmp/soundcn
#
# Everything is converted to 48 kHz stereo WAV and peak-normalized to -1 dBFS,
# so cue volumes in the templates are comparable.
set -euo pipefail
SRC="${1:?path to a soundcn checkout}/assets"
OUT="$(cd "$(dirname "$0")/.." && pwd)/public/sfx"
mkdir -p "$OUT"
TMP="$(mktemp -d)"
trap 'rm -rf "$TMP"' EXIT

normalize() { # in out
  local conv="$TMP/conv-$(basename "$2")" peak
  ffmpeg -loglevel error -y -i "$1" -ar 48000 -ac 2 -c:a pcm_s16le "$conv"
  peak=$(ffmpeg -hide_banner -i "$conv" -af volumedetect -f null - 2>&1 | awk '/max_volume/ {print $5}')
  ffmpeg -loglevel error -y -i "$conv" -af "volume=$(awk "BEGIN{print -1 - ($peak)}")dB" -c:a pcm_s16le "$2"
}

# --- Kenney CC0 (www.kenney.nl) ---
normalize "$SRC/kenney_impact-sounds/impactPunch_heavy_000.ogg" "$OUT/impact-heavy.wav"
normalize "$SRC/kenney_impact-sounds/impactSoft_heavy_001.ogg" "$OUT/thud-soft.wav"
normalize "$SRC/kenney_impact-sounds/impactGlass_heavy_000.ogg" "$OUT/glass-shatter.wav"
normalize "$SRC/kenney_interface-sounds/select_002.ogg" "$OUT/click.wav"
normalize "$SRC/kenney_interface-sounds/tick_002.ogg" "$OUT/tick.wav"
normalize "$SRC/kenney_interface-sounds/scratch_002.ogg" "$OUT/marker.wav"
normalize "$SRC/kenney_interface-sounds/drop_002.ogg" "$OUT/pop.wav"
normalize "$SRC/kenney_interface-sounds/confirmation_001.ogg" "$OUT/confirm.wav"

# --- Synthesized ---
# Whoosh: pink noise, band-limited, swelling envelope, panned across the stereo field.
for dir in lr rl; do
  if [ "$dir" = lr ]; then L="(1-t/0.45)"; R="(t/0.45)"; else L="(t/0.45)"; R="(1-t/0.45)"; fi
  ffmpeg -loglevel error -y -f lavfi -i "anoisesrc=d=0.45:c=pink:r=48000:a=1:seed=7" \
    -af "highpass=f=250,lowpass=f=3200,aeval=exprs='val(0)*pow(sin(PI*t/0.45),3)*(0.35+0.65*$L)|val(0)*pow(sin(PI*t/0.45),3)*(0.35+0.65*$R)':c=stereo,aphaser=speed=2" \
    "$TMP/whoosh-$dir.wav"
  normalize "$TMP/whoosh-$dir.wav" "$OUT/whoosh-$dir.wav"
done
# Sub drop: sine sweeping 90 Hz -> 40 Hz with a fast decay (adds weight under hits).
ffmpeg -loglevel error -y -f lavfi -i "aevalsrc='0.9*sin(2*PI*(90*t-25*t*t))*exp(-5*t)':d=0.8:s=48000" "$TMP/sub.wav"
normalize "$TMP/sub.wav" "$OUT/sub-drop.wav"
# Chime: three bell tones (E5, G5, C6) arpeggiated 70 ms apart, with a short echo tail.
bell() { echo "if(gte(t,$2),(sin(2*PI*$1*(t-$2))+0.35*sin(2*PI*$1*2.76*(t-$2))*exp(-6*(t-$2))+0.15*sin(2*PI*$1*5.4*(t-$2))*exp(-10*(t-$2)))*exp(-2.6*(t-$2)),0)"; }
ffmpeg -loglevel error -y -f lavfi -i "aevalsrc='0.3*($(bell 659.25 0)+$(bell 783.99 0.07)+$(bell 1046.5 0.14))':d=2.2:s=48000" \
  -af "aecho=0.8:0.5:110|230:0.3|0.18,afade=t=out:st=1.7:d=0.5" "$TMP/chime.wav"
normalize "$TMP/chime.wav" "$OUT/chime.wav"

ls -1 "$OUT"
