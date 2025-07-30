import mongoose, { model, Schema } from "mongoose";
import { IReport } from "./report.interface";

// Define RegisterShowerSchema
const reportSchema = new Schema<IReport>(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    suspect: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    msgTitle: { type: String, required: true },
    msg: { type: String, required: true },
    isDeleted: { type: Boolean, default: false },
    isReplyed: { type: Boolean, default: false },
  },
  { timestamps: true }
);

// Create the RegisterShower model
const reportModel = model<IReport>("report", reportSchema);

export default reportModel;
