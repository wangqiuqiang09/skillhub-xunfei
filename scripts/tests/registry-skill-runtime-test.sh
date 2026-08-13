#!/bin/sh
set -eu

ROOT_DIR=$(CDPATH= cd -- "$(dirname -- "$0")/../.." && pwd)
ENTRYPOINT="$ROOT_DIR/web/docker-entrypoint.d/30-runtime-config.sh"
tmp=$(mktemp -d)
trap 'rm -rf "$tmp"' EXIT

mkdir -p "$tmp/html/registry"
cp "$ROOT_DIR/web/runtime-config.js.template" "$tmp/html/runtime-config.js.template"
cp "$ROOT_DIR/web/src/docs/skill.md.template" "$tmp/html/registry/skill.md.template"

run_entrypoint() {
  public_url="$1"
  sed \
    -e "s#/usr/share/nginx/html#$tmp/html#g" \
    "$ENTRYPOINT" >"$tmp/entrypoint.sh"
  chmod +x "$tmp/entrypoint.sh"
  SKILLHUB_PUBLIC_BASE_URL="$public_url" "$tmp/entrypoint.sh"
}

if run_entrypoint '' >"$tmp/empty.out" 2>"$tmp/empty.err"; then
  echo 'empty public server URL must be rejected' >&2
  exit 1
fi

if run_entrypoint '${SKILLHUB_PUBLIC_BASE_URL}' >"$tmp/placeholder.out" 2>"$tmp/placeholder.err"; then
  echo 'unresolved public server URL must be rejected' >&2
  exit 1
fi

server_url='http://172.16.80.130:8090'
run_entrypoint "$server_url"

grep -Fq "export CLAWHUB_REGISTRY=$server_url" "$tmp/html/registry/skill.md"
grep -Fq -- "--registry $server_url" "$tmp/html/registry/skill.md"
if grep -Fq '${SKILLHUB_PUBLIC_BASE_URL}' "$tmp/html/registry/skill.md"; then
  echo 'registry/skill.md must not contain an unresolved server URL' >&2
  exit 1
fi

printf '%s\n' 'registry-skill-runtime-test passed'
