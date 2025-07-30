import { Types } from "mongoose";
export const RelationEnum = [
  "friend",
  "mother",
  "father",
  "sister",
  "brother",
  "son",
  "daughter",
  "grandmother",
  "grandfather",
  "grandson",
  "granddaughter",
  "aunt",
  "uncle",
  "cousin",
  "nephew",
  "niece",
  "mother-in-law",
  "father-in-law",
  "brother-in-law",
  "sister-in-law",
  "stepmother",
  "stepfather",
  "stepbrother",
  "stepsister",
];

export type TRelation =
  | "friend"
  | "mother"
  | "father"
  | "sister"
  | "brother"
  | "son"
  | "daughter"
  | "grandmother"
  | "grandfather"
  | "grandson"
  | "granddaughter"
  | "aunt"
  | "uncle"
  | "cousin"
  | "nephew"
  | "niece"
  | "mother-in-law"
  | "father-in-law"
  | "brother-in-law"
  | "sister-in-law"
  | "stepmother"
  | "stepfather"
  | "stepbrother"
  | "stepsister";

export const RelationStatusEnum = [
  "unfriended",
  "requested",
  "accepted",
  "rejected",
];
export type TRelationStatus =
  | "unfriended"
  | "requested"
  | "accepted"
  | "rejected";
export type TFriends = {
  sendBy: Types.ObjectId;
  reciveBy: Types.ObjectId;
  relation: TRelation;
  status: TRelationStatus;
};
