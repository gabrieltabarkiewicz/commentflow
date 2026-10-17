# syntax=docker/dockerfile:1

FROM node:24-bookworm-slim AS base
WORKDIR /app
# Prisma needs openssl at build and runtime
RUN apt-get update && apt-get install -y --no-install-recommends openssl \
  && rm -rf /var/lib/apt/lists/*

# ---- deps: install node modules (schema is needed for postinstall `prisma generate`)
FROM base AS deps
COPY package.json package-lock.json* ./
COPY prisma ./prisma
RUN npm install

# ---- build: compile Next.js
FROM base AS build
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npx prisma generate && npm run build

# ---- runner: production image
FROM base AS runner
ENV NODE_ENV=production
ENV PORT=3000
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/.next ./.next
COPY --from=build /app/public ./public
COPY --from=build /app/prisma ./prisma
COPY --from=build /app/package.json ./package.json
COPY --from=build /app/next.config.mjs ./next.config.mjs
EXPOSE 3000
# Apply migrations, then start the server
CMD ["sh", "-c", "npx prisma migrate deploy && npm run start"]
