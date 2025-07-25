import { useRef } from "react";
import socket from "../services/Socket";
import apiClient from "../services/apiClient";
import { useNavigate } from "react-router";
import { useEffect } from "react";
import { useState } from "react";

const Home = () => {
  const roomRef = useRef(null);
  const userRef = useRef(null);
  const navigate = useNavigate();
  const [rooms, setRooms] = useState([]);
  const [totalRooms, setTotalRooms] = useState(0);

  const handleFormSibmit = (e) => {
    e.preventDefault();
    if (!userRef.current || !roomRef.current) return;

    const userName = userRef.current.value;
    const roomName = roomRef.current.value;

    apiClient
      .post("/room", {
        roomName: roomName,
      })
      .then(() => {
        socket.roomName = roomName;
        socket.emit("new-user", roomName, userName);
        navigate("/room/" + roomName);
      })
      .catch((err) => console.log(err));

    roomRef.current.value = "";
    userRef.current.value = "";
  };

  const handleExistingRoomClick = (roomName) => {
    const userName = prompt("Enter your Name");
    socket.emit("new-user", roomName, userName);
    navigate("/room/" + roomName);
  };

  useEffect(() => {
    // to get existing rooms list
    apiClient
      .get("/rooms")
      .then((res) => setRooms(res.data.rooms))
      .catch((err) => console.log(err.data));
  }, [totalRooms]);

  useEffect(() => {
    socket.on("room-created", (data) => {
      // to increment the room number
      setTotalRooms((prev) => prev + 1);
    });

    return () => {
      socket.off("room-created");
    };
  }, []);

  return (
    <div className="home">
      <h1 className="text-amber-300 text-5xl text-center mt-2">Welcome</h1>
      <div className="text-3xl flex flex-col pl-1 gap-y-5">
        <div className="flex flex-col gap-y-5">
          <div className="">Create new Room</div>
          <form
            action=""
            className="text-[20px] flex flex-col gap-y-3"
            onSubmit={handleFormSibmit}
          >
            <div className="flex gap-4">
              <label htmlFor="userName">Enter your name: </label>
              <input
                type="text"
                placeholder="User Name"
                id="userName"
                className="border border-white rounded-md px-2 text-sm"
                ref={userRef}
                required
              />
              <label htmlFor="roomName">Enter Room Name: </label>
              <input
                className="border border-white rounded-md px-2 text-sm"
                type="text"
                id="roomName"
                ref={roomRef}
                placeholder="Room Name"
                required
              />
            </div>
            <button
              className="bg-gray-400 text-black rounded-md text-sm p-2 w-[200px] cursor-pointer hover:bg-gray-100"
              type="submit"
            >
              Create Room
            </button>
          </form>
        </div>
        <div className="">Join a existing Room</div>
        <ul>
          {rooms.length !== 0 &&
            rooms.map((room, idx) => (
              <li key={idx}>
                <button onClick={() => handleExistingRoomClick(room)}>
                  {room}
                </button>
              </li>
            ))}
        </ul>
      </div>
    </div>
  );
};

export default Home;
