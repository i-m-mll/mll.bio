#!/usr/bin/env bash
set -euo pipefail

repo_root="$(git rev-parse --show-toplevel)"
tmp_root="$(mktemp -d)"
trap 'rm -rf "$tmp_root"' EXIT

fixture_repo="$tmp_root/site"
fixture_mono="$tmp_root/main-repo"

mkdir -p "$fixture_repo/content/posts" "$fixture_repo/content/series" "$fixture_mono"
git -C "$fixture_repo" init -q

(
  cd "$fixture_repo"
  ln -s "/Users/mll/Main/20 Writing/10 Posts/example.md" content/posts/example.md
  ln -s "/Users/mll/Main/20 Writing/15 Series/example-series" content/series/example-series
  git add content/posts/example.md content/series/example-series
)

mkdir -p "$fixture_mono/20 Writing/10 Posts" "$fixture_mono/20 Writing/15 Series/example-series"
printf 'example post\n' >"$fixture_mono/20 Writing/10 Posts/example.md"
printf 'series index\n' >"$fixture_mono/20 Writing/15 Series/example-series/index.md"

(
  cd "$fixture_repo"
  MONO_CHECKOUT_DIR="$fixture_mono" \
    EXPECTED_CONTENT_SYMLINK_COUNT=2 \
    "$repo_root/scripts/resolve-ci-content.sh" >"$tmp_root/success.log"
)

grep -q 'Content symlinks: expected=2 resolved=2 missing=0' "$tmp_root/success.log"
grep -q 'example post' "$fixture_repo/content/posts/example.md"
test -f "$fixture_repo/content/series/example-series/index.md"

missing_repo="$tmp_root/missing-site"
mkdir -p "$missing_repo/content/posts"
git -C "$missing_repo" init -q
(
  cd "$missing_repo"
  ln -s "/Users/mll/Main/20 Writing/10 Posts/missing.md" content/posts/missing.md
  git add content/posts/missing.md

  set +e
  MONO_CHECKOUT_DIR="$fixture_mono" \
    EXPECTED_CONTENT_SYMLINK_COUNT=1 \
    "$repo_root/scripts/resolve-ci-content.sh" >"$tmp_root/missing.log" 2>&1
  status="$?"
  set -e

  if [[ "$status" == "0" ]]; then
    echo "expected missing content resolution to fail" >&2
    exit 1
  fi
)

grep -q 'Content symlinks: expected=1 resolved=0 missing=1' "$tmp_root/missing.log"
grep -q 'missing-source' "$tmp_root/missing.log"

empty_repo="$tmp_root/empty-site"
mkdir -p "$empty_repo/content/posts" "$empty_repo/content/series"
git -C "$empty_repo" init -q
(
  cd "$empty_repo"

  set +e
  MONO_CHECKOUT_DIR="$fixture_mono" \
    "$repo_root/scripts/resolve-ci-content.sh" >"$tmp_root/empty.log" 2>&1
  status="$?"
  set -e

  if [[ "$status" == "0" ]]; then
    echo "expected empty content resolution to fail" >&2
    exit 1
  fi
)

grep -q 'Content symlinks: expected=0 resolved=0 missing=0' "$tmp_root/empty.log"
grep -q 'no committed content symlinks found' "$tmp_root/empty.log"

echo "deploy content resolution checks passed"
