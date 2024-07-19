FROM node:18-alpine AS builder
RUN apk add --update --no-cache python3 make g++ git
RUN git config --global url."https://github.com/".insteadOf ssh://git@github.com/
WORKDIR /app
COPY package.json yarn.lock ./
RUN yarn --frozen-lock-file && yarn global add @nestjs/cli pm2
COPY . .
# RUN yarn run test:cov
RUN yarn build