const mongoose = require("mongoose");
const User = require("../models/User");
require("dotenv").config();

// Array de usuários fakes para testes
const fakeUsers = [
  {
    name: "João Silva",
    email: "joao.silva@example.com",
    password: "senha123",
  },
  {
    name: "Maria Oliveira",
    email: "maria.oliveira@example.com",
    password: "senha456",
  },
  {
    name: "Carlos Santos",
    email: "carlos.santos@example.com",
    password: "senha789",
  },
];

// Função para conectar ao MongoDB
async function connectDB() {
  try {
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log("Conectado ao MongoDB");
  } catch (error) {
    console.error("Erro ao conectar ao MongoDB:", error);
    process.exit(1);
  }
}

// Função para popular o banco com usuários de teste
async function seedUsers() {
  try {
    // Limpa usuários existentes (opcional - remova esta linha se quiser preservar usuários existentes)
    await User.deleteMany({});

    // Cria os usuários de teste
    const createdUsers = await User.create(fakeUsers);

    console.log(
      `${createdUsers.length} usuários de teste criados com sucesso:`,
    );
    createdUsers.forEach((user) => {
      console.log(`- ${user.name} (${user.email})`);
    });

    return createdUsers;
  } catch (error) {
    console.error("Erro ao criar usuários de teste:", error);
    throw error;
  }
}

// Função principal que executa o seed
async function runSeed() {
  try {
    await connectDB();
    await seedUsers();
    console.log("Seed concluído com sucesso!");
  } catch (error) {
    console.error("Erro durante o seed:", error);
  } finally {
    // Fecha a conexão com o MongoDB
    await mongoose.connection.close();
    console.log("Conexão com MongoDB fechada");
  }
}

// Executa o seed se este arquivo for executado diretamente
if (require.main === module) {
  runSeed()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error(err);
      process.exit(1);
    });
}

// Exporta as funções para uso em testes
module.exports = {
  fakeUsers,
  seedUsers,
  connectDB,
  runSeed,
};
