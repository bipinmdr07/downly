# [Stage 1: Build]
# Use official Node.js LTS image
FROM node:20-alpine AS builder

# Set working directory
WORKDIR /app

COPY . .

# Install dependencies
RUN npm ci

# Build the application
RUN npm run build


# [Stage 2: Production Final]
# Start fresh for production
FROM node:20-alpine AS runner

# Install dependencies
RUN apk add --no-cache aria2

# Set working directory
WORKDIR /app

# Copy only standalone build
COPY --from=builder /app/build/standalone ./build/standalone
COPY --from=builder /app/build/static ./build/static
COPY --from=builder /app/public ./public

# Copy package.json and package-lock.json (if exists)
COPY --from=builder /app/package.json ./
COPY --from=builder /app/package-lock.json ./

RUN mkdir -p /data/downloads
RUN mkdir -p /data/db

# Expose port (default for Next.js)
EXPOSE 3000

ENV IS_DOCKER="true"
ENV NODE_ENV=production
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"
ENV DOWNLOAD_LOCATION="/data/downloads"
ENV DB_LOCATION="/data/db"

# Start the application
CMD ["npm", "start"]
