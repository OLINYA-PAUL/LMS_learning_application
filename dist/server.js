"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
require("dotenv").config();
const databaseDB_1 = require("./utils/databaseDB");
const app_1 = __importDefault(require("./app"));
const cloudinary_1 = require("./utils/cloudinary");
const http_1 = __importDefault(require("http"));
const socket_IO_1 = require("./scoketIOserver/socket.IO");
const server = http_1.default.createServer(app_1.default);
(0, cloudinary_1.cloudinaryConfig)();
(0, socket_IO_1.initialiseSocketIO)(server);
server.listen(process.env.PORT, async () => {
    try {
        if (process.env.MONGODB_URL)
            await (0, databaseDB_1.connectDbUrl)(process.env.MONGODB_URL).then((data) => {
                // console.log({ DATATA: data });
                console.log(`Server is listening to ${process.env.PORT} - ${data.connection.host}`);
            });
    }
    catch (error) {
        if (error instanceof Error) {
            console.log(error.message);
        }
        else {
            console.log("An unexpected error occurred:", error);
        }
    }
});
