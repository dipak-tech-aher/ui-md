const express = require("express");
const fileUpload = require("express-fileupload");
const fs = require("fs");
const path = require("path");
const cors = require("cors");
const docx2html = require("docx2html");

const app = express();
const PORT = process.env.PORT || 3001;
// CORS configuration
const corsOptions = {
  origin: "http://localhost:3002", // Replace with your frontend URL
  methods: "GET,HEAD,PUT,PATCH,POST,DELETE",
  credentials: true,
  optionsSuccessStatus: 204,
};

// Enable CORS with options
app.use(cors(corsOptions));

app.use(fileUpload());

app.get("/", async (req, res) => {
  res.json({ msg: "working" });
});

app.post("/convert", async (req, res) => {
  console.log("req---->", req.files);
  if (!req.files || Object.keys(req.files).length === 0) {
    return res.status(400).send("No files were uploaded.");
  }

  const file = req.files.file;
  const filePath = path.join(__dirname, "/", file.name);
  console.log("filepath", filePath);

  // Save the file to the server
  try {
    await file.mv(filePath);
    console.log("File saved successfully");


    docx2html(fs.readFileSync(filePath)).then(function (converted) {
      // Access the converted HTML content
      const html = converted.toString();

      fs.unlinkSync(filePath); // Clean up the uploaded file
      res.send(html);
    });
  } catch (err) {
    console.log("err----->", err);
    res.status(500).send("Error converting file: " + err.message);
  }
});

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
