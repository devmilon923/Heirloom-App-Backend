import { Job } from "bull";
import {
  sendPushNotification,
  sendPushNotificationToMultiple,
} from "../../modules/notifications/pushNotification/pushNotification.controller";
import { UserModel } from "../../modules/user/user.model";
import mongoose from "mongoose";

import ApiError from "../../errors/ApiError";
import httpStatus from "http-status";
import { LegacyQueues } from "../queus/legacy.queus";
import { Legacys } from "../../modules/legacy/legacy.model";
import { emitNotification } from "../../utils/socket";
import { LegacyService } from "../../modules/legacy/legacy.service";

const triggerlagacyQueue = async (job: Job) => {
  try {
    console.log(`🚦 Starting job ${job.id} for lagacy ${job.data.legacyId}`);
    // Add your actual business logic here
    const { recipients, legacyId } = job.data;
    const objectIds = recipients?.map(
      (id: string) => new mongoose.Types.ObjectId(id)
    ); // convert string to ObjectId

    const users = await UserModel.find({
      _id: { $in: objectIds },
    }).select("name fcmToken");
    const tokens = users?.map((user) => {
      return user?.fcmToken !== "" && user?.fcmToken;
    });
    // Only fetch the lagacy once
    const lagacy: any = await Legacys.findById(legacyId).populate(
      "user",
      "name"
    );

    // Send push notification first
    try {
      if (lagacy) {
        console.log(lagacy);
        await sendPushNotificationToMultiple(tokens, {
          body: `Hey there! This message is from ${lagacy?.user?.name || "Someone"}, and here's what they said: 
${lagacy?.messages || "No message available."}`,
          title: `New lagacy Message Alert`,
        });

        lagacy.triggerStatus = true;
        await lagacy.save();
        recipients?.map(async (userId: any) => {
          const notificationPayload: any = {
            userId: new mongoose.Types.ObjectId(userId),
            userMsg: `Hey there! This message is from ${lagacy?.user?.name || "Someone"}, and here's what they said: 
${lagacy?.messages || "No message available."}`,
            adminMsg: "Someone recevied lagacy update.",
          };

          // Emit the notification.
          await emitNotification(notificationPayload);
        });
        if (lagacy.type === "loop") {
          const nextTriggerDate = new Date(lagacy.triggerDate);
          nextTriggerDate.setFullYear(nextTriggerDate.getFullYear() + 1);

          const result = await LegacyService.addLegacy({
            user: new mongoose.Types.ObjectId(lagacy?.user?._id),
            recipients,
            messages: lagacy?.messages,
            triggerDate: nextTriggerDate,
            type: lagacy?.type,
          });
          // Schedule new job
          const delay = nextTriggerDate.getTime() - Date.now();
          await LegacyQueues.triggerLegacyQueue({
            recipients,
            legacyId: result?._id,
            delay,
          });

          console.log(
            `🔄 Rescheduled loop lagacy ${result?._id} for ${nextTriggerDate}`
          );
        }
      }

      // Only update triggerStatus after successful push, use the already fetched doc
    } catch (error) {
      console.log(error);
    }
    return { success: true, recipientCount: recipients.length };
  } catch (error: any) {
    console.error(`❗ Job ${job.id} failed:`, error);

    // Enhanced error logging
    job.log(`Error details: ${error.message}`);
    job.log(`Stack trace: ${error.stack}`);

    // Add custom error properties if needed
    if (error?.code === "SOME_SPECIAL_ERROR") {
      job.log("Special error occurred");
    }

    throw error;
  }
};

export const BullProssess = { triggerlagacyQueue };
