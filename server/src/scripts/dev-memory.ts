/**
 * Local development without MongoDB Atlas: starts a throwaway MongoDB,
 * seeds demo data, and runs the API.
 *   npm run dev:memory
 * Data lives under server/.data so it survives restarts; delete that folder
 * to start fresh.
 */
import { randomBytes } from 'node:crypto';
import { mkdirSync } from 'node:fs';
import path from 'node:path';
import { MongoMemoryServer } from 'mongodb-memory-server';

const dbPath = path.resolve(import.meta.dirname, '../../.data/db');
mkdirSync(dbPath, { recursive: true });

// Zero-config local runs. A per-run secret only invalidates 15-minute access
// tokens on restart; the app silently refreshes them.
process.env.JWT_ACCESS_SECRET ??= randomBytes(48).toString('base64url');
process.env.CORS_ORIGINS ??= 'http://localhost:8081';

const mongo = await MongoMemoryServer.create({
  instance: { dbPath, storageEngine: 'wiredTiger', port: 27027 },
});
process.env.MONGODB_URI = mongo.getUri('lifemate');

const { env } = await import('../config/env.js');
const { connectDatabase } = await import('../db/connect.js');
const { createApp } = await import('../app.js');
const { UserModel } = await import('../modules/users/user.model.js');
const { DEMO_USERS, seedDemoData } = await import('./seed-data.js');

await connectDatabase(process.env.MONGODB_URI);
if (!(await UserModel.estimatedDocumentCount())) {
  await seedDemoData(env.BCRYPT_ROUNDS);
  console.log(`Seeded demo data -> ${DEMO_USERS.primary.email} / ${DEMO_USERS.primary.password}`);
}

createApp().listen(env.PORT, () => {
  console.log(`LifeMate API (in-memory MongoDB) on http://localhost:${env.PORT}`);
});

const stop = async () => {
  await mongo.stop({ doCleanup: false });
  process.exit(0);
};
process.on('SIGINT', stop);
process.on('SIGTERM', stop);
