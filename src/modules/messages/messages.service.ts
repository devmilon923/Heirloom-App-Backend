import mongoose, { Types } from "mongoose";
import { UserModel } from "../user/user.model";
import { Conversations, Messages } from "./messages.model";
import { TMessages } from "./messages.interface";
import ApiError from "../../errors/ApiError";
import httpStatus from "http-status";
import { checkMessage } from "../../utils/checkRelation";
import { Friends } from "../friends/friends.model";
import {
  sendInboxSocketStacks,
  sendSocketConversation,
} from "../../utils/socket";
import { formatConversationData } from "../../utils/formatted";
import { PineconeCollections } from "../../DB/pinecone";
import { OpenAIService } from "../../utils/openAI";

const updateActiveStatus = async (status: boolean, userId: Types.ObjectId) => {
  try {
    await UserModel.findByIdAndUpdate(userId, { activeStatus: status });
    return true;
  } catch (error) {
    console.log(error);
    return false;
  }
};
const findConversation = async (conId: Types.ObjectId) => {
  try {
    const conversation = await Conversations.findById(conId)
      .populate("participants", "name activeStatus username image") // Added image field
      .populate({
        path: "lastMessage",
        populate: [
          { path: "sender", select: "name image username activeStatus" },
          { path: "reciver", select: "name image username activeStatus" },
        ],
      });

    return conversation;
  } catch (error) {
    console.log(error);
    return false;
  }
};
const updateConversation = async (
  conId: Types.ObjectId,
  sender: Types.ObjectId,
  reciver: Types.ObjectId,
  messageId?: Types.ObjectId
) => {
  console.log(
    sender,
    reciver,
    messageId,
    "===============================sdfgsdfg="
  );
  try {
    const conversation = await Conversations.findOneAndUpdate(
      {
        participants: { $all: [sender, reciver] },
        _id: conId,
      },
      {
        lastMessage: messageId,
      }
    );

    return conversation;
  } catch (error) {
    console.log(error);
    return false;
  }
};
const updateAiStatus = async (
  conversationId: Types.ObjectId,
  status: boolean,
  userId: Types.ObjectId
) => {
  let updated;
  if (status === true) {
    // Add userId to ai_user array if user is participant
    updated = await Conversations.findOneAndUpdate(
      { _id: conversationId, participants: { $in: userId } },
      { $addToSet: { ai_user: userId } },
      { new: true }
    );
    if (!updated) {
      throw new Error("Conversation not found or user not a participant.");
    }
    return updated;
  } else {
    // Remove userId from ai_user array only if user is participant
    updated = await Conversations.findOneAndUpdate(
      { _id: conversationId, participants: { $in: userId } },
      { $pull: { ai_user: userId } },
      { new: true }
    );
    if (!updated) {
      throw new Error("Conversation not found or user not a participant.");
    }
    return updated;
  }
};
const createConversation = async (
  sender: Types.ObjectId,
  receiver: Types.ObjectId,
  messageId?: Types.ObjectId
) => {
  try {
    const participants = [sender, receiver].sort(); // always sort for consistency
    // First try to find and update existing conversation
    let conversation = await Conversations.findOneAndUpdate(
      { participants: { $all: participants, $size: 2 } },
      { $set: { lastMessage: messageId || null } },
      { new: true }
    );

    // If not found, create a new one
    if (!conversation) {
      conversation = await Conversations.create({
        participants: [sender, receiver],
        lastMessage: messageId || null,
      });
    }

    // Populate the participants and lastMessage fields after creation
    const populatedConversation = await (
      await conversation.populate(
        "participants",
        "name activeStatus username image"
      )
    ).populate({
      path: "lastMessage",
      populate: [
        {
          path: "sender",
          select: "name activeStatus username image",
        },
        {
          path: "reciver", // fixed typo here to 'receiver'
          select: "name activeStatus username image",
        },
        {
          path: "readBy",
          select: "name activeStatus username image",
        },
      ],
    });

    return populatedConversation;
  } catch (error) {
    console.log(error);
    throw new ApiError(httpStatus.BAD_REQUEST, "Server error!");
  }
};
const getMessages = async (
  conversationId: Types.ObjectId,
  userId: Types.ObjectId,
  page: number,
  limit: number
) => {
  const skip = (page - 1) * limit;
  try {
    const messages = await Messages.find({
      conversation: conversationId,
      $or: [
        {
          sender: userId,
        },
        {
          reciver: userId,
        },
      ],
    })
      .populate("sender", "name activeStatus username image")
      .populate("reciver", "name activeStatus username image")
      .populate("readBy", "name activeStatus username image")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .exec();
    // console.log(messages);
    const responseData = messages?.map((message: any) => {
      return {
        sender_name: message?.sender?.name || message?.sender?.username,
        // image: message?.sender?.image?.publicFileURL || "",
        sender_id: message?.sender?._id,
        activeStatus: message?.sender?.activeStatus,
        content: message?.messages,
        image: message?.image?.publicFileURL || "",
        readBy: message?.readBy?.includes(message?.reciver?._id),
        time: message?.createdAt,
      };
    });
    const totalMessages = await Messages.countDocuments({
      conversation: conversationId,
      $or: [
        {
          sender: userId,
        },
        {
          reciver: userId,
        },
      ],
    }).exec();
    await Messages.updateMany(
      {
        conversation: conversationId,
        $or: [
          {
            sender: userId,
          },
          {
            reciver: userId,
          },
        ],
      },
      {
        $addToSet: { readBy: userId },
      }
    );
    // Calculate total pages
    const totalPages = Math.ceil(totalMessages / limit);
    const prevPage = page > 1 ? page - 1 : null;
    const nextPage = page < totalPages ? page + 1 : null;
    return {
      messages: [...responseData],
      pagination: {
        totalPages,
        currentPage: page,
        prevPage,
        nextPage,
        limit,
        totalMessages,
      },
    };
  } catch (error) {
    console.log(error);
    throw new ApiError(httpStatus.BAD_REQUEST, "Server error!");
  }
};
const getMedia = async (
  conversationId: Types.ObjectId,
  userId: Types.ObjectId,
  page: number,
  limit: number
) => {
  const skip = (page - 1) * limit;
  try {
    const messages = await Messages.find({
      conversation: conversationId,
      $or: [
        {
          sender: userId,
        },
        {
          reciver: userId,
        },
      ],
      "image.publicFileURL": { $exists: true, $ne: "" },
    })
      .select("image")

      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .exec();
    const responseData = messages?.map(
      (message: any) => message?.image?.publicFileURL || ""
    );
    const totalMessages = await Messages.countDocuments({
      conversation: conversationId,
      $or: [
        {
          sender: userId,
        },
        {
          reciver: userId,
        },
      ],
    }).exec();
    await Messages.updateMany(
      {
        conversation: conversationId,
        $or: [
          {
            sender: userId,
          },
          {
            reciver: userId,
          },
        ],
      },
      {
        $addToSet: { readBy: userId },
      }
    );
    // Calculate total pages
    const totalPages = Math.ceil(totalMessages / limit);
    const prevPage = page > 1 ? page - 1 : null;
    const nextPage = page < totalPages ? page + 1 : null;
    return {
      media: [...responseData],
      pagination: {
        totalPages,
        currentPage: page,
        prevPage,
        nextPage,
        limit,
        totalMessages,
      },
    };
  } catch (error) {
    console.log(error);
    throw new ApiError(httpStatus.BAD_REQUEST, "Server error!");
  }
};
const getConversation = async (
  userId: Types.ObjectId,
  page: number,
  limit: number,
  searchQ?: string
) => {
  const skip = (page - 1) * limit;

  const filter = { participants: { $in: [userId] } };

  let conversations = await Conversations.find(filter)
    .populate("participants", "name activeStatus username image") // Added image field
    .populate({
      path: "lastMessage",
      populate: {
        path: "sender reciver readBy",
        select: "name activeStatus username image",
      },
    })
    .sort({ updatedAt: -1 })
    .skip(skip)
    .limit(limit)
    .exec();

  // Format data using participants instead of lastMessage.reciver
  let formattedData = await Promise.all(
    conversations.map(async (data: any) => {
      const otherParticipant = data?.participants?.find(
        (participant: any) => participant?._id.toString() !== userId?.toString()
      );
      const sender = data?.lastMessage?.sendBy?._id || userId;
      const recevier =
        data?.lastMessage?.reciveBy?._id || otherParticipant?._id;
      const chatValidation = await checkMessage({ sender, recevier });
      return {
        _id: data?._id,
        lastMessage: data?.lastMessage?.messages || "No message yet.",
        name:
          data?.lastMessage?.receiver?.name ||
          otherParticipant?.name ||
          "Unknown",
        image:
          data?.lastMessage?.receiver?.image?.publicFileURL ||
          otherParticipant?.image?.publicFileURL ||
          "",
        sender_id: sender,
        reciver_id: recevier,
        userName:
          data?.lastMessage?.username ||
          otherParticipant?.username ||
          "Unknown",
        time: data?.updatedAt,
        ai_user: data?.ai_user?.includes(userId) || false,
        chatAccess: chatValidation?.status ? true : false,
        activeStatus:
          data?.lastMessage?.activeStatus || otherParticipant?.activeStatus,
      };
    })
  );

  // Search functionality remains the same
  if (searchQ && searchQ.trim() !== "") {
    const searchLower = searchQ.toLowerCase();
    formattedData = formattedData.filter((conv: any) =>
      conv?.name?.toLowerCase().includes(searchLower)
    );
  }

  const totalConversations = await Conversations.countDocuments(filter);
  const totalPages = Math.ceil(totalConversations / limit);
  const prevPage = page > 1 ? page - 1 : null;
  const nextPage = page < totalPages ? page + 1 : null;

  return {
    conversations: formattedData,
    pagination: {
      totalPages,
      currentPage: page,
      prevPage,
      nextPage,
      limit,
      totalConversations,
    },
  };
};
// Service function to handle sending a message in a conversation
const sendMessage = async (body: TMessages) => {
  // 1. Check if the conversation exists
  const hasConversation: any = await findConversation(body?.conversation);
  if (!hasConversation) {
    // If not, throw an error
    throw new ApiError(httpStatus.BAD_REQUEST, "Invalid conversation");
  }
  // 2. Find the receiver (the other participant in the conversation)
  const receiverId = hasConversation.participants.find(
    (pati: any) => !pati.equals(new mongoose.Types.ObjectId(body.sender))
  );

  // Determine sender and receiver for this message
  const sender = hasConversation.lastMessage?.sendBy || body.sender;
  const receiver = hasConversation.lastMessage?.reciveBy || receiverId;

  // Defensive: ensure only ObjectId is used for readBy and all downstream logic
  const safeSender =
    typeof sender === "object" && sender?._id
      ? sender._id.toString()
      : sender?.toString();
  const safeReceiver =
    typeof receiver === "object" && receiver?._id
      ? receiver._id.toString()
      : receiver?.toString();

  // 3. In parallel: check relationship and prepare message data
  const [relationData, messageData] = await Promise.all([
    checkMessage({
      recevier: new mongoose.Types.ObjectId(receiver),
      sender: new mongoose.Types.ObjectId(sender),
    }),
    // Prepare message data concurrently
    Promise.resolve({
      conversation: new mongoose.Types.ObjectId(body.conversation),
      sender: new mongoose.Types.ObjectId(sender),
      reciver: new mongoose.Types.ObjectId(receiver),
      messages: body.messages,
      image: body.image,
    }),
  ]);

  // If users are not allowed to message each other, throw an error
  if (relationData?.status === false && relationData?.relation === null) {
    throw new ApiError(httpStatus.BAD_REQUEST, "You can't message this person");
  }

  // 4. Create the message and populate sender/receiver fields
  const result = await Messages.create(messageData);
  const populatedResult = await Messages.findById(result._id)
    .populate("sender", "name _id") // Populate sender's name
    .populate("reciver", "name _id"); // Populate receiver's name
  console.log("=============", populatedResult);
  // 5. Perform background tasks (embedding, conversation update, socket emission)
  setImmediate(async () => {
    try {
      // A. If message is text, generate embedding and save to Pinecone
      if (body.messages) {
        const vector = await OpenAIService.embedding(body.messages);
        PineconeCollections.saveChat({
          id: result._id.toString(),
          senderId: sender,
          reciverId: receiver?._id,
          chat: body.messages,
          relation: relationData?.relation || "",
          vector,
        });
      }

      // B. Update conversation metadata and create conversation if needed
      await Promise.all([
        updateConversation(
          new mongoose.Types.ObjectId(body.conversation),
          new mongoose.Types.ObjectId(receiver),
          new mongoose.Types.ObjectId(sender),
          result._id
        ),
        MessagesServices.createConversation(sender, receiver, result._id),
      ]);

      // C. Format conversation data and send socket updates
      const [formattedDataForSender, _senderStack] = await Promise.all([
        formatConversationData(body?.conversation, safeSender),
        sendInboxSocketStacks(safeSender),
      ]);
      const [formattedDataForReciver, _receiverStack] = await Promise.all([
        formatConversationData(body?.conversation, safeReceiver),
        sendInboxSocketStacks(safeReceiver),
      ]);
      sendSocketConversation(formattedDataForSender, [
        new mongoose.Types.ObjectId(safeSender),
      ]);
      sendSocketConversation(formattedDataForReciver, [
        new mongoose.Types.ObjectId(safeReceiver),
      ]);
    } catch (error) {
      // Log any errors that occur during background processing
      console.error("Background processing error:", error);
    }
  });

  // 6. Return the relation data and the populated message (immediate response)
  return { ...relationData, message: populatedResult };
};
const messageStack = async (query: any) => {
  try {
    const unreadMessage = await Messages.countDocuments(query).exec();
    return unreadMessage;
  } catch (error) {
    console.log(error);
    throw new ApiError(httpStatus.BAD_REQUEST, "Server error!");
  }
};
const requestStack = async (query: any) => {
  try {
    const requestCount = await Friends.countDocuments(query).exec();
    return requestCount;
  } catch (error) {
    console.log(error);
    throw new ApiError(httpStatus.BAD_REQUEST, "Server error!");
  }
};
export const MessagesServices = {
  updateActiveStatus,
  findConversation,
  updateConversation,
  sendMessage,
  updateAiStatus,
  getMessages,
  getConversation,
  createConversation,
  getMedia,
  messageStack,
  requestStack,
};
