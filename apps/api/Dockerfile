# --- Builder ---
FROM node:20-slim AS builder

WORKDIR /app

# OpenSSL is required by Prisma on slim images
RUN apt-get update -y && apt-get install -y openssl && rm -rf /var/lib/apt/lists/*

COPY package.json package-lock.json ./
COPY tsconfig.base.json nx.json jest.preset.js ./
COPY apps ./apps
COPY libs ./libs

RUN npm ci

RUN npx prisma generate --schema=libs/data-access/prisma/schema.prisma
RUN npx nx build api --configuration=production

# --- Runner ---
FROM node:20-slim AS runner

WORKDIR /app
ENV NODE_ENV=production

RUN apt-get update -y && apt-get install -y openssl curl && rm -rf /var/lib/apt/lists/*

COPY --from=builder /app/apps/api/dist ./apps/api/dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./
COPY --from=builder /app/libs/data-access/prisma ./libs/data-access/prisma

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=10s --start-period=20s --retries=3 \
  CMD curl -fs "http://localhost:${PORT:-3333}/api/health" || exit 1

CMD ["sh", "-c", "npx prisma migrate deploy --schema=libs/data-access/prisma/schema.prisma && node apps/api/dist/main.js"]
