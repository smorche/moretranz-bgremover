const express = require('express');
const cors = require('cors');
const multer = require('multer');
const axios = require('axios');
const FormData = require('form-data');
require('dotenv').config();

const app = express();
const upload = multer({ storage: multer.memoryStorage() }); // ✅ Important!

app.use(cors());
app.use(express.static('public'));

app.post('/remove-background', upload.single('image'), async (req, res) => {
  try {
    if (!req.file || !req.file.buffer) {
      return res.status(400).json({ error: 'No image uploaded' });
    }

    const form = new FormData();
    form.append('image_file', req.file.buffer, {
      filename: req.file.originalname,
      contentType: req.file.mimetype
    });

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
      console.error('❌ Unexpected PixelCut response:', pixelcutResponse.data);
      return res.status(500).json({ error: 'PixelCut returned no result_url' });
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
