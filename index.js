const express = require('express');
const cors = require('cors');
const multer = require('multer');
const axios = require('axios');
require('dotenv').config();

const app = express();
const upload = multer(); // in-memory buffer

app.use(cors());
app.use(express.static('public'));

app.post('/remove-background', upload.single('image'), async (req, res) => {
  try {
    if (!req.file || !req.file.buffer) {
      return res.status(400).json({ error: 'No image uploaded' });
    }

    const base64Image = req.file.buffer.toString('base64');

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

    const resultBase64 = Buffer.from(response.data).toString('base64');
    res.json({ image: `data:image/png;base64,${resultBase64}` });

  } catch (err) {
    console.error('Background removal error:', err.response?.data || err.message);
    res.status(500).json({ error: 'Background removal failed' });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`PixelCut Background Remover running on port ${PORT}`);
});
