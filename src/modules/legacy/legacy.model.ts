import mongoose from "mongoose";
import { TLegacy } from "./legacy.interface";

const legacySchema = new mongoose.Schema<TLegacy>(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      trim: true,
    },
    recipients: {
      type: [mongoose.Schema.Types.ObjectId],
      ref: "User",
      required: true,
    },
    triggerDate: { type: Date, required: true, trim: true },
    messages: { type: String, required: true, trim: true },
    isDeleted: { type: Boolean, required: true, default: false },
    triggerStatus: { type: Boolean, required: true, default: false },
    type: { type: String, required: true, enum: ["onetime", "loop"] },
  },
  { timestamps: true },
);
legacySchema.pre("save", function (next) {
  if (this.recipients && this.recipients.length) {
    const uniqueRecipients = [
      ...new Set(this.recipients.map((id) => id.toString())),
    ].map((id) => new mongoose.Types.ObjectId(id));

    this.recipients = uniqueRecipients;
  }
  next();
});
export const Legacys = mongoose.model<TLegacy>("legacys", legacySchema);
