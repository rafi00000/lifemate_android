/**
 * Seeds the database in MONGODB_URI with demo data. Refuses to run against a
 * database that already has users, so it can never clobber real accounts.
 *   npm run seed
 */
import { env } from '../config/env.js';
import { connectDatabase, disconnectDatabase } from '../db/connect.js';
import { UserModel } from '../modules/users/user.model.js';
import { DEMO_USERS, seedDemoData } from './seed-data.js';

async function main() {
  if (!env.MONGODB_URI) throw new Error('MONGODB_URI is not set.');
  await connectDatabase(env.MONGODB_URI);
  if (await UserModel.estimatedDocumentCount()) {
    console.log('Database already has users; seed skipped.');
  } else {
    await seedDemoData(env.BCRYPT_ROUNDS);
    console.log(`Seeded demo data. Sign in as ${DEMO_USERS.primary.email}`);
  }
  await disconnectDatabase();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
