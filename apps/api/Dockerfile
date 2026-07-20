# Build context is the REPO ROOT (npm workspaces need the root lockfile):
#   docker build -f apps/api/Dockerfile -t infrager-api .
FROM node:22-alpine AS build
WORKDIR /app
COPY package.json package-lock.json ./
COPY apps/api/package.json apps/api/package.json
RUN npm ci --include-workspace-root --workspace apps/api
COPY apps/api ./apps/api
RUN npm run build --workspace apps/api

FROM node:22-alpine
WORKDIR /app
ENV NODE_ENV=production
COPY package.json package-lock.json ./
COPY apps/api/package.json apps/api/package.json
RUN npm ci --omit=dev --include-workspace-root --workspace apps/api && npm cache clean --force
COPY --from=build /app/apps/api/dist ./apps/api/dist
EXPOSE 4000
CMD ["node", "apps/api/dist/index.js"]
