FROM node:22 AS dev

ENV NODE_ENV=development
ENV PATH=/app/node_modules/.bin:$PATH

USER node

WORKDIR /app

COPY package.json yarn.lock /app/

RUN yarn install --frozen-lockfile && yarn cache clean

COPY prisma prisma

RUN npx prisma generate

CMD ["yarn", "start"]

FROM dev AS prod

ENV NODE_ENV=production

COPY . .

CMD ["tsx", "/app/src/bin/run.ts"]
