import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';

let mongoServer: MongoMemoryServer;

export const connectDB = async (): Promise<void> => {
  mongoServer = await MongoMemoryServer.create();
  const mongoUri = mongoServer.getUri();
  
  await mongoose.connect(mongoUri);
};

export const disconnectDB = async (): Promise<void> => {
  await mongoose.connection.dropDatabase();
  await mongoose.connection.close();
  await mongoServer.stop();
};

export const clearDB = async (): Promise<void> => {
  const collections = mongoose.connection.collections;
  
  for (const key in collections) {
    const collection = collections[key];
    await collection.deleteMany({});
  }
};