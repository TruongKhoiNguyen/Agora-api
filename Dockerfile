FROM node:18 as base

# install dependencies
FROM base as deps

WORKDIR /app

COPY package.json yarn.lock ./

RUN yarn --frozen-lockfile;

# run
FROM node:18-alpine as runner

WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules

COPY . .

RUN yarn build

CMD [ "yarn", "start:dev" ]