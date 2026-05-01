# syntax=docker/dockerfile:1.7
# Build context expected at repo root.

ARG NODE_VERSION=22.12.0
ARG PNPM_VERSION=10.9.0

FROM node:${NODE_VERSION}-bookworm-slim AS deps
ARG PNPM_VERSION
WORKDIR /repo
RUN corepack enable && corepack prepare pnpm@${PNPM_VERSION} --activate

COPY pnpm-workspace.yaml pnpm-lock.yaml package.json tsconfig.base.json ./
COPY services/audit-verifier/package.json services/audit-verifier/
COPY packages/audit/package.json packages/audit/
COPY packages/db/package.json packages/db/

RUN --mount=type=cache,id=pnpm,target=/pnpm/store \
    pnpm config set store-dir /pnpm/store \
 && pnpm install --frozen-lockfile

FROM node:${NODE_VERSION}-bookworm-slim AS build
ARG PNPM_VERSION
WORKDIR /repo
RUN corepack enable && corepack prepare pnpm@${PNPM_VERSION} --activate

COPY --from=deps /repo /repo
COPY . .

RUN pnpm --filter @agconn/db db:generate \
 && pnpm --filter @agconn/audit-verifier build \
 && pnpm deploy --filter=@agconn/audit-verifier --prod /app

FROM node:${NODE_VERSION}-bookworm-slim AS runtime
WORKDIR /app
ENV NODE_ENV=production
RUN useradd --system --create-home --shell /usr/sbin/nologin --uid 1001 agconn

COPY --from=build --chown=agconn:agconn /app /app
COPY --from=build --chown=agconn:agconn /repo/node_modules/.pnpm/@prisma /app/node_modules/.pnpm/@prisma

USER agconn
CMD ["node", "dist/index.js"]
