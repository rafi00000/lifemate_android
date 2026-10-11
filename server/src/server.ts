import { env } from './config/env.js';
import { connectDatabase, disconnectDatabase } from './db/connect.js';
import { createApp } from './app.js';

async function main() {
  if (!env.MONGODB_URI) {
    throw new Error('MONGODB_URI is not set. Copy .env.example to .env, or run `npm run dev:memory`.');
  }
  await connectDatabase(env.MONGODB_URI);
  const server = createApp().listen(env.PORT, () => {
    console.log(`LifeMate API listening on port ${env.PORT}`);
  });

  const shutdown = async () => {
    server.close();
    await disconnectDatabase();
    process.exit(0);
  };
  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
});
