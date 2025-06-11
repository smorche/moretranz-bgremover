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
    console.log('📥 Incoming request to /remove-background');
    if (!req.file || !req.file.buffer) {
      return res.status(400).json({ error: 'No image uploaded' });
    }

    // Step 1: Upload to ImgBB
    const imgbbApiKey = process.env.IMGBB_API_KEY;
    const base64Image = req.file.buffer.toString('base64');

    const imgbbResponse = await axios.post(
      `https://api.imgbb.com/1/upload?key=${imgbbApiKey}`,
      new URLSearchParams({ 
        image: base64Image,
        expiration: '600' // auto-delete after 10 minutes
      })

    const uploadedUrl = imgbbResponse.data?.data?.url;
    if (!uploadedUrl) {
      console.error('❌ ImgBB upload failed:', imgbbResponse.data);
      return res.status(500).json({ error: 'ImgBB upload failed' });
    }

    console.log('✅ Uploaded to ImgBB:', uploadedUrl);

    // Step 2: Call PixelCut with image_url
    const pixelcutResponse = await axios.post(
      'https://api.developer.pixelcut.ai/v1/remove-background',
      {
        image_url: uploadedUrl,
        format: 'png'
      },
      {
        headers: {
          'Content-Type': 'application/json',
          'X-API-KEY': process.env.PIXELCUT_API_KEY
        }
      }
    );

    const resultUrl = pixelcutResponse.data?.result_url;
    if (!resultUrl) {
      console.error('❌ PixelCut did not return result_url:', pixelcutResponse.data);
      return res.status(500).json({ error: 'PixelCut failed' });
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
  console.log(`✅ MoreTranz Background Remover (ImgBB) running on port ${PORT}`);
});
