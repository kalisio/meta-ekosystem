#!/usr/bin/env bash
set -euo pipefail
# set -x

# Syncs the meta-ekosystem catalog to the *-ekosystem repo defined by
# MONOREPO  and creates a pull request if there are changes.
# Requires GH_TOKEN env var to be set for gh CLI authentication.
#
# Usage (CI mode):
#   MONOREPO=kdk-ekosystem bash ./scripts/sync_catalog.sh
#
# Usage (dev mode):
#   MONOREPO=kdk-ekosystem bash ./scripts/sync_catalog.sh <tag>

THIS_FILE=$(readlink -f "${BASH_SOURCE[0]}")
THIS_DIR=$(dirname "$THIS_FILE")
ROOT_DIR=$(dirname "$THIS_DIR")

. "$THIS_DIR/kash/kash.sh"

TAG="${GITHUB_REF_NAME:-${1:-}}"
WORKSPACE_DIR="${MONOREPO_WORKSPACE_DIR:-$(dirname "$ROOT_DIR")}"

## Validate required variables
##
if [[ -z "$TAG" ]]; then
    echo "-> Error: TAG is required. Set GITHUB_REF_NAME or pass it as first argument." >&2
    exit 1
fi

if [[ -z "${MONOREPO:-}" ]]; then
    echo "-> Error: MONOREPO is required." >&2
    exit 1
fi

if [[ -z "${GH_TOKEN:-}" ]]; then
    echo "-> Error: GH_TOKEN is required." >&2
    exit 1
fi

## Configure git identity for commits CI mode only
## https://github.com/actions/checkout/pull/1707
##
if [[ "${CI:-false}" == "true" ]]; then
    git config --global user.name "github-actions[bot]"
    git config --global user.email "41898282+github-actions[bot]@users.noreply.github.com"
fi

## Sync catalog and create pull request
##
REPO_DIR="$WORKSPACE_DIR/$MONOREPO"
BRANCH="sync/catalog-$TAG"

cd "$REPO_DIR"
node "$ROOT_DIR/scripts/k-sync-catalog.js"

# Skip if no changes on the files k-sync-catalog modifies
if git diff --quiet -- pnpm-workspace.yaml package.json; then
    echo "-> No changes in $MONOREPO, skipping"
    exit 0
fi

# Checkout branch — create if not exists on remote, reuse if already exists
# --force-with-lease ensures we never overwrite unexpected remote changes
if git ls-remote --heads origin "refs/heads/$BRANCH" | grep -q "refs/heads/$BRANCH$"; then
    git fetch origin "$BRANCH"
    git checkout "$BRANCH"
else
    git checkout -b "$BRANCH"
fi

git add pnpm-workspace.yaml package.json
git commit -m "chore: sync catalog to meta-ekosystem@$TAG"
git push --force-with-lease origin "$BRANCH"

gh_create_pull_request \
    "kalisio/$MONOREPO" \
    "chore: sync catalog to meta-ekosystem@$TAG" \
    "Automated catalog sync from meta-ekosystem@$TAG." \
    "$BRANCH"

echo "-> $MONOREPO synced successfully"