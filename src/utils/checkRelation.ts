import { Types } from "mongoose";
import { Friends } from "../modules/friends/friends.model";
import { UserModel } from "../modules/user/user.model";
import ApiError from "../errors/ApiError";
import httpStatus from "http-status";

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

export const findRelation = async ({
  userId,
  requestId,
}: {
  userId: Types.ObjectId;
  requestId: Types.ObjectId;
}) => {
  const request: any = await Friends.findOne({
    _id: requestId,
    $or: [{ sendBy: userId }, { reciveBy: userId }],
  })
    .populate("reciveBy", "gender")
    .populate("sendBy", "gender")
    .lean();
  const receiver =
    request?.sendBy?._id?.toString() === userId
      ? request?.reciveBy
      : request?.sendBy;
  const sender =
    request?.sendBy?._id?.toString() === userId
      ? request?.sendBy
      : request?.reciveBy;
  const myGender =
    request?.sendBy?._id?.toString() === userId
      ? request?.sendBy?.gender
      : request?.reciveBy?.gender;
  const receiverGender = receiver?.gender;
  console.log("checcccck===============================");
  console.log(receiverGender, myGender, receiver);
  console.log("checcccck=================end==============");

  const currentRequestRelation = request?.relation || null;
  let myRelation = null;

  if (!currentRequestRelation) {
    throw new ApiError(httpStatus.BAD_GATEWAY, "Relation mismatch 1");
  }

  // Parent relations
  if (
    (currentRequestRelation === "mother" && receiverGender === "female") ||
    currentRequestRelation === "father"
  ) {
    myRelation = myGender === "male" ? "son" : "daughter";
  }

  // Sibling relations
  if (
    (currentRequestRelation === "sister" && receiverGender === "female") ||
    currentRequestRelation === "brother"
  ) {
    myRelation = myGender === "male" ? "brother" : "sister";
  }

  // Child relations
  if (
    currentRequestRelation === "son" ||
    currentRequestRelation === "daughter"
  ) {
    myRelation = myGender === "male" ? "father" : "mother";
  }

  // Grandparent relations
  if (
    (currentRequestRelation === "grandmother" && receiverGender === "female") ||
    currentRequestRelation === "grandfather"
  ) {
    myRelation = myGender === "male" ? "grandson" : "granddaughter";
  }

  // Grandchild relations
  if (
    currentRequestRelation === "grandson" ||
    currentRequestRelation === "granddaughter"
  ) {
    myRelation = myGender === "male" ? "grandfather" : "grandmother";
  }

  // Aunt/Uncle relations
  if (
    (currentRequestRelation === "aunt" && receiverGender === "female") ||
    currentRequestRelation === "uncle"
  ) {
    myRelation = myGender === "male" ? "nephew" : "niece";
  }

  // Nephew/Niece relations
  if (
    currentRequestRelation === "nephew" ||
    currentRequestRelation === "niece"
  ) {
    myRelation = myGender === "male" ? "uncle" : "aunt";
  }

  // Cousin relation (symmetric)
  if (currentRequestRelation === "cousin") {
    myRelation = "cousin";
  }

  // In-law relations
  if (
    currentRequestRelation === "mother-in-law" ||
    currentRequestRelation === "father-in-law"
  ) {
    myRelation = myGender === "male" ? "son-in-law" : "daughter-in-law";
  }

  if (currentRequestRelation === "brother-in-law") {
    myRelation = myGender === "male" ? "brother-in-law" : "sister-in-law";
  }

  if (currentRequestRelation === "sister-in-law") {
    myRelation = myGender === "male" ? "brother-in-law" : "sister-in-law";
  }

  // Step relations
  if (
    currentRequestRelation === "stepmother" ||
    currentRequestRelation === "stepfather"
  ) {
    myRelation = myGender === "male" ? "stepson" : "stepdaughter";
  }

  if (
    currentRequestRelation === "stepbrother" ||
    currentRequestRelation === "stepsister"
  ) {
    myRelation = myGender === "male" ? "stepbrother" : "stepsister";
  }

  // Friend relation (symmetric)
  if (currentRequestRelation === "friend") {
    myRelation = "friend";
  }

  if (!myRelation) {
    throw new ApiError(
      httpStatus.BAD_REQUEST,
      "Unable to determine reciprocal relation",
    );
  }

  return { myRelation, reciveBy: receiver?._id, sendBy: sender?._id };
};
