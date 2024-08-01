FROM node:20 AS dev

ENV NODE_ENV=development
ENV PATH=/app/node_modules/.bin:$PATH

USER node

WORKDIR /app

COPY package.json yarn.lock /app/

RUN yarn install --frozen-lockfile

COPY prisma prisma

RUN npx prisma generate

CMD ["npm", "start"]

FROM dev AS prod

ENV NODE_ENV=production

COPY . .

CMD ["ts-node", "./src/bin/run.ts"]
