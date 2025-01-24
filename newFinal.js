import React, { useState, useRef } from "react";


const FinalCanvas = () => {
    const [elements, setElements] = useState([]);
    const [draggingId, setDraggingId] = useState(null);
    const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
    const [selectedElementId, setSelectedElementId] = useState(null);
    const [showToolbar, setShowToolbar] = useState(false);
    const [toolbarPosition, setToolbarPosition] = useState({ x: 0, y: 0 });
    const [selectedCell, setSelectedCell] = useState(null);
    const [cursorRange, setCursorRange] = useState(null); // To save the cursor range
    const [canvasHeight, setCanvasHeight] = useState(500); // Initial height of the canvas
    const textEditorRef = useRef(null)
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
                width: type === "table" ? 200 : type === "checkbox" ? 20 : 500,
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
        } else if (draggingId) {
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
        setToolbarPosition({
            x: e.clientX - canvasRect.left,
            y: e.clientY - canvasRect.top,
        });
    };

    const handleUpdateConfig = (field, value) => {
        setElements((prev) =>
            prev.map((el) =>
                el.id === selectedElementId ? { ...el, [field]: value } : el
            )
        );
    };

    const selectedElement = elements.find((el) => el.id === selectedElementId);

    const saveCursorPosition = () => {
        const selection = window.getSelection();
        if (selection.rangeCount > 0) {
            const range = selection.getRangeAt(0);
            setCursorRange(range.cloneRange()); // Clone the range to avoid DOM changes affecting it
            console.log("Saved range:", {
                startContainer: range.startContainer,
                startOffset: range.startOffset,
                endContainer: range.endContainer,
                endOffset: range.endOffset,
            });
        } else {
            console.warn("No range to save.");
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
            const updatedIndex = updatedElements.findIndex(
                (item) => item.id === el.id
            );
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

      const [isInsertingLabel, setIsInsertingLabel] = useState(false); // Track if a label is being inserted

    const handleBlur = (el) => {
        if (isInsertingLabel) {
            // Delay sync to allow label insertion to complete
            setTimeout(() => {
                syncContentToState(el);
                setIsInsertingLabel(false); // Reset the flag
            }, 0);
        } else {
            syncContentToState(el); // Normal sync behavior
        }
    };
    
    const insertLabelAtCursor = (label) => {
        if (cursorRange && selectedElementId) {
            setIsInsertingLabel(true); // Set the flag when a label is being inserted
    
            const element = document.querySelector(`[data-id="${selectedElementId}"]`);
            if (element) {
                element.focus();
                const selection = window.getSelection();
                selection.removeAllRanges();
                selection.addRange(cursorRange);
    
                if (label === "dropdown") {
                    const select = document.createElement("select");
                    ["Option 1", "Option 2", "Option 3"].forEach((optionText) => {
                        const option = document.createElement("option");
                        option.textContent = optionText;
                        select.appendChild(option);
                    });
    
                    const range = selection.getRangeAt(0);
                    range.deleteContents();
                    range.insertNode(select);
                    range.setStartAfter(select);
                    range.collapse(true);
    
                    selection.removeAllRanges();
                    selection.addRange(range);
                } else {
                    const labelNode = document.createTextNode(`{{${label}}}`);
                    const range = selection.getRangeAt(0);
                    range.deleteContents();
                    range.insertNode(labelNode);
                    range.setStartAfter(labelNode);
                    range.collapse(true);
    
                    selection.removeAllRanges();
                    selection.addRange(range);
                }
    
                // Update the content state after insertion
                const updatedContent = element.innerHTML;
                setElements((prevElements) =>
                    prevElements.map((item) =>
                        item.id === selectedElementId ? { ...item, content: updatedContent } : item
                    )
                );
    
                // Save the new cursor range
                const newRange = window.getSelection().getRangeAt(0);
                setCursorRange(newRange);
            }
        } else {
            console.warn("Cursor position is not saved or no element is selected.");
        }
    };

    const generateHTML = () => {
        const html = elements
            .map((el) => {
                if (el.type === "text") {
                    return `<div style="position: absolute; left: ${el.x}px; top: ${el.y}px; width: ${el.width}px; margin: ${el.margin || 0}px; padding: ${el.padding || 0
                        }px;">${el.content}</div>`;
                }
                return "";
            })
            .join("");

        console.log(html); // Log the generated HTML for now
    };


    const insertHTMLToTextEditor = (html) => {
        console.log('textEditorRef----->', textEditorRef)
        if (textEditorRef.current) {
            textEditorRef.current.innerHTML = html;
        }
    };


    const parseHTML = (html) => {
        const parser = new DOMParser();
        const doc = parser.parseFromString(html, 'text/html');
        const parsedElements = [];

        doc.body.childNodes.forEach((node) => {
            if (node.nodeType === Node.ELEMENT_NODE) {
                const style = node.style;
                const x = parseInt(style.left, 10) || 0;
                const y = parseInt(style.top, 10) || 0;
                const width = parseInt(style.width, 10) || 100;
                const height = parseInt(style.height, 10) || 50;
                const backgroundColor = style.backgroundColor || '#fff';

                if (node.tagName === 'DIV' && node.innerHTML.includes('input')) {
                    parsedElements.push({
                        id: Date.now() + Math.random(),
                        type: 'checkbox',
                        x,
                        y,
                        width,
                        height,
                        backgroundColor,
                        checked: node.querySelector('input').checked,
                    });
                } else if (
                    node.tagName === 'DIV' &&
                    node.innerHTML.includes('table') &&
                    !node.innerHTML.includes('contenteditable')
                ) {
                    console.log('node.innerHTML----->', node.innerHTML);
                    const table = node.querySelector('table');
                    const tableData = Array.from(table.rows).map((row) =>
                        Array.from(row.cells).map((cell) => cell.innerHTML)
                    );
                    parsedElements.push({
                        id: Date.now() + Math.random(),
                        type: 'table',
                        x,
                        y,
                        width,
                        height,
                        backgroundColor,
                        rows: tableData.length,
                        cols: tableData[0]?.length || 0,
                        tableData,
                    });
                } else {
                    parsedElements.push({
                        id: Date.now() + Math.random(),
                        type: 'text',
                        x,
                        y,
                        width,
                        height,
                        backgroundColor,
                        content: node.innerHTML,
                    });
                }
            }
        });

        setElements(parsedElements);
    };

    return (
        <div style={{ display: "flex", gap: "20px" }}>
            <div
                style={{ width: "200px", border: "1px solid #ccc", padding: "10px" }}
            >
                <h4>Configuration</h4>
                <button onClick={generateHTML}>Generate HTML</button>
                <input type="text" onChange={(e) => parseHTML(e?.target?.value)} />

                {selectedElement ? (
                    <>
                        <label>
                            Width (px):
                            <input
                                type="number"
                                value={selectedElement.width}
                                onChange={(e) =>
                                    handleUpdateConfig("width", parseInt(e.target.value) || 0)
                                }
                            />
                        </label>
                        <h5>Labels</h5>
                        <ul>
                            {["Name", "Date", "Address"].map((label) => (
                                <li key={label} onMouseDown={(e) => {
                                    e.preventDefault(); // Prevent focus shift
                                    insertLabelAtCursor(label);
                                }}>
                                    {label}
                                </li>
                            ))}
                            <li onClick={() => insertLabelAtCursor("dropdown")}>
                                Insert Dropdown
                            </li>

                        </ul>

                    </>
                ) : (
                    <p>Select an item to configure</p>
                )}
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
                    <button
                        draggable
                        onDragStart={(e) => e.dataTransfer.setData("type", "text")}
                    >
                        Add Text
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
                    {console.log('elements------->', elements)}
                    {elements.map((el) => (
                        <div
                            key={el.id}
                            data-id={el?.id}
                            style={{
                                position: "absolute",
                                left: el.x,
                                top: el.y,
                                width: el.width,
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
                                    ref={textEditorRef}
                                    onMouseUp={saveCursorPosition}
                                    onKeyUp={saveCursorPosition}
                                    onInput={saveCursorPosition}
                                    contentEditable
                                    suppressContentEditableWarning
                                    style={{
                                        margin: `${el?.margin ?? 0}px`,
                                        padding: `${el?.padding ?? 0}px`,
                                        outline: "none",
                                        width: "100%",
                                    }}
                                    dangerouslySetInnerHTML={{ __html: el.content }}
                                />
                            ) : null}
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default FinalCanvas;
