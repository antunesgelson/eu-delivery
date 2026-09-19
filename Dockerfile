FROM node:22-alpine AS build
WORKDIR /app
ENV NEXT_TELEMETRY_DISABLED=1
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM node:22-alpine AS runtime
WORKDIR /app
ENV NODE_ENV=production NEXT_TELEMETRY_DISABLED=1 PORT=4051
COPY package*.json ./
RUN npm ci --omit=dev && npm cache clean --force
COPY --from=build --chown=node:node /app/.next-production ./.next-production
COPY --from=build /app/public ./public
COPY --from=build /app/next.config.mjs ./next.config.mjs
USER node
EXPOSE 4051
CMD ["node", "node_modules/next/dist/bin/next", "start", "--hostname", "0.0.0.0"]
