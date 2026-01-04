import mongoose from "mongoose";

export interface ICompany extends Document {
  companyName: string;
  nickname: string;
  cnpj: string;
  cep: string;
  address: string;
  district: string;
  city: string;
  uf: string;
  page: string;
  registration: string;
  responsibleCpf: string;
  responsibleName: string;
  responsibleRole: string;
  companyEmail: string;
}

const companySchema = new mongoose.Schema<ICompany>(
  {
    companyName: {
      type: String,
      required: [true, "O nome é obrigatório"],
    },
    nickname: {
      type: String,
      required: [true, "O nome fantasia é obrigatório"],
    },
    cnpj: {
      type: String,
      required: [true, "O CNPJ é obrigatório"],
      validate: {
        validator: function (v: string) {
          return v.length === 14;
        },
        message: "Preencha apenas os 14 números do CNPJ",
      },
    },
    cep: {
      type: String,
      required: [true, "O número do CEP é obrigatório"],
      validate: {
        validator: function (v: string) {
          return v.length === 7;
        },
        message: "O CEP deve ter 7 caracteres",
      },
    },
    address: {
      type: String,
      required: [true, "O endereço é obrigatório"],
    },
    district: {
      type: String,
      required: [true, "O bairro é obrigatório"],
    },
    city: {
      type: String,
      required: [true, "A cidade é obrigatória"],
    },
    uf: {
      type: String,
      required: [true, "A UF é obrigatória"],
    },
    page: {
      type: String,
      required: [true, "O número da folha é obrigatório"],
    },
    registration: {
      type: String,
      required: [true, "A inscrição estadual é obrigatória"],
    },
    responsibleCpf: {
      type: String,
      required: [true, "O número de CPF do responsável é obrigatório"],
      validate: {
        validator: function (v: string) {
          return v.length === 11;
        },
        message: "O CPF deve ter 11 dígitos",
      },
    },
    responsibleName: {
      type: String,
      required: [true, "O nome do responsável é obrigatório"],
    },
    responsibleRole: {
      type: String,
      required: [true, "O cargo do responsável é obrigatório"],
    },
    companyEmail: {
      type: String,
      required: [true, "O email da empresa é obrigatório"],
      validate: {
        validator: function (v: string) {
          return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
        },
        message: "Formato de email inválido",
      },
    },
  },
  {
    timestamps: true,
  }
);

export const Company = mongoose.model("Company", companySchema);
