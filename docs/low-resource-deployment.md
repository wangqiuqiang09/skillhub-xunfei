# Low-resource deployment

`compose.low-resource.yml` is a feasibility profile for small evaluation hosts. It runs the
SkillHub server, PostgreSQL, Redis, and the web UI with about 800 MB of container memory limits in
total. The security scanner is disabled and package storage uses a local Docker volume.

This profile is intended for evaluation and light workloads. Production installations should use
`compose.release.yml`, external object storage, backups, and capacity based on measured traffic.

## Build the server image

```bash
docker build \
  -f server/Dockerfile.low-resource \
  -t skillhub-server:low-resource \
  server
```

The runtime image uses a Java 21 Alpine JRE, Serial GC, a bounded heap percentage, and a reduced
thread stack. Build dependencies remain in the discarded build stage.

## Start the stack

Set the public URL to the address that browsers and CLI clients use to reach the SkillHub server.
Do not use an internal Docker service name such as `http://server:8080`.

```bash
export SKILLHUB_PUBLIC_BASE_URL=http://192.0.2.10
export SKILLHUB_DOWNLOAD_ANON_COOKIE_SECRET="$(openssl rand -hex 32)"

docker compose -f compose.low-resource.yml up -d --build
```

The web container uses `SKILLHUB_PUBLIC_BASE_URL` to generate `/registry/skill.md`. It refuses to
start when that value is empty, unresolved, malformed, or has a trailing slash, preventing clients
from receiving an unusable registry address.

## Resource limits

| Service | Memory limit | Notes |
|---|---:|---|
| Server | 512 MB | Serial GC, local storage, scanner disabled |
| PostgreSQL | 192 MB | 32 MB shared buffers, 30 connections |
| Redis | 64 MB | No persistence, 48 MB max data memory |
| Web | 32 MB | Nginx static frontend and API proxy |

Override the image or exposed ports with `SKILLHUB_LOW_RESOURCE_SERVER_IMAGE`,
`SKILLHUB_WEB_IMAGE`, `API_PORT`, and `WEB_PORT`.
