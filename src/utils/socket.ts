import { Server as SocketIOServer, Socket } from "socket.io";
import { Server as HttpServer } from "http";

import mongoose, { Types } from "mongoose";

import { UserModel } from "../modules/user/user.model"; // User model

import { NotificationModel } from "../modules/notifications/notification.model";
import { INotification } from "../modules/notifications/notification.interface";

import express, { Application, NextFunction, Request, Response } from "express";

import { verifySocketToken } from "./JwtToken";
import ApiError from "../errors/ApiError";
import httpStatus from "http-status";
import { MessagesServices } from "../modules/messages/messages.service";
import { TMessages } from "../modules/messages/messages.interface";
const app: Application = express();

declare module "socket.io" {
  interface Socket {
    user?: {
      _id: string;
      name: string;
      email: string;
      role: string;
    };
  }
}

// Initialize the Socket.IO server
let io: SocketIOServer;
export const connectedUsers = new Map<string, { socketID: string }>();
export const connectedClients = new Map<string, Socket>();
const sendResponse = (
  statusCode: number,
  status: string,
  message: string,
  data?: any
) => ({
  statusCode,
  status,
  message,
  data,
});

export const initSocketIO = async (server: HttpServer): Promise<void> => {
  console.log("🔧 Initializing Socket.IO server 🔧");

  const { Server } = await import("socket.io");

  io = new Server(server, {
    cors: {
      origin: "*", // Replace with your client's origin
      methods: ["GET", "POST"],
      allowedHeaders: ["my-custom-header"], // Add any custom headers if needed
      credentials: true,
    },
  });

  console.log("🎉 Socket.IO server initialized! 🎉");

  // Authentication middleware: now takes the token from headers.
  io.use(async (socket: Socket, next: (err?: any) => void) => {
    // Extract token from headers (ensure your client sends it in headers)
    const token =
      (socket.handshake.auth.token as string) ||
      (socket.handshake.headers.token as string);

    if (!token) {
      return next(
        new ApiError(
          httpStatus.UNAUTHORIZED,
          "Authentication error: Token missing"
        )
      );
    }
    console.log(token, "===========incoming token");
    const userDetails = verifySocketToken(token);
    if (!userDetails) {
      return next(new Error("Authentication error: Invalid token"));
    }

    const user = await UserModel.findById(userDetails.id);
    if (!user) {
      return next(new Error("Authentication error: User not found"));
    }

    socket.user = user;
    next();
  });

  io.on("connection", (socket: Socket) => {
    console.log(connectedUsers, "============when connected");
    console.log("Socket just connected:", {
      socketId: socket.id,
      userId: socket.user?._id,
      name: socket.user?.name,
      email: socket.user?.email,
      role: socket.user?.role,
    });
    MessagesServices.updateActiveStatus(
      true,
      new Types.ObjectId(socket.user?._id)
    );
    // Automatically register the connected user to avoid missing the "userConnected" event.
    if (socket.user && socket.user._id) {
      connectedUsers.set(socket.user._id.toString(), { socketID: socket.id });
      console.log(
        `Registered user ${socket.user._id.toString()} with socket ID: ${socket.id}`
      );
    }

    // (Optional) In addition to auto-registering, you can still listen for a "userConnected" event if needed.
    socket.on("userConnected", ({ userId }: { userId: string }) => {
      connectedUsers.set(userId, { socketID: socket.id });
      console.log(`User ${userId} connected with socket ID: ${socket.id}`);
    });

    socket.on("disconnect", () => {
      const token =
        (socket.handshake.auth.token as string) ||
        (socket.handshake.headers.token as string);
      console.log(token, "==========logout");

      console.log(
        `${socket.user?.name} || ${socket.user?.email} || ${socket.user?._id} just disconnected with socket ID: ${socket.id}`
      );
      MessagesServices.updateActiveStatus(
        false,
        new Types.ObjectId(socket.user?._id)
      );

      for (const [key, value] of connectedUsers.entries()) {
        if (value.socketID === socket.id) {
          connectedUsers.delete(key);
          break;
        }
      }
    });
  });
};

