import { ObjectId } from "mongoose";

export type TJournals = {
  user: ObjectId;
  title: string;
  content: string;
  customDate: Date;
  isDeleted: boolean;
};
