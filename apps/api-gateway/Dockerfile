FROM node:20-alpine AS base
WORKDIR /app
RUN corepack enable

FROM base AS deps
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/api-gateway/package.json apps/api-gateway/package.json
COPY packages/shared-types/package.json packages/shared-types/package.json
COPY packages/utils/package.json packages/utils/package.json
RUN pnpm install --frozen-lockfile

FROM deps AS builder
COPY tsconfig.json turbo.json ./
COPY apps/api-gateway apps/api-gateway
COPY packages packages
RUN pnpm --filter @imana-signature/api-gateway build

FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
RUN corepack enable

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nestjs

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY --from=builder /app/apps/api-gateway/package.json apps/api-gateway/package.json
COPY --from=builder /app/apps/api-gateway/dist apps/api-gateway/dist
COPY --from=builder /app/packages packages
RUN pnpm install --prod --frozen-lockfile --filter @imana-signature/api-gateway...

USER nestjs

EXPOSE 3001
CMD ["node", "apps/api-gateway/dist/main.js"]
