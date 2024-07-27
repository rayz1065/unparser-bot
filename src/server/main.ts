import { serve } from '@hono/node-server';
import { Hono } from 'hono';
import { HTTPException } from 'hono/http-exception';
import { Bot, webhookCallback } from 'grammy';
import { MyContext } from '../context';
import { appConfig } from '../config';

export function startServer(bot: Bot<MyContext>) {
  const app = new Hono();

  const port = 3000;
  console.log(`Server is running on port ${port}`);

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
      } catch (error) {
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
        console.info('client error', err);
      } else {
        console.error('server error', err);
      }
      return err.getResponse();
    }

    console.error('unexpected error', err);
    return c.json({ ok: false, error: 'Internal Server Error' }, 500);
  });

  serve({
    fetch: app.fetch,
    port,
  });

  return app;
}
