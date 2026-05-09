# syntax=docker/dockerfile:1.7
# Build context expected at repo root: `docker build -f services/api/Dockerfile .`
#
# Three-stage build:
#   deps    — installs the entire workspace; identical across every service
#             Dockerfile so the matrix builds share this layer.
#   build   — prisma generate + tsc for this service.
#   runtime — copies the whole built /repo tree to /app and runs the service.
#             Yes, runtime carries the full workspace + devDeps. That's the
#             price we're paying for a reliable build; can prune later.

ARG NODE_VERSION=22.12.0
ARG PNPM_VERSION=10.9.0

# ─── deps ───────────────────────────────────────────────────────────────────
FROM node:${NODE_VERSION}-bookworm-slim AS deps
ARG PNPM_VERSION
WORKDIR /repo

# Prisma's query engine needs OpenSSL; install in both deps and runtime.
RUN apt-get update \
 && apt-get install -y --no-install-recommends openssl ca-certificates \
 && rm -rf /var/lib/apt/lists/*
RUN npm install -g corepack@latest \
 && corepack enable \
 && corepack prepare pnpm@${PNPM_VERSION} --activate

COPY pnpm-workspace.yaml pnpm-lock.yaml package.json tsconfig.base.json .npmrc ./
COPY apps/web/package.json                 apps/web/
COPY services/api/package.json             services/api/
COPY services/audit-retention/package.json services/audit-retention/
COPY services/audit-verifier/package.json  services/audit-verifier/
COPY services/cert-generator/package.json  services/cert-generator/
COPY services/email-worker/package.json    services/email-worker/
COPY services/flc-verifier/package.json    services/flc-verifier/
COPY services/resume-parser/package.json   services/resume-parser/
COPY services/scheduler/package.json       services/scheduler/
COPY services/sms-worker/package.json      services/sms-worker/
COPY packages/api-client/package.json      packages/api-client/
COPY packages/audit/package.json           packages/audit/
COPY packages/db/package.json              packages/db/
COPY packages/email/package.json           packages/email/
COPY packages/flc-verify/package.json      packages/flc-verify/
COPY packages/llm/package.json             packages/llm/
COPY packages/schemas/package.json         packages/schemas/
COPY packages/sms/package.json             packages/sms/
COPY packages/ui/package.json              packages/ui/

RUN --mount=type=secret,id=fontawesome_token,required=true \
    --mount=type=cache,id=pnpm,target=/pnpm/store \
    export FONTAWESOME_TOKEN="$(cat /run/secrets/fontawesome_token)" \
 && pnpm config set store-dir /pnpm/store \
 && pnpm install --frozen-lockfile

# ─── build ──────────────────────────────────────────────────────────────────
FROM node:${NODE_VERSION}-bookworm-slim AS build
ARG PNPM_VERSION
WORKDIR /repo

RUN apt-get update \
 && apt-get install -y --no-install-recommends openssl ca-certificates \
 && rm -rf /var/lib/apt/lists/*
RUN npm install -g corepack@latest \
 && corepack enable \
 && corepack prepare pnpm@${PNPM_VERSION} --activate

# prisma.config.ts requires both vars for codegen; the build never connects.
ENV DATABASE_URL=postgresql://build:build@localhost:5432/build \
    DIRECT_URL=postgresql://build:build@localhost:5432/build

COPY --from=deps /repo /repo
COPY . .

RUN pnpm --filter @agconn/db db:generate \
 && pnpm --filter "./packages/**" build \
 && pnpm --filter @agconn/api build

# ─── runtime ────────────────────────────────────────────────────────────────
FROM node:${NODE_VERSION}-bookworm-slim AS runtime
WORKDIR /app
ENV NODE_ENV=production \
    PORT=3001

RUN apt-get update \
 && apt-get install -y --no-install-recommends openssl ca-certificates \
 && rm -rf /var/lib/apt/lists/*
RUN useradd --system --create-home --shell /usr/sbin/nologin --uid 1001 agconn

COPY --from=build --chown=agconn:agconn /repo /app

USER agconn
EXPOSE 3001
CMD ["node", "services/api/dist/index.js"]
