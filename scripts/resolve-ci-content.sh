#!/usr/bin/env bash
set -euo pipefail

mono_checkout_dir="${MONO_CHECKOUT_DIR:-/tmp/main-repo}"
mono_prefix="${MONO_PREFIX:-/Users/mll/Main/}"
content_symlink_dirs="${CONTENT_SYMLINK_DIRS:-content/posts content/series}"
expected_symlink_count="${EXPECTED_CONTENT_SYMLINK_COUNT:-}"
dry_run="${DRY_RUN:-0}"

if [[ ! -d "$mono_checkout_dir" ]]; then
  echo "error: monorepo checkout directory does not exist: $mono_checkout_dir" >&2
  exit 1
fi

tmp_expected="$(mktemp)"
tmp_missing="$(mktemp)"
tmp_resolved="$(mktemp)"
trap 'rm -f "$tmp_expected" "$tmp_missing" "$tmp_resolved"' EXIT

while IFS= read -r content_dir; do
  [[ -n "$content_dir" ]] || continue

  while IFS= read -r -d '' entry; do
    metadata="${entry%%$'\t'*}"
    link_path="${entry#*$'\t'}"
    read -r mode blob_hash _stage <<<"$metadata"

    [[ "$mode" == "120000" ]] || continue

    target="$(git cat-file blob "$blob_hash")"
    printf '%s\t%s\n' "$link_path" "$target" >>"$tmp_expected"

    if [[ "$target" != "$mono_prefix"* ]]; then
      printf 'unresolved-prefix\t%s\t%s\n' "$link_path" "$target" >>"$tmp_missing"
      continue
    fi

    rel="${target#"$mono_prefix"}"
    src="$mono_checkout_dir/$rel"

    if [[ -e "$src" || -d "$src" ]]; then
      printf '%s\t%s\t%s\n' "$link_path" "$rel" "$src" >>"$tmp_resolved"
    else
      printf 'missing-source\t%s\t%s\n' "$link_path" "$rel" >>"$tmp_missing"
    fi
  done < <(git ls-files -s -z -- "$content_dir")
done <<<"$(tr ' ' '\n' <<<"$content_symlink_dirs")"

expected_count="$(wc -l <"$tmp_expected" | tr -d ' ')"
resolved_count="$(wc -l <"$tmp_resolved" | tr -d ' ')"
missing_count="$(wc -l <"$tmp_missing" | tr -d ' ')"

echo "Content symlinks: expected=$expected_count resolved=$resolved_count missing=$missing_count"

if [[ -n "$expected_symlink_count" && "$expected_count" != "$expected_symlink_count" ]]; then
  echo "error: expected $expected_symlink_count committed content symlinks, found $expected_count" >&2
  echo "Indexed content symlinks:" >&2
  cut -f1-2 "$tmp_expected" >&2 || true
  exit 1
fi

if [[ "$expected_count" == "0" ]]; then
  echo "error: no committed content symlinks found; refusing an empty content deploy path" >&2
  exit 1
fi

if [[ "$missing_count" != "0" ]]; then
  echo "error: unresolved content symlink targets:" >&2
  cat "$tmp_missing" >&2
  exit 1
fi

if [[ "$dry_run" == "1" ]]; then
  exit 0
fi

while IFS=$'\t' read -r link_path rel src; do
  rm -rf -- "$link_path"
  cp -R "$src" "$link_path"
  echo "Copied: $rel -> $link_path"
done <"$tmp_resolved"
