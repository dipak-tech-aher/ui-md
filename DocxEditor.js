import React, { useState } from "react";
import mammoth from "mammoth";
import PizZip from "pizzip";
import Docxtemplater from "docxtemplater";
import { saveAs } from "file-saver";
import htmlDocx from "html-docx-js/dist/html-docx";
import axios from "axios";

const DocxEditor = () => {
  const [editorContent, setEditorContent] = useState("");
  const [editorContentBuffer, setEditorContentBuffer] = useState(null);

  // const handleFileUpload = async (event) => {
  //   const file = event.target.files[0];
  //   if (file) {
  //     const arrayBuffer = await file.arrayBuffer();
  //     setEditorContentBuffer(arrayBuffer);
  //     console.log("arrayBuffer----->", arrayBuffer);
  //     const options = {
  //       styleMap: [
  //         "p[style-name='Title'] => h1:fresh",
  //         "p[style-name='Heading 1'] => h2:fresh",
  //         "p[style-name='Heading 2'] => h3:fresh",
  //       ],
  //     };
  //     const result = await mammoth.convertToHtml({ arrayBuffer }, options);
  //     console.log("result------------->", result);
  //     setEditorContent(result.value);
  //   }
  // };

  const handleFileUpload = async (event) => {
    try {
      const file = event.target.files[0];
      if (file) {
        // const arrayBuffer = await file.arrayBuffer();
        // const result = await jsDocxToHtml.convertToHtml(arrayBuffer);
        // console.log("HTML Output:", result.html);
        const formData = new FormData();
        formData.append("file", file);

        const response = await axios.post(
          "http://localhost:3001/convert",
          formData,
          {
            headers: {
              "Content-Type": "multipart/form-data",
            },
          }
        );

        setEditorContent(response.data);
      }
    } catch (err) {
      console.log("err---->", err);
    }
  };

  const handleDownload = () => {
    const docx = htmlDocx.asBlob(editorContent, {
      orientation: "landscape",
      margins: { top: 720 },
    });
    saveAs(docx, "edited.docx");
  };

  return (
    <div>
      <input type="file" accept=".docx" onChange={handleFileUpload} />
      <button onClick={handleDownload}>Download</button>
      <div
        contentEditable
        dangerouslySetInnerHTML={{ __html: editorContent }}
        onInput={(e) => setEditorContent(e.currentTarget.innerHTML)}
      ></div>
    </div>
  );
};

export default DocxEditor;
