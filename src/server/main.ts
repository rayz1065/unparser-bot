import { serve } from '@hono/node-server';
import { Hono } from 'hono';
import { HTTPException } from 'hono/http-exception';
import { Bot, webhookCallback } from 'grammy';
import { MyContext } from '../context.js';
import { appConfig } from '../config.js';
import { Logger } from '../logger.js';

type Dependencies = {
  bot: Bot<MyContext>;
  logger: Logger;
};

export function startServer({ bot, logger }: Dependencies) {
  const app = new Hono();

  const port = 3000;
  logger.info(`Server is running on port ${port}`);

  app.get('/ping', (c) => {
    return c.json({
      ok: true,
      result: {
        pong: true,
      },
    });
  });

  if (appConfig.USE_WEBHOOK) {
    app.post('/webhook', async (c) => {
      try {
        await c.req.json();
      } catch {
        return c.json({ ok: false, error: 'Invalid body' }, 400);
      }
      return await webhookCallback(bot, 'hono', {
        secretToken: appConfig.WEBHOOK_SECRET,
      })(c);
    });
  }

  app.onError((err, c) => {
    if (err instanceof HTTPException) {
      if (err.status < 500) {
        logger.info(err, 'client error');
      } else {
        logger.error(err, 'server error');
      }
      return err.getResponse();
    }

    logger.error(err, 'unexpected error');
    return c.json({ ok: false, error: 'Internal Server Error' }, 500);
  });

  const server = serve({
    fetch: app.fetch,
    port,
  });

  return { app, server };
}
