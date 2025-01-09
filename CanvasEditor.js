import React, { useState } from "react";

const CanvasDesigner = () => {
  const [elements, setElements] = useState([]);
  const [draggingId, setDraggingId] = useState(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });

  const handleDrop = (e) => {
    e.preventDefault();
    const type = e.dataTransfer.getData("type");
    const canvasRect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - canvasRect.left - dragOffset.x;
    const y = e.clientY - canvasRect.top - dragOffset.y;

    if (type) {
      const newElement = {
        id: Date.now(),
        type,
        x,
        y,
        width: type === "table" ? 150 : 100,
        height: type === "table" ? 100 : 50,
        content: type === "text" ? "Edit me" : "",
        rows: 2,
        cols: 2,
        tableData: Array(2)
          .fill(null)
          .map(() => Array(2).fill("Cell")), // Default table data
        label: "Label",
      };
      setElements([...elements, newElement]);
    } else if (draggingId) {
      setElements((prev) =>
        prev.map((el) =>
          el.id === draggingId ? { ...el, x, y } : el
        )
      );
      setDraggingId(null);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  const handleDragStart = (e, id) => {
    const element = elements.find((el) => el.id === id);
    const canvasRect = e.currentTarget.parentNode.getBoundingClientRect();
    const offsetX = e.clientX - canvasRect.left - element.x;
    const offsetY = e.clientY - canvasRect.top - element.y;
    setDraggingId(id);
    setDragOffset({ x: offsetX, y: offsetY });
  };

  const modifyTable = (id, type) => {
    setElements((prev) =>
      prev.map((el) => {
        if (el.id === id) {
          if (type === "addRow") {
            const newTableData = [...el.tableData, Array(el.cols).fill("Cell")];
            return { ...el, rows: el.rows + 1, tableData: newTableData };
          } else if (type === "addCol") {
            const newTableData = el.tableData.map((row) => [...row, "Cell"]);
            return { ...el, cols: el.cols + 1, tableData: newTableData };
          }
        }
        return el;
      })
    );
  };

  const updateCellContent = (id, rowIdx, colIdx, content) => {
    setElements((prev) =>
      prev.map((el) => {
        if (el.id === id && el.type === "table") {
          const updatedTableData = el.tableData.map((row, rIdx) =>
            rIdx === rowIdx
              ? row.map((cell, cIdx) =>
                  cIdx === colIdx ? content : cell
                )
              : row
          );
          return { ...el, tableData: updatedTableData };
        }
        return el;
      })
    );
  };

  const generateHTML = () => {
    const html = elements
      .map((el) => {
        if (el.type === "text") {
          return `<div style="position: absolute; left: ${el.x}px; top: ${el.y}px; width: ${el.width}px; height: ${el.height}px;">${el.content}</div>`;
        } else if (el.type === "checkbox") {
          return `<div style="position: absolute; left: ${el.x}px; top: ${el.y}px;"><label><input type="checkbox" /> ${el.label}</label></div>`;
        } else if (el.type === "table") {
          const rows = el.tableData
            .map(
              (row) =>
                `<tr>${row
                  .map(
                    (cell) =>
                      `<td style="border: 1px solid #333; padding: 5px;">${cell}</td>`
                  )
                  .join("")}</tr>`
            )
            .join("");
  
          return `<div style="position: absolute; left: ${el.x}px; top: ${el.y}px; width: ${el.width}px; height: ${el.height}px;">
            <table style="border-collapse: collapse; width: 100%; height: 100%; border: 1px solid #333;">
              ${rows}
            </table>
          </div>`;
        }
        return "";
      })
      .join("");
  
    console.log(html);
    return html;
  };
  

  return (
    <div>
      <div
        style={{
          display: "flex",
          gap: "10px",
          marginBottom: "10px",
          border: "1px solid #ccc",
          padding: "10px",
          backgroundColor: "#f1f1f1",
        }}
      >
        <button
          draggable
          onDragStart={(e) => e.dataTransfer.setData("type", "text")}
        >
          Add Text
        </button>
        <button
          draggable
          onDragStart={(e) => e.dataTransfer.setData("type", "checkbox")}
        >
          Add Checkbox
        </button>
        <button
          draggable
          onDragStart={(e) => e.dataTransfer.setData("type", "table")}
        >
          Add Table
        </button>
        <button onClick={() => console.log(generateHTML())}>
          Generate HTML
        </button>
      </div>

      <div
        style={{
          position: "relative",
          width: "800px",
          height: "600px",
          border: "1px solid #ccc",
          backgroundColor: "#f9f9f9",
        }}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
      >
        {elements.map((el) => (
          <div
            key={el.id}
            style={{
              position: "absolute",
              left: el.x,
              top: el.y,
              width: el.width,
              height: el.height,
              border: el.type === "text" ? "1px dashed #333" : "none",
              backgroundColor: "#fff",
              cursor: "move",
            }}
            draggable
            onDragStart={(e) => handleDragStart(e, el.id)}
          >
            {el.type === "text" ? (
              <input
                type="text"
                value={el.content}
                onChange={(e) =>
                  setElements((prev) =>
                    prev.map((item) =>
                      item.id === el.id
                        ? { ...item, content: e.target.value }
                        : item
                    )
                  )
                }
                style={{
                  width: "100%",
                  height: "100%",
                  border: "none",
                  outline: "none",
                }}
              />
            ) : el.type === "checkbox" ? (
              <label>
                <input type="checkbox" />
                <input
                  type="text"
                  value={el.label}
                  onChange={(e) =>
                    setElements((prev) =>
                      prev.map((item) =>
                        item.id === el.id
                          ? { ...item, label: e.target.value }
                          : item
                      )
                    )
                  }
                  style={{
                    border: "none",
                    outline: "none",
                    marginLeft: "5px",
                  }}
                />
              </label>
            ) : el.type === "table" ? (
              <>
                <table
                  style={{
                    width: "100%",
                    height: "100%",
                    border: "1px solid #333",
                  }}
                >
                  {el.tableData.map((row, rowIdx) => (
                    <tr key={rowIdx}>
                      {row.map((cell, colIdx) => (
                        <td
                          key={colIdx}
                          style={{
                            border: "1px solid #ccc",
                            padding: "5px",
                          }}
                          contentEditable
                          suppressContentEditableWarning
                          onBlur={(e) =>
                            updateCellContent(el.id, rowIdx, colIdx, e.target.textContent)
                          }
                        >
                          {cell}
                        </td>
                      ))}
                    </tr>
                  ))}
                </table>
                <button onClick={() => modifyTable(el.id, "addRow")}>
                  Add Row
                </button>
                <button onClick={() => modifyTable(el.id, "addCol")}>
                  Add Column
                </button>
              </>
            ) : null}
          </div>
        ))}
      </div>
    </div>
  );
};

export default CanvasDesigner;
