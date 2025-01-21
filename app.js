var express = require('express');
const multer = require('multer');
require('dotenv').config();

const { GoogleGenerativeAI } = require("@google/generative-ai");

const { GoogleAIFileManager } = require("@google/generative-ai/server");

var app = express();
app.use(express.static('public'));

// Configure multer for file upload
const upload = multer({ dest: 'uploads/' }); // Files will be temporarily stored in the 'uploads' folder

app.post('/uploadFile', upload.single('file'), async (req, res) => {
    try {
        const fs = require('fs');
        const path = require('path');

        // Access the uploaded file
        const uploadedFilePath = req.file.path;
        const mimeType = req.file.mimetype;

        // Initialize Google Generative AI
        const genAI = new GoogleGenerativeAI(process.env.MY_GEMINI_API_KEY);
        const fileManager = new GoogleAIFileManager(process.env.MY_GEMINI_API_KEY);
        const model = genAI.getGenerativeModel({ model: 'models/gemini-1.5-flash' });

        // Upload the file to Google Generative AI
        const uploadResult = await fileManager.uploadFile(uploadedFilePath, {
            mimeType,
            displayName: req.file.originalname,
        });

        // Generate content based on the uploaded file
        const myPrompt = "Provide a summary of this file.";
        const result = await model.generateContent([
            {
                fileData: {
                    fileUri: uploadResult.file.uri,
                    mimeType: uploadResult.file.mimeType,
                },
            },
            myPrompt,
        ]);

        const theResponse = result.response.text();
        console.log(theResponse);

        // Cleanup uploaded file from the server
        fs.unlinkSync(uploadedFilePath);

        // Send the result back to the client
        res.json({ theResultFromGemini: theResponse });
    } catch (error) {
        console.error("Error processing file:", error);
        res.status(500).json({ error: "An error occurred while processing your file." });
    }
});

//=========================
const port = process.env.PORT || 3001;

app.listen(port, function () {
    console.log(`My app is listening on port ${port}!`);
});
