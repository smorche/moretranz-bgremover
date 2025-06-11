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

    // Upload to Cloudinary
    const uploadedUrl = await new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream({ folder: 'moretranz/bg-remover' }, (error, result) => {
        if (error) return reject(error);
        resolve(result.secure_url);
      });
      streamifier.createReadStream(req.file.buffer).pipe(uploadStream);
    });

    // Send Cloudinary image URL to PixelCut API
    const response = await axios.post(
      'https://api.developer.pixelcut.ai/v1/remove-background',
      {
        image_url: uploadedUrl
      },
      {
        headers: {
          'Content-Type': 'application/json',
          'X-API-KEY': process.env.PIXELCUT_API_KEY
        },
        responseType: 'arraybuffer'
      }
    );

    const base64 = Buffer.from(response.data).toString('base64');
    res.json({ image: `data:image/png;base64,${base64}` });
  } catch (error) {
    console.error('Background removal error:', error.response?.data || error.message);
    res.status(500).json({ error: 'Background removal failed' });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`✅ PixelCut Background Remover (Cloudinary) running on port ${PORT}`);
});
