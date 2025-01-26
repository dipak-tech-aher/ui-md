import React, { useRef, useState, useEffect } from "react";

const RichTextEditor = () => {
    const editorRef = useRef(null);
    const [backgroundColor, setBackgroundColor] = useState("#ffffff");
    const [fontColor, setFontColor] = useState("#000000"); // Default font color
    const [fontSize, setFontSize] = useState("16px"); // Default font size
    const [htmlContent, setHtmlContent] = useState(""); // State to store generated HTML

    const formatText = (command, value = null) => {
        document.execCommand(command, false, value);
    };

    const insertTable = () => {
        const rows = 2;
        const cols = 2
        // const rows = parseInt(prompt("Enter number of rows:", 2), 10);
        // const cols = parseInt(prompt("Enter number of columns:", 2), 10);

        if (rows > 0 && cols > 0) {
            let table = "<table border='1' style='border-collapse: collapse; width: 100%;'>";
            for (let i = 0; i < rows; i++) {
                table += "<tr>";
                for (let j = 0; j < cols; j++) {
                    table += "<td style='padding: 5px; text-align: center;'>Cell</td>";
                }
                table += "</tr>";
            }
            table += "</table>";
            document.execCommand("insertHTML", false, table);
        }
    };

    const insertTextBox = () => {
        const textBox = `<div contenteditable="true" style="border: 1px solid #ccc; padding: 10px; min-height: 50px; margin-bottom: 10px; background-color: ${backgroundColor};">
                      Edit this text...
                    </div>`;
        document.execCommand("insertHTML", false, textBox);
    };

    const handleBackgroundColorChange = (event) => {
        const color = event.target.value;
        setBackgroundColor(color);

        const selection = window.getSelection();
        const anchorNode = selection.anchorNode;

        // Ensure anchorNode is a DOM element and not a text node
        const element = anchorNode && anchorNode.nodeType === 3 ? anchorNode.parentElement : anchorNode;

        if (element) {
            element.style.backgroundColor = color;
        }
    };

    const handleFontColorChange = (event) => {
        const color = event.target.value;
        setFontColor(color);

        // Apply font color to the selected text
        document.execCommand("foreColor", false, color);
    };

    const handleFontSizeChange = (event) => {
        const size = event.target.value;
        setFontSize(size);

        // Apply font size to the selected text
        document.execCommand("fontSize", false, 7); // 7 corresponds to the largest size
        const selection = window.getSelection();
        const range = selection.getRangeAt(0);
        const selectedNode = range.startContainer;

        if (selectedNode && selectedNode.nodeType === 3) {
            const span = document.createElement("span");
            span.style.fontSize = size;
            range.surroundContents(span);
        }
    };

    const handleListChange = (type) => {
        if (type === "ordered") {
            document.execCommand("insertOrderedList");
        } else {
            document.execCommand("insertUnorderedList");
        }
    };

    const handleTableEdit = (action) => {
        const selection = window.getSelection();
        const anchorNode = selection.anchorNode;

        // Ensure anchorNode is a DOM element and not a text node
        const cell = anchorNode && anchorNode.nodeType === 3 ? anchorNode.parentElement : anchorNode.closest("td");
        const row = cell?.parentElement;
        const table = cell?.closest("table");

        if (!cell || !row || !table) {
            alert("Please place the cursor inside a table cell.");
            return;
        }

        switch (action) {
            case "addRowAbove":
                const newRowAbove = row.cloneNode(true);
                row.parentNode.insertBefore(newRowAbove, row);
                break;
            case "addRowBelow":
                const newRowBelow = row.cloneNode(true);
                row.parentNode.insertBefore(newRowBelow, row.nextSibling);
                break;
            case "addColLeft":
                Array.from(table.rows).forEach((r) => {
                    const newCellLeft = document.createElement("td");
                    newCellLeft.style = "padding: 5px; text-align: center;";
                    newCellLeft.textContent = "Cell";
                    r.insertBefore(newCellLeft, r.cells[cell.cellIndex]);
                });
                break;
            case "addColRight":
                Array.from(table.rows).forEach((r) => {
                    const newCellRight = document.createElement("td");
                    newCellRight.style = "padding: 5px; text-align: center;";
                    newCellRight.textContent = "Cell";
                    r.insertBefore(newCellRight, r.cells[cell.cellIndex + 1]);
                });
                break;
            case "deleteRow":
                row.remove();
                break;
            case "deleteCol":
                Array.from(table.rows).forEach((r) => {
                    if (r.cells[cell.cellIndex]) r.cells[cell.cellIndex].remove();
                });
                break;
            default:
                break;
        }
    };

    const handleInput = () => {
        console.log("Content:", editorRef.current.innerHTML); // Log or process the content
    };

    const handleGenerateHTML = () => {
        setHtmlContent(editorRef.current.innerHTML); // Save HTML to state
        console.log("Generated HTML:", editorRef.current.innerHTML); // Log the generated HTML
    };

    const handleLoadHTML = () => {
        // Load the saved HTML into the editor
        if (editorRef.current) {
            editorRef.current.innerHTML = htmlContent;
        }
    };

    // Set cursor at the start when component mounts
    useEffect(() => {
        if (editorRef.current) {
            const range = document.createRange();
            const selection = window.getSelection();
            range.setStart(editorRef.current, 0);
            range.collapse(true);
            selection.removeAllRanges();
            selection.addRange(range);
            editorRef.current.focus();
        }
    }, []);

    const [dropdownOptions, setDropdownOptions] = useState(["Option 1", "Option 2", "Option 3"]); // Sample options

    const insertDropdown = () => {
        const dropdownHtml = `
      <select style="padding: 5px; font-size: 14px;">
        ${dropdownOptions.map(option => `<option value="${option}">${option}</option>`).join('')}
      </select>
    `;

        // Insert the dropdown at the cursor position
        document.execCommand("insertHTML", false, dropdownHtml);
    };

    const insertVariable = (text) => {
        const selection = window.getSelection();
        const range = selection.getRangeAt(0);

        // Insert the placeholder text at the cursor position
        range.deleteContents();
        const textNode = document.createTextNode(`{{${text}}}`);
        range.insertNode(textNode);

        // Optional: Move the cursor after the inserted text
        range.setStartAfter(textNode);
        range.setEndAfter(textNode);
        selection.removeAllRanges();
        selection.addRange(range);
    };

    const insertCheckbox = () => {
        const checkboxHtml = `<input type="checkbox" style="margin-right: 5px;" />`;

        // Insert the checkbox at the cursor position
        document.execCommand("insertHTML", false, checkboxHtml);
    };

    return (
        <div className="rich-text-editor">
            {/* Toolbar */}
            <div className="toolbar">
                <button onClick={() => formatText("bold")} title="Bold">
                    <b>B</b>
                </button>
                <button onClick={() => formatText("italic")} title="Italic">
                    <i>I</i>
                </button>
                <button onClick={() => formatText("underline")} title="Underline">
                    <u>U</u>
                </button>
                <button onClick={insertCheckbox} title="Insert Checkbox">
                    Insert Checkbox
                </button>
                <button onClick={insertTable} title="Insert Table">
                    Table
                </button>
                <button onClick={insertTextBox} title="Insert Text Box">
                    Text Box
                </button>
                <button onClick={insertDropdown} title="Insert Dropdown">
                    Dropdown
                </button>
                <button onClick={() => insertVariable('name')} title="Insert Dropdown">
                    variable
                </button>

                {/* Color Picker for Background Color */}
                <input
                    type="color"
                    value={backgroundColor}
                    onChange={handleBackgroundColorChange}
                    title="Change Background Color"
                />

                {/* Color Picker for Font Color */}
                <input
                    type="color"
                    value={fontColor}
                    onChange={handleFontColorChange}
                    title="Change Font Color"
                />

                {/* Font Size Selector */}
                <select value={fontSize} onChange={handleFontSizeChange} title="Font Size">
                    <option value="12px">12px</option>
                    <option value="14px">14px</option>
                    <option value="16px">16px</option>
                    <option value="18px">18px</option>
                    <option value="20px">20px</option>
                    <option value="24px">24px</option>
                    <option value="30px">30px</option>
                </select>

                {/* List Options */}
                <button onClick={() => handleListChange("ordered")} title="Ordered List">
                    OL
                </button>
                <button onClick={() => handleListChange("unordered")} title="Unordered List">
                    UL
                </button>

                {/* Text Alignment Buttons */}
                <button onClick={() => formatText("justifyLeft")} title="Align Left">
                    Left
                </button>
                <button onClick={() => formatText("justifyCenter")} title="Align Center">
                    Center
                </button>
                <button onClick={() => formatText("justifyRight")} title="Align Right">
                    Right
                </button>
                <button onClick={() => formatText("justifyFull")} title="Justify">
                    Justify
                </button>

                <button onClick={() => handleTableEdit("addRowAbove")} title="Add Row Above">
                    Add Row Above
                </button>
                <button onClick={() => handleTableEdit("addRowBelow")} title="Add Row Below">
                    Add Row Below
                </button>
                <button onClick={() => handleTableEdit("addColLeft")} title="Add Column Left">
                    Add Col Left
                </button>
                <button onClick={() => handleTableEdit("addColRight")} title="Add Column Right">
                    Add Col Right
                </button>
                <button onClick={() => handleTableEdit("deleteRow")} title="Delete Row">
                    Delete Row
                </button>
                <button onClick={() => handleTableEdit("deleteCol")} title="Delete Column">
                    Delete Col
                </button>

                {/* Generate HTML Button */}
                <button onClick={handleGenerateHTML} title="Generate HTML">
                    Generate HTML
                </button>

                {/* Load HTML Button */}
                <button onClick={handleLoadHTML} title="Load HTML">
                    Load HTML
                </button>
            </div>

            {/* Editable Area */}
            <div
                ref={editorRef}
                className="editor"
                contentEditable
                onInput={handleInput}
                style={{
                    border: "1px solid #ccc",
                    padding: "10px",
                    minHeight: "200px",
                    borderRadius: "4px",
                    fontFamily: "Arial, sans-serif",
                }}
            >
                <p>Edit this text...</p>
            </div>

            {/* Optional: Textarea to view or input the generated HTML */}
            <div>
                <textarea
                    rows="5"
                    cols="80"
                    value={htmlContent}
                    onChange={(e) => setHtmlContent(e.target.value)}
                    placeholder="Generated HTML will appear here..."
                />
            </div>
        </div>
    );
};

export default RichTextEditor;
