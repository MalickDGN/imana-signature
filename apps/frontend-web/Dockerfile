FROM node:20-alpine AS base
WORKDIR /app
RUN corepack enable

FROM base AS deps
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/frontend-web/package.json apps/frontend-web/package.json
COPY packages/shared-types/package.json packages/shared-types/package.json
COPY packages/utils/package.json packages/utils/package.json
RUN pnpm install --frozen-lockfile

FROM deps AS builder
ENV NEXT_OUTPUT=standalone
COPY tsconfig.json turbo.json tailwind.config.ts ./
COPY apps/frontend-web apps/frontend-web
COPY packages packages
COPY index.html la-maison.html magazine.html catalogue.html ./
COPY assets assets
RUN pnpm --filter @imana-signature/frontend-web build

FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder --chown=nextjs:nodejs /app/apps/frontend-web/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/apps/frontend-web/.next/static ./apps/frontend-web/.next/static
COPY --from=builder --chown=nextjs:nodejs /app/apps/frontend-web/public ./apps/frontend-web/public

USER nextjs

EXPOSE 3000
CMD ["node", "apps/frontend-web/server.js"]
