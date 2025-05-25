// Import the HTTP module to create a server
import http from "http";

// Import and rename the Socket.IO server class for use
import { Server as socketIOServer } from "socket.io";
// import { Server as socketIOServer } from "socket.io";

/**
 * Initializes the Socket.IO server and attaches it to the given HTTP server
 * @param server - The HTTP server to attach Socket.IO to
 */
const initialiseSocketIO = (server: http.Server) => {
  // Create a new instance of Socket.IO server bound to the HTTP server
  const io = new socketIOServer(server);

  // Listen for new client connections
  io.on("connection", (socket: any) => {
    console.log("A user connected");

    // Listen for "notification" events from the connected client
    socket.on("notification", (data: any) => {
      // Immediately emit the received data back to the same client
      socket.emit("notification", data);
    });

    // Listen for client disconnection
    socket.on("disconnect", () => {
      console.log("A user disconnected");
    });
  });
};

// Export the server and the initializer for use in other files if needed
export { initialiseSocketIO };
