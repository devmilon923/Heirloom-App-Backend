import BookMark from "./BookMark.model";
import mongoose, {  Types } from "mongoose";

export const createBookMarkService = async (
  userId: Types.ObjectId,
  articalsId: Types.ObjectId
) => {
  console.log(userId, articalsId);
  // Validate required fields.
  const missingFields: string[] = [];
  if (!articalsId) missingFields.push("articalsId");

  // Verify that the event exists.
  const bookmark = await BookMark.findOneAndUpdate(
    {
      articalsId: articalsId,
      userId: userId,
    },
    { articalsId: articalsId, userId: userId },
    { new: true, upsert: true }
  );

  return bookmark;
};

export const getBookMarkList = async (
  userId: Types.ObjectId,
  page: number,
  limit: number
) => {
  const skip = (page - 1) * limit;

  // Build the match criteria for active bookmarks of the logged-in user.
  const matchCriteria: any = {
    userId: new mongoose.Types.ObjectId(userId),
    isDeleted: false,
    isBooked: true,
  };

  // Execute the aggregation pipeline.
  const bookmarks = await BookMark.find({
    userId: userId,
  }).select("-isDeleted");
  const totalBookmarks = await BookMark.countDocuments(matchCriteria);
  const totalPages = Math.ceil(totalBookmarks / limit);
  const prevPage = page > 1 ? page - 1 : 1;
  const nextPage = page < totalPages ? page + 1 : totalPages;

  // Return response in the desired format.
  return {
    data: bookmarks,
    // pagination: {
    //   totalPage: totalPages,
    //   currentPage: page,
    //   prevPage,
    //   nextPage,
    //   limit,
    //   totalItem: totalBookmarks,
    // },
  };
};
