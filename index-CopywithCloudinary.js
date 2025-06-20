const express = require('express');
const cors = require('cors');
const multer = require('multer');
const axios = require('axios');
const cloudinary = require('cloudinary').v2;
const streamifier = require('streamifier');
require('dotenv').config();

const app = express();
const upload = multer();

app.use(cors());
app.use(express.static('public'));

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

app.post('/remove-background', upload.single('image'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'No image uploaded' });

    const uploadedUrl = await new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        { folder: 'moretranz/bg-remover' },
        (error, result) => {
          if (error) return reject(error);
          resolve(result.secure_url);
        }
      );
      streamifier.createReadStream(req.file.buffer).pipe(uploadStream);
    });

    console.log('✅ Uploaded to Cloudinary:', uploadedUrl);

    // PixelCut API call
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
      console.error('❌ PixelCut returned unexpected response:', pixelcutResponse.data);
      return res.status(500).json({ error: 'Invalid PixelCut response' });
    }

    console.log('✅ PixelCut Result URL:', resultUrl);

    // Fetch the image and convert to base64
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
