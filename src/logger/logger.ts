// import { createLogger, format, transports } from "winston";
// import DailyRotateFile from "winston-daily-rotate-file";
// import path from "path";

// const logger = createLogger({
//   level: "info",
//   format: format.combine(
//     format.timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),
//     format.errors({ stack: true }),
//     format.splat(),
//     format.json(),
//   ),
//   defaultMeta: { service: "user-service" },
//   transports: [
//     // Write all logs with level `error` and below to `error.log`
//     new DailyRotateFile({
//       filename: path.join("logs", "error-%DATE%.log"),
//       datePattern: "YYYY-MM-DD",
//       level: "error",
//     }),
//     // Write all logs with level `info` and below to `combined.log`
//     new DailyRotateFile({
//       filename: path.join("logs", "combined-%DATE%.log"),
//       datePattern: "YYYY-MM-DD",
//     }),
//     // Write logs to the console as well
//     new transports.Console({
//       format: format.combine(format.colorize(), format.simple()),
//     }),
//   ],
// });

// // If we're not in production, log to the `console` with the format: `${info.level}: ${info.message} JSON.stringify({ ...rest }) `
// if (process.env.NODE_ENV !== "production") {
//   logger.add(
//     new transports.Console({
//       format: format.combine(format.colorize(), format.simple()),
//     }),
//   );
// }

// export default logger;

//current
// import { createLogger, format, transports } from "winston";
// import DailyRotateFile from "winston-daily-rotate-file";
// import path from "path";
// import express, { Request, Response, NextFunction } from "express";
// import {
//   blue,
//   green,
//   greenBright,
//   magenta,
//   red,
//   yellow,
//   yellowBright,
// } from "colorette";

// export const logger = createLogger({
//   level: "info",
//   format: format.combine(
//     format.timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),
//     format.errors({ stack: true }),
//     format.splat(),
//     format.json(),
//   ),
//   transports: [
//     // Write all logs with level `error` and below to `error.log`
//     new DailyRotateFile({
//       filename: path.join("logs", "error-%DATE%.log"),
//       datePattern: "YYYY-MM-DD",
//       level: "error",
//     }),
//     // Write all logs with level `info` and below to `combined.log`
//     new DailyRotateFile({
//       filename: path.join("logs", "combined-%DATE%.log"),
//       datePattern: "YYYY-MM-DD",
//     }),
//     // Write logs to the console
//     new transports.Console({
//       format: format.combine(format.colorize(), format.simple()),
//     }),
//   ],
// });

// // Middleware to log requests and responses
// export const logHttpRequests = (
//   req: Request,
//   res: Response,
//   next: NextFunction,
// ) => {
//   const startTime = Date.now();

//   res.on("finish", () => {
//     const colorizeByStatusCode = (statusCode: number) => {
//       if (statusCode >= 200 && statusCode < 300) {
//         return green(statusCode.toString()); // Successful responses
//       } else if (statusCode >= 400 && statusCode < 500) {
//         return red(statusCode.toString()); // Client errors
//       } else if (statusCode >= 500) {
//         return yellow(statusCode.toString()); // Server errors
//       }
//       return blue(statusCode.toString()); // Default color
//     };
//     const colorizeByStatusUrl = (method: string) => {
//       if (method === "GET") {
//         return green(method); // Successful responses
//       } else if (method === "POST") {
//         return blue(method); // Client errors
//       } else if (method === "PATCH") {
//         return yellow(method); // Server errors
//       } else if (method === "PUT") {
//         return yellowBright(method); // Server errors
//       }
//       return red(method); // Default color
//     };
//     //  console.log(req)
//     logger.info({
//       message: ` Incoming Request ${colorizeByStatusUrl(req.method)} ${colorizeByStatusCode(res.statusCode)} ${magenta(req.originalUrl)} ${yellowBright(`${Date.now() - startTime} ms`)}`,
//       size: res.get("Content-Length") || 0,
//     });
//   });

//   next();
// };

import { createLogger, format, transports } from "winston";
import DailyRotateFile from "winston-daily-rotate-file";
import path from "path";
import express, { Request, Response, NextFunction } from "express";

import {
  blue,
  green,
  greenBright,
  magenta,
  magentaBright,
  red,
  yellow,
  yellowBright,
} from "colorette";

export const logger = createLogger({
  level: "info",
  format: format.combine(
    format.timestamp({ format: "DD-MM-YYYY HH:mm:ss" }),
    format.errors({ stack: true }),
    format.splat(),
    format.json(),
  ),
  transports: [
    new DailyRotateFile({
      filename: path.join("logs", "error-%DATE%.log"),
      datePattern: "YYYY-MM-DD",
      level: "error",
    }),
    new DailyRotateFile({
      filename: path.join("logs", "combined-%DATE%.log"),
      datePattern: "YYYY-MM-DD",
    }),
    new transports.Console({
      format: format.combine(format.colorize(), format.simple()),
    }),
  ],
});

// Middleware to log requests and responses with emojis and extra information
export const logHttpRequests = (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const startTime = Date.now();

  res.on("finish", () => {
    const colorizeByStatusCode = (statusCode: number) => {
      if (statusCode >= 200 && statusCode < 300) {
        return green(`${statusCode} 🎉`); // Successful responses
      } else if (statusCode >= 400 && statusCode < 500) {
        return red(`${statusCode} ⚠️`); // Client errors
      } else if (statusCode >= 500) {
        return yellow(`${statusCode} 🔥`); // Server errors
      }
      return blue(`${statusCode} ❗`); // Default color
    };
    const colorizeByMethod = (method: string) => {
      if (method === "GET") {
        return green(method + " 🔍"); // GET requests (read)
      } else if (method === "POST") {
        return blue(method + " ✏️"); // POST requests (create)
      } else if (method === "PATCH") {
        return yellow(method + " ✨"); // PATCH requests (update)
      } else if (method === "PUT") {
        return yellowBright(method + " 🛠️"); // PUT requests (replace)
      } else if (method === "DELETE") {
        return red(method + " ❌"); // DELETE requests (remove)
      }
      return magentaBright(method + " " + "Unknown 😢☹️"); // Default for unknown methods
    };

    // Log the request information with method, status, and response time in ms
    // logger.info({
    //   message: ` 🌐 Incoming Request: ${colorizeByMethod(req.method)} ${colorizeByStatusCode(res.statusCode)} ${magenta(req.originalUrl)} ⏱️ Response Time: ${yellowBright(`${Date.now() - startTime} ms`)}`,
    //   size: res.get("Content-Length") || 0,
    //   // additionalInfo: `🖥️ IP: ${req.ip} | Host: ${req.hostname} | User-Agent: ${req.get("User-Agent")}`,
    // });

    const clientIp = req.ip
      ? req.ip.startsWith("::ffff:")
        ? req.ip.substring(7)
        : req.ip
      : "Unknown IP";

    logger.info({
      message: `🖥️ IP: ${clientIp} 📅: ${new Date().toLocaleDateString("en-US", { weekday: "long" })} 🌐 Incoming Request: ${colorizeByMethod(req.method)} ${colorizeByStatusCode(res.statusCode)} ${magenta(req.originalUrl)} ⏱️ Response Time: ${yellowBright(`${Date.now() - startTime} ms`)}`,
      size: res.get("Content-Length") || 0,
    });
  });

  next();
};
