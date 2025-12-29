import { model, Schema } from "mongoose";
import { TFAQ } from "./faq.interface";

const faqSchema = new Schema<TFAQ>(
  {
    question: { type: String, required: true },
    answer: { type: String, required: true },
  },
  { timestamps: true },
);

export const FAQModel = model("FAQ", faqSchema);
