import { Types } from "mongoose";

export type TLegacy = {
  user: Types.ObjectId;
  recipients: Types.ObjectId[];
  triggerDate: Date;
  messages: String;
  isDeleted?: boolean;
  type?: "onetime" | "loop";
  triggerStatus?: boolean;
};
