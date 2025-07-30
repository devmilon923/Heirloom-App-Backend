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

const triggerlagacyQueue = async (job: Job) => {
  try {
    console.log(`🚦 Starting job ${job.id} for lagacy ${job.data.lagacyId}`);

    // Add your actual business logic here
    const { recipients, lagacyId } = job.data;
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
    const lagacy = await Legacys.findById(lagacyId);
    // Send push notification first
    try {
      if (lagacy) {
        await sendPushNotificationToMultiple(tokens, {
          body: `${lagacy?.messages}`,
          title: `New lagacy Message Alert`,
        });
        lagacy.triggerStatus = true;
        await lagacy.save();

        // Handle loop type - reschedule for next year
        if (lagacy.type === "loop") {
          // Calculate next trigger date (1 year later)
          const nextTriggerDate = new Date(lagacy.triggerDate);
          nextTriggerDate.setFullYear(nextTriggerDate.getFullYear() + 1);

          // Update lagacy with new trigger date
          lagacy.triggerDate = nextTriggerDate;
          lagacy.triggerStatus = false; // Reset for next trigger
          await lagacy.save();

          // Schedule new job
          const delay = nextTriggerDate.getTime() - Date.now();

          await LegacyQueues.triggerLegacyQueue({
            recipients,
            legacyId: lagacy._id,
            delay,
          });

          console.log(
            `🔄 Rescheduled loop lagacy ${lagacy._id} for ${nextTriggerDate}`
          );
        }
      } else {
        throw new ApiError(
          httpStatus.NOT_FOUND,
          "Not found that lagacy message"
        );
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
