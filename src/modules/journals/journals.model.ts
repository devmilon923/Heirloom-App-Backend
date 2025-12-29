import mongoose from "mongoose";
import { TJournals } from "./journals.interface";

const journalSchema = new mongoose.Schema<TJournals>(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "users",
      required: true,
    },
    title: { type: String, required: true, trim: true, unique: true },
    content: { type: String, required: true, trim: true },
    customDate: { type: Date, required: true },
    isDeleted: { type: Boolean, required: true, trim: true, default: false },
  },
  { timestamps: true },
);

export const JournalsDB = mongoose.model("journals", journalSchema);
