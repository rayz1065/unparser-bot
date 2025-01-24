## Setup and run

You will need a bot API token, get one by contacting [BotFather](https://t.me/botfather), after that create a .env file by copying the .env.example, be sure to change `POSTGRES_PASSWORD` with a secure password, and `BOT_TOKEN` with the token you received from BotFather.

Copy or link the configuration you want to use to `docker-compose.override.yml`.
To use the bot in development mode write:

```sh
ln --symbolic --force docker-compose.dev.yml docker-compose.override.yml
```

You may also want to run `yarn install` to download the dependencies on your machine, which are essential for your code editor to give you hints.

To use it in production mode write:

```sh
ln --symbolic --force docker-compose.prod.yml docker-compose.override.yml
```

Ensure that the user written in the environment file has read/write access to the relevant files in storage/ as this will be mounted.

```sh
sudo chown 1000:1000 storage/ -R
```

Start the services by running:

```sh
docker compose up
```

You will need to do a one-time setup of the bot, to get the exact list of steps run:

```sh
docker compose run --rm -it app npx tsx src/bin/setup-bot.ts --all
```

You can use that utility script to update most configurations automatically for you, the rest will need to be changed through BotFather.

Finally you will need to run the database migrations:

```sh
docker compose run --rm -it app npx prisma migrate deploy
```
