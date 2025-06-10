
require('dotenv').config();
const express = require('express');
const multer = require('multer');
const FormData = require('form-data');
const axios = require('axios');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3000;

const upload = multer({ dest: 'uploads/' });

app.use(express.static(path.join(__dirname, 'public')));

app.post('/remove-background', upload.single('image'), async (req, res) => {
  const filePath = req.file.path;

  try {
    const imageBuffer = fs.readFileSync(filePath);
    const base64Image = imageBuffer.toString('base64');

    const response = await axios.post(
      'https://api.developer.pixelcut.ai/v1/remove-background',
      {
        image: base64Image,
      },
      {
        headers: {
          'Authorization': `Bearer ${process.env.PIXELCUT_API_KEY}`,
          'Content-Type': 'application/json'
        },
        responseType: 'arraybuffer'
      }
    );

    const resultBuffer = response.data;
    const imageDataUrl = `data:image/png;base64,${Buffer.from(resultBuffer).toString('base64')}`;

    fs.unlinkSync(filePath);
    res.json({ image: imageDataUrl });
  } catch (error) {
    console.error('Upscale error:', error.response?.data || error.message);
    if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
    res.status(500).json({ error: 'Background removal failed.' });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
