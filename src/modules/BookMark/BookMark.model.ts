import mongoose, { Schema, Document } from "mongoose";
import { IBookMark } from "./BookMark.interface";

const BookMarkSchema = new Schema<IBookMark>(
  {
    articalsId: {
      type: mongoose.Types.ObjectId,
      ref: "Articals",
      required: true,
    },
    userId: {
      type: mongoose.Types.ObjectId,
      ref: "User",
      required: true,
    },

    isDeleted: { type: Boolean, default: false },
  },
  { timestamps: true },
);

// Create the model based on the schema
const BookMark = mongoose.model<IBookMark>("BookMark", BookMarkSchema);

export default BookMark;
