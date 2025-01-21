import React, { useState, useRef } from "react";

const CanvasDesigner = () => {
    const [elements, setElements] = useState([]);
    const [draggingId, setDraggingId] = useState(null);
    const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
    const [selectedElementId, setSelectedElementId] = useState(null);
    const [showToolbar, setShowToolbar] = useState(false);
    const [toolbarPosition, setToolbarPosition] = useState({ x: 0, y: 0 });
    const [selectedCell, setSelectedCell] = useState(null);
    const [isEditing, setIsEditing] = useState(false);
    const [cursorRange, setCursorRange] = useState(null); // To save the cursor range
    const contentEditableRef = useRef(null);
    const [canvasHeight, setCanvasHeight] = useState(500); // Initial height of the canvas

    const updateCanvasHeight = () => {
        const bufferSpace = 50; // Buffer space to maintain at the bottom
        const bottomMostElement = elements.reduce((max, el) => {
            const elBottom = el.y + el.height; // Calculate element's bottom position
            return elBottom > max ? elBottom : max;
        }, 0);

        const newHeight = Math.max(bottomMostElement + bufferSpace, 500); // Minimum canvas height is 500
        setCanvasHeight(newHeight); // Set the canvas height
    };



    const handleDrop = (e) => {
        e.preventDefault();
        const type = e.dataTransfer.getData("type");
        const canvasRect = e.currentTarget.getBoundingClientRect();
        let x = e.clientX - canvasRect.left - dragOffset.x;
        let y = e.clientY - canvasRect.top - dragOffset.y;

        if (type) {
            const newElement = {
                id: Date.now(),
                type,
                x,
                y,
                width: type === "table" ? 200 : type === "checkbox" ? 20 : 100,
                height: type === "table" ? 71 : type === "checkbox" ? 20 : 50,
                content: type === "text" ? "Edit me" : "",
                rows: 2,
                cols: 2,
                tableData: Array(2)
                    .fill(null)
                    .map(() => Array(2).fill("Cell")),
                label: "Label",
            };
            setElements((prev) => {
                const newElements = [...prev, newElement];
                setTimeout(() => updateCanvasHeight(), 0); // Recalculate canvas height after state update
                return newElements;
            });
        }
        else if (draggingId) {
            setElements((prev) =>
                prev.map((el) =>
                    el.id === draggingId
                        ? {
                            ...el,
                            x: Math.max(0, Math.min(x, canvasRect.width - el.width)),
                            y: Math.max(0, Math.min(y, canvasRect.height - el.height)),
                        }
                        : el
                )
            );
            setDraggingId(null);
            setTimeout(updateCanvasHeight, 0); // Update canvas height
        }

    };

    const handleDragStart = (e, id) => {
        const element = elements.find((el) => el.id === id);
        const canvasRect = e.currentTarget.parentNode.getBoundingClientRect();
        const offsetX = e.clientX - canvasRect.left - element.x;
        const offsetY = e.clientY - canvasRect.top - element.y;
        setDraggingId(id);
        setDragOffset({ x: offsetX, y: offsetY });
    };

    const handleDragOver = (e) => e.preventDefault();

    const handleSelectElement = (e, id) => {
        const canvasRect = e.currentTarget.getBoundingClientRect();
        setSelectedElementId(id);
        setSelectedCell(null);
        setShowToolbar(true);
        setToolbarPosition({ x: e.clientX - canvasRect.left, y: e.clientY - canvasRect.top });
    };

    const handleUpdateConfig = (field, value) => {
        setElements((prev) =>
            prev.map((el) =>
                el.id === selectedElementId ? { ...el, [field]: value } : el
            )
        );
    };

    const generateHTML = () => {
        const html = elements
            .map((el) => {
                if (el.type === "text") {
                    return `<div style="position: absolute; left: ${el.x}px; top: ${el.y}px; width: ${el.width}px; background-color: ${el.backgroundColor};">${contentEditableRef.current.innerHTML}</div>`;
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
                    return `<div style="position: absolute; left: ${el.x}px; top: ${el.y}px; width: ${el.width}px; height: ${el.height}px;  background-color: ${el.backgroundColor};">
                                <table style="width: 100%; height: 100%; border-collapse: collapse;">
                                    ${rows}
                                </table>
                            </div>`;
                } else if (el.type === "checkbox") {
                    return `<div style="position: absolute; left: ${el.x}px; top: ${el.y}px; width: ${el.width}px; height: ${el.height}px;">
                                <input type="checkbox" ${el.checked ? "checked" : ""} />
                            </div>`;
                }
                return "";
            })
            .join("");
        console.log(html);
        return html;
    };

    const selectedElement = elements.find((el) => el.id === selectedElementId);

    const saveCursorPosition = () => {
        const selection = window.getSelection();
        if (selection.rangeCount > 0) {
            const range = selection.getRangeAt(0);
            setCursorRange(range);
        }
    };

    const syncContentToState = (el) => {
        const element = document.querySelector(`[data-id="${el.id}"]`);
        const content = element ? element.innerHTML : el.content;
        const height = element ? element.scrollHeight : el.height; // Get the scrollHeight of the element

        setElements((prevElements) => {
            const updatedElements = prevElements.map((item) =>
                item.id === el.id
                    ? {
                        ...item,
                        content,
                        height, // Update height based on content
                    }
                    : item
            );

            // Adjust positions of elements below the updated one
            const updatedIndex = updatedElements.findIndex((item) => item.id === el.id);
            let currentY = updatedElements[updatedIndex].y + height + 10; // Add spacing after the updated element

            for (let i = updatedIndex + 1; i < updatedElements.length; i++) {
                updatedElements[i] = {
                    ...updatedElements[i],
                    y: currentY,
                };
                currentY += updatedElements[i].height + 10;
            }

            return updatedElements;
        });
    };

    // Handle when the user finishes editing
    const handleBlur = (el) => {
        setIsEditing(false);
        syncContentToState(el); // Sync content with state on blur
    };

    const handleSelectCell = (e, elementId, rowIdx, colIdx) => {
        e.stopPropagation(); // Prevent canvas click events from resetting selection
        setSelectedElementId(elementId); // Set the selected element ID
        setSelectedCell({ rowIdx, colIdx }); // Set the selected cell
        setShowToolbar(true); // Show the toolbar
        const canvasRect = e.currentTarget.getBoundingClientRect();
        setToolbarPosition({
            x: e.clientX - canvasRect.left,
            y: e.clientY - canvasRect.top,
        });
    };

    const updateCellContent = (elementId, rowIdx, colIdx, content) => {
        setElements((prev) =>
            prev.map((el) => {
                if (el.id === elementId && el.type === "table") {
                    const updatedTableData = el.tableData.map((row, rIdx) =>
                        rIdx === rowIdx
                            ? row.map((cell, cIdx) =>
                                cIdx === colIdx ? content : cell
                            )
                            : row
                    );

                    // Adjust table height if content expands
                    const tableHeight =
                        updatedTableData.length * 30; // Assuming 30px per row
                    return {
                        ...el,
                        tableData: updatedTableData,
                        height: Math.min(tableHeight, 500), // Restrict to canvas height
                    };
                }
                return el;
            })
        );
    };

    return (
        <div style={{ display: "flex", gap: "20px" }}>
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

                    </>
                ) : (
                    <p>Select an item to configure</p>
                )}
                <button onClick={generateHTML}>Generate HTML</button>
            </div>

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
                        height: `${canvasHeight}px`, // Use dynamic height
                        border: "1px solid #ccc",
                        backgroundColor: "#f9f9f9",
                        overflow: "auto", // Enable scrolling if necessary
                    }}
                    onDrop={handleDrop}
                    onDragOver={handleDragOver}
                >
                    {elements.map((el) => (
                        <div
                            key={el.id}
                            data-id={el?.id}
                            style={{
                                position: "absolute",
                                left: el.x,
                                top: el.y,
                                width: el.width,
                                // height: el.type === "text" ? 'auto' : el.height,
                                border: el.type === "text" ? "1px dashed #333" : "none",
                                backgroundColor: el.backgroundColor,
                                cursor: "move",
                            }}
                            draggable
                            onDragStart={(e) => handleDragStart(e, el.id)}
                            onClick={(e) => handleSelectElement(e, el.id)}
                        >
                            {el.type === "text" ? (
                                <div
                                    onMouseUp={saveCursorPosition}
                                    onKeyUp={() => {
                                        saveCursorPosition();
                                    }}
                                    onBlur={() => handleBlur(el)}
                                    contentEditable
                                    suppressContentEditableWarning
                                    style={{
                                        margin: `${el?.margin ?? 0}px`,
                                        padding: `${el?.padding ?? 0}px`,
                                        outline: 'none',
                                        width: '100%',
                                    }}
                                    dangerouslySetInnerHTML={{ __html: el.content }} // Use dangerouslySetInnerHTML to render HTML
                                />
                            ) : el.type === "table" ? (
                                <table
                                    style={{
                                        width: "100%",
                                        height: "100%",
                                        borderCollapse: "collapse",
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
                                                        position: "relative",
                                                    }}
                                                    onClick={(e) => handleSelectCell(e, el.id, rowIdx, colIdx)}
                                                >
                                                    {cell.includes("<select") ? (
                                                        // Render the dropdown using `dangerouslySetInnerHTML`
                                                        <div contentEditable>
                                                            <div

                                                                dangerouslySetInnerHTML={{ __html: cell }}
                                                                style={{ pointerEvents: "auto" }}
                                                            />
                                                        </div>
                                                    ) : (
                                                        // Render editable content if it's not a dropdown
                                                        <div
                                                            contentEditable
                                                            suppressContentEditableWarning
                                                            onBlur={(e) =>
                                                                updateCellContent(el.id, rowIdx, colIdx, e.target.textContent)
                                                            }
                                                            style={{
                                                                outline: "none",
                                                                minHeight: "20px",
                                                                width: "100%",
                                                                height: "100%",
                                                            }}
                                                        >
                                                            {cell}
                                                        </div>
                                                    )}
                                                </td>
                                            ))}
                                        </tr>
                                    ))}
                                </table>
                            ) : el.type === "checkbox" ? (
                                <input type="checkbox" checked={el.checked} readOnly />
                            ) : null}
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default CanvasDesigner;
