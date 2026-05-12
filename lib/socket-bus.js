/* eslint-disable @typescript-eslint/no-require-imports */
const { EventEmitter } = require("events");

const globalForSocketBus = globalThis;

const notificationBus =
  globalForSocketBus.__notificationBus ?? new EventEmitter();

if (!globalForSocketBus.__notificationBus) {
  notificationBus.setMaxListeners(50);
  globalForSocketBus.__notificationBus = notificationBus;
}

function emitUserNotification(userId, notification, unreadCount) {
  notificationBus.emit("notification:new", {
    userId,
    notification,
    unreadCount,
  });
}

module.exports = {
  notificationBus,
  emitUserNotification,
};
