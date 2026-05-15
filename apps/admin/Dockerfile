# syntax=docker/dockerfile:1.7

# Multi-stage build for the Next.js admin app inside a pnpm monorepo.
# Build context expected at the repo root: `docker build -f apps/admin/Dockerfile .`

ARG NODE_VERSION=22.12.0
ARG PNPM_VERSION=10.9.0

# ─── deps ────────────────────────────────────────────────────────────────────
FROM node:${NODE_VERSION}-bookworm-slim AS deps
ARG PNPM_VERSION
WORKDIR /repo

RUN npm install -g corepack@latest && corepack enable && corepack prepare pnpm@${PNPM_VERSION} --activate

COPY pnpm-workspace.yaml pnpm-lock.yaml package.json tsconfig.base.json ./
COPY apps/admin/package.json apps/admin/
COPY apps/web/package.json apps/web/
COPY packages/api-client/package.json packages/api-client/
COPY packages/audit/package.json packages/audit/
COPY packages/auth/package.json packages/auth/
COPY packages/db/package.json packages/db/
COPY packages/email/package.json packages/email/
COPY packages/flc-verify/package.json packages/flc-verify/
COPY packages/llm/package.json packages/llm/
COPY packages/reporting/package.json packages/reporting/
COPY packages/schemas/package.json packages/schemas/
COPY packages/sms/package.json packages/sms/
COPY packages/ui/package.json packages/ui/
COPY .npmrc ./

RUN --mount=type=secret,id=fontawesome_token,required=true \
    --mount=type=cache,id=pnpm,target=/pnpm/store \
    export FONTAWESOME_TOKEN="$(cat /run/secrets/fontawesome_token)" \
 && pnpm config set store-dir /pnpm/store \
 && pnpm install --frozen-lockfile

# ─── build ───────────────────────────────────────────────────────────────────
FROM node:${NODE_VERSION}-bookworm-slim AS build
ARG PNPM_VERSION
WORKDIR /repo

ARG NEXT_PUBLIC_ADMIN_CLERK_PUBLISHABLE_KEY=""
ARG NEXT_PUBLIC_ADMIN_URL=""
ARG NEXT_PUBLIC_SENTRY_DSN_ADMIN=""
ARG SENTRY_RELEASE=""

ENV NEXT_TELEMETRY_DISABLED=1 \
    NEXT_PUBLIC_ADMIN_CLERK_PUBLISHABLE_KEY=$NEXT_PUBLIC_ADMIN_CLERK_PUBLISHABLE_KEY \
    NEXT_PUBLIC_ADMIN_URL=$NEXT_PUBLIC_ADMIN_URL \
    NEXT_PUBLIC_SENTRY_DSN=$NEXT_PUBLIC_SENTRY_DSN_ADMIN \
    NEXT_PUBLIC_SENTRY_RELEASE=$SENTRY_RELEASE \
    SENTRY_RELEASE=$SENTRY_RELEASE \
    DATABASE_URL=postgresql://build:build@localhost:5432/build \
    DIRECT_URL=postgresql://build:build@localhost:5432/build

RUN npm install -g corepack@latest && corepack enable && corepack prepare pnpm@${PNPM_VERSION} --activate

COPY --from=deps /repo /repo
COPY . .

RUN pnpm --filter @agconn/db db:generate \
 && pnpm --filter "@agconn/admin^..." build \
 && pnpm --filter @agconn/admin build

# ─── runtime ─────────────────────────────────────────────────────────────────
FROM node:${NODE_VERSION}-bookworm-slim AS runtime
WORKDIR /app
ARG SENTRY_RELEASE=""
ENV NODE_ENV=production \
    NEXT_TELEMETRY_DISABLED=1 \
    PORT=3100 \
    HOSTNAME=0.0.0.0 \
    SENTRY_RELEASE=$SENTRY_RELEASE

RUN useradd --system --create-home --shell /usr/sbin/nologin --uid 1001 agconn

COPY --from=build --chown=agconn:agconn /repo/apps/admin/.next/standalone ./
COPY --from=build --chown=agconn:agconn /repo/apps/admin/.next/static ./apps/admin/.next/static
COPY --from=build --chown=agconn:agconn /repo/apps/admin/public ./apps/admin/public

USER agconn
EXPOSE 3100

CMD ["node", "apps/admin/server.js"]
