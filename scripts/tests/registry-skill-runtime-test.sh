#!/bin/sh
set -eu

ROOT_DIR=$(CDPATH= cd -- "$(dirname -- "$0")/../.." && pwd)
ENTRYPOINT="$ROOT_DIR/web/docker-entrypoint.d/30-runtime-config.sh"
STAGING_COMPOSE="$ROOT_DIR/docker-compose.staging.yml"
MAKEFILE="$ROOT_DIR/Makefile"
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
grep -Fq "search skillhub-hello --registry $server_url" "$tmp/html/registry/skill.md"
grep -Fq "install skillhub-hello --scope user --agent codex --registry $server_url" "$tmp/html/registry/skill.md"
grep -Fq 'export SKILL_DIR=./my-skill' "$tmp/html/registry/skill.md"
grep -Fq 'printf '\''directory=%s\nnamespace=%s\nvisibility=%s\n'\''' "$tmp/html/registry/skill.md"
grep -Fq '一次性 Token' "$tmp/html/registry/skill.md"
grep -Fq '能力披露' "$tmp/html/registry/skill.md"
grep -Fq '固定使用 `global` 命名空间和 `public` 可见性' "$tmp/html/registry/skill.md"
grep -Fq '无需中途重复确认' "$tmp/html/registry/skill.md"
if grep -Fq 'hello-world' "$tmp/html/registry/skill.md"; then
  echo 'registry/skill.md must use the shipped skillhub-hello starter skill' >&2
  exit 1
fi
if grep -Fq '${SKILLHUB_PUBLIC_BASE_URL}' "$tmp/html/registry/skill.md"; then
  echo 'registry/skill.md must not contain an unresolved server URL' >&2
  exit 1
fi

grep -Fq 'image: skillhub-web:staging' "$STAGING_COMPOSE" \
  || { echo 'staging must run the SkillHub web image so runtime instructions are generated' >&2; exit 1; }
grep -Fq 'SKILLHUB_PUBLIC_BASE_URL: "http://localhost"' "$STAGING_COMPOSE" \
  || { echo 'staging must provide a concrete public URL to the web entrypoint' >&2; exit 1; }
grep -Fq 'docker build -t $(STAGING_WEB_IMAGE) -f web/Dockerfile web' "$MAKEFILE" \
  || { echo 'staging must build the SkillHub web image' >&2; exit 1; }
grep -Fq '$(STAGING_WEB_URL)/registry/skill.md' "$MAKEFILE" \
  || { echo 'staging must verify generated registry instructions' >&2; exit 1; }

printf '%s\n' 'registry-skill-runtime-test passed'
