# syntax=docker/dockerfile:1

# ---------- Builder stage ----------
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package.json and lock files
COPY package*.json ./

# Install Node.js dependencies with caching
RUN --mount=type=cache,target=/root/.npm npm ci

# Copy the rest of the source code
COPY . .

# Build the production assets
RUN npm run build

# ---------- Production image ----------
FROM nginx:alpine
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=builder /app/dist /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
