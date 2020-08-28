FROM node:14-slim as builder
WORKDIR /app
COPY . ./
RUN npm ci --no-optional
RUN npm run build

FROM node:14-slim
COPY package*.json ./
RUN npm ci --only=production --no-optional
COPY --from=builder /app/dist dist
CMD ["node", "dist/server.js"]
