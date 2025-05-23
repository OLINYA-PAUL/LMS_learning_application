"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.initialiseSocketIO = void 0;
// Import and rename the Socket.IO server class for use
const socket_io_1 = require("socket.io");
/**
 * Initializes the Socket.IO server and attaches it to the given HTTP server
 * @param server - The HTTP server to attach Socket.IO to
 */
const initialiseSocketIO = (server) => {
    // Create a new instance of Socket.IO server bound to the HTTP server
    const io = new socket_io_1.Server(server);
    // Listen for new client connections
    io.on("connection", (socket) => {
        console.log("A user connected");
        // Listen for "notification" events from the connected client
        socket.on("notification", (data) => {
            // Immediately emit the received data back to the same client
            socket.emit("notification", data);
        });
        // Listen for client disconnection
        socket.on("disconnect", () => {
            console.log("A user disconnected");
        });
    });
};
exports.initialiseSocketIO = initialiseSocketIO;
