import mongoose from 'mongoose';

const connectDB = async () => {
  try {
    const dbURI = process.env.MONGO_URI || 'mongodb://localhost:27017/amplo-backend';
    const conn = await mongoose.connect(dbURI);
    
    console.log(`MongoDB Connected: ${conn.connection.host}`);
    console.log(`Database Name: ${conn.connection.name}`);
  } catch (error) {
    console.error(`Error: ${(error as Error).message}`);
    process.exit(1);
  }
};

export default connectDB;
