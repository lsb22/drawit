import Home from "./components/Home";
import { Routes, Route } from "react-router";
import WhiteBoard from "./components/WhiteBoard";

const App = () => {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/room/:roomName" element={<WhiteBoard />} />
    </Routes>
  );
};

export default App;
