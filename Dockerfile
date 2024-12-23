# Stage 1: Build stage
FROM node:alpine AS builder

LABEL maintainer="https://github.com/its4nik"
LABEL version="2.0.0"
LABEL description="API for DockStat"
LABEL license="BSD-3-Clause license"
LABEL repository="https://github.com/its4nik/dockstatapi"
LABEL documentation="https://github.com/its4nik/dockstatapi"
LABEL org.opencontainers.image.description="The DockSatAPI is a free and OpenSource backend for gathering container statistics across hosts"
LABEL org.opencontainers.image.licenses="BSD-3-Clause license"
LABEL org.opencontainers.image.source="https://github.com/its4nik/dockstatapi"

WORKDIR /build
ENV NODE_NO_WARNINGS=1

RUN apk update && \
    apk upgrade && \
    apk add bash


COPY tsconfig.json environment.d.ts package*.json tsconfig.json yarn.lock ./
RUN npm install

COPY ./src ./src
RUN npm run build:mini

# Stage 2: main stage
FROM alpine AS main

# Needed packages
RUN apk update && \
    apk upgrade && \
    apk add --update npm

WORKDIR /build

RUN mkdir -p /build/src/data

COPY tsconfig.json environment.d.ts package*.json tsconfig.json yarn.lock ./
RUN npm install --omit=dev

COPY --from=builder /build/dist/* /build/src
COPY --from=builder /build/src/misc/entrypoint.sh /build/entrypoint.sh
COPY --from=builder /build/src/misc/createEnvFile.sh /build/createEnvFile.sh

RUN node src/config/db.js

# Stage 3: Production stage
FROM alpine AS production

RUN apk add --update bash curl nodejs
HEALTHCHECK --interval=5m --timeout=3s \
    CMD curl -f http://localhost:9876/api/status || exit 1

WORKDIR /api

COPY --from=main /build /api

EXPOSE 9876
ENTRYPOINT [ "bash", "./entrypoint.sh" ]
