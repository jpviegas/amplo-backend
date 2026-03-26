import mongoose from 'mongoose';

const connectDB = async () => {
  try {
    const dbURI = process.env.MONGO_URI || 'mongodb+srv://jpviegas:vM0x2heiD4082dfx@cluster0.l5pbm.mongodb.net/';
    const conn = await mongoose.connect(dbURI);
    
    console.log(`MongoDB Connected: ${conn.connection.host}`);
    console.log(`Database Name: ${conn.connection.name}`);

    try {
      const db = conn.connection.db as any;
      if (!db) throw new Error('no-db');
      const positionsColl = db.collection('positions');
      const indexes = await positionsColl.indexes();
      const hasBadIdIndex = indexes.some((ix: any) => ix?.name === 'id_1');
      if (hasBadIdIndex) {
        await positionsColl.dropIndex('id_1');
        console.log('Dropped obsolete unique index id_1 from positions');
      }
    } catch (e) {
      console.warn('Index check/drop for positions collection skipped:', (e as any)?.message || e);
    }
  } catch (error) {
    console.error(`Error: ${(error as Error).message}`);
    process.exit(1);
  }
};

export default connectDB;
