#!/usr/bin/env bash
# One-time copy of every Supabase Storage object into the matching Azure Blob container (AG-11).
# When: run by .github/workflows/move-to-azure.yml after the database move. Keys are kept as they are.
# Touches: reads Supabase (SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY), writes Azure (AZURE_STORAGE_ACCOUNT, AZURE_STORAGE_KEY).
# Safe to run again: uploads overwrite, and it fails if any bucket's object count or bytes differ afterwards.
set -euo pipefail

# certs too: the code has always had that bucket, even if Supabase never created it.
BUCKETS=(job-photos compliance-evidence grant-reports certs)
WORK=$(mktemp -d)
trap 'rm -rf "$WORK"' EXIT

# Lists a bucket recursively as "<key>\t<size>\t<mimetype>" lines; folders come back with a null id.
list_supabase() {
  local bucket=$1 prefix=$2 offset=0 page
  while :; do
    page=$(curl -fsS -X POST "$SUPABASE_URL/storage/v1/object/list/$bucket" \
      -H "Authorization: Bearer $SUPABASE_SERVICE_ROLE_KEY" -H 'Content-Type: application/json' \
      -d "{\"prefix\":\"$prefix\",\"limit\":1000,\"offset\":$offset,\"sortBy\":{\"column\":\"name\",\"order\":\"asc\"}}")
    jq -r --arg p "$prefix" '.[] | select(.id != null) | [($p + .name), (.metadata.size|tostring), .metadata.mimetype] | @tsv' <<<"$page"
    for folder in $(jq -r '.[] | select(.id == null) | .name' <<<"$page"); do
      list_supabase "$bucket" "$prefix$folder/"
    done
    [ "$(jq length <<<"$page")" -lt 1000 ] && break
    offset=$((offset + 1000))
  done
}

azure() {
  az storage blob "$@" --account-name "$AZURE_STORAGE_ACCOUNT" --account-key "$AZURE_STORAGE_KEY" --only-show-errors
}

copy_bucket() {
  local bucket=$1 key size mime
  list_supabase "$bucket" '' | sort > "$WORK/$bucket.src"
  while IFS=$'\t' read -r key size mime; do
    curl -fsS "$SUPABASE_URL/storage/v1/object/$bucket/$key" \
      -H "Authorization: Bearer $SUPABASE_SERVICE_ROLE_KEY" -o "$WORK/blob"
    azure upload --container-name "$bucket" --name "$key" --file "$WORK/blob" --content-type "$mime" --overwrite >/dev/null
  done < "$WORK/$bucket.src"
  cut -f1,2 "$WORK/$bucket.src" > "$WORK/$bucket.want"
  azure list --container-name "$bucket" --num-results '*' \
    --query '[].[name, to_string(properties.contentLength)]' -o tsv | sort > "$WORK/$bucket.got"
  if ! diff "$WORK/$bucket.want" "$WORK/$bucket.got"; then
    echo "::error::$bucket: Azure does not match Supabase (key and size per line above)"
    return 1
  fi
  echo "$bucket: $(wc -l < "$WORK/$bucket.want") objects, $(awk -F'\t' '{s+=$2} END {print s+0}' "$WORK/$bucket.want") bytes match"
}

# 200 is a bucket, 400/404 is none; anything else (a network or auth failure) stops the move.
bucket_exists() {
  local code
  code=$(curl -sS -o /dev/null -w '%{http_code}' "$SUPABASE_URL/storage/v1/bucket/$1" \
    -H "Authorization: Bearer $SUPABASE_SERVICE_ROLE_KEY")
  case "$code" in
    200) return 0 ;;
    400|404) return 1 ;;
    *) echo "::error::Supabase answered $code for bucket $1" >&2; exit 1 ;;
  esac
}

for bucket in "${BUCKETS[@]}"; do
  if bucket_exists "$bucket"; then copy_bucket "$bucket"; else echo "$bucket: no such Supabase bucket, nothing to copy"; fi
done
