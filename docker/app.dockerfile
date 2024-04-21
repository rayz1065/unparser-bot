FROM node:20 as dev

USER node

WORKDIR /app

COPY package.json package.json
COPY yarn.lock yarn.lock

RUN yarn install

COPY .env .env
COPY prisma prisma

RUN npx prisma generate

ENV env development

CMD ["npm", "start"]

FROM dev as prod

COPY . .

ENV env production

CMD ["npx", "ts-node", "/app/src/bin/run.ts"]
