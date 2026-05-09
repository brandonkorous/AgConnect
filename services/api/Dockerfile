# syntax=docker/dockerfile:1.7

# Build context expected at repo root: `docker build -f services/api/Dockerfile .`

ARG NODE_VERSION=22.12.0
ARG PNPM_VERSION=10.9.0

FROM node:${NODE_VERSION}-bookworm-slim AS deps
ARG PNPM_VERSION
WORKDIR /repo
RUN npm install -g corepack@latest && corepack enable && corepack prepare pnpm@${PNPM_VERSION} --activate

COPY pnpm-workspace.yaml pnpm-lock.yaml package.json tsconfig.base.json ./
COPY services/api/package.json services/api/
COPY packages/api-client/package.json packages/api-client/
COPY packages/audit/package.json packages/audit/
COPY packages/db/package.json packages/db/
COPY packages/email/package.json packages/email/
COPY .npmrc ./

RUN --mount=type=secret,id=fontawesome_token,required=true \
    --mount=type=cache,id=pnpm,target=/pnpm/store \
    FONTAWESOME_TOKEN="$(cat /run/secrets/fontawesome_token)" \
    pnpm config set store-dir /pnpm/store \
 && pnpm install --frozen-lockfile

FROM node:${NODE_VERSION}-bookworm-slim AS build
ARG PNPM_VERSION
WORKDIR /repo
RUN npm install -g corepack@latest && corepack enable && corepack prepare pnpm@${PNPM_VERSION} --activate

COPY --from=deps /repo /repo
COPY . .

RUN pnpm --filter @agconn/db db:generate \
 && pnpm --filter @agconn/api build \
 && pnpm deploy --filter=@agconn/api --prod /app

# Runtime carries Prisma's generated client and Node-only deps.
FROM node:${NODE_VERSION}-bookworm-slim AS runtime
WORKDIR /app
ENV NODE_ENV=production \
    PORT=3001

RUN useradd --system --create-home --shell /usr/sbin/nologin --uid 1001 agconn

COPY --from=build --chown=agconn:agconn /app /app
# Prisma generated client lives under packages/db's node_modules; copy it.
COPY --from=build --chown=agconn:agconn /repo/node_modules/.pnpm/@prisma /app/node_modules/.pnpm/@prisma

USER agconn
EXPOSE 3001

CMD ["node", "dist/index.js"]
