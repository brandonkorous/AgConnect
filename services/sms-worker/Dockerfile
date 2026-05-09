# syntax=docker/dockerfile:1.7
# Build context expected at repo root.

ARG NODE_VERSION=22.12.0
ARG PNPM_VERSION=10.9.0

FROM node:${NODE_VERSION}-bookworm-slim AS deps
ARG PNPM_VERSION
WORKDIR /repo
RUN npm install -g corepack@latest && corepack enable && corepack prepare pnpm@${PNPM_VERSION} --activate

COPY pnpm-workspace.yaml pnpm-lock.yaml package.json tsconfig.base.json ./
COPY services/sms-worker/package.json services/sms-worker/
COPY packages/db/package.json packages/db/
COPY packages/audit/package.json packages/audit/
COPY packages/sms/package.json packages/sms/
COPY .npmrc ./

RUN --mount=type=secret,id=fontawesome_token,required=true \
    --mount=type=cache,id=pnpm,target=/pnpm/store \
    FONTAWESOME_TOKEN="$(cat /run/secrets/fontawesome_token)" \
    pnpm config set store-dir /pnpm/store \
 && pnpm install --frozen-lockfile

FROM node:${NODE_VERSION}-bookworm-slim AS build
ARG PNPM_VERSION
WORKDIR /repo

# prisma.config.ts requires both vars for codegen; the build never connects.
ENV DATABASE_URL=postgresql://build:build@localhost:5432/build \
    DIRECT_URL=postgresql://build:build@localhost:5432/build

RUN npm install -g corepack@latest && corepack enable && corepack prepare pnpm@${PNPM_VERSION} --activate

COPY --from=deps /repo /repo
COPY . .

RUN pnpm --filter @agconn/db db:generate \
 && pnpm --filter @agconn/sms-worker build \
 && pnpm deploy --filter=@agconn/sms-worker --prod /app

FROM node:${NODE_VERSION}-bookworm-slim AS runtime
WORKDIR /app
ENV NODE_ENV=production
RUN useradd --system --create-home --shell /usr/sbin/nologin --uid 1001 agconn

COPY --from=build --chown=agconn:agconn /app /app
COPY --from=build --chown=agconn:agconn /repo/node_modules/.pnpm/@prisma /app/node_modules/.pnpm/@prisma

USER agconn
CMD ["node", "dist/index.js"]
