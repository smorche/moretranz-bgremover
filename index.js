const express = require('express');
const cors = require('cors');
const multer = require('multer');
const axios = require('axios');
const fs = require('fs');
require('dotenv').config();

const app = express();
const upload = multer();

app.use(cors());
app.use(express.static('public'));

app.post('/remove-background', upload.single('image'), async (req, res) => {
  try {
    const file = req.file;
    if (!file) {
      return res.status(400).json({ error: 'No image uploaded' });
    }

    const base64Image = file.buffer.toString('base64');

    const response = await axios.post(
      'https://api.developer.pixelcut.ai/v1/remove-background',
      {
        image_base64: base64Image,
        format: 'png'
      },
      {
        headers: {
          'Content-Type': 'application/json',
          'X-API-KEY': process.env.PIXELCUT_API_KEY
        },
        responseType: 'arraybuffer'
      }
    );

    const resultBuffer = Buffer.from(response.data, 'binary');
    const resultBase64 = resultBuffer.toString('base64');

    res.json({ image: `data:image/png;base64,${resultBase64}` });
  } catch (error) {
    console.error('Background removal error:', error.response?.data || error.message);
    res.status(500).json({ error: 'Failed to remove background' });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`PixelCut Background Remover running on port ${PORT}`);
});
