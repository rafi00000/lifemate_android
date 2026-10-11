import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose from '../src/db/mongoose.js';
import { afterAll, beforeAll, beforeEach } from 'vitest';
import { connectDatabase, disconnectDatabase } from '../src/db/connect.js';

let mongo: MongoMemoryServer | undefined;

beforeAll(async () => {
  mongo = await MongoMemoryServer.create();
  await connectDatabase(mongo.getUri('lifemate-test'));
});

beforeEach(async () => {
  const collections = await mongoose.connection.db!.collections();
  await Promise.all(collections.map((c) => c.deleteMany({})));
});

afterAll(async () => {
  await disconnectDatabase();
  await mongo?.stop();
});
