# --- Builder ---
FROM node:20-slim AS builder

WORKDIR /app

COPY package.json package-lock.json ./
COPY tsconfig.base.json nx.json jest.preset.js ./
COPY apps ./apps
COPY libs ./libs

RUN npm ci

RUN npx nx build web

# --- Runner: Node serves Next.js (SSR) ---
FROM node:20-slim AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000
# API base URL — override at runtime (Railway / Fly / etc.)
ENV NEXT_PUBLIC_API_URL=http://localhost:3333

# Next.js standalone output bundles only what's needed for runtime
COPY --from=builder /app/apps/web/.next/standalone ./
COPY --from=builder /app/apps/web/.next/static ./apps/web/.next/static

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget -qO- "http://127.0.0.1:${PORT}/" >/dev/null || exit 1

CMD ["node", "apps/web/server.js"]
