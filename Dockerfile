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
RUN meteor build --directory /app/build --server-only

# Install production-only server dependencies
WORKDIR /app/build/bundle/programs/server
RUN npm install --omit=dev

# ---------- 2. Runtime stage ----------
FROM node:22-alpine AS runtime
WORKDIR /app

# Copy built Meteor bundle (pure Node app)
COPY --from=builder /app/build/bundle /app

ENV NODE_ENV=production
ENV NODE_OPTIONS="--max-old-space-size=512"
EXPOSE 3000

CMD ["node", "main.js"]