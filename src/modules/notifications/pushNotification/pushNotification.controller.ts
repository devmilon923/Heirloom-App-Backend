// pushNotification.ts
import admin from "firebase-admin";

import { readFileSync } from "fs";

import { INotificationPayload } from "../notification.interface";
import ApiError from "../../../errors/ApiError";
import { FIREBASE_SERVICE_ACCOUNT_PATH } from "../../../config";

// Read and parse the Firebase service account JSON file
const serviceAccountBuffer = readFileSync(
  FIREBASE_SERVICE_ACCOUNT_PATH,
  "utf8",
);
const serviceAccount = JSON.parse(serviceAccountBuffer);

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
}

export const sendPushNotification = async (
  fcmToken: string,
  payload: INotificationPayload,
): Promise<string> => {
  const message = {
    token: fcmToken,
    notification: {
      title: payload.title,
      body: payload.body,
    },
  };
  console.log(message, "message");
  try {
    const response = await admin.messaging().send(message);
    console.log("Push notification sent successfully:", response);
    return response;
  } catch (error) {
    console.error("Error sending push notification:", error);
    throw new ApiError(500, "Error sending push notification");
  }
};

// Fallback helper for sending notifications to multiple tokens
export const sendPushNotificationToMultiple = async (
  tokens: string[],
  payload: INotificationPayload,
): Promise<any> => {
  try {
    // Filter out empty or invalid tokens
    const validTokens = tokens.filter(
      (token) => typeof token === "string" && token.trim() !== "",
    );
    if (!validTokens.length) {
      throw new ApiError(400, "No valid FCM tokens provided");
    }
    const message = {
      tokens: validTokens,
      notification: {
        title: payload.title,
        body: payload.body,
      },
    };
    // Use sendEachForMulticast for native multiple notification support
    const response = await admin.messaging().sendEachForMulticast(message);
    console.log("Push notifications sent successfully to multiple:", response);
    return response;
  } catch (error) {
    console.error("Error sending push notifications:", error);
    throw error;
  }
};
