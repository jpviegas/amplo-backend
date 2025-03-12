const mongoose = require("mongoose");
const uri = process.env.MONGODB_URI;

const connectDB = async () => {
  try {
    await mongoose.connect(uri);
    // await client.connect();
    console.log("Conectado ao MongoDB!");
    // const db = client.db("amplo");
    // const collections = await db.listCollections().toArray();
    // console.log("Coleções:", collections);
  } catch (error) {
    console.error("Erro ao conectar:", error);
  } finally {
    // await client.close();
  }
  // console.log("conn");
};

module.exports = connectDB;
