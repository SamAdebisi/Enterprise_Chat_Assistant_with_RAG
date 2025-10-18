# syntax=docker/dockerfile:1.6
FROM node:20-alpine AS build
WORKDIR /app
COPY apps/web/package.json apps/web/package-lock.json* ./
RUN npm ci
COPY apps/web/tsconfig.json apps/web/vite.config.ts ./ 
COPY apps/web/index.html ./index.html
COPY apps/web/public ./public
COPY apps/web/src ./src
RUN npm run build

FROM nginx:1.27.0-alpine AS runtime
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
