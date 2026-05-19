#!/usr/bin/env bash
set -euo pipefail
# set -x

# Syncs the meta-ekosystem catalog to the *-ekosystem repo defined by
# MONOREPO and creates a pull request if there are changes.
# Requires GH_TOKEN env var to be set for git authentication.
#
# Usage (CI mode):
#   MONOREPO=kdk-ekosystem bash ./scripts/sync_catalog.sh

THIS_FILE=$(readlink -f "${BASH_SOURCE[0]}")
THIS_DIR=$(dirname "$THIS_FILE")
ROOT_DIR=$(dirname "$THIS_DIR")

. "$THIS_DIR/kash/kash.sh"

TAG="${GITHUB_REF_NAME:-}"
WORKSPACE_DIR="$(dirname "$ROOT_DIR")"

## Validate required variables
if [[ -z "$TAG" ]]; then
    echo "-> Error: TAG is required. Set GITHUB_REF_NAME." >&2
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

## Configure git identity for commits
git config --global user.name "github-actions[bot]"
git config --global user.email "41898282+github-actions[bot]@users.noreply.github.com"

## Install required tools
echo "-> Installing pnpm"
ensure_pnpm

## Install meta-ekosystem dependencies required by k-sync-catalog
echo "-> Installing meta-ekosystem dependencies"
cd "$ROOT_DIR" && pnpm install && cd ~-

## Clone the ekosystem repo using GH_TOKEN
REMOTE_URL="https://x-access-token:${GH_TOKEN}@github.com/kalisio/${MONOREPO}.git"
REPO_DIR="$WORKSPACE_DIR/$MONOREPO"

if [[ ! -d "$REPO_DIR" ]]; then
    echo "-> Cloning $MONOREPO"
    git_shallow_clone "$REMOTE_URL" "$REPO_DIR"
else
    echo "-> $MONOREPO already cloned, skipping"
fi

## Enter repo directory
cd "$REPO_DIR"

## Run catalog sync
node "$ROOT_DIR/bin/k-sync-catalog.js"

## Skip if no changes in relevant files
if git diff --quiet -- pnpm-workspace.yaml package.json; then
    echo "-> No changes in $MONOREPO, skipping"
    exit 0
fi

## Prepare branch
BRANCH="sync/catalog-$TAG"

# Check if remote branch exists (using explicit tokenized URL)
if git ls-remote --heads "$REMOTE_URL" "refs/heads/$BRANCH" | grep -q "refs/heads/$BRANCH$"; then
    echo "-> Branch $BRANCH already exists on remote, fetching and checking out"
    git fetch "$REMOTE_URL" "$BRANCH"
    git checkout "$BRANCH"
else
    echo "-> Creating new branch $BRANCH"
    git checkout -b "$BRANCH"
fi

## Commit changes
git add pnpm-workspace.yaml package.json
git commit -m "chore: sync catalog to meta-ekosystem@$TAG"

## Push using explicit tokenized URL (force-with-lease for safety)
echo "-> Pushing branch $BRANCH"
git push --force-with-lease "$REMOTE_URL" "$BRANCH"

## Create pull request using gh CLI (uses GH_TOKEN automatically)
gh_create_pull_request \
    "kalisio/$MONOREPO" \
    "chore: sync catalog to meta-ekosystem@$TAG" \
    "Automated catalog sync from meta-ekosystem@$TAG." \
    "$BRANCH"

echo "-> $MONOREPO synced successfully"