import bcrypt from "bcryptjs";
import mongoose, { Document } from "mongoose";
import { ICompany } from "./Company";
import { IDepartment } from "./Department";

export interface IUser extends Document {
  name: string;
  role: string;
  email: string;
  password: string;
  pis: string;
  cpf: string;
  registration: string;
  admissionDate: string;
  companyId: mongoose.Types.ObjectId | ICompany;
  workingHours?: string;
  status: "active" | "inactive";
  departmentId: mongoose.Types.ObjectId | IDepartment;
  costCenter?: string;
  position?: string;
  sheetNumber?: string;
  ctps?: string;
  directSuperior?: string;
  rg: string;
  birthDate: string;
  socialName?: string;
  cnh?: string;
  cnhCategory?: string;
  cnhExpiration?: string;
  cep?: string;
  address?: string;
  neighborhood?: string;
  city?: string;
  state?: string;
  phone?: string;
  extension?: string;
  fatherName?: string;
  motherName?: string;
  gender?: string;
  nationality?: string;
  placeOfBirth?: string;
  civilStatus?: string;
  dependents: boolean;
  dependentsQuantity: number;
  createdAt: Date;
  updatedAt: Date;
  children: Array<{
    name: string;
    cpf: string;
    birthDate: string;
  }>;
  comparePassword(enteredPassword: string): Promise<boolean>;
}

const userSchema = new mongoose.Schema<IUser>(
  {
    name: {
      type: String,
      required: [true, "O nome é obrigatório"],
      minlength: [10, "O nome deve ter no mínimo 10 caracteres"],
    },
    role: {
      type: String,
      required: [true, "Role"],
      default: "employee",
    },
    email: {
      type: String,
      required: [true, "O email é obrigatório"],
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: {
      type: String,
      required: [true, "A senha é obrigatória."],
      minlength: [8, "A senha deve ter no mínimo 8 caracteres"],
      validate: {
        validator: function (v: string) {
          return /^(?=.*[A-Z])(?=.*\d)(?=.*[\W_]).{8,}$/.test(v);
        },
        message:
          "A senha deve conter pelo menos 1 letra maiúscula, 1 caractere especial, 1 número e mínimo de 8 caracteres",
      },
      // select: false,
    },
    pis: {
      type: String,
      required: [true, "O PIS é obrigatório"],
    },
    cpf: {
      type: String,
      required: [true, "O CPF é obrigatório"],
      length: 11,
      validate: {
        validator: function (v: string) {
          return v.length === 11;
        },
        message: "Preencha apenas os 11 números do CPF",
      },
      unique: true,
    },
    registration: {
      type: String,
      required: [true, "O número de matrícula é obrigatório"],
    },
    admissionDate: {
      type: String,
      required: [true, "A data de admissão é obrigatória"],
    },
    companyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Company",
      required: true,
    },
    workingHours: {
      type: String,
      default: "",
    },
    status: {
      type: String,
      enum: {
        values: ["active", "inactive"],
        message: 'Status deve ser "Ativo" ou "Inativo"',
      },
      required: true,
    },
    departmentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Department",
      required: true,
    },
    costCenter: {
      type: String,
      default: "",
    },
    position: {
      type: String,
      default: "",
    },
    sheetNumber: {
      type: String,
      default: "",
    },
    ctps: {
      type: String,
      default: "",
    },
    directSuperior: {
      type: String,
    },
    rg: {
      type: String,
      required: [true, "O RG é obrigatório"],
      length: 9,
      validate: {
        validator: function (v: string) {
          return v.length === 9;
        },
        message: "Preencha apenas os 9 números do RG",
      },
      unique: true,
    },
    birthDate: {
      type: String,
      required: [true, "A data de nascimento é obrigatória"],
      length: 8,
      validate: {
        validator: function (v: string) {
          return v.length === 8;
        },
        message: "Preencha apenas os 8 números da data de nascimento",
      },
    },
    socialName: {
      type: String,
    },
    cnh: {
      type: String,
    },
    cnhCategory: {
      type: String,
    },
    cnhExpiration: {
      type: Date,
    },
    cep: {
      type: String,
    },
    address: {
      type: String,
    },
    neighborhood: {
      type: String,
    },
    city: {
      type: String,
    },
    state: {
      type: String,
    },
    phone: {
      type: String,
      length: 11,
      validate: {
        validator: function (v: string) {
          return v.length === 11;
        },
        message: "Preencha apenas os 11 números do telefone",
      },
    },
    extension: {
      type: String,
    },
    fatherName: {
      type: String,
    },
    motherName: {
      type: String,
    },
    gender: {
      type: String,
    },
    nationality: {
      type: String,
    },
    placeOfBirth: {
      type: String,
    },
    civilStatus: {
      type: String,
    },
    dependents: {
      type: Boolean,
      default: false,
    },
    dependentsQuantity: {
      type: Number,
      default: 0,
    },
    children: [
      {
        name: { type: String },
        cpf: { type: String },
        birthDate: { type: String },
      },
    ],
  },
  {
    timestamps: true,
  }
);

userSchema.pre("save", async function (this: IUser) {
  if (!this.isModified("password")) {
    return;
  }

  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
  } catch (error) {
    return error as any;
  }
});

userSchema.methods.comparePassword = async function (
  candidatePassword: string
) {
  return bcrypt.compare(candidatePassword, this.password);
};

export const User = mongoose.model("User", userSchema);
