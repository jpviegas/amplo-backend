const mongoose = require("mongoose");
const Employee = require("../models/Funcionarios");
require("dotenv").config();

// Array de funcionários fakes para testes
const fakeEmployees = [
  {
    name: "João da Silva funcionario fake",
    pis: "12345678901",
    cpf: "12345678901",
    registration: "12345",
    admissionDate: new Date("2022-01-15"),
    company: "67d0302fa423413a928921da", // Substitua pelo ID real da empresa
    workingHours: "40 horas semanais",
    status: "active",
    department: "Vendas",
    costCenter: "Centro de Custo 1",
    position: "Vendedor",
    sheetNumber: "001",
    ctps: "1234567890",
    rg: "123456789",
    birthDate: new Date("1990-05-20"),
    socialName: "Joãozinho",
    cnh: "1234567890",
    cnhCategory: "B",
    cnhExpiration: "2025-05-20",
    cep: "12345678",
    address: "Rua A, 123",
    neighborhood: "Centro",
    city: "São Paulo",
    state: "SP",
    phone: "11987654321",
    extension: "123",
    fatherName: "José da Silva",
    motherName: "Maria da Silva",
    gender: "Masculino",
    nationality: "Brasileiro",
    placeOfBirth: "São Paulo",
    civilStatus: "Solteiro",
  },
  {
    name: "Maria Oliveira funcionario fake",
    pis: "23456789012",
    cpf: "23456789012",
    registration: "12346",
    admissionDate: new Date("2021-02-10"),
    company: "67d0302fa423413a928921da", // Substitua pelo ID real da empresa
    workingHours: "40 horas semanais",
    status: "active",
    department: "Recursos Humanos",
    costCenter: "Centro de Custo 2",
    position: "Analista de RH",
    sheetNumber: "002",
    ctps: "2345678901",
    rg: "234567890",
    birthDate: new Date("1985-03-15"),
    socialName: "Mari",
    cnh: "2345678901",
    cnhCategory: "B",
    cnhExpiration: "2026-03-15",
    cep: "23456789",
    address: "Rua B, 456",
    neighborhood: "Jardim",
    city: "São Paulo",
    state: "SP",
    phone: "11987654322",
    extension: "124",
    fatherName: "Carlos Oliveira",
    motherName: "Ana Oliveira",
    gender: "Feminino",
    nationality: "Brasileira",
    placeOfBirth: "São Paulo",
    civilStatus: "Casada",
  },
  {
    name: "Carlos Santos funcionario fake",
    pis: "34567890123",
    cpf: "34567890123",
    registration: "12347",
    admissionDate: new Date("2020-03-20"),
    company: "67d0302fa423413a928921da", // Substitua pelo ID real da empresa
    workingHours: "40 horas semanais",
    status: "active",
    department: "Financeiro",
    costCenter: "Centro de Custo 3",
    position: "Analista Financeiro",
    sheetNumber: "003",
    ctps: "3456789012",
    rg: "345678901",
    birthDate: new Date("1992-07-25"),
    socialName: "Carlão",
    cnh: "3456789012",
    cnhCategory: "B",
    cnhExpiration: "2027-07-25",
    cep: "34567890",
    address: "Rua C, 789",
    neighborhood: "Vila Nova",
    city: "São Paulo",
    state: "SP",
    phone: "11987654323",
    extension: "125",
    fatherName: "Roberto Santos",
    motherName: "Clara Santos",
    gender: "Masculino",
    nationality: "Brasileiro",
    placeOfBirth: "São Paulo",
    civilStatus: "Divorciado",
  },
  {
    name: "Ana Costa funcionario fake",
    pis: "45678901234",
    cpf: "45678901234",
    registration: "12348",
    admissionDate: new Date("2019-04-30"),
    company: "67d0302fa423413a928921da", // Substitua pelo ID real da empresa
    workingHours: "40 horas semanais",
    status: "active",
    department: "Marketing",
    costCenter: "Centro de Custo 4",
    position: "Coordenadora de Marketing",
    sheetNumber: "004",
    ctps: "4567890123",
    rg: "456789012",
    birthDate: new Date("1988-11-10"),
    socialName: "Aninha",
    cnh: "4567890123",
    cnhCategory: "B",
    cnhExpiration: "2028-11-10",
    cep: "45678901",
    address: "Rua D, 321",
    neighborhood: "Bairro Alto",
    city: "São Paulo",
    state: "SP",
    phone: "11987654324",
    extension: "126",
    fatherName: "Fernando Costa",
    motherName: "Juliana Costa",
    gender: "Feminino",
    nationality: "Brasileira",
    placeOfBirth: "São Paulo",
    civilStatus: "Solteira",
  },
  {
    name: "Lucas Pereira funcionario fake",
    pis: "56789012345",
    cpf: "56789012345",
    registration: "12349",
    admissionDate: new Date("2018-05-15"),
    company: "67d0302fa423413a928921da", // Substitua pelo ID real da empresa
    workingHours: "40 horas semanais",
    status: "active",
    department: "TI",
    costCenter: "Centro de Custo 5",
    position: "Desenvolvedor",
    sheetNumber: "005",
    ctps: "5678901234",
    rg: "567890123",
    birthDate: new Date("1995-02-20"),
    socialName: "Luquinha",
    cnh: "5678901234",
    cnhCategory: "B",
    cnhExpiration: "2029-02-20",
    cep: "56789012",
    address: "Rua E, 654",
    neighborhood: "Centro",
    city: "São Paulo",
    state: "SP",
    phone: "11987654325",
    extension: "127",
    fatherName: "Jorge Pereira",
    motherName: "Sofia Pereira",
    gender: "Masculino",
    nationality: "Brasileiro",
    placeOfBirth: "São Paulo",
    civilStatus: "Casado",
  },
  {
    name: "Fernanda Lima funcionario fake",
    pis: "67890123456",
    cpf: "67890123456",
    registration: "12350",
    admissionDate: new Date("2017-06-25"),
    company: "67d0302fa423413a928921da", // Substitua pelo ID real da empresa
    workingHours: "40 horas semanais",
    status: "active",
    department: "Vendas",
    costCenter: "Centro de Custo 6",
    position: "Vendedora",
    sheetNumber: "006",
    ctps: "6789012345",
    rg: "678901234",
    birthDate: new Date("1993-08-30"),
    socialName: "Nanda",
    cnh: "6789012345",
    cnhCategory: "B",
    cnhExpiration: "2030-08-30",
    cep: "67890123",
    address: "Rua F, 987",
    neighborhood: "Jardim",
    city: "São Paulo",
    state: "SP",
    phone: "11987654326",
    extension: "128",
    fatherName: "Ricardo Lima",
    motherName: "Patrícia Lima",
    gender: "Feminino",
    nationality: "Brasileira",
    placeOfBirth: "São Paulo",
    civilStatus: "Solteira",
  },
  {
    name: "Rafael Gomes funcionario fake",
    pis: "78901234567",
    cpf: "78901234567",
    registration: "12351",
    admissionDate: new Date("2016-07-10"),
    company: "67d0302fa423413a928921da", // Substitua pelo ID real da empresa
    workingHours: "40 horas semanais",
    status: "active",
    department: "Financeiro",
    costCenter: "Centro de Custo 7",
    position: "Analista Financeiro",
    sheetNumber: "007",
    ctps: "7890123456",
    rg: "789012345",
    birthDate: new Date("1991-12-15"),
    socialName: "Rafa",
    cnh: "7890123456",
    cnhCategory: "B",
    cnhExpiration: "2031-12-15",
    cep: "78901234",
    address: "Rua G, 321",
    neighborhood: "Vila Nova",
    city: "São Paulo",
    state: "SP",
    phone: "11987654327",
    extension: "129",
    fatherName: "André Gomes",
    motherName: "Cláudia Gomes",
    gender: "Masculino",
    nationality: "Brasileiro",
    placeOfBirth: "São Paulo",
    civilStatus: "Divorciado",
  },
  {
    name: "Tatiane Rocha funcionario fake",
    pis: "89012345678",
    cpf: "89012345678",
    registration: "12352",
    admissionDate: new Date("2015-08-20"),
    company: "67d0302fa423413a928921da", // Substitua pelo ID real da empresa
    workingHours: "40 horas semanais",
    status: "active",
    department: "Marketing",
    costCenter: "Centro de Custo 8",
    position: "Coordenadora de Marketing",
    sheetNumber: "008",
    ctps: "8901234567",
    rg: "890123456",
    birthDate: new Date("1989-03-05"),
    socialName: "Tati",
    cnh: "8901234567",
    cnhCategory: "B",
    cnhExpiration: "2032-03-05",
    cep: "89012345",
    address: "Rua H, 654",
    neighborhood: "Centro",
    city: "São Paulo",
    state: "SP",
    phone: "11987654328",
    extension: "130",
    fatherName: "Fernando Rocha",
    motherName: "Ana Rocha",
    gender: "Feminino",
    nationality: "Brasileira",
    placeOfBirth: "São Paulo",
    civilStatus: "Casada",
  },
  {
    name: "Gustavo Martins funcionario fake",
    pis: "90123456789",
    cpf: "90123456789",
    registration: "12353",
    admissionDate: new Date("2014-09-30"),
    company: "67d0302fa423413a928921da", // Substitua pelo ID real da empresa
    workingHours: "40 horas semanais",
    status: "active",
    department: "TI",
    costCenter: "Centro de Custo 9",
    position: "Desenvolvedor de Software",
    sheetNumber: "009",
    ctps: "9012345678",
    rg: "901234567",
    birthDate: new Date("1990-11-11"),
    socialName: "Gus",
    cnh: "9012345678",
    cnhCategory: "B",
    cnhExpiration: "2033-11-11",
    cep: "90123456",
    address: "Rua I, 987",
    neighborhood: "Bairro Alto",
    city: "São Paulo",
    state: "SP",
    phone: "11987654329",
    extension: "131",
    fatherName: "Carlos Martins",
    motherName: "Sofia Martins",
    gender: "Masculino",
    nationality: "Brasileiro",
    placeOfBirth: "São Paulo",
    civilStatus: "Solteiro",
  },
  {
    name: "Patrícia Almeida funcionario fake",
    pis: "01234567890",
    cpf: "01234567890",
    registration: "12354",
    admissionDate: new Date("2013-10-15"),
    company: "67d0302fa423413a928921da", // Substitua pelo ID real da empresa
    workingHours: "40 horas semanais",
    status: "active",
    department: "Recursos Humanos",
    costCenter: "Centro de Custo 10",
    position: "Analista de RH",
    sheetNumber: "010",
    ctps: "0123456789",
    rg: "012345678",
    birthDate: new Date("1987-04-20"),
    socialName: "Paty",
    cnh: "0123456789",
    cnhCategory: "B",
    cnhExpiration: "2034-04-20",
    cep: "01234567",
    address: "Rua J, 321",
    neighborhood: "Centro",
    city: "São Paulo",
    state: "SP",
    phone: "11987654330",
    extension: "132",
    fatherName: "Roberto Almeida",
    motherName: "Clara Almeida",
    gender: "Feminino",
    nationality: "Brasileira",
    placeOfBirth: "São Paulo",
    civilStatus: "Casada",
  },
];

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

async function seedEmployees() {
  try {
    // Limpa usuários existentes (opcional - remova esta linha se quiser preservar usuários existentes)
    await Employee.deleteMany({});

    // Cria os usuários de teste
    const createdEmployees = await Employee.create(fakeEmployees);

    console.log(
      `${createdEmployees.length} usuários de teste criados com sucesso:`,
    );
    createdEmployees.forEach((employees) => {
      console.log(`- ${employees.name}`);
    });

    return createdEmployees;
  } catch (error) {
    console.error("Erro ao criar usuários de teste:", error);
    throw error;
  }
}

// Função principal que executa o seed
async function runSeed() {
  try {
    await connectDB();
    await seedEmployees();
    console.log("Seed concluído com sucesso!");
  } catch (error) {
    console.error("Erro durante o seed:", error);
  } finally {
    // Fecha a conexão com o MongoDB
    await mongoose.connection.close();
    console.log("Conexão com MongoDB fechada");
  }
}

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
  fakeEmployees,
  seedEmployees,
  connectDB,
  runSeed,
};
