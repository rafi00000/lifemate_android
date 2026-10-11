import mongoose from './mongoose.js';

export async function connectDatabase(uri: string): Promise<void> {
  await mongoose.connect(uri, { serverSelectionTimeoutMS: 10_000 });
  await mongoose.connection.syncIndexes();
}

export async function disconnectDatabase(): Promise<void> {
  await mongoose.disconnect();
}
