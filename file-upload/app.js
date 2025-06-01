const express = require("express");
const jwt = require('jsonwebtoken');
// const { expressjwt: masinMW } = require('express-jwt');
const multer = require("multer");
const path = require("path");
const app = express();
const cors = require('cors')

app.use(express.static("public"));
app.use(express.json());
app.use(cors());
require('dotenv').config();

const masinSecretKey = process.env.MASIN_FILE_UPLOAD;
// const jwtMiddleware = masinMW({ secret: { masinSecretKey }, algorithms: ['HS256'] });

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, "public/uploads");
    },
    filename: (req, file, cb) => {
        let extArray = file.mimetype.split("/");
        let extension = extArray[extArray.length - 1];
        cb(null, file.fieldname + '-' + Date.now() + '.' + extension)
    },
});

const upload = multer({
    storage: storage,
    limits: { fileSize: 1024 * 1024 * 50 },
    fileFilter: (req, file, cb) => {
        const allowedMimeTypes = ["application/msword", "application/vnd.openxmlformats-officedocument.wordprocessingml.document", "text/plain", "application/pdf", "image/png", "image/jpg", "image/jpeg"];
        if (allowedMimeTypes.includes(file.mimetype)) {
            cb(null, true);
        } else {
            cb('Invalid file type', false);
        }
    },
});

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.post('/login', (req, res) => {
    const { masinFileName } = req.body;

    if (masinFileName == masinSecretKey) {
        const token = jwt.sign({ masinFileName }, masinSecretKey, { expiresIn: 60 * 60 });
        return res.json({ token });
    }

    return res.status(401).json({ message: 'Invalid credentials' });
});

const verifyMasinToken = (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).send('Unauthorized: No token provided');
    }
    const token = authHeader.split(' ')[1];
    try {
        const decoded = jwt.verify(token, masinSecretKey);
        req.user = decoded;
        next();
    } catch (error) {
        return res.status(403).send('Forbidden: Invalid token');
    }
};

app.post("/masin-upload", verifyMasinToken, upload.single("file"), (req, res) => {
    res.send("File uploaded successfully.");
});

const PORT = 5000;
app.listen(PORT, () => {
    console.log('Back end server running on port ', PORT);
});