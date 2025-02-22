import { Canvas, Rect, Circle, PencilBrush } from "fabric";
import { useRef, useEffect, useState } from "react";

const Home = () => {
  const canvaRef = useRef(null);
  const [canva, setCanva] = useState(null);
  const [drawing, setDrawing] = useState(false);

  useEffect(() => {
    if (canvaRef.current) {
      const newCanvas = new Canvas(canvaRef.current, {
        width: window.innerWidth,
        height: window.innerHeight,
      });

      setCanva(newCanvas);
      newCanvas.freeDrawingBrush = new PencilBrush(newCanvas);
      newCanvas.freeDrawingBrush.color = "white";
      newCanvas.freeDrawingBrush.width = 5;
      newCanvas.backgroundColor = "black";
      newCanvas.renderAll();

      return () => {
        newCanvas.dispose();
      };
    }
  }, []);

  useEffect(() => {
    if (canva) {
      if (drawing) canva.isDrawingMode = true;
      else canva.isDrawingMode = false;
    }
  }, [drawing]);

  const addRectangle = () => {
    if (canva) {
      const rect = new Rect({
        fill: "skyblue",
        width: 100,
        height: 60,
        top: Math.random() * 600 + 1,
        left: Math.random() * 900 + 1,
      });

      canva.add(rect);
    }
  };

  const addCircle = () => {
    if (canva) {
      const circle = new Circle({
        fill: "skyblue",
        radius: 50,
        top: Math.random() * 600 + 1,
        left: Math.random() * 900 + 1,
      });

      canva.add(circle);
    }
  };

  const toggleDrawing = () => {
    if (canva) {
      setDrawing((prevVal) => !prevVal);
    }
  };

  return (
    <div>
      <canvas id="c" ref={canvaRef}></canvas>
      <div className="toolBar">
        <button className="rect" onClick={addRectangle}>
          {"[]"}
        </button>
        <button className="circ" onClick={addCircle}>
          {"O"}
        </button>
      </div>
      <button className="toggleDrawing" onClick={toggleDrawing}>
        {`Switch ${drawing ? "of" : "on"} drawing`}
      </button>
    </div>
  );
};

export default Home;
