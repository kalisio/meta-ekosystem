#!/usr/bin/env bash
set -euo pipefail

# Syncs the meta-ekosystem workspace to the repo defined by REPOSITORY
# and creates (or updates) a pull request if there are changes.
# Needs GH_TOKEN environment variable for git and gh login.

THIS_FILE=$(readlink -f "${BASH_SOURCE[0]}")
THIS_DIR=$(dirname "$THIS_FILE")
ROOT_DIR=$(dirname "$THIS_DIR")

. "$THIS_DIR/kash/kash.sh"

WORKSPACE_DIR="$(dirname "$ROOT_DIR")"

#  Check required variables
if [[ -z "${REPOSITORY:-}" ]]; then
    echo "-> Error: REPOSITORY is required." >&2
    exit 1
fi
if [[ -z "${GH_TOKEN:-}" ]]; then
    echo "-> Error: GH_TOKEN is required." >&2
    exit 1
fi

# The sync is triggered by a tag on meta-ekosystem
TAG="${GITHUB_REF_NAME:-}"
if [[ -z "$TAG" || "${GITHUB_REF_TYPE:-}" != "tag" ]]; then
    echo "-> Error: the sync must be run from a tag of meta-ekosystem." >&2
    exit 1
fi

# A single branch per repo, rebuilt on every sync, so that pull requests don't pile up
BRANCH="sync/meta-ekosystem"
TARGET_REPO="kalisio/$REPOSITORY"
PR_TITLE="chore: sync workspace with meta-ekosystem@$TAG"

#  Set git identity
git config --global user.name "meta-ekosystem-ci[bot]"
git config --global user.email "meta-ekosystem-ci[bot]@users.noreply.github.com"

#  Install tools
# pnpm switches by itself to the version declared in the packageManager field of each repo
echo "-> Installing pnpm"
ensure_pnpm
ensure_gh

echo "-> Installing meta-ekosystem dependencies"
cd "$ROOT_DIR" && pnpm install && cd ~-

# Clone target repo with token
REMOTE_URL="https://x-access-token:${GH_TOKEN}@github.com/${TARGET_REPO}.git"
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

# Always start the branch from the up-to-date default branch: an existing sync branch
# may be based on an outdated state of the repo. It is force pushed below.
echo "-> Creating branch $BRANCH"
git checkout -B "$BRANCH"

#  Run workspace sync tool
node "$ROOT_DIR/bin/k-sync-workspace.js"

#  Stop if no changes: the repo is already up to date, so any open sync pull request is obsolete
if git diff --quiet -- pnpm-workspace.yaml package.json pnpm-lock.yaml; then
    echo "-> No changes in $REPOSITORY"
    if [[ -n "$(gh pr list --repo "$TARGET_REPO" --head "$BRANCH" --state open --json number --jq '.[].number')" ]]; then
        echo "-> Closing obsolete pull request"
        gh pr close "$BRANCH" --repo "$TARGET_REPO" --delete-branch \
            --comment "Workspace already up to date with meta-ekosystem@$TAG."
    fi
    exit 0
fi

#  Commit changes
git add pnpm-workspace.yaml package.json pnpm-lock.yaml
git commit -m "chore: sync workspace with meta-ekosystem@$TAG"

#  Push branch - use --force (safe because only this workflow writes to this branch)
echo "-> Pushing branch $BRANCH"
git push --force origin "$BRANCH"

#  Create pull request, or update the title of the open one (the force push has updated its content)
PR_BODY="Automated workspace sync from meta-ekosystem@$TAG."
if [[ -n "$(gh pr list --repo "$TARGET_REPO" --head "$BRANCH" --state open --json number --jq '.[].number')" ]]; then
    echo "-> Updating open pull request"
    gh pr edit "$BRANCH" --repo "$TARGET_REPO" --title "$PR_TITLE" --body "$PR_BODY"
else
    gh_create_pull_request "$TARGET_REPO" "$PR_TITLE" "$PR_BODY" "$BRANCH"
fi

#  Merge automatically once the required checks pass.
# Requires "Allow auto-merge" in the repo settings and branch protection with required checks.
if ! gh pr merge "$BRANCH" --repo "$TARGET_REPO" --auto --squash; then
    echo "-> Warning: auto-merge could not be enabled on $REPOSITORY, the pull request must be merged manually" >&2
fi

echo "-> $REPOSITORY synced successfully"