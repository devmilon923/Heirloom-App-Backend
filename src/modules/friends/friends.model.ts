import mongoose, { Schema } from "mongoose";
import {
  RelationEnum,
  RelationStatusEnum,
  TFriends,
} from "./friends.interface";

const friendSchema = new Schema<TFriends>(
  {
    sendBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
    reciveBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
    relation: { type: String, enum: RelationEnum, required: true },
    status: { type: String, enum: RelationStatusEnum, required: true },
  },
  { timestamps: true }
);
export const Friends = mongoose.model("friends", friendSchema);
