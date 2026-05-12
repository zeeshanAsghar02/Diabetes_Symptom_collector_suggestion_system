FROM node:20-slim AS base

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=5000

FROM base AS deps

COPY package.json package-lock.json ./
RUN npm ci --omit=dev

FROM base AS runtime

COPY --from=deps /app/node_modules ./node_modules
COPY . .

RUN chown -R node:node /app

USER node

EXPOSE 5000

CMD ["node", "server.js"]
