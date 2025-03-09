const mongoose = require("mongoose");

const employeeSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "O nome é obrigatório"],
      minlength: [10, "O nome deve ter no mínimo 10 caracteres"],
    },
    pis: {
      type: String,
      required: [true, "O PIS é obrigatório"],
      minlength: [1, "O PIS é obrigatório"],
    },
    cpf: {
      type: String,
      required: [true, "O CPF é obrigatório"],
      validate: {
        validator: function (v) {
          return v.length === 11;
        },
        message: "Preencha apenas os 11 números do CPF",
      },
    },
    registration: {
      type: String,
      required: [true, "O número de matrícula é obrigatório"],
    },
    admissionDate: {
      type: Date,
      required: [true, "A data de admissão é obrigatória"],
    },
    company: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Company",
      required: [true, "O código da empresa é obrigatório"],
    },
    workingHours: {
      type: String,
    },
    status: {
      type: String,
      enum: ["active", "inactive"],
      required: true,
    },
    department: {
      type: String,
    },
    costCenter: {
      type: String,
    },
    position: {
      type: String,
    },
    sheetNumber: {
      type: String,
    },
    ctps: {
      type: String,
    },
    directSuperior: {
      type: String,
    },
    rg: {
      type: String,
      required: true,
    },
    birthDate: {
      type: Date,
      required: [true, "A data de nascimento é obrigatória"],
    },
    socialName: {
      type: String,
    },
    cnh: { type: String },
    cnhCategory: { type: String },
    cnhExpiration: { type: String },
    cep: { type: String },
    address: { type: String },
    neighborhood: { type: String },
    city: { type: String },
    state: { type: String },
    phone: { type: String },
    extension: { type: String },
    fatherName: { type: String },
    motherName: { type: String },
    gender: { type: String },
    nationality: { type: String },
    placeOfBirth: { type: String },
    civilStatus: { type: String },
  },
  {
    timestamps: true,
  },
);

const Employee = mongoose.model("Employee", employeeSchema);

module.exports = Employee;
