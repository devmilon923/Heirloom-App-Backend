import { Schema, model, Document } from "mongoose";
import { IContactUs } from "./contactUs.interface";

const contactUsSchema = new Schema<IContactUs>(
  {
    message: {
      type: String,
      required: true,
    },
    name: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: true,
    },
    phone: {
      type: String,
      required: true,
    },
    isDeleted: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true, // optional, adds `createdAt` and `updatedAt` fields
  },
);

// Create the model using the schema
const contactUs = model<IContactUs>("contactUs", contactUsSchema);

export default contactUs;
