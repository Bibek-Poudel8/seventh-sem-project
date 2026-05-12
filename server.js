/* eslint-disable @typescript-eslint/no-require-imports */
const { createServer } = require("http");
const next = require("next");
const { Server } = require("socket.io");
const { getToken } = require("next-auth/jwt");
const { notificationBus } = require("./lib/socket-bus");

const port = parseInt(process.env.PORT || "3000", 10);
const hostname = process.env.HOSTNAME || "localhost";
const dev =
  process.env.NODE_ENV !== "production" &&
  process.env.npm_lifecycle_event !== "start";

const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

app.prepare().then(() => {
  const httpServer = createServer((req, res) => {
    handle(req, res);
  });

  const io = new Server(httpServer, {
    path: "/api/socket",
  });

  io.use(async (socket, nextSocket) => {
    try {
      const token = await getToken({
        req: socket.request,
        secret:
          process.env.AUTH_SECRET ||
          process.env.NEXTAUTH_SECRET ||
          process.env.BETTER_AUTH_SECRET,
      });

      if (!token?.id) {
        nextSocket(new Error("Unauthorized"));
        return;
      }

      socket.data.userId = token.id;
      nextSocket();
    } catch (error) {
      nextSocket(error);
    }
  });

  io.on("connection", (socket) => {
    socket.join(`user:${socket.data.userId}`);
  });

  notificationBus.on("notification:new", (payload) => {
    io.to(`user:${payload.userId}`).emit("notification:new", {
      notification: payload.notification,
      unreadCount: payload.unreadCount,
    });
  });

  httpServer.listen(port, () => {
    console.log(
      `> Server listening at http://${hostname}:${port} as ${
        dev ? "development" : "production"
      }`
    );
  });
});
