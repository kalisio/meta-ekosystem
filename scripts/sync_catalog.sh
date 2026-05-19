#!/usr/bin/env bash
set -euo pipefail

# Syncs the meta-ekosystem catalog to the repo defined by MONOREPO
# and creates a pull request if there are changes.
# Needs GH_TOKEN environment variable for git and gh login.

THIS_FILE=$(readlink -f "${BASH_SOURCE[0]}")
THIS_DIR=$(dirname "$THIS_FILE")
ROOT_DIR=$(dirname "$THIS_DIR")

. "$THIS_DIR/kash/kash.sh"

TAG="${GITHUB_REF_NAME:-}"
WORKSPACE_DIR="$(dirname "$ROOT_DIR")"

#  Check required variables 
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

#  Set git identity 
git config --global user.name "github-actions[bot]"
git config --global user.email "41898282+github-actions[bot]@users.noreply.github.com"

#  Install tools 
echo "-> Installing pnpm"
ensure_pnpm

echo "-> Installing meta-ekosystem dependencies"
cd "$ROOT_DIR" && pnpm install && cd ~-

# Clone target repo with token 
REMOTE_URL="https://x-access-token:${GH_TOKEN}@github.com/kalisio/${MONOREPO}.git"
REPO_DIR="$WORKSPACE_DIR/$MONOREPO"

if [[ ! -d "$REPO_DIR" ]]; then
    echo "-> Cloning $MONOREPO"
    git_shallow_clone "$REMOTE_URL" "$REPO_DIR"
else
    echo "-> $MONOREPO already cloned, skipping"
fi

#  Go into repo and set remote URL 
cd "$REPO_DIR"
git remote set-url origin "$REMOTE_URL"

#  Run catalog sync tool 
node "$ROOT_DIR/bin/k-sync-catalog.js"

#  Stop if no changes in key files 
if git diff --quiet -- pnpm-workspace.yaml package.json; then
    echo "-> No changes in $MONOREPO, skipping"
    exit 0
fi

# Create or reuse branch 
BRANCH="sync/catalog-$TAG"

if git ls-remote --heads origin "refs/heads/$BRANCH" | grep -q "refs/heads/$BRANCH$"; then
    echo "-> Branch $BRANCH already exists on remote, fetching and checking out"
    git fetch origin "$BRANCH"
    git checkout "$BRANCH"
else
    echo "-> Creating new branch $BRANCH"
    git checkout -b "$BRANCH"
fi

#  Commit changes 
git add pnpm-workspace.yaml package.json
git commit -m "chore: sync catalog to meta-ekosystem@$TAG"

#  Push branch 
echo "-> Pushing branch $BRANCH"
git push --force-with-lease origin "$BRANCH"

#  Create pull request 
gh_create_pull_request \
    "kalisio/$MONOREPO" \
    "chore: sync catalog to meta-ekosystem@$TAG" \
    "Automated catalog sync from meta-ekosystem@$TAG." \
    "$BRANCH"

echo "-> $MONOREPO synced successfully"