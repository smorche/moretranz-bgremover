const express = require('express');
const multer = require('multer');
const cors = require('cors');
const axios = require('axios');
const FormData = require('form-data');
require('dotenv').config();

const app = express();
const upload = multer();
app.use(cors());

app.post('/remove-background', upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No image uploaded' });
    }

    const form = new FormData();
    form.append('image', req.file.buffer, {
      filename: req.file.originalname,
      contentType: req.file.mimetype
    });

    const response = await axios.post(
      'https://api.pixelcut.ai/v1/remove-background',
      form,
      {
        headers: {
          ...form.getHeaders(),
          Authorization: `Bearer ${process.env.PIXELCUT_API_KEY}`
        },
        responseType: 'arraybuffer'
      }
    );

    res.set('Content-Type', 'image/png');
    res.send(response.data);
  } catch (error) {
    console.error('Background removal error:', error?.response?.data || error.message);
    res.status(500).json({ error: 'Background removal failed' });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Background remover running on port ${PORT}`);
});