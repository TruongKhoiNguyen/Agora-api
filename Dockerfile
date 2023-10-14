FROM node:18 as base

# install dependencies
FROM base as deps

WORKDIR /app

COPY package.json yarn.lock ./

RUN yarn --frozen-lockfile;

COPY . .

RUN yarn build

CMD [ "yarn", "start:prod" ]