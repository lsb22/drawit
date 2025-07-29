import { v1 as uuid } from "uuid";
import socket from "../services/Socket";
import { useRef, useEffect, useState } from "react";
import { Canvas, Rect, Circle, PencilBrush } from "fabric";

const WhiteBoard = () => {
  const canvaRef = useRef(null);
  const [canva, setCanva] = useState(null);
  const [drawing, setDrawing] = useState(false);
  const [brushColor, setBrushColor] = useState("");
  const [shapeColor, setShapeColor] = useState("");
  let isFromSocket = false;

  const emitAdd = (obj) => {
    socket.emit("object-added", socket.roomName, obj);
  };

  const emitModify = (obj) => {
    const essentialProps = {
      left: obj.obj.left,
      top: obj.obj.top,
      scaleX: obj.obj.scaleX,
      scaleY: obj.obj.scaleY,
      angle: obj.obj.angle || 0,
      type: obj.obj.type,
    };
    socket.emit("object-modified", socket.roomName, {
      obj: JSON.stringify(essentialProps),
      id: obj.id,
    });
  };

  const addObj = () => {
    if (canva) {
      socket.off("new-add");
      socket.on("new-add", (data) => {
        const { obj, id } = data;
        const newObj = JSON.parse(obj);
        if (newObj.type === "rect") {
          const rect = new Rect({
            height: newObj.height,
            width: newObj.width,
            top: newObj.top,
            left: newObj.left,
            fill: newObj.fill,
          });
          rect.set({ id: id });
          canva.add(rect);
          canva.renderAll();
        } else if (newObj.type === "circle") {
          const circle = new Circle({
            radius: newObj.radius,
            fill: newObj.fill,
            top: newObj.top,
            left: newObj.left,
          });
          circle.set({ id: id });
          canva.add(circle);
          canva.renderAll();
        }
      });
    }
  };

  const modifyObj = () => {
    socket.on("new-modification", (data) => {
      isFromSocket = true;
      const { obj, id } = data;
      const newObj = JSON.parse(obj);
      canva.getObjects().forEach((object) => {
        if (object.id === id) {
          object.scaleX = newObj.scaleX;
          object.scaleY = newObj.scaleY;
          object.left = newObj.left;
          object.top = newObj.top;
          object.angle = newObj.angle;
          object.setCoords();
          canva.renderAll();
        }
      });
      setTimeout(() => {
        isFromSocket = false;
      }, 0);
    });
  };

  useEffect(() => {
    if (canva) {
      const handleObjectModified = (options) => {
        if (isFromSocket) {
          return;
        }
        if (options.target) {
          const modifiedObj = {
            obj: options.target,
            id: options.target.id,
          };
          emitModify(modifiedObj);
        }
      };

      const handleObjectMoving = (options) => {
        if (isFromSocket) {
          return;
        }
        if (options.target) {
          const modifiedObj = {
            obj: options.target,
            id: options.target.id,
          };
          emitModify(modifiedObj);
        }
      };

      canva.on("object:modified", handleObjectModified);
      canva.on("object:moving", handleObjectMoving);

      modifyObj();
      addObj();

      return () => {
        canva.off("object:moving", handleObjectMoving);
        canva.off("object:modified", handleObjectModified);

        socket.off("new-add");
        socket.off("new-modification");
      };
    }
  }, [canva]);

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
      loadExistingData();

      return () => {
        newCanvas.dispose();
      };
    }
  }, []);

  useEffect(() => {
    if (canva) {
      if (drawing) canva.isDrawingMode = true;
      else canva.isDrawingMode = false;
      canva.freeDrawingBrush.color = brushColor ? brushColor : "white";
    }
  }, [drawing, brushColor]);

  const addRectangle = () => {
    if (canva) {
      const rect = new Rect({
        fill: shapeColor ? shapeColor : "skyblue",
        width: 100,
        height: 60,
        top: Math.random() * 600 + 1,
        left: Math.random() * 900 + 1,
      });

      rect.set({ id: uuid() });
      canva.add(rect);
      canva.renderAll();
      const obj = {
        height: rect.height,
        width: rect.width,
        fill: rect.fill,
        top: rect.top,
        left: rect.left,
        type: rect.type,
      };
      emitAdd({ obj: JSON.stringify(obj), id: rect.id });
    }
  };

  const addCircle = () => {
    if (canva) {
      const circle = new Circle({
        fill: shapeColor ? shapeColor : "skyblue",
        radius: 50,
        top: Math.random() * 600 + 1,
        left: Math.random() * 900 + 1,
      });

      circle.set({ id: uuid() });
      canva.add(circle);
      canva.renderAll();
      const obj = {
        radius: circle.radius,
        top: circle.top,
        left: circle.left,
        fill: circle.fill,
        type: circle.type,
      };
      emitAdd({ obj: JSON.stringify(obj), id: circle.id });
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
      <div className="absolute top-[calc(50%-30px)] flex flex-col gap-2 rounded-[7px] left-[10px] p-[10px] bg-[#4024c0]">
        <button className="rect" onClick={addRectangle}>
          {"[]"}
        </button>
        <button className="circ" onClick={addCircle}>
          {"O"}
        </button>
      </div>
      <button
        className="absolute top-[20px] left-[10px] bg-gray-200 text-black rounded-md px-2 text-[16px] hover:opacity-80"
        onClick={toggleDrawing}
      >
        {`Switch ${drawing ? "of" : "on"} drawing`}
      </button>
      <div className="color-input">
        <input type="color" onChange={(e) => setBrushColor(e.target.value)} />
        <div className="after-container"></div>
      </div>

      <div className="shapes-color-input">
        <input type="color" onChange={(e) => setShapeColor(e.target.value)} />
        <div className="shapes-after-container"></div>
      </div>
      <button
        className="absolute top-[10px] right-[10px] bg-gray-200 text-black px-2 py-1 rounded-md active:scale-90 cursor-pointer"
        onClick={() => {
          canva.clear();
          canva.backgroundColor = "black";
        }}
      >
        clear canvas
      </button>
    </div>
  );
};

export default WhiteBoard;
