  useEffect(() => {
        const editor = editorRef.current;

        const handleKeyDown = (event) => {
            // Check if Ctrl+A is pressed
            if (event.ctrlKey && event.key === 'a') {
                event.preventDefault(); // Prevent default select-all behavior

                const selection = window.getSelection();
                const anchorNode = selection.anchorNode;
                console.log('anchorNode----->', anchorNode)
                // Ensure we're inside a table cell (td element)
                if (anchorNode) {
                    const cell = anchorNode;
                    // const cell = anchorNode?.closest("td");

                    if (cell) {
                        // If inside a cell, manually select the content of the cell
                        const range = document.createRange();
                        range.selectNodeContents(cell); // Select the contents of the current cell
                        selection.removeAllRanges(); // Clear current selection
                        selection.addRange(range); // Add our custom range to select only the cell's content
                    }
                }
            }
        };

        if (editor) {
            editor.addEventListener("keydown", handleKeyDown);
        }

        return () => {
            if (editor) {
                editor.removeEventListener("keydown", handleKeyDown);
            }
        };
    }, []);
