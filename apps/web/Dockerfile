FROM node:22-alpine AS deps
WORKDIR /code
COPY  apps/web/package.json apps/web/pnpm-lock.yaml ./
RUN corepack enable && corepack prepare pnpm@9.0.1 --activate
RUN pnpm install --frozen-lockfile 

FROM node:22-alpine AS dev
WORKDIR /code
COPY apps/web .
COPY --from=deps /code/node_modules ./node_modules
EXPOSE 5173
CMD ["pnpm", "dev", "--host", "0.0.0.0", "--port", "5173"]