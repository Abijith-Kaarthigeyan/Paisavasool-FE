# syntax=docker/dockerfile:1

# ---------- Builder stage ----------
FROM node:20-alpine AS builder

WORKDIR /app

ARG VITE_API_BASE_URL=
ARG VITE_AR_API_BASE_URL=/ar/api/v1
ARG VITE_DISPUTE_API_BASE_URL=/dispute/api/v1

ENV VITE_API_BASE_URL=$VITE_API_BASE_URL
ENV VITE_AR_API_BASE_URL=$VITE_AR_API_BASE_URL
ENV VITE_DISPUTE_API_BASE_URL=$VITE_DISPUTE_API_BASE_URL

COPY package*.json ./
RUN --mount=type=cache,target=/root/.npm npm ci

COPY . .
RUN npm run build

# ---------- Production image ----------
FROM nginx:alpine

RUN apk add --no-cache gettext

COPY nginx.conf.template /etc/nginx/templates/default.conf.template
COPY docker-entrypoint.sh /docker-entrypoint.sh
RUN sed -i 's/\r$//' /docker-entrypoint.sh && chmod +x /docker-entrypoint.sh

COPY --from=builder /app/dist /usr/share/nginx/html

EXPOSE 80
ENTRYPOINT ["/docker-entrypoint.sh"]
