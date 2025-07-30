// global.d.ts
import { Server as SocketIo } from "socket.io";

declare global {
  namespace NodeJS {
    interface Global {
      io: SocketIo;
    }
  }
}
