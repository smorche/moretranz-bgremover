// index.js for PixelCut Background Remover (MoreTranz)

const express = require('express');
const multer = require('multer');
const cors = require('cors');
const axios = require('axios');
const FormData = require('form-data');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.static('public'));

// Setup multer
const storage = multer.memoryStorage();
const upload = multer({ storage });

// Background Removal Endpoint
app.post('/remove-background', upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const form = new FormData();
    form.append('image_file', req.file.buffer, req.file.originalname);

    const response = await axios.post('https://api.pixelcut.ai/v1/remove-background', form, {
      headers: {
        'Authorization': `Bearer ${process.env.PIXELCUT_API_KEY}`,
        ...form.getHeaders(),
      },
      responseType: 'arraybuffer'
    });

    res.set('Content-Type', 'image/png');
    res.send(response.data);
  } catch (err) {
    console.error('Background removal error:', err);
    if (err.response) {
      console.error('Error data:', err.response.data.toString());
    }
    res.status(500).json({ error: 'Background removal failed' });
  }
});

app.listen(port, () => {
  console.log(`MoreTranz BG Remover server running at http://localhost:${port}`);
});
