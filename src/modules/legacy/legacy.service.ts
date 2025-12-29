import { Types } from "mongoose";
import { TLegacy } from "./legacy.interface";
import { Legacys } from "./legacy.model";

const addLegacy = async ({
  user,
  recipients,
  messages,
  triggerDate,
  type,
}: TLegacy) => {
  const result = await Legacys.create({
    user,
    recipients,
    messages,
    triggerDate,
    type,
  });
  return result;
};
const getLegacy = async (query: object, page: number, limit: number) => {
  const skip = (page - 1) * limit;
  const result = await Legacys.find(query)
    .populate("user", "name")
    .populate("recipients", "name")
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit)
    .exec();
  const totalLegacy = await Legacys.countDocuments(query).exec();
  // Calculate total pages
  const totalPages = Math.ceil(totalLegacy / limit);
  const prevPage = page > 1 ? page - 1 : null;
  const nextPage = page < totalPages ? page + 1 : null;

  return {
    legacys: [...result],
    pagination: {
      totalPages,
      currentPage: page,
      prevPage,
      nextPage,
      limit,
      totalLegacy,
    },
  };
};
const getLegacyById = async (
  legacyId: Types.ObjectId,
  userId: Types.ObjectId,
) => {
  const result = await Legacys.findOne({
    _id: legacyId,
    user: userId,
    isDeleted: false,
  })
    .populate("recipients", "name")
    .populate("user", "name");
  return result;
};
const deleteLegacyById = async (
  legacyId: Types.ObjectId,
  userId: Types.ObjectId,
) => {
  const result = await Legacys.findOneAndUpdate(
    {
      _id: legacyId,
      user: userId,
      isDeleted: false,
    },
    {
      isDeleted: true,
    },
  )
    .populate("recipients", "name")
    .populate("user", "name");
  return result;
};
const editLegacyById = async ({
  user,
  legacyId,
  recipients,
  messages,
  triggerDate,
}: {
  user: Types.ObjectId;
  legacyId: Types.ObjectId;
  recipients: Types.ObjectId[];
  triggerDate: Date;
  messages: String;
}) => {
  const result = await Legacys.findOneAndUpdate(
    {
      _id: legacyId,
      user: user,
      isDeleted: false,
    },
    {
      recipients,
      messages,
      triggerDate,
      // isDeleted: true,
    },
    {
      new: true,
      runValidators: true,
    },
  )
    .populate("recipients", "name")
    .populate("user", "name");
  return result;
};
const getTriggeredLegacyById = async (
  legacyId: Types.ObjectId,
  userId: Types.ObjectId,
) => {
  const result = await Legacys.findOne({
    _id: legacyId,
    recipients: { $in: userId },
    triggerStatus: true,
  })
    .populate("recipients", "name")
    .populate("user", "name");
  // .select('createdAt')
  return result;
};
export const LegacyService = {
  addLegacy,
  getLegacy,
  getLegacyById,
  getTriggeredLegacyById,
  editLegacyById,
  deleteLegacyById,
};
