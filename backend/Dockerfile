FROM node:20-alpine

WORKDIR /app

# Install only production deps first for better cache utilization
COPY package*.json ./
RUN npm ci --omit=dev

COPY src ./src

ENV NODE_ENV=production
EXPOSE 5000

CMD ["node", "src/server.js"]
