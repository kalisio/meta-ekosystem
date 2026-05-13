#!/usr/bin/env bash
set -euo pipefail
# set -x

# Setup the workspace required to run catalog sync scripts.
# Clones the *-ekosystem repo defined by EKOSYSTEM_REPO.
# In CI mode: triggered once per matrix job.
# In dev mode: pass the repo name via EKOSYSTEM_REPO env var.
#
#

THIS_FILE=$(readlink -f "${BASH_SOURCE[0]}")
THIS_DIR=$(dirname "$THIS_FILE")
ROOT_DIR=$(dirname "$THIS_DIR")
WORKSPACE_DIR="$(dirname "$ROOT_DIR")"

. "$THIS_DIR/kash/kash.sh"

begin_group "Setting up workspace ..."

## Parse options — dev mode only
##
if [[ "${CI:-false}" != "true" ]]; then
    WORKSPACE_BRANCH=
    WORKSPACE_TAG=

    while getopts "b:t:" option; do
        case $option in
            b) WORKSPACE_BRANCH=$OPTARG ;;
            t) WORKSPACE_TAG=$OPTARG ;;
            *) ;;
        esac
    done
    shift $((OPTIND-1))
    WORKSPACE_DIR="${1:-$WORKSPACE_DIR}"
fi

## Validate required variables
##
if [[ -z "${MONOREPO:-}" ]]; then
    echo "-> Error: MONOREPO is required." >&2
    exit 1
fi

if [[ -z "${KALISIO_GITHUB_URL:-}" || ! "$KALISIO_GITHUB_URL" =~ ^https:// ]]; then
    echo "-> Error: KALISIO_GITHUB_URL is invalid or missing." >&2
    exit 1
fi

## Install meta-ekosystem dependencies required by k-sync-catalog
##
ensure_pnpm
cd "$ROOT_DIR" && pnpm install && cd ~-
echo "-> dependencies installed"

## Clone *-ekosystem repo
##
if [[ ! -d "$WORKSPACE_DIR/$MONOREPO" ]]; then
    git_shallow_clone \
        "$KALISIO_GITHUB_URL/kalisio/$MONOREPO.git" \
        "$WORKSPACE_DIR/$MONOREPO" \
        "${WORKSPACE_TAG:-${WORKSPACE_BRANCH:-}}"
else
    echo "-> $MONOREPO already cloned, skipping"
fi

## Export workspace dir for subsequent scripts
##
export MONOREPO_WORKSPACE_DIR="$WORKSPACE_DIR"

if [[ "${CI:-false}" == "true" ]]; then
    echo "MONOREPO_WORKSPACE_DIR=$WORKSPACE_DIR" >> "$GITHUB_ENV"
fi

end_group "Setting up workspace ..."