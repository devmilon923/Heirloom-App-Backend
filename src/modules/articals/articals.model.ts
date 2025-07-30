import { model, Schema } from "mongoose";
import { ArticalsEnum, TArticals } from "./articals.interface";

const articalSchema = new Schema<TArticals>(
  {
    titile: { type: String, required: true },
    category: { type: String, required: true, enum: ArticalsEnum },
    image: {
      type: {
        publicFileURL: { type: String, trim: true },
        path: { type: String, trim: true },
      },
      required: true,
      default: {
        publicFileURL: "",
        path: "",
      },
    },
    content: { type: String, required: true },
  },
  { timestamps: true }
);
export const ArticalsModel = model("Articals", articalSchema);
