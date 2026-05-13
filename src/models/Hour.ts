import mongoose, { Document } from "mongoose";

export interface IHours extends Document {
  name: string;
  initialHour?: string;
  finalHour?: string;
  days?: Array<{
    dayOfWeek: number;
    ranges: Array<{
      start: string;
      end: string;
    }>;
    totalMinutes: number;
  }>;
  weeklyTotalMinutes?: number;
}

const timeRangeSchema = new mongoose.Schema(
  {
    start: { type: String, required: true, trim: true },
    end: { type: String, required: true, trim: true },
  },
  { _id: false },
);

const dayScheduleSchema = new mongoose.Schema(
  {
    dayOfWeek: { type: Number, required: true },
    ranges: { type: [timeRangeSchema], default: [] },
    totalMinutes: { type: Number, default: 0 },
  },
  { _id: false },
);

const hourSchema = new mongoose.Schema<IHours>(
  {
    name: {
      type: String,
      default: "",
      trim: true,
    },
    initialHour: {
      type: String,
      trim: true,
    },
    finalHour: {
      type: String,
      trim: true,
    },
    days: {
      type: [dayScheduleSchema],
      default: [],
    },
    weeklyTotalMinutes: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  },
);

export const Hour = mongoose.model("Hour", hourSchema);
