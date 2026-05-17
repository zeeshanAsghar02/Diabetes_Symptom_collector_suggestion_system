FROM node:20-slim AS base

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=5000

FROM base AS deps

COPY package.json package-lock.json ./
RUN npm ci --omit=dev

FROM base AS runtime

USER root

RUN apt-get update \
	&& apt-get install -y --no-install-recommends python3 python3-pip \
	&& rm -rf /var/lib/apt/lists/*

COPY --from=deps /app/node_modules ./node_modules
COPY . .

RUN python3 -m pip install --no-cache-dir --break-system-packages -r services/ml/requirements.txt

ENV PYTHON_BIN=python3

RUN chown -R node:node /app

USER node

EXPOSE 5000

CMD ["node", "server.js"]
