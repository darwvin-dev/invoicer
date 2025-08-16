# Build stage
FROM node:20-alpine AS build
WORKDIR /app
RUN apk add --no-cache ca-certificates && update-ca-certificates
COPY package*.json ./
RUN npm ci
COPY tsconfig.json ./
COPY src ./src
RUN npm run build

# Run stage (non-root)
FROM node:20-alpine
WORKDIR /app
RUN apk add --no-cache ca-certificates && update-ca-certificates \
  && addgroup -S app && adduser -S app -G app
COPY --from=build /app/package*.json ./
RUN npm ci --omit=dev
COPY --from=build /app/dist ./dist
USER app
ENV NODE_ENV=production
CMD ["node", "dist/index.js"]
