import { model, Schema } from "mongoose";
import { ISupport } from "./support.interface";

// Define RegisterShowerSchema
const supportSchema = new Schema<ISupport>(
  {
    name: { type: String, required: true },
    email: { type: String, required: true },
    msgTitle: { type: String, required: true },
    msg: { type: String, required: true },
    isDeleted: { type: Boolean, default: false },
  },
  { timestamps: true }
);

// Create the RegisterShower model
const supportModel = model<ISupport>("support", supportSchema);

export default supportModel;
