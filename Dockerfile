FROM node:20-alpine

# Install iputils for ping command (required by ping package)
RUN apk add --no-cache iputils

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY . .

# Create data directory for persistent storage
RUN mkdir -p /app/data
VOLUME /app/data

ENV DATA_DIR=/app/data
EXPOSE 3000

CMD ["node", "server.js"]
