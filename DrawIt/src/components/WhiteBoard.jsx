import { v1 as uuid } from "uuid";
import socket from "../services/Socket";
import { useRef, useEffect, useState } from "react";
import { Canvas, Rect, Circle, PencilBrush, ActiveSelection } from "fabric";

const WhiteBoard = () => {
  const canvaRef = useRef(null);
  const [canva, setCanva] = useState(null);
  const [drawing, setDrawing] = useState(false);
  const [brushColor, setBrushColor] = useState("");
  const [shapeColor, setShapeColor] = useState("");

  const emitAdd = (obj) => {
    socket.emit("object-added", obj);
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
    socket.emit("object-modified", {
      obj: essentialProps,
      id: obj.id,
    });
  };

  const addObj = () => {
    if (canva) {
      socket.off("new-add");
      socket.on("new-add", (data) => {
        console.log(data);
        const { obj, id } = data;
        if (obj.type === "Rect") {
          const rect = new Rect({
            height: obj.height,
            width: obj.width,
            top: obj.top,
            left: obj.left,
            fill: obj.fill,
          });
          rect.set({ id: id });
          canva.add(rect);
          canva.renderAll();
        } else if (obj.type === "Circle") {
          const circle = new Circle({
            radius: obj.radius,
            fill: obj.fill,
            top: obj.top,
            left: obj.left,
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
      console.log(data);
      const { obj, id } = data;
      canva.getObjects().forEach((object) => {
        if (object.id === id) {
          object.scaleX = obj.scaleX;
          object.scaleY = obj.scaleY;
          object.left = obj.left;
          object.top = obj.top;
          object.angle = obj.angle;
          object.setCoords();
          canva.renderAll();
        }
      });
    });
  };

  useEffect(() => {
    if (canva) {
      let isFromSocket = false;

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
        console.log("object moved");
        console.log(options);
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
      emitAdd({ obj: rect, id: rect.id });
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
      emitAdd({ obj: circle, id: circle.id });
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
      <div className="color-input">
        <input type="color" onChange={(e) => setBrushColor(e.target.value)} />
        <div className="after-container"></div>
      </div>

      <div className="shapes-color-input">
        <input type="color" onChange={(e) => setShapeColor(e.target.value)} />
        <div className="shapes-after-container"></div>
      </div>
      <button
        className="clear-canvas-butt"
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
