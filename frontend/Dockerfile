# Build stage: Build the static PWA assets using Vite
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package descriptors first to leverage Docker layer caching
COPY package*.json ./
RUN npm ci

# Copy the rest of the application files
COPY . .

# Build the Vite application (outputs to dist/)
RUN npm run build

# Production stage: Serve the built static files with Nginx
FROM nginx:alpine

# Copy the custom nginx configuration for reverse proxying /api requests
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copy the Vite build output (bundled assets & index.html)
COPY --from=builder /app/dist /usr/share/nginx/html

# Copy original service worker and source files so the SW precache list doesn't 404
COPY --from=builder /app/sw.js /usr/share/nginx/html/sw.js
COPY --from=builder /app/css /usr/share/nginx/html/css
COPY --from=builder /app/js /usr/share/nginx/html/js

# Expose port 80 (mapped to 8080 in docker-compose.yml)
EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
