import { ObjectId, Types } from "mongoose";
import { IUserPayload } from "../../middlewares/roleGuard";
import { TJournals } from "./journals.interface";
import { JournalsDB } from "./journals.model";
import ApiError from "../../errors/ApiError";
import httpStatus from "http-status";
import { OpenAIService } from "../../utils/openAI";
import { chunkText } from "../user/user.utils";
import { PineconeCollections } from "../../DB/pinecone";

const addJournals = async (body: TJournals, userId: Types.ObjectId) => {
  const chunk = chunkText(body?.content, 200);
  const result = await JournalsDB.create({
    ...body,
    customDate: new Date(body.customDate),
    user: userId,
  });

  Promise.all(
    chunk.map(async (data, index) => {
      // Add index parameter
      const vector = await OpenAIService.embedding(
        `journal title: ${body?.title} and journal body: ${data}`
      );

      await PineconeCollections.saveJournal({
        vector: vector,
        text: data,
        title: body.title,
        userId: userId.toString(),
        id: `${result._id.toString()}-${index}`,
      });
    })
  );

  return result;
};

const getJournals = async (query: any, page: number, limit: number) => {
  const skip = (page - 1) * limit;
  const result = await JournalsDB.find(query)
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit)
    .exec();
  // Count total notifications based on role
  const totalJournals = await JournalsDB.countDocuments(query).exec();

  // Calculate total pages
  const totalPages = Math.ceil(totalJournals / limit);
  const prevPage = page > 1 ? page - 1 : 0;
  const nextPage = page < totalPages ? page + 1 : 0;
  return {
    data: result,
    pagination: {
      totalPages,
      currentPage: page,
      prevPage,
      nextPage,
      limit,
      totalJournals,
    },
  };
};
const deleteJournals = async (
  journalid: Types.ObjectId,
  userId: Types.ObjectId
) => {
  const result = await JournalsDB.findOneAndUpdate(
    {
      user: userId,
      _id: journalid,
      isDeleted: false,
    },
    {
      isDeleted: true,
    }
  );
  if (!result) {
    throw new ApiError(httpStatus.NOT_FOUND, "Journal not found.");
  }
  return result;
};
const editJournals = async (
  body: TJournals,
  userId: Types.ObjectId,
  journalid: Types.ObjectId
) => {
  const result = await JournalsDB.findOneAndUpdate(
    {
      _id: journalid,
      user: userId,
    },
    {
      ...body,
      user: userId,
    },
    {
      new: true,
    }
  );
  return result;
};
export const journalServices = {
  addJournals,
  getJournals,
  deleteJournals,
  editJournals,
};
