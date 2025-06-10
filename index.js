
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

  const form = new FormData();
  form.append('image', fs.createReadStream(filePath));

  try {
    const response = await axios.post(
      'https://api.developer.pixelcut.ai/v1/remove-background',
      form,
      {
        headers: {
          ...form.getHeaders(),
          'x-api-key': process.env.PIXELCUT_API_KEY
        },
        responseType: 'arraybuffer'
      }
    );

    const imageBuffer = response.data;
    const base64Image = Buffer.from(imageBuffer).toString('base64');
    const imageDataUrl = `data:image/png;base64,${base64Image}`;

    fs.unlinkSync(filePath);
    res.json({ image: imageDataUrl });
  } catch (error) {
    console.error('Error:', error.message);
    fs.unlinkSync(filePath);
    res.status(500).json({ error: 'Background removal failed.' });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
