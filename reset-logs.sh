#!/usr/bin/env bash
set -euo pipefail

SCRIPT_NAME="$(basename "$0")"
ORPHAN_BRANCH="${1:-$(git branch --show-current)}"
TEMP_BRANCH="temp-orphan-$$"

# Clear logs/ contents (keep dir)
rm -rf logs/* logs/.* 2>/dev/null || true
touch logs/.gitkeep

# Use a temp branch as intermediate since the target branch already exists
git checkout --orphan "$TEMP_BRANCH"

# Stage only what we want to keep
git reset HEAD -- . 2>/dev/null || true
git add subscriptions.opml logs/.gitkeep "$SCRIPT_NAME"

# Commit on temp branch
git commit -m "chore: reset repository, keep only config and logs directory"

# Replace the target branch with temp branch
git branch -M "$TEMP_BRANCH" "$ORPHAN_BRANCH"

# Force push
git push origin "$ORPHAN_BRANCH" --force

echo "Done. Orphan branch '$ORPHAN_BRANCH' has been force-pushed."
