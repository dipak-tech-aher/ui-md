import React, { useState, useEffect, useCallback, useRef } from "react";
import * as pdfjsLib from "pdfjs-dist/build/pdf";
import pdfjsWorker from "pdfjs-dist/build/pdf.worker.entry";
import { DndProvider, useDrag, useDrop } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";
import update from "immutability-helper";
import { PDFDocument, degrees } from "pdf-lib";  // Import degrees from pdf-lib
import './App.css'; // Custom CSS

// Set worker globally
pdfjsLib.GlobalWorkerOptions.workerSrc = pdfjsWorker;

const ItemTypes = {
    PAGE: "page",
};

const DraggablePage = ({ pageNumber, index, movePage, pdfDoc, rotatePage, scale, isActive, pageRef }) => {
    const canvasRef = useRef(null);
    const renderTaskRef = useRef(null);
    const [rotation, setRotation] = useState(0);

    const [{ isDragging }, drag] = useDrag({
        type: ItemTypes.PAGE,
        item: { index },
        collect: (monitor) => ({
            isDragging: monitor.isDragging(),
        }),
    });

    const [, drop] = useDrop({
        accept: ItemTypes.PAGE,
        hover: (draggedItem) => {
            if (draggedItem.index !== index) {
                movePage(draggedItem.index, index);
                draggedItem.index = index;
            }
        },
    });

    const renderPage = useCallback(async () => {
        if (!pdfDoc || !pageNumber || !canvasRef.current) return;

        const canvas = canvasRef.current;
        const context = canvas.getContext("2d");

        try {
            const page = await pdfDoc.getPage(pageNumber);
            const viewport = page.getViewport({ scale: scale, rotation });

            // Set canvas size with device pixel ratio for better clarity
            const pixelRatio = window.devicePixelRatio || 1;
            canvas.width = viewport.width * pixelRatio;
            canvas.height = viewport.height * pixelRatio;

            // Scale the context to account for the pixel ratio
            context.scale(pixelRatio, pixelRatio);

            if (renderTaskRef.current) {
                renderTaskRef.current.cancel();
            }

            renderTaskRef.current = page.render({
                canvasContext: context,
                viewport,
            });

            await renderTaskRef.current.promise;
        } catch (error) {
            if (error.name !== 'RenderingCancelledException') {
                console.error(`Error rendering page ${index + 1}:`, error);
                alert(`Error rendering page ${index + 1}: ${error.message}`);
            }
        }
    }, [pdfDoc, pageNumber, scale, rotation]);


    useEffect(() => {
        renderPage();

        return () => {
            if (renderTaskRef.current) {
                renderTaskRef.current.cancel();
            }
        };
    }, [renderPage]);

    const handleRotate = () => {
        const newRotation = (rotation + 90) % 360;
        setRotation(newRotation);
        rotatePage(index, newRotation);
    };

    return (
        <div
            ref={(node) => {
                drag(drop(node));
                pageRef(node); // Set the page ref
            }}
            className={`page-container ${isActive ? 'active' : ''}`}
            style={{ opacity: isDragging ? 0.5 : 1 }}
        >
            <div className="page-controls">
                <button onClick={handleRotate} className="rotate-button">Rotate</button>
                <span className="page-number">Page {pageNumber}</span>
            </div>
            <canvas ref={canvasRef} />
        </div>
    );
};

