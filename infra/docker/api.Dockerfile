# syntax=docker/dockerfile:1.6
FROM node:20-alpine AS deps
WORKDIR /app
COPY apps/api/package.json apps/api/package-lock.json* ./
RUN npm ci

FROM deps AS build
COPY apps/api/tsconfig.json ./
COPY apps/api/src ./src
RUN npm run build

FROM node:20-alpine AS runtime
WORKDIR /app
ENV NODE_ENV=production
COPY --from=deps /app/node_modules ./node_modules
COPY --from=build /app/dist ./dist
COPY apps/api/package.json .
EXPOSE 8080
CMD ["node", "dist/index.js"]
