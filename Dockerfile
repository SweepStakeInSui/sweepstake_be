FROM node:20-alpine AS builder
RUN apk add --update --no-cache python3 make g++ git
RUN corepack enable
WORKDIR /app
COPY package.json yarn.lock ./
RUN yarn install --immutable
COPY . .
RUN yarn run build