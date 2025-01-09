import React, { useState } from "react";

const CanvasDesigner = () => {
    const [elements, setElements] = useState([]);
    const [draggingId, setDraggingId] = useState(null);
    const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
    const [selectedElementId, setSelectedElementId] = useState(null);

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
                    .map(() => Array(2).fill("Cell")),
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

    const handleDragOver = (e) => e.preventDefault();

    const handleDragStart = (e, id) => {
        const element = elements.find((el) => el.id === id);
        const canvasRect = e.currentTarget.parentNode.getBoundingClientRect();
        const offsetX = e.clientX - canvasRect.left - element.x;
        const offsetY = e.clientY - canvasRect.top - element.y;
        setDraggingId(id);
        setDragOffset({ x: offsetX, y: offsetY });
    };

    const handleSelectElement = (id) => setSelectedElementId(id);

    const handleUpdateConfig = (field, value) => {
        setElements((prev) =>
            prev.map((el) =>
                el.id === selectedElementId ? { ...el, [field]: value } : el
            )
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
                    return `<div style="position: absolute; left: ${el.x}px; top: ${el.y}px; width: ${el.width}px; height: ${el.height}px; background-color: ${el.backgroundColor};">${el.content}</div>`;
                } else if (el.type === "table") {
                    const rows = el.tableData
                        .map(
                            (row) =>
                                `<tr>${row
                                    .map(
                                        (cell) =>
                                            `<td style="border: 1px solid #333; padding: 5px; background-color: ${el.backgroundColor};">${cell}</td>`
                                    )
                                    .join("")}</tr>`
                        )
                        .join("");
                    return `<div style="position: absolute; left: ${el.x}px; top: ${el.y}px; width: ${el.width}px; height: ${el.height}px; background-color: ${el.backgroundColor};">
                                <table style="width: 100%; height: 100%; border-collapse: collapse; border: 1px solid #333;">
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


    const selectedElement = elements.find((el) => el.id === selectedElementId);

    return (
        <div style={{ display: "flex", gap: "20px" }}>
            {/* Configuration Panel */}
            <div style={{ width: "200px", border: "1px solid #ccc", padding: "10px" }}>
                <h4>Configuration</h4>
                {selectedElement ? (
                    <>
                        <label>
                            Width (px):
                            <input
                                type="number"
                                value={selectedElement.width}
                                onChange={(e) => handleUpdateConfig("width", parseInt(e.target.value) || 0)}
                            />
                        </label>

                        <label>
                            Height (px):
                            <input
                                type="number"
                                value={selectedElement.height}
                                onChange={(e) => handleUpdateConfig("height", parseInt(e.target.value) || 0)}
                            />
                        </label>
                        <label>
                            Background color:
                            <input
                                type="color"
                                value={selectedElement?.backgroundColor || "#ffffff"}
                                onChange={(e) => {
                                    const newColor = e.target.value;
                                    setElements((prev) =>
                                        prev.map((el) =>
                                            el.id === selectedElement.id
                                                ? { ...el, backgroundColor: newColor }
                                                : el
                                        )
                                    );
                                }}
                            />
                        </label>
                    </>
                ) : (
                    <p>Select an item to configure</p>
                )}
                <button onClick={generateHTML}>Generate HTML</button>
            </div>

            {/* Canvas and Toolbar */}
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
                    <button draggable onDragStart={(e) => e.dataTransfer.setData("type", "text")}>
                        Add Text
                    </button>
                    <button draggable onDragStart={(e) => e.dataTransfer.setData("type", "checkbox")}>
                        Add Checkbox
                    </button>
                    <button draggable onDragStart={(e) => e.dataTransfer.setData("type", "table")}>
                        Add Table
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
                                backgroundColor: el.backgroundColor,
                                // backgroundColor: el.id === selectedElementId ? "#eef" : "#fff",
                                cursor: "move",
                            }}
                            draggable
                            onDragStart={(e) => handleDragStart(e, el.id)}
                            onClick={() => handleSelectElement(el.id)}
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
                                        backgroundColor: el.backgroundColor,
                                        width: "100%",
                                        height: "100%",
                                        border: "none",
                                        outline: "none",
                                    }}
                                />
                            ) : el.type === "checkbox" ? (
                                <label>
                                    <input type="checkbox" />
                                    {el.label}
                                </label>
                            ) : el.type === "table" ? (
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
                            ) : null}
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default CanvasDesigner;
