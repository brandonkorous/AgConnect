# 10 — Infra & CI/CD: GitHub Actions Pipelines

## Workflow inventory

| workflow              | trigger          | purpose                                                  |
| --------------------- | ---------------- | -------------------------------------------------------- |
| `ci.yml`              | PR open / push   | install, lint, typecheck, test, lighthouse               |
| `preview.yml`         | PR open / sync   | build images, deploy to `pr-<id>` namespace              |
| `preview-cleanup.yml` | PR closed        | delete `pr-<id>` namespace                               |
| `deploy.yml`          | push to `main`   | build → push → deploy to staging → manual approve → prod |
| `nightly-eval.yml`    | cron `0 7 * * *` | resume-parser eval set, alert on regressions             |

## ci.yml (skeleton)

```yaml
name: CI
on: [pull_request, push]

jobs:
  install:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v3 ; with: { version: 9 }
      - uses: actions/setup-node@v4 ; with: { node-version: 22, cache: pnpm }
      - run: pnpm install --frozen-lockfile

  lint:
    needs: install
    runs-on: ubuntu-latest
    steps: [ ..., run: pnpm lint ]

  typecheck:
    needs: install
    runs-on: ubuntu-latest
    steps: [ ..., run: pnpm typecheck ]

  test:
    needs: install
    runs-on: ubuntu-latest
    services:
      postgres:
        image: postgres:16
        env: { POSTGRES_PASSWORD: test, POSTGRES_DB: agconn_test }
        options: >- ...
    steps:
      - ...
      - run: pnpm --filter db prisma migrate deploy
        env: { DATABASE_URL: postgresql://postgres:test@localhost:5432/agconn_test }
      - run: pnpm test

  lighthouse:
    needs: [install]
    runs-on: ubuntu-latest
    steps:
      - ...
      - run: pnpm --filter web build
      - run: pnpm --filter web start &
      - run: npx wait-on http://localhost:3000
      - run: pnpm lighthouse:ci
```

## deploy.yml (production path)

```yaml
name: Deploy
on:
  push:
    branches: [main]

jobs:
  build-and-push:
    runs-on: ubuntu-latest
    permissions: { contents: read, packages: write }
    strategy:
      matrix:
        app: [web, api, admin, workers]
    steps:
      - uses: actions/checkout@v4
      - uses: docker/setup-buildx-action@v3
      - uses: docker/login-action@v3
        with:
          registry: ghcr.io
          username: ${{ github.actor }}
          password: ${{ secrets.GITHUB_TOKEN }}
      - uses: docker/build-push-action@v5
        with:
          context: .
          file: apps/${{ matrix.app }}/Dockerfile
          push: true
          tags: |
            ghcr.io/agconn/${{ matrix.app }}:${{ github.sha }}
            ghcr.io/agconn/${{ matrix.app }}:latest
          cache-from: type=gha
          cache-to: type=gha,mode=max

  deploy-staging:
    needs: build-and-push
    runs-on: ubuntu-latest
    environment: staging
    steps:
      - uses: azure/login@v2 ; with: { creds: ${{ secrets.AZURE_CREDENTIALS }} }
      - uses: azure/aks-set-context@v3 ; with: { cluster-name: agconn-aks, resource-group: agconn-rg }
      - run: |
          helm upgrade --install agconn ./infra/helm/agconn \
            --namespace agconn-staging \
            -f ./infra/helm/agconn/values-staging.yaml \
            --set image.tag=${{ github.sha }} \
            --wait --timeout 5m
      - run: kubectl rollout status -n agconn-staging deployment/web deployment/api deployment/admin deployment/workers --timeout=5m

  deploy-prod:
    needs: deploy-staging
    runs-on: ubuntu-latest
    environment: production       # GitHub environment with manual approval gate
    steps:
      - uses: azure/login@v2 ; with: { creds: ${{ secrets.AZURE_CREDENTIALS }} }
      - uses: azure/aks-set-context@v3 ; with: { cluster-name: agconn-aks, resource-group: agconn-rg }
      - run: |
          helm upgrade --install agconn ./infra/helm/agconn \
            --namespace agconn-prod \
            -f ./infra/helm/agconn/values-prod.yaml \
            --set image.tag=${{ github.sha }} \
            --wait --timeout 10m
      - run: kubectl rollout status -n agconn-prod deployment/web deployment/api deployment/admin deployment/workers --timeout=10m
      - name: Smoke test
        run: |
          curl -f https://agconn.com/api/health
          curl -f https://api.agconn.com/v1/health
```

## preview.yml

```yaml
name: Preview
on: pull_request
jobs:
    build-and-deploy:
        if: github.event.pull_request.draft == false
        runs-on: ubuntu-latest
        steps:
            - ... (same image build as deploy)
            - run: |
                  NS=pr-${{ github.event.pull_request.number }}
                  kubectl create ns $NS --dry-run=client -o yaml | kubectl apply -f -
                  helm upgrade --install agconn-pr ./infra/helm/agconn \
                    --namespace $NS \
                    -f ./infra/helm/agconn/values-preview.yaml \
                    --set image.tag=${{ github.sha }} \
                    --set ingress.host=pr-${{ github.event.pull_request.number }}.preview.agconn.com \
                    --wait --timeout 10m
            - name: Comment URL
              uses: peter-evans/create-or-update-comment@v4
              with:
                  issue-number: ${{ github.event.pull_request.number }}
                  body: 'Preview: https://pr-${{ github.event.pull_request.number }}.preview.agconn.com'
```

## preview-cleanup.yml

On PR close, deletes `pr-<id>` namespace.

## Dockerfile pattern

Multi-stage build for each app. Example for `apps/api`:

```dockerfile
# apps/api/Dockerfile
FROM node:22-alpine AS deps
RUN corepack enable
WORKDIR /app
COPY pnpm-lock.yaml pnpm-workspace.yaml package.json ./
COPY packages packages
COPY apps/api apps/api
RUN pnpm install --frozen-lockfile

FROM deps AS build
RUN pnpm --filter @agconn/db prisma generate
RUN pnpm --filter @agconn/api build

FROM node:22-alpine AS runtime
WORKDIR /app
COPY --from=build /app/apps/api/dist ./dist
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/packages/db/prisma ./packages/db/prisma
EXPOSE 3000
USER node
CMD ["node", "dist/index.js"]
```

The web Dockerfile uses `next start`. Workers similar.

## Secrets in CI

GitHub repository secrets:

- `AZURE_CREDENTIALS` — service principal for AKS access
- `GITHUB_TOKEN` — auto-provided, used for GHCR push
- `LHCI_GITHUB_APP_TOKEN` — Lighthouse CI app token (if using LHCI's GitHub integration)

Production-runtime secrets live ONLY in Azure Key Vault, never in GitHub secrets.

## Branch protection

- `main` — protected; requires PR + review + CI green.
- Direct push blocked.
- Squash-merge preferred for clean history.

## Environments and approval

GitHub Environments configured:

- `staging` — auto-deployed from `main`, no approval.
- `production` — required reviewers list (admin team), required status checks (CI green).
