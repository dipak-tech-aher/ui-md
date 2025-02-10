  const handleGenerateHTML = () => {
        if (!editorRef.current) return;
    
        const clonedContent = editorRef.current.cloneNode(true);
    
        // Ensure dropdowns retain selected values
        clonedContent.querySelectorAll("select").forEach((dropdown) => {
            const selectedValue = dropdown.getAttribute("data-selected") || dropdown.value;
            dropdown.querySelectorAll("option").forEach((option) => {
                if (option.value === selectedValue) {
                    option.setAttribute("selected", "selected");
                } else {
                    option.removeAttribute("selected");
                }
            });
        });
    
        const finalHtml = clonedContent.innerHTML;
        setHtmlContent(finalHtml);
    
        console.log("Generated HTML:", finalHtml);
    };


    const insertDropdown = () => {
        if (!editorRef.current) return;
    
        const selection = window.getSelection();
        const range = selection.rangeCount > 0 ? selection.getRangeAt(0) : null;
    
        // Ensure cursor is inside the editor before inserting
        if (!range || !editorRef.current.contains(selection.anchorNode)) {
            alert("Please place the cursor inside the editor before inserting a dropdown.");
            return;
        }
    
        // Create dropdown element
        const selectElement = document.createElement("select");
        selectElement.style.padding = "5px";
        selectElement.style.fontSize = "14px";
    
        // Populate options
        dropdownOptions.forEach(option => {
            const optionElement = document.createElement("option");
            optionElement.value = option;
            optionElement.textContent = option;
            selectElement.appendChild(optionElement);
        });
    
        // Add change event listener to store selected value
        selectElement.addEventListener("change", function () {
            this.setAttribute("data-selected", this.value);
        });
    
        // Insert dropdown at the cursor position
        range.deleteContents();
        range.insertNode(selectElement);
    
        // Save history for undo/redo functionality
        saveHistory();
    };

