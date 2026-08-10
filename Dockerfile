# ---------- 1. Build stage ----------
FROM node:22-slim AS builder
ENV METEOR_ALLOW_SUPERUSER=true

# Install curl for Meteor installer
RUN apt-get update && \
    apt-get install -y curl ca-certificates && \
    update-ca-certificates && \
    rm -rf /var/lib/apt/lists/*

# Install Meteor (build-time only)
RUN curl https://install.meteor.com/ | sh
ENV PATH="/root/.meteor:${PATH}"

WORKDIR /app
COPY . .

# Install deps and build bundle
RUN meteor npm ci
RUN meteor build --directory /tmp/build --server-only

# Install production-only server dependencies. Override stale versions emitted
# by Meteor's bundle so the runtime image does not ship known vulnerabilities.
WORKDIR /tmp/build/bundle/programs/server
RUN npm install --omit=dev node-gyp@latest underscore@latest && \
    npm audit --omit=dev && \
    uws_binary="uws_$(node -p process.platform)_$(node -p process.arch)_$(node -p process.versions.modules).node" && \
    find npm/node_modules/meteor/ddp-server/node_modules/uWebSockets.js \
      -type f -name 'uws_*.node' ! -name "$uws_binary" -delete

# ---------- 2. Runtime stage ----------
FROM node:22-alpine AS runtime
WORKDIR /app

# Copy built Meteor bundle (pure Node app)
COPY --from=builder --chown=node:node /tmp/build/bundle /app

ENV NODE_ENV=production
ENV NODE_OPTIONS="--max-old-space-size=256"
USER node

EXPOSE 3000

CMD ["node", "main.js"]
