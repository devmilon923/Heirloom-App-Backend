import mongoose, { Types } from "mongoose";
import { UserModel } from "../user/user.model";
import ApiError from "../../errors/ApiError";
import httpStatus from "http-status";
import moment from "moment";
import { ArticalsModel } from "../articals/articals.model";
import { FAQModel } from "../faq/faq.model";

// admin.service.ts
const updateStatus = async (userId: Types.ObjectId, days: number) => {
  let extendDays = new Date();
  extendDays.setDate(extendDays.getDate() + days);
  const user = await UserModel.findByIdAndUpdate(
    userId,
    {
      lockUntil: days ? extendDays : null,
    },
    { new: true },
  ).select("lockUntil");

  return user;
};
const getUsers = async (query: object) => {
  console.log(query);
  const clients = await UserModel.find(query).select(
    "frist_name last_name email phone city",
  );
  return clients;
};

// Helper function to calculate the start and end of the current week
function getCurrentWeekDates() {
  const currentDate = new Date();

  // Convert current date to Bangladesh Standard Time (UTC+6)
  const bangladeshTime = new Date(
    currentDate.toLocaleString("en-US", { timeZone: "Asia/Dhaka" }),
  );

  // Set the start of the week (Sunday) at midnight in BST
  const startOfWeek = new Date(bangladeshTime);
  startOfWeek.setDate(bangladeshTime.getDate() - bangladeshTime.getDay()); // Sunday
  startOfWeek.setHours(0, 0, 0, 0); // Set to midnight (start of Sunday)

  // Set the end of the week (Saturday) at 23:59:59.999 in BST
  const endOfWeek = new Date(bangladeshTime);
  endOfWeek.setDate(bangladeshTime.getDate() + (6 - bangladeshTime.getDay())); // Saturday
  endOfWeek.setHours(23, 59, 59, 999); // Set to the end of the day (11:59:59.999 PM)
  console.log({ startOfWeek, endOfWeek });
  return { startOfWeek, endOfWeek };
}

const createArtical = async (body: Object, file: any) => {
  const result = await ArticalsModel.create({
    ...body,
    image: {
      publicFileURL: `public\\images\\${file?.filename}`, // This is a bug
      path: `/images/${file?.filename}`,
    },
  });
  return result;
};
const updateArtical = async (
  body: Object,
  file: any,
  articalId: Types.ObjectId,
) => {
  let query = {};
  if (file) {
    query = {
      ...body,
      image: {
        publicFileURL: `public\\images\\${file?.filename}`, // This is a bug
        path: `/images/${file?.filename}`,
      },
    };
  } else {
    query = {
      ...body,
    };
  }

  const result = await ArticalsModel.findByIdAndUpdate(articalId, query, {
    new: true,
  });
  return result;
};
const createFAQ = async (body: Object) => {
  const result = await FAQModel.create(body);
  return result;
};
const updateFAQ = async (body: Object, faqId: Types.ObjectId) => {
  const result = await FAQModel.findByIdAndUpdate(faqId, body, {
    new: true,
  });
  return result;
};
const changeRole = async ({ role, filter }: { role: string; filter: any }) => {
  const result = await UserModel.findByIdAndUpdate(
    filter,
    { role: role },
    {
      new: true,
    },
  );
  return result;
};
export const AdminService = {
  getUsers,
  changeRole,
  updateStatus,
  createFAQ,
  updateFAQ,
  updateArtical,
  createArtical,
};
