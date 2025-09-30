# Multi-stage build for production
FROM node:24.5.0-alpine AS builder

# Set working directory
WORKDIR /app

# Install dependencies for native modules and SSL
RUN apk add --no-cache python3 make g++ openssl ca-certificates curl

# Copy package files
COPY package*.json ./
COPY prisma ./prisma/

# Install all dependencies (including dev dependencies for build)
RUN npm ci --silent

# Copy source code
COPY . .

# Generate Prisma client
RUN NODE_TLS_REJECT_UNAUTHORIZED=0 npx prisma generate

# Build the TypeScript application
RUN npm run build

# Production stage
FROM node:24.5.0-alpine AS production

# Set working directory
WORKDIR /app

# Install runtime dependencies
RUN apk add --no-cache openssl ca-certificates curl

# Copy package files
COPY package*.json ./

# Install only production dependencies
RUN npm ci --only=production --silent && npm cache clean --force

# Copy built application from builder stage
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma

# Create non-root user
RUN addgroup -g 1001 -S nodejs
RUN adduser -S nodejs -u 1001

# Create logs directory
RUN mkdir -p logs && chown -R nodejs:nodejs logs

# Change ownership of the app directory
RUN chown -R nodejs:nodejs /app

# Switch to non-root user
USER nodejs

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:3000/health || exit 1

# Start the application
CMD ["node", "dist/index.js"]
