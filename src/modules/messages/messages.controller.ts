import { Request, Response } from "express";
import catchAsync from "../../utils/catchAsync";
import sendResponse from "../../utils/sendResponse";
import httpStatus from "http-status";
import { MessagesServices } from "./messages.service";
import ApiError from "../../errors/ApiError";
import { TMessages } from "./messages.interface";
import { IUserPayload } from "../../middlewares/roleGuard";
import mongoose, { Types } from "mongoose";
import {
  connectedUsers,
  io,
  sendInboxSocketStacks,
  sendSocketConversation,
  sendSocketNewMessage,
} from "../../utils/socket";
import { checkAIMode } from "../../utils/checkAIMode";
import { OpenAIService } from "../../utils/openAI";
import { UserModel } from "../user/user.model";
import { Messages } from "./messages.model";
import { cacheManagerService } from "../../utils/cacheManager";
import { formatConversationData } from "../../utils/formatted";

// Controller to handle sending a message in a conversation
const sendMessage = catchAsync(async (req: Request, res: Response) => {
  // Extract conversation ID and message content from request body
  const { conversation, messages } = req.body;
  if (!conversation) {
    // If conversation ID is missing, throw an error
    throw new ApiError(httpStatus.BAD_REQUEST, "Missing conversation");
  }

  // Get the authenticated user's ID
  const user = req.user as IUserPayload;
  const userId = user.id;

  // Run AI mode check and image processing in parallel for efficiency
  const [checkMyMode, image] = await Promise.all([
    checkAIMode(conversation, new mongoose.Types.ObjectId(userId)),
    processImage(req.file),
  ]);

  // If AI mode is active for the sender, prevent sending a message
  if (checkMyMode) {
    throw new ApiError(httpStatus.BAD_REQUEST, "AI mode is active.");
  }
  // Ensure at least a message or an image is provided
  if (!req.file && !messages) {
    throw new ApiError(httpStatus.BAD_REQUEST, "Missing message content");
  }

  // Construct the message object to be saved
  const body: TMessages = {
    ...req.body,
    sender: userId,
    image,
  };

  // Save the message using the service layer
  const result: any = await MessagesServices.sendMessage(body);

  // Immediately send a success response to the client
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Message sent successfully!",
    data: result,
  });

  // Perform background tasks (socket notification, AI reply) without blocking the client
  setImmediate(async () => {
    try {
      // Notify conversation participants of the new message via socket

      await sendSocketNewMessage({
        sender_name: result?.message?.receiver?.name || "Unknown",
        sender: result?.message?.receiver?._id?.toString(),
        image: result?.message?.image,
        conversation: conversation.toString(),
        messages: messages,
        result,
      });

      // Check if the receiver has AI mode enabled
      const receiverId = result?.message?.reciver?._id;
      // console.log(conversation, receiverId);
      if (receiverId) {
        const checkReciverMode = await checkAIMode(
          conversation,
          new mongoose.Types.ObjectId(receiverId)
        );

        if (checkReciverMode) {
          // console.log(receiverId);
          const user =
            await UserModel.findById(receiverId).select("user_mood name");
          const reply = await OpenAIService.genarateAiResponses({
            chatQuery: {
              $or: [{ senderId: receiverId }, { reciverId: receiverId }],
            },
            sender_name: result?.message?.reciver?.name,
            receiver_name: result?.message?.sender?.name,
            journalQuery: { userId: receiverId },
            moods: user?.user_mood || "Unknown",
            relation: result?.relationData?.relation || "Unknown",
            textPrompt: messages,
            userId: receiverId,
          });

          // Emit the AI-generated response to both sender and receiver
          emitToBothParties(
            conversation,
            {
              sender_name: result?.message?.reciver?.name || "Unknown",
              sender_id: receiverId,
              content: reply || "",
              image: image?.publicFileURL || "",
              
            },
            userId,
            receiverId,
            result,
            req.body
          );

        }
      }
    } catch (error) {
      // Log any errors that occur during background processing
      console.error("Background processing error:", error);
    }
  });
});

// Helper functions
function processImage(file?: Express.Multer.File) {
  if (!file) return undefined;
  return {
    path: `public/images/${file.filename}`,
    publicFileURL: `/images/${file.filename}`,
  };
}

function emitToBothParties(
  conversation: string,
  messageData: any,
  senderId: string,
  receiverId: string,
  result: any,
  body: any
) {
  const senderSocket = connectedUsers.get(senderId?.toString());
  const receiverSocket = connectedUsers.get(receiverId?.toString());
  // console.log(senderSocket, receiverSocket);
  const socketPayload = {
    ...messageData,
    activeStatus: true,
    readBy: true,
    time: new Date(),
  };

  if (senderSocket) {
    io.to(senderSocket.socketID).emit(
      `getNewMessage-${conversation}`,
      socketPayload
    );
  }
  if (receiverSocket) {
    io.to(receiverSocket.socketID).emit(
      `getNewMessage-${conversation}`,
      socketPayload
    );
  }
  Messages.create({
    conversation: new mongoose.Types.ObjectId(body?.conversation),
    sender: new mongoose.Types.ObjectId(messageData?.sender_id),
    reciver: new mongoose.Types.ObjectId(senderId),
    messages: messageData?.content,
    image: { publicFileURL: "", path: "" }, // Fix: provide empty object for image
  }).then(async (message) => {
    // Use the same safeSender/safeReceiver logic as in messages.service
    const safeSender = messageData?.sender_id?.toString();
    const safeReceiver = senderId?.toString();
    await MessagesServices.updateConversation(
      new mongoose.Types.ObjectId(body?.conversation),
      new mongoose.Types.ObjectId(safeReceiver),
      new mongoose.Types.ObjectId(safeSender),
      message?._id
    );
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
  });
}
const aimode = catchAsync(async (req: Request, res: Response) => {
  const { conversationId, status } = req.body;
  if (!conversationId) {
    throw new ApiError(httpStatus.BAD_REQUEST, "conversationId is required");
  }

  const userId = (req.user as IUserPayload).id;
  const result = await MessagesServices.updateAiStatus(
    conversationId,
    status,
    new mongoose.Types.ObjectId(userId)
  );
  await cacheManagerService.setConversation({ conversationId, data: result });
  return sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "AI Mode updated",
    data: result,
  });
});
const messageStack = catchAsync(async (req: Request, res: Response) => {
  try {
    const user = (req.user as IUserPayload).id;
    const userObjectId =
      typeof user === "string" ? new mongoose.Types.ObjectId(user) : user;
    const unreadMessage = await MessagesServices.messageStack({
      $or: [
        {
          sender: userObjectId,
        },
        {
          reciver: userObjectId,
        },
      ],
      readBy: { $ne: userObjectId },
    });
    const requestStack = await MessagesServices.requestStack({
      reciveBy: new mongoose.Types.ObjectId(user),
      status: "requested",
      relation: "friend",
    });
    const friendStack = await MessagesServices.requestStack({
      $or: [
        {
          reciveBy: user,
        },
        {
          sendBy: user,
        },
      ],
      status: "accepted",
      relation: "friend",
    });
    // Send final response
    return sendResponse(res, {
      statusCode: httpStatus.OK,
      success: true,
      message: "Inbox stack count",
      data: { unreadMessage, requestStack, friendStack },
    });
  } catch (error: any) {
    throw new ApiError(
      error.statusCode || 500,
      error.message ||
        "Unexpected error occurred while retrieving user information."
    );
  }
});
export const MessagesController = { sendMessage, aimode, messageStack };
