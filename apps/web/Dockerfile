# syntax=docker/dockerfile:1.7

# Multi-stage build for the Next.js web app inside a pnpm monorepo.
# Build context expected at the repo root: `docker build -f apps/web/Dockerfile .`

ARG NODE_VERSION=22.12.0
ARG PNPM_VERSION=10.9.0

# ─── deps: install workspace deps once, fully ────────────────────────────────
FROM node:${NODE_VERSION}-bookworm-slim AS deps
ARG PNPM_VERSION
WORKDIR /repo

RUN npm install -g corepack@latest && corepack enable && corepack prepare pnpm@${PNPM_VERSION} --activate

COPY pnpm-workspace.yaml pnpm-lock.yaml package.json tsconfig.base.json ./
COPY apps/web/package.json apps/web/
COPY packages/api-client/package.json packages/api-client/
COPY packages/ui/package.json packages/ui/
COPY packages/audit/package.json packages/audit/
COPY packages/db/package.json packages/db/
COPY packages/email/package.json packages/email/
COPY .npmrc ./

RUN --mount=type=secret,id=fontawesome_token,required=true \
    --mount=type=cache,id=pnpm,target=/pnpm/store \
    FONTAWESOME_TOKEN="$(cat /run/secrets/fontawesome_token)" \
    pnpm config set store-dir /pnpm/store \
 && pnpm install --frozen-lockfile

# ─── build: produce standalone Next bundle ───────────────────────────────────
FROM node:${NODE_VERSION}-bookworm-slim AS build
ARG PNPM_VERSION
WORKDIR /repo

# Next.js inlines NEXT_PUBLIC_* into the client bundle at build time, so these
# have to be present here rather than being injected at K8s runtime. The deploy
# workflow passes them as --build-arg from GitHub Actions secrets.
ARG NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=""
ARG NEXT_PUBLIC_SENTRY_DSN=""
ARG NEXT_PUBLIC_POSTHOG_KEY=""
ARG NEXT_PUBLIC_MAPBOX_TOKEN=""

# prisma.config.ts requires DATABASE_URL + DIRECT_URL for codegen; the build
# never connects, so dummy localhost values are fine.
ENV NEXT_TELEMETRY_DISABLED=1 \
    NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=$NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY \
    NEXT_PUBLIC_SENTRY_DSN=$NEXT_PUBLIC_SENTRY_DSN \
    NEXT_PUBLIC_POSTHOG_KEY=$NEXT_PUBLIC_POSTHOG_KEY \
    NEXT_PUBLIC_MAPBOX_TOKEN=$NEXT_PUBLIC_MAPBOX_TOKEN \
    DATABASE_URL=postgresql://build:build@localhost:5432/build \
    DIRECT_URL=postgresql://build:build@localhost:5432/build

RUN npm install -g corepack@latest && corepack enable && corepack prepare pnpm@${PNPM_VERSION} --activate

COPY --from=deps /repo /repo
COPY . .

RUN pnpm --filter @agconn/db db:generate \
 && pnpm --filter @agconn/web build

# ─── runtime: minimal node + standalone server ───────────────────────────────
FROM node:${NODE_VERSION}-bookworm-slim AS runtime
WORKDIR /app
ENV NODE_ENV=production \
    NEXT_TELEMETRY_DISABLED=1 \
    PORT=3000 \
    HOSTNAME=0.0.0.0

RUN useradd --system --create-home --shell /usr/sbin/nologin --uid 1001 agconn

COPY --from=build --chown=agconn:agconn /repo/apps/web/.next/standalone ./
COPY --from=build --chown=agconn:agconn /repo/apps/web/.next/static ./apps/web/.next/static
COPY --from=build --chown=agconn:agconn /repo/apps/web/public ./apps/web/public

USER agconn
EXPOSE 3000

CMD ["node", "apps/web/server.js"]
