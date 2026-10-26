#!/bin/sh
# One-time copy of AgConnect's public schema from Supabase to psql-agconn-prod-cus (AG-11), run by move-to-azure.yml.
# Reads SUPABASE_DB_URL (session port 5432) and DATABASE_ADMIN_URL (agconn_owner). pgboss is not moved: pg-boss recreates it.
# Refuses a target that already has tables; the restore is one transaction, so a failed run leaves the target empty.
set -eu
WORK=/work

# libpq rejects Prisma-only URL parameters (schema=, pgbouncer=, ...): keep the base URL and sslmode only.
libpq_url() {
  mode=$(printf '%s' "$1" | sed -n 's/.*[?&]sslmode=\([^&]*\).*/\1/p')
  printf '%s?sslmode=%s' "${1%%\?*}" "${mode:-require}"
}
SOURCE=$(libpq_url "$SUPABASE_DB_URL")
TARGET=$(libpq_url "$DATABASE_ADMIN_URL")
# On the target, admin plus a placeholder tenant: counts see every row whether or not the owner bypasses RLS.
TARGET_OPTIONS='-c app.role=admin -c app.tenant_id=00000000-0000-0000-0000-000000000000'

# One "table=rows" line per table in public (partitions are counted through their parent).
counts() {
  PGOPTIONS="$2" psql "$1" -v ON_ERROR_STOP=1 -At -c "
    SELECT c.relname || '=' || (xpath('/row/n/text()',
             query_to_xml(format('SELECT count(*) AS n FROM public.%I', c.relname), false, true, '')))[1]::text
    FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE n.nspname = 'public' AND c.relkind IN ('r', 'p') AND NOT c.relispartition
    ORDER BY c.relname"
}

echo "pg_dump $(pg_dump --version | awk '{print $3}')"
echo "source server $(psql "$SOURCE" -At -c 'SHOW server_version')"
echo "target server $(psql "$TARGET" -At -c 'SHOW server_version')"

existing=$(psql "$TARGET" -At -c "SELECT count(*) FROM pg_tables WHERE schemaname = 'public'")
if [ "$existing" != "0" ]; then
  echo "target already has $existing tables in public; refusing to restore over them" >&2
  exit 1
fi

pg_dump "$SOURCE" --schema=public --no-owner --no-acl --format=custom --file="$WORK/agconn.dump"
# The target already has the public schema; everything else restores as agconn_owner.
pg_restore -l "$WORK/agconn.dump" | grep -v -E 'SCHEMA - public|COMMENT - SCHEMA public' > "$WORK/toc"
PGOPTIONS="$TARGET_OPTIONS" pg_restore --dbname="$TARGET" --no-owner --no-acl --exit-on-error --single-transaction \
  -L "$WORK/toc" "$WORK/agconn.dump"

counts "$SOURCE" '' > "$WORK/source.txt"
counts "$TARGET" "$TARGET_OPTIONS" > "$WORK/target.txt"
echo "--- row counts (source)"
cat "$WORK/source.txt"
if ! diff "$WORK/source.txt" "$WORK/target.txt"; then
  echo "row counts differ between Supabase and Azure" >&2
  exit 1
fi
echo "all $(wc -l < "$WORK/source.txt") tables match"
