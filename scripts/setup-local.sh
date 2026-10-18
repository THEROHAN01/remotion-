#!/usr/bin/env bash
# One-shot local setup: clone (or update) the repo and install everything.
#   curl -fsSL https://raw.githubusercontent.com/THEROHAN01/remotion-/main/scripts/setup-local.sh | bash
#   or, inside an existing clone: bash scripts/setup-local.sh
set -euo pipefail

REPO=https://github.com/THEROHAN01/remotion-.git
DIR=${1:-remotion-}

if git rev-parse --show-toplevel >/dev/null 2>&1 && [ -f "$(git rev-parse --show-toplevel)/remotion.config.ts" ]; then
  cd "$(git rev-parse --show-toplevel)"
  echo "→ updating existing clone in $(pwd)"
  git pull --ff-only origin main
else
  if [ -d "$DIR/.git" ]; then cd "$DIR" && git pull --ff-only origin main
  else git clone "$REPO" "$DIR" && cd "$DIR"; fi
fi

need() { command -v "$1" >/dev/null 2>&1 || { echo "✗ $1 not found: $2"; MISSING=1; }; }
MISSING=0
need node   "install Node 20+ from https://nodejs.org"
need ffmpeg "install ffmpeg (macOS: brew install ffmpeg · Ubuntu: sudo apt install ffmpeg · Windows: winget install ffmpeg)"
[ "$MISSING" = 0 ] || { echo "Install the tools above, then re-run this script."; exit 1; }

echo "→ installing Remotion project dependencies"
npm install

echo "→ installing Playwright + Chromium (used by films/rohansalunkhe-dev)"
npm install -g playwright
npx --yes playwright install chromium

if [ ! -f .env ]; then
  printf 'CARTESIA_API_KEY=\n' > .env
  echo "→ created .env: paste your Cartesia key into it (never commit it)"
fi

cat <<'EOF'

Done.
  Remotion studio:      npm run dev
  Template renders:     out/*.mp4
  Portfolio film:       films/rohansalunkhe-dev/out/*.mp4  (re-render: see films/rohansalunkhe-dev/README.md;
                        uses Playwright's Chromium; set CHROME=<path> to use another)
  Continue this Claude conversation in your terminal:  claude --teleport
EOF
