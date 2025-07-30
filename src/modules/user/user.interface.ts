import mongoose, { Document, ObjectId } from "mongoose";
import { TRole } from "../../config/role";
export const MoodEnum = [
  "😄 Peaceful",
  "🤩 Grateful",
  "😊 Hopeful",
  "😐 Lonely",
  "😢 Sad",
  "💪 Inspired",
  "🧘 Peaceful",
  "💕 Loved",
  "💯 Confident",
  "⚡ Energized",
  "💪 Proud",
  "🚀 Motivated",
  "😌 Relaxed",
  "😄 Joyful",
  "😆 Playful",
  "😌 Calm",
  "🤔 Reflective",
  "🤷 Curious",
  "😑 Bored",
  "😐 Indifferent",
  "🫤 Numb",
  "🤷‍♀️ Uncertain",
  "😴 Distracted",
  "🏃‍♀️ Restless",
  "😰 Anxious",
  "😔 Lonely",
  "😤 Overwhelmed",
  "😠 Frustrated",
  "😡 Angry",
  "😞 Hurt",
  "😓 Stressed",
  "😩 Exhausted",
  "😞 Disappointed",
  "😒 Jealous",
  "😕 Guilty",
  "😨 Fearful",
  "😌 Nostalgic",
  "🥺 Sentimental",
  "😔 Melancholy",
  "😢 Vulnerable",
  "😤 Empowered",
  "💪 Resilient",
  "🕵️‍♂️ Detached",
  "😔 Inspired yet tired",
  "null",
];
export type TModes =
  | "😄 Peaceful"
  | "🤩 Grateful"
  | "😊 Hopeful"
  | "😐 Lonely"
  | "😢 Sad"
  | "💪 Inspired"
  | "🧘 Peaceful"
  | "💕 Loved"
  | "💯 Confident"
  | "⚡ Energized"
  | "💪 Proud"
  | "🚀 Motivated"
  | "😌 Relaxed"
  | "😄 Joyful"
  | "😆 Playful"
  | "😌 Calm"
  | "🤔 Reflective"
  | "🤷 Curious"
  | "😑 Bored"
  | "😐 Indifferent"
  | "🫤 Numb"
  | "🤷‍♀️ Uncertain"
  | "😴 Distracted"
  | "🏃‍♀️ Restless"
  | "😰 Anxious"
  | "😤 Overwhelmed"
  | "😠 Frustrated"
  | "😡 Angry"
  | "😞 Hurt"
  | "😓 Stressed"
  | "😩 Exhausted"
  | "😞 Disappointed"
  | "😒 Jealous"
  | "😕 Guilty"
  | "😨 Fearful"
  | "😌 Nostalgic"
  | "🥺 Sentimental"
  | "😔 Melancholy"
  | "😢 Vulnerable"
  | "😤 Empowered"
  | "💪 Resilient"
  | "🕵️‍♂️ Detached"
  | "😔 Inspired yet tired"
  | "null";
export type IUser = {
  name: string;
  username: string;
  email: string;
  password: string;
  gender?: "male" | "female" | "other";
  ageRange?: string;
  address?: string;
  user_mood: TModes;

  jurnals?: ObjectId[] | null;
  chat_history_with_ai?: ObjectId[] | null;
  profile_status?: Boolean;
  conections?: ObjectId[] | null;
  image: {
    publicFileURL: string;
    path: string;
  };
  isVerified: boolean;
  blockStatus: Date | null;
  role: TRole;
  isRequest?: "approve" | "deny" | "send";
  isDeleted: boolean;
  fcmToken?: string;
  activeStatus?: boolean;
} & Document;

export type IOTP = {
  email: string;
  otp: string;
  expiresAt: Date;
} & Document;
