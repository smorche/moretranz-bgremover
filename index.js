const express = require('express');
const cors = require('cors');
const multer = require('multer');
const axios = require('axios');
const FormData = require('form-data');
require('dotenv').config();

const app = express();
const upload = multer(); // In-memory file storage

app.use(cors());
app.use(express.static('public'));

app.post('/remove-background', upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No image uploaded' });
    }

    const form = new FormData();
    form.append('image_file', req.file.buffer, req.file.originalname);

    const pixelcutResponse = await axios.post(
      'https://api.developer.pixelcut.ai/v1/remove-background',
      form,
      {
        headers: {
          ...form.getHeaders(),
          'X-API-KEY': process.env.PIXELCUT_API_KEY
        }
      }
    );

    const resultUrl = pixelcutResponse.data?.result_url;
    if (!resultUrl) {
      console.error('❌ PixelCut returned unexpected response:', pixelcutResponse.data);
      return res.status(500).json({ error: 'Invalid PixelCut response' });
    }

    console.log('✅ PixelCut result URL:', resultUrl);

    const imageResponse = await axios.get(resultUrl, { responseType: 'arraybuffer' });
    const base64 = Buffer.from(imageResponse.data).toString('base64');

    res.json({ image: `data:image/png;base64,${base64}` });

  } catch (error) {
    console.error('❌ Background removal error:', error.response?.data || error.message);
    res.status(500).json({ error: 'Background removal failed' });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`✅ MoreTranz Background Remover running on port ${PORT}`);
});
