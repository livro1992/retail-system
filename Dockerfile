# syntax=docker/dockerfile:1
# Build un'app Nx dalla root: --build-arg NX_APP=api-gateway|auth-service|order-service|inventory-service
ARG NODE_VERSION=20-bookworm-slim

FROM node:${NODE_VERSION} AS builder
WORKDIR /workspace

COPY package.json package-lock.json ./
RUN npm ci

COPY . .

ARG NX_APP
RUN test -n "$NX_APP" || (echo "ARG NX_APP is required (e.g. api-gateway)" && exit 1)

ENV NODE_ENV=production
RUN npx nx run "${NX_APP}:build:production" --skip-nx-cache \
  && npx nx run "${NX_APP}:prune" --skip-nx-cache

FROM node:${NODE_VERSION} AS runner
WORKDIR /app

ARG NX_APP

ENV NODE_ENV=production

# Copia tutto l'output della prune (main.js, workspace_modules, ecc.) prima di npm ci:
# il package.json pruned referenzia i workspace con file:./workspace_modules/...
COPY --from=builder /workspace/dist/apps/${NX_APP}/ ./

RUN npm ci --omit=dev && npm cache clean --force

CMD ["node", "main.js"]
