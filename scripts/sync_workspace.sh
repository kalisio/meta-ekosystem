#!/usr/bin/env bash
set -euo pipefail

# Syncs the meta-ekosystem workspace to the repo defined by REPOSITORY
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

if [[ -z "${REPOSITORY:-}" ]]; then
    echo "-> Error: REPOSITORY is required." >&2
    exit 1
fi

if [[ -z "${GH_TOKEN:-}" ]]; then
    echo "-> Error: GH_TOKEN is required." >&2
    exit 1
fi

#  Set git identity 
git config --global user.name "meta-ekosystem-ci[bot]"
git config --global user.email "meta-ekosystem-ci[bot]@users.noreply.github.com"

#  Install tools 
echo "-> Installing pnpm"
ensure_pnpm

echo "-> Installing meta-ekosystem dependencies"
cd "$ROOT_DIR" && pnpm install && cd ~-

# Clone target repo with token 
REMOTE_URL="https://x-access-token:${GH_TOKEN}@github.com/kalisio/${REPOSITORY}.git"
REPO_DIR="$WORKSPACE_DIR/$REPOSITORY"

if [[ ! -d "$REPO_DIR" ]]; then
    echo "-> Cloning $REPOSITORY"
    git_shallow_clone "$REMOTE_URL" "$REPO_DIR"
else
    echo "-> $REPOSITORY already cloned, skipping"
fi

#  Go into repo and set remote URL 
cd "$REPO_DIR"
git remote set-url origin "$REMOTE_URL"

# Create or switch to target branch BEFORE running sync
BRANCH="sync/workspace-$TAG"

if git ls-remote --heads origin "refs/heads/$BRANCH" | grep -q "refs/heads/$BRANCH$"; then
    echo "-> Branch $BRANCH already exists on remote, fetching and resetting"
    git fetch origin refs/heads/"$BRANCH":refs/remotes/origin/"$BRANCH" --depth=1
    git checkout -B "$BRANCH" "origin/$BRANCH"
else
    echo "-> Creating new branch $BRANCH"
    git checkout -b "$BRANCH"
fi

#  Run workspace sync tool (now on the correct branch)
node "$ROOT_DIR/bin/k-sync-workspace.js"

#  Stop if no changes in key files 
if git diff --quiet -- pnpm-workspace.yaml package.json; then
    echo "-> No changes in $REPOSITORY, skipping"
    exit 0
fi

#  Commit changes 
git add pnpm-workspace.yaml package.json
git commit -m "chore: sync workspace to meta-ekosystem@$TAG"

#  Push branch - use --force (safe because only this workflow writes to this branch)
echo "-> Pushing branch $BRANCH"
git push --force origin "$BRANCH"

#  Create pull request 
gh_create_pull_request \
    "kalisio/$REPOSITORY" \
    "chore: sync workspace to meta-ekosystem@$TAG" \
    "Automated workspace sync from meta-ekosystem@$TAG." \
    "$BRANCH"

echo "-> $REPOSITORY synced successfully"