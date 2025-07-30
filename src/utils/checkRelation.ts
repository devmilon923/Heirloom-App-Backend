import { Types } from "mongoose";
import { Friends } from "../modules/friends/friends.model";

export const checkMessage = async ({
  sender,
  recevier,
}: {
  sender: Types.ObjectId;
  recevier: Types.ObjectId;
}) => {
  try {
    const result = await Friends.findOne({
      $or: [
        { sendBy: sender, reciveBy: recevier },
        { sendBy: recevier, reciveBy: sender },
      ],
      status: "accepted",
    });
    if (!result?.relation) {
      return {
        status: false,
        relation: result?.relation || null,
      };
    }
    return {
      status: true,
      relation: result?.relation || null,
    };
  } catch (error) {
    return {
      status: false,
      relation: null,
      error: error,
    };
  }
};
