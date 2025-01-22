   const deleteSelectedElement = () => {
        if (selectedElementId) {
            // Remove the selected element
            setElements((prev) => prev.filter((el) => el.id !== selectedElementId));
            setSelectedElementId(null); // Reset selection
            setShowToolbar(false); // Hide the toolbar
    
            // Update canvas height after deletion
            setTimeout(() => {
                const bufferSpace = 50; // Buffer space at the bottom
                const remainingElements = elements.filter((el) => el.id !== selectedElementId);
                const bottomMostElement = remainingElements.reduce((max, el) => {
                    const elBottom = el.y + el.height; // Calculate bottom position of each element
                    return elBottom > max ? elBottom : max;
                }, 0);
    
                const newHeight = Math.max(bottomMostElement + bufferSpace, 500); // Minimum height is 500
                setCanvasHeight(newHeight);
            }, 0);
        }
    };
    


const syncContentToState = (el) => {
        const element = document.querySelector(`[data-id="${el.id}"]`);
        const content = element ? element.innerHTML : el.content;
        const newHeight = element ? element.scrollHeight : el.height;
    
        setElements((prevElements) => {
            let updatedElements = prevElements.map((item) =>
                item.id === el.id
                    ? {
                          ...item,
                          content,
                          height: newHeight, // Update with new height
                      }
                    : item
            );
    
            // Find the updated element
            const updatedIndex = updatedElements.findIndex((item) => item.id === el.id);
            const updatedElement = updatedElements[updatedIndex];
    
            // Adjust positions of elements below
            let currentY = updatedElement.y + updatedElement.height + 10; // Spacing of 10px
            for (let i = updatedIndex + 1; i < updatedElements.length; i++) {
                updatedElements[i] = {
                    ...updatedElements[i],
                    y: currentY,
                };
                currentY += updatedElements[i].height + 10;
            }
    
            return updatedElements;
        });
    
        setTimeout(updateCanvasHeight, 0); // Ensure canvas height updates
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
    
            // If the new element is being added at the top, adjust positions
            if (y < 50) { // Assume y < 50 is considered as "top"
                const shiftAmount = newElement.height + 10; // Shift amount includes element height + spacing
                setElements((prev) =>
                    prev.map((el) => ({
                        ...el,
                        y: el.y + shiftAmount,
                    }))
                );
    
                // Update the new element's position
                newElement.y = 10; // Place it at the top with some spacing
            }
    
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
