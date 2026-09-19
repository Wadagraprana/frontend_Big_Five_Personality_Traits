FROM node:24-alpine AS base
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable

FROM base AS development-dependencies-env
COPY . /app
WORKDIR /app
RUN --mount=type=cache,id=pnpm,target=/pnpm/store pnpm install --frozen-lockfile

FROM base AS production-dependencies-env
COPY ./package.json ./pnpm-lock.yaml /app/
WORKDIR /app
RUN --mount=type=cache,id=pnpm,target=/pnpm/store pnpm install --prod --frozen-lockfile

FROM base AS build-env
COPY . /app
WORKDIR /app
COPY --from=development-dependencies-env /app/node_modules /app/node_modules
RUN pnpm run build

FROM base
COPY ./package.json ./pnpm-lock.yaml /app/
COPY --from=production-dependencies-env /app/node_modules /app/node_modules
COPY --from=build-env /app/build /app/build
WORKDIR /app

EXPOSE 3000

CMD ["pnpm", "run", "start"]