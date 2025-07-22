import express from "express";
import { createServer } from "http";
import { Server } from "socket.io";
import cors from "cors";

const app = express();
const server = createServer(app);
app.use(cors());
app.use(express.json());

const rooms = {};

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
  socket.on("new-user", (roomName, userName) => {
    socket.join(roomName);
    console.log(rooms);
    rooms[roomName].users[socket.id] = userName; // add the user to the respective room
    socket.to(roomName).emit("user-connected", userName); // emit to all users except the current user in that room
  });

  socket.on("object-added", (roomName, data) => {
    socket.to(roomName).emit("new-add", data);
  });

  socket.on("object-modified", (roomName, data) => {
    socket.to(roomName).emit("new-modification", data);
  });
});

app.post("/room", (req, res) => {
  if (!req.body) return res.status(400).json({ message: "Room name is empty" });
  const { roomName } = req.body;

  if (rooms[roomName] !== undefined) {
    return res
      .status(200)
      .json({ message: "Already exists", roomName: roomName });
  }

  rooms[roomName] = { users: {} };
  io.emit("room-created", roomName); // emits for everyone including the current user
  res.status(200).json({
    message: "Room created successfully",
    roomName: roomName,
  });
});

server.listen(3000, () => console.log("server stated on port 3000"));
