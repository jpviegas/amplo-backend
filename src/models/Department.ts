import mongoose from "mongoose";

export interface IDepartment extends Document {
  departmentName: string;
  approvalFlow: string;
  sheetNumber: string;
}

const departmentSchema = new mongoose.Schema<IDepartment>(
  {
    departmentName: {
      type: String,
      required: [true, "O nome é obrigatório"],
    },
    approvalFlow: {
      type: String,
      default: "",
    },
    sheetNumber: {
      type: String,
      required: [true, "O número da folha é obrigatório"],
    },
  },
  {
    timestamps: true,
  }
);

export const Department = mongoose.model("Department", departmentSchema);
