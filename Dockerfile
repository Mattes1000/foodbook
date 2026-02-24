# Stage 1: Build React frontend
FROM oven/bun:1 AS frontend-builder
WORKDIR /app/client
COPY client/package.json client/bun.lock* ./
RUN bun install --frozen-lockfile
COPY client/ ./
RUN bun run build

# Stage 2: Production server
FROM oven/bun:1 AS server
WORKDIR /app/server
COPY server/package.json server/bun.lock* ./
RUN bun install --frozen-lockfile
COPY server/ ./

# Copy React build into expected location
COPY --from=frontend-builder /app/client/dist ../client/dist

# Data directory for SQLite
RUN mkdir -p /data

EXPOSE 3001

CMD ["sh", "-c", "bun run src/seed.ts && bun src/index.ts"]
