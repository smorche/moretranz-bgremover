const express = require('express');
const cors = require('cors');
const multer = require('multer');
const FormData = require('form-data');
const fetch = require('node-fetch');
const streamifier = require('streamifier');
require('dotenv').config();

const app = express();
const upload = multer({ storage: multer.memoryStorage() });

app.use(cors());
app.use(express.static('public'));

app.post('/remove-background', upload.single('image'), async (req, res) => {
  try {
    console.log('📥 Incoming request to /remove-background');
    console.log('File received:', !!req.file);

    if (!req.file || !req.file.buffer) {
      console.error('❌ No file buffer received');
      return res.status(400).json({ error: 'No image uploaded' });
    }

    const form = new FormData();
    const stream = streamifier.createReadStream(req.file.buffer);
    
    form.append('image_file', stream, {
      filename: req.file.originalname,
      contentType: req.file.mimetype
    });

    console.log('📤 Sending to PixelCut using fetch...');

    const response = await fetch('https://api.developer.pixelcut.ai/v1/remove-background', {
      method: 'POST',
      headers: {
        'X-API-KEY': process.env.PIXELCUT_API_KEY
      },
      body: form
    });

    const result = await response.json();

    if (!response.ok || !result.result_url) {
      console.error('❌ PixelCut error:', result);
      return res.status(500).json({ error: result.error || 'PixelCut failed' });
    }

    console.log('✅ PixelCut result URL:', result.result_url);

    const imageResponse = await fetch(result.result_url);
    const imageBuffer = await imageResponse.arrayBuffer();
    const base64 = Buffer.from(imageBuffer).toString('base64');

    res.json({ image: `data:image/png;base64,${base64}` });
  } catch (error) {
    console.error('❌ Background removal error:', error.message);
    res.status(500).json({ error: 'Background removal failed' });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`✅ MoreTranz Background Remover running on port ${PORT}`);
});
