import express from "express";
import { createServer } from "http";
import { Server } from "socket.io";
import cors from "cors";

const app = express();
const server = createServer(app);
app.use(cors());
app.use(express.json());

const rooms = {}; // stores rooms, with users
const roomList = []; // list of rooms
const roomData = new Map();

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
    // joins user to a specific room
    socket.join(roomName);
    rooms[roomName].users[socket.id] = userName; // add the user to the respective room
    socket.to(roomName).emit("user-connected", userName); // emit to all users except the current user in that room
  });

  socket.on("object-added", (roomName, data) => {
    // communicates object addition to all users of a specific room
    const { obj, id } = data;
    const newObj = JSON.parse(obj);
    if (!roomData.has(roomName)) roomData.set(roomName, {});
    roomData.get(roomName)[id] = newObj;
    socket.to(roomName).emit("new-add", data);
  });

  socket.on("object-modified", (roomName, data) => {
    // communicates object modification to all users of a specific room
    const { obj, id } = data;
    const newObj = JSON.parse(obj);
    if (!roomData.has(roomName)) roomData.set(roomName, {});
    roomData.get(roomName)[id] = newObj;
    socket.to(roomName).emit("new-modification", data);
  });

  socket.on("disconnect", () => {
    // removes users from all their rooms
    const arr = getUserRooms(socket);
    arr.forEach((room) => {
      socket.to(room).emit("user-disconnected", rooms[room].users[socket.id]);
      delete rooms[room].users[socket.id];
    });
  });
});

function getUserRooms(socket) {
  const temp = Object.entries(rooms);
  if (temp.length === 0) return [];
  const res = [];

  for (let i = 0; i < temp.length; i++) {
    const roomName = temp[i][0];
    if (rooms[roomName].users[socket.id] !== null) res.push(roomName); // list all the rooms where user exists
  }
  return res;
}

app.post("/room", (req, res) => {
  if (!req.body) return res.status(400).json({ message: "Room name is empty" });
  const { roomName } = req.body;

  if (rooms[roomName] !== undefined) {
    return res
      .status(200)
      .json({ message: "Already exists", roomName: roomName });
  }

  if (!roomList.includes(roomName)) roomList.push(roomName);
  if (!roomData.has(roomName)) roomData.set(roomName, {});

  rooms[roomName] = { users: {} };
  io.emit("room-created", roomName); // emits for everyone including the current user
  res.status(200).json({
    message: "Room created successfully",
    roomName: roomName,
  });
});

app.get("/rooms", (req, res) => {
  res.status(200).json({ rooms: roomList });
});

app.get("/room/data/:roomName", (req, res) => {
  const { roomName } = req.params;
  if (!roomData.has(roomName))
    return res.status(404).json({ message: "Room is empty" });
  res.status(200).json({ data: roomData.get(roomName) });
});

server.listen(3000, () => console.log("server stated on port 3000"));
