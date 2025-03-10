const mongoose = require("mongoose");

const companySchema = new mongoose.Schema(
  {
    companyName: {
      type: String,
      required: [true, "O nome é obrigatório"],
      minlength: [10, "O nome deve ter no mínimo 10 caracteres"],
    },
    nickname: {
      type: String,
      required: [true, "O nome fantasia é obrigatório"],
      minlength: [1, "O nome fantasia é obrigatório"],
    },
    cnpj: {
      type: String,
      required: [true, "O CNPJ é obrigatório"],
      validate: {
        validator: function (v) {
          return v.length === 14;
        },
        message: "Preencha apenas os 14 números do CNPJ",
      },
    },
    cep: {
      type: String,
      required: [true, "O CEP é obrigatório"],
      validate: {
        validator: function (v) {
          return v.length === 7;
        },
        message: "O número do CEP é obrigatório",
      },
    },
    address: {
      type: String,
      required: [true, "O endereço é obrigatório"],
      minlength: [1, "O endereço é obrigatório"],
    },
    district: {
      type: String,
      required: [true, "O bairro é obrigatório"],
      minlength: [1, "O bairro é obrigatório"],
    },
    city: {
      type: String,
      required: [true, "A cidade é obrigatória"],
      minlength: [1, "A cidade é obrigatória"],
    },
    uf: {
      type: String,
      required: [true, "A UF é obrigatória"],
      minlength: [1, "A UF é obrigatória"],
    },
    page: {
      type: String,
      required: [true, "O número da folha é obrigatório"],
      minlength: [1, "O número da folha obrigatório"],
    },
    registration: {
      type: String,
      required: [true, "A inscrição estadual é obrigatória"],
      minlength: [1, "A inscrição estadual é obrigatória"],
    },
    responsibleCpf: {
      type: String,
      required: [true, "O CPF do responsável é obrigatório"],
      validate: {
        validator: function (v) {
          return v.length === 11;
        },
        message: "O número de CPF do responsável é obrigatório",
      },
    },
    responsibleName: {
      type: String,
      required: [true, "O nome do responsável é obrigatório"],
      minlength: [1, "O nome do responsável é obrigatório"],
    },
    responsibleRole: {
      type: String,
      required: [true, "O cargo do responsável é obrigatório"],
      minlength: [1, "O cargo do responsável é obrigatória"],
    },
    companyEmail: {
      type: String,
      required: [true, "O email da empresa é obrigatório"],
      validate: {
        validator: function (v) {
          return /^\S+@\S+\.\S+$/.test(v);
        },
        message: "O email da empresa é obrigatório",
      },
    },
  },
  {
    timestamps: true,
  },
);

const Company = mongoose.model("Company", companySchema);

module.exports = Company;