const PDFViewer = ({ pdfFile }) => {
    const [rotationPerPage, setRotationPerPage] = useState({});

    const rotatePage = (index, newRotation) => {
        setRotationPerPage((prevRotation) => ({
            ...prevRotation,
            [index]: newRotation,
        }));
    };

    const [pdfUrl, setPdfUrl] = useState(pdfFile); // Store the uploaded PDF Blob URL
    const [pdfDoc, setPdfDoc] = useState(null);
    const [pageOrder, setPageOrder] = useState([]);
    const [totalPages, setTotalPages] = useState(0);
    const [scale, setScale] = useState(1);
    const [currentPage, setCurrentPage] = useState(1);
    const [drawerOpen, setDrawerOpen] = useState(false);
    const pageRefs = useRef([]); // Ref to store references for each page


    const loadPdfDocument = async (pdfFileOrUrl) => {
        try {
            let pdf;
            if (typeof pdfFileOrUrl === "string") {
                pdf = await pdfjsLib.getDocument(pdfFileOrUrl).promise; // Load from URL
            } else {
                const arrayBuffer = await pdfFileOrUrl.arrayBuffer();
                pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise; // Load from Blob (file upload)
            }

            setPdfDoc(pdf);
            setTotalPages(pdf.numPages);
            setPageOrder([...Array(pdf.numPages).keys()].map((i) => i + 1));
            setCurrentPage(1); // Reset to the first page after loading a new PDF
            console.log(`Loaded PDF with ${pdf.numPages} pages.`);
        } catch (error) {
            console.error("Error loading PDF:", error);
            alert(`Error loading PDF: ${error.message}`);
        }
    };

    useEffect(() => {
        // Load a default PDF if you want (e.g., a sample PDF URL or previously uploaded PDF).
        if (pdfUrl) {
            loadPdfDocument(pdfUrl);
        }
    }, [pdfUrl]);

    const movePage = (fromIndex, toIndex) => {
        const updatedOrder = update(pageOrder, {
            $splice: [
                [fromIndex, 1],
                [toIndex, 0, pageOrder[fromIndex]],
            ],
        });
        setPageOrder(updatedOrder);
    };

    const handleZoomIn = () => {
        setScale((prevScale) => Math.min(prevScale + 0.1, 4)); // Zoom in by 10%
    };

    const handleZoomOut = () => {
        setScale((prevScale) => Math.max(prevScale - 0.1, 0.5)); // Zoom out by 10%
    };

    const toggleDrawer = () => setDrawerOpen((prev) => !prev);

    const handleDownload = async () => {
        if (!pdfDoc) return;

        try {
            // Fetch the original PDF document as a binary array
            const pdfBytes = await fetch(pdfUrl).then((res) => res.arrayBuffer());

            // Load the PDF using pdf-lib
            const originalPdfDoc = await PDFDocument.load(pdfBytes);

            // Create a new PDF document to hold the rearranged pages
            const newPdfDoc = await PDFDocument.create();

            // Loop through the reordered pages
            for (const pageNumber of pageOrder) {
                const [copiedPage] = await newPdfDoc.copyPages(originalPdfDoc, [pageNumber - 1]); // Copy page

                // Retrieve rotation for each page
                const pageRotation = rotationPerPage[pageNumber - 1] || 0; // Use rotation stored in rotationPerPage or default to 0

                // Apply rotation using pdf-lib's `degrees` function
                copiedPage.setRotation(degrees(pageRotation));

                // Add the copied and possibly rotated page to the new PDF
                newPdfDoc.addPage(copiedPage);
            }

            // Save the newly created PDF
            const newPdfBytes = await newPdfDoc.save();

            // Create a Blob from the PDF bytes
            const blob = new Blob([newPdfBytes], { type: "application/pdf" });
            const url = URL.createObjectURL(blob);

            // Create an anchor element to trigger the download
            const link = document.createElement("a");
            link.href = url;
            link.download = "updated.pdf";
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);

            // Revoke the object URL after the download
            URL.revokeObjectURL(url);
        } catch (error) {
            console.error("Error downloading PDF:", error);
            alert(`Error downloading PDF: ${error.message}`);
        }
    };

    const handlePrint = async () => {
        if (!pdfDoc) return;

        try {
            // Fetch the original PDF document as a binary array
            const pdfBytes = await fetch(pdfUrl).then((res) => res.arrayBuffer());

            // Load the PDF using pdf-lib
            const originalPdfDoc = await PDFDocument.load(pdfBytes);

            // Create a new PDF document to hold the rearranged pages
            const newPdfDoc = await PDFDocument.create();

            // Loop through the reordered pages
            for (const pageNumber of pageOrder) {
                const [copiedPage] = await newPdfDoc.copyPages(originalPdfDoc, [pageNumber - 1]);

                // Retrieve rotation for each page
                const pageRotation = rotationPerPage[pageNumber - 1] || 0;

                // Apply rotation using pdf-lib's `degrees` function
                copiedPage.setRotation(degrees(pageRotation));

                // Add the copied and possibly rotated page to the new PDF
                newPdfDoc.addPage(copiedPage);
            }

            // Save the newly created PDF
            const newPdfBytes = await newPdfDoc.save();

            // Create a Blob from the PDF bytes
            const blob = new Blob([newPdfBytes], { type: "application/pdf" });
            const url = URL.createObjectURL(blob);

            // Open the PDF in a new tab
            const newWindow = window.open(url);

            if (!newWindow) {
                alert("Please allow popups to open the PDF for printing.");
            } else {
                // Ensure the print dialog opens after the PDF has loaded in the new tab
                newWindow.onload = () => {
                    newWindow.focus();
                    newWindow.print();

                    // Cleanup: Optionally close the tab after printing
                    newWindow.onafterprint = () => {
                        newWindow.close();
                    };
                };
            }
        } catch (error) {
            console.error("Error printing PDF:", error);
            alert(`Error printing PDF: ${error.message}`);
        }
    };

    const handleFileUpload = (event) => {
        const file = event.target.files[0];
        if (file && file.type === "application/pdf") {
            const fileUrl = URL.createObjectURL(file); // Create a URL for the uploaded PDF
            setPdfUrl(fileUrl); // Set the URL as the PDF source
        } else {
            alert("Please upload a valid PDF file.");
        }
    };

    // useEffect(() => {
    //     if (pdfDoc) {
    //         console.log(`Current page: ${currentPage}`);
    //         console.log('pageRefs.current----------->', pageRefs.current)
    //         pageRefs.current[currentPage - 1]?.scrollIntoView({ behavior: "smooth" });
    //     }
    // }, [currentPage, pdfDoc]); // Scroll to the current page when it changes

    useEffect(() => {
        if (pdfDoc && pageRefs.current[currentPage - 1]) {
            pageRefs.current[currentPage - 1]?.scrollIntoView({ behavior: "smooth", block: "start" });
            console.log(`Scrolled to page ${currentPage}`);
        }
    }, [currentPage, pdfDoc]);

    const handlePageChange = (e) => {
        const newPage = Number(e.target.value);
        if (newPage >= 1 && newPage <= totalPages) {
            const pageIndex = pageOrder.indexOf(newPage); // Get the index of the desired page in the current order
            if (pageIndex !== -1) {
                setCurrentPage(newPage);
                pageRefs.current[pageIndex]?.scrollIntoView({ behavior: "smooth", block: "start" });
            }
        }
    };


    const goToNextPage = () => {
        const currentPageIndex = pageOrder.indexOf(currentPage);
        if (currentPageIndex < totalPages - 1) {
            const nextPageNumber = pageOrder[currentPageIndex + 1]; // Get the next page in the reordered array
            setCurrentPage(nextPageNumber);
            pageRefs.current[currentPageIndex + 1]?.scrollIntoView({ behavior: "smooth", block: "start" });
        }
    };

    const goToPreviousPage = () => {
        const currentPageIndex = pageOrder.indexOf(currentPage);
        if (currentPageIndex > 0) {
            const previousPageNumber = pageOrder[currentPageIndex - 1]; // Get the previous page in the reordered array
            setCurrentPage(previousPageNumber);
            pageRefs.current[currentPageIndex - 1]?.scrollIntoView({ behavior: "smooth", block: "start" });
        }
    };

    // Scroll to the top (first page)
    const scrollToTop = () => {
        if (pageRefs.current[0]) {
            pageRefs.current[0].scrollIntoView({ behavior: 'smooth', block: 'start' });
            setCurrentPage(1); // Set the current page to the first one
        }
    };

    // Scroll to the bottom (last page)
    const scrollToBottom = () => {
        const lastPageIndex = totalPages - 1; // Index of the last page
        if (pageRefs.current[lastPageIndex]) {
            pageRefs.current[lastPageIndex].scrollIntoView({ behavior: 'smooth', block: 'end' });
            setCurrentPage(totalPages); // Set the current page to the last one
        } else {
            console.error("Last page not found in pageRefs");
        }
    };


    if (!pdfDoc) {
        return <div>Loading PDF...</div>;
    }

    return (
        <DndProvider backend={HTML5Backend}>
            <div className="navbar">
                <button className="hamburger" onClick={toggleDrawer}>☰</button>
                <div className="navbar-controls">
                    <button onClick={handleZoomOut}>Zoom Out</button>
                    <span className="zoom-percentage">{`${Math.round(scale * 100)}%`}</span>
                    <button onClick={handleZoomIn}>Zoom In</button>
                    <button onClick={handleDownload} className="download-button">Download PDF</button>
                    <button onClick={handlePrint} className="print-button">Print PDF</button>
                    <input type="file" accept="application/pdf" onChange={handleFileUpload} />
                    <button onClick={goToPreviousPage} disabled={currentPage === 1}>Previous</button>
                    <button onClick={goToNextPage} disabled={currentPage === totalPages}>Next</button>

                    <input
                        type="number"
                        value={currentPage}
                        onChange={handlePageChange}
                        min="1"
                        max={totalPages}
                    />

                    <button onClick={scrollToTop}>Scroll to Top</button>
                    <button onClick={scrollToBottom}>Scroll to Bottom</button>
                </div>
            </div>
            <div className="pdf-viewer-layout">
                <div className={`drawer ${drawerOpen ? 'open' : 'closed'}`}>
                    <h3>Page Thumbnails</h3>
                    {pageOrder.map((pageNumber, index) => (
                        <div key={pageNumber} ref={(el) => (pageRefs.current[index] = el)} className="thumbnail-container">
                            <DraggablePage
                                pageNumber={pageNumber}
                                index={index}
                                movePage={movePage}
                                pdfDoc={pdfDoc}
                                rotatePage={rotatePage}
                                scale={scale}
                                isActive={currentPage === pageNumber}
                                pageRef={(el) => (pageRefs.current[index] = el)} // Assign ref to page
                            />
                        </div>
                    ))}
                </div>
                <div className="main-viewer">
                    {pageOrder.map((pageNumber, index) => (
                        <DraggablePage
                            key={pageNumber}
                            pageNumber={pageNumber}
                            index={index}
                            movePage={movePage}
                            pdfDoc={pdfDoc}
                            rotatePage={rotatePage}
                            scale={scale}
                            isActive={currentPage === pageNumber}
                            pageRef={(el) => (pageRefs.current[index] = el)} // Assign ref to page
                        />
                    ))}
                </div>
            </div>
        </DndProvider>
    );
};



 useEffect(() => {
        if (pdfDoc) {
            const observer = new IntersectionObserver(
                (entries) => {
                    entries.forEach((entry) => {
                        if (entry.isIntersecting) {
                            const visiblePageIndex = pageRefs.current.indexOf(entry.target);
                            if (visiblePageIndex !== -1) {
                                const visiblePageNumber = pageOrder[visiblePageIndex];
                                setCurrentPage(visiblePageNumber); // Update currentPage when the page is visible
                            }
                        }
                    });
                },
                {
                    root: null, // Use the viewport as the root
                    rootMargin: '0px',
                    threshold: 0.5, // Trigger when 50% of the page is visible
                }
            );

            // Observe each page
            pageRefs.current.forEach((pageRef) => {
                if (pageRef) observer.observe(pageRef);
            });

            // Clean up the observer on component unmount
            return () => {
                if (observer) {
                    pageRefs.current.forEach((pageRef) => {
                        if (pageRef) observer.unobserve(pageRef);
                    });
                }
            };
        }
    }, [pdfDoc, pageOrder]);


export default PDFViewer;
