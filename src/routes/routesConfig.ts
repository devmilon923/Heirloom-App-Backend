import { UserRoutes } from "../modules/user/user.route";
import { TermsRoutes } from "../modules/settings/Terms/Terms.route";
import { AboutRoutes } from "../modules/settings/About/About.route";
import { PrivacyRoutes } from "../modules/settings/privacy/Privacy.route";
import { NotificationRoutes } from "../modules/notifications/notification.route";
import { contactUsRoutes } from "../modules/contactUs/contactUs.route";
import { SupportRoutes } from "../modules/support/support.route";

import {
  AppInstruction,
  htmlRoute,
} from "../modules/settings/privacy/Privacy.controller";
import { BookMarkRoutes } from "../modules/BookMark/BookMark.route";
import { AdminRoutes } from "../modules/admin/admin.route";

import { ArticalsRoute } from "../modules/articals/articals.route";
import { JournalRoutes } from "../modules/journals/journals.route";
import { EnhanceRoutes } from "../modules/enhance/enhance.route";
import { MessageRoute } from "../modules/messages/messages.route";
import { FriendRoute } from "../modules/friends/friends.route";
import { ReportRoutes } from "../modules/report/report.route";
import { CommonRoute } from "../modules/common/common.route";
import { LegacyRoute } from "../modules/legacy/legacy.route";
import { AssistantRoutes } from "../modules/Assistant/assistantChat.route";

export const routesConfig = [
  { path: "/api/v1/auth", handler: UserRoutes },
  { path: "/api/v1/terms", handler: TermsRoutes },
  { path: "/api/v1/about", handler: AboutRoutes },
  { path: "/api/v1/privacy", handler: PrivacyRoutes },
  { path: "/api/v1/notification", handler: NotificationRoutes },
  { path: "/api/v1/contact-us", handler: contactUsRoutes },

  { path: "/api/v1/support", handler: SupportRoutes },

  { path: "/api/v1/bookmark", handler: BookMarkRoutes },
  { path: "/api/v1/admin", handler: AdminRoutes },
  { path: "/api/v1/journals", handler: JournalRoutes },
  { path: "/api/v1/message", handler: MessageRoute },
  { path: "/api/v1/ai", handler: EnhanceRoutes },
  { path: "/api/v1/friend", handler: FriendRoute },
  { path: "/api/v1/report", handler: ReportRoutes },
  { path: "/api/v1/common", handler: CommonRoute },
  { path: "/api/v1/legacy", handler: LegacyRoute },
  { path: "/api/v1/assistant", handler: AssistantRoutes },

  { path: "/api/v1/articals", handler: ArticalsRoute },

  //------>publishing app <--------------
  { path: "/privacy-policy-page", handler: htmlRoute },
  { path: "/app-instruction", handler: AppInstruction },
];