// Export the Socket.IO instance
export { io };
export const sendSocketConversation = (
  payload: {
    _id: Types.ObjectId;
    lastMessage: string;
    name: string;
    image: string;
    sender_id: Types.ObjectId;
    reciver_id: Types.ObjectId;
    userName: string;
    time: Date;
    ai_user: boolean;
    activeStatus: boolean;
  },
  sendTo: Types.ObjectId[]
) => {
  sendTo.length
    ? sendTo?.map((user) => {
        const userSocket = connectedUsers.get(user?.toString());

        if (userSocket) {
          io.to(userSocket.socketID).emit(`getConversation`, payload);
        } else {
          console.log("User not online");
        }
      })
    : console.log("No user found.");
};
export const sendInboxSocketStacks = async (sendTo: string) => {
  const user = sendTo;
  const unreadMessage = await MessagesServices.messageStack({
    $or: [
      {
        sender: user,
      },
      {
        reciver: user,
      },
    ],
    readBy: { $ne: user },
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
  const userSocket = connectedUsers.get(user?.toString());
  if (userSocket) {
    io.to(userSocket.socketID).emit(`getInboxStacks`, {
      unreadMessage,
      requestStack,
      friendStack,
    });
  } else {
    console.log("User not online");
  }
};
export const sendSocketNewMessage = async ({
  sender_name,
  sender,
  image,
  messages,
  conversation,
  result,
}: {
  sender_name: string;
  sender: string;
  image: {
    path: string;
    publicFileURL: string;
  };
  messages: string;
  conversation: string;
  result: any;
}) => {
  if (!conversation) {
    throw new ApiError(httpStatus.BAD_REQUEST, "missing conversation");
  }
  const reciverId = result?.message?.reciver._id
    ? result?.message?.reciver?._id?.toString()
    : undefined;
  if (!reciverId) {
    console.log("Receiver ID is undefined");
    return;
  }
  const userSocket = connectedUsers.get(reciverId);
  if (userSocket) {
    io.to(userSocket.socketID).emit(`getNewMessage-${conversation}`, {
      sender_name: sender_name,
      sender_id: sender,
      activeStatus: true,
      content: messages || "",
      image: image?.publicFileURL || "",
      readBy: true,
      time: result?.createdAt || null,
    });
  } else {
    console.log("User not online");
  }
};
export const emitNotification = async ({
  managerId,
  userId,
  userMsg,
  adminMsg,
  managerMsg,
}: {
  managerId?: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  userMsg?: string;
  adminMsg?: string;
  managerMsg?: string;
}): Promise<void> => {
  if (!io) {
    throw new Error("Socket.IO is not initialized");
  }

  // Get the socket ID of the specific user
  const userSocket = connectedUsers.get(userId.toString());

  // Get admin IDs
  const admins = await UserModel.find({ role: "admin" }).select("_id");
  const adminIds = admins.map((admin) => admin._id.toString());

  // Notify the specific user
  if (userMsg && userSocket) {
    io.to(userSocket.socketID).emit(`notification`, {
      userId,
      message: userMsg,
    });
  }

  // Notify all admins
  if (adminMsg) {
    adminIds.forEach((adminId) => {
      const adminSocket = connectedUsers.get(adminId);
      if (adminSocket) {
        io.to(adminSocket.socketID).emit(`notification`, {
          adminId,
          message: adminMsg,
        });
      }
    });
  }

  // Notify the specific manager
  if (managerMsg && managerId) {
    const managerSocket = connectedUsers.get(managerId.toString());
    if (managerSocket) {
      io.to(managerSocket.socketID).emit(`notification`, {
        managerId,
        message: managerMsg,
      });
    }
  }

  // Save notification to the database
  await NotificationModel.create<INotification>({
    userId,
    userMsg,
    managerId: managerId,
    adminId: adminIds,
    adminMsg,
    managerMsg,
  });
};

// Helper to stream assistant chat responses to the correct user socket
export const sendSocketAssistantStream = (userId: string, content: string) => {
  const userSocket = connectedUsers.get(userId);
  if (userSocket) {
    io.to(userSocket.socketID).emit("assistant-stream", { content });
  }
};
