import { Types } from "mongoose";
import { checkMessage } from "./checkRelation";
import { MessagesServices } from "../modules/messages/messages.service";

export const formatConversationData = async (
  conversationId: Types.ObjectId,
  userId: string
) => {
  const data: any = await MessagesServices.findConversation(conversationId);
  // console.log(data, "======================");
  const otherParticipant = data?.participants?.find(
    (participant: any) => participant?._id.toString() !== userId
  );

  const sender = data?.lastMessage?.sender?._id || userId;
  const recevier = data?.lastMessage?.reciver?._id || otherParticipant?._id;
  // console.log(sender, recevier, "=========================");
  const chatValidation = await checkMessage({ sender, recevier });

  return {
    _id: data?._id,
    lastMessage: data?.lastMessage?.messages || "No message yet.",
    name:
      data?.lastMessage?.receiver?.name || otherParticipant?.name || "Unknown",
    image:
      data?.lastMessage?.receiver?.image?.publicFileURL ||
      otherParticipant?.image?.publicFileURL ||
      "",
    sender_id: sender,
    reciver_id: recevier?.toString(),
    userName:
      data?.lastMessage?.receiver?.username ||
      otherParticipant?.username ||
      "Unknown",
    time: data?.updatedAt,
    ai_user: data?.ai_user?.includes(userId) || false,
    chatAccess: chatValidation?.status ? true : false,
    activeStatus:
      data?.lastMessage?.receiver?.activeStatus ||
      otherParticipant?.activeStatus,
  };
};
