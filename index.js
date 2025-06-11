const express = require('express');
const cors = require('cors');
const multer = require('multer');
const axios = require('axios');
const FormData = require('form-data');
require('dotenv').config();

const app = express();
const upload = multer({ storage: multer.memoryStorage() });

app.use(cors());
app.use(express.static('public'));

app.post('/remove-background', upload.single('image'), async (req, res) => {
  try {
    const file = req.file;
    if (!file) {
      return res.status(400).json({ error: 'No image uploaded' });
    }

    const form = new FormData();
    form.append('image', file.buffer, {
      filename: file.originalname,
      contentType: file.mimetype
    });

    const response = await axios.post(
      'https://api.developer.pixelcut.ai/v1/remove-background',
      form,
      {
        headers: {
          ...form.getHeaders(),
          'X-API-KEY': process.env.PIXELCUT_API_KEY
        },
        responseType: 'arraybuffer'
      }
    );

    const resultBase64 = Buffer.from(response.data).toString('base64');
    res.json({ image: `data:image/png;base64,${resultBase64}` });
  } catch (error) {
    console.error('Background removal error:', error.response?.data || error.message);
    res.status(500).json({ error: 'Background removal failed' });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`✅ PixelCut Background Remover is running on port ${PORT}`);
});
