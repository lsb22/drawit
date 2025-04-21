import express from "express";
import { createServer } from "http";
import { Server } from "socket.io";

const app = express();
const server = createServer(app);
const io = new Server(server, {
  cors: {
    origin: ["http://localhost:5173"],
    methods: ["GET", "POST"],
    credentials: true,
    allowedHeaders: ["Content-Type", "Authorization"],
  },
  maxHttpBufferSize: 1e7,
});

io.on("connection", (socket) => {
  socket.on("object-added", (data) => {
    socket.broadcast.emit("new-add", data);
  });

  socket.on("object-modified", (data) => {
    socket.broadcast.emit("new-modification", data);
  });
});

server.listen(3000, () => console.log("server stated on port 3000"));
