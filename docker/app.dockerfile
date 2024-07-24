FROM node:20 AS dev

USER node

WORKDIR /app

COPY package.json package.json
COPY yarn.lock yarn.lock

RUN yarn install --frozen-lockfile

COPY prisma prisma

RUN npx prisma generate

ENV NODE_ENV=development

CMD ["npm", "start"]

FROM dev AS prod

COPY . .

ENV NODE_ENV=production

CMD ["npx", "ts-node", "/app/src/bin/run.ts"]
