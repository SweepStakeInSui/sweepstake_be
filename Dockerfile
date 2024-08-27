FROM node:18-alpine AS builder
RUN apk add --update --no-cache python3 make g++ git
RUN corepack enable
WORKDIR /app
COPY package.json yarn.lock ./
RUN yarn --immutable && yarn global add @nestjs/cli pm2
COPY . .
RUN yarn build