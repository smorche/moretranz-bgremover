const express = require('express');
const multer = require('multer');
const fs = require('fs');
const path = require('path');
const axios = require('axios');
const cors = require('cors');
const FormData = require('form-data');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.static('public'));

const upload = multer({ dest: 'uploads/' });

app.post('/remove-background', upload.single('image'), async (req, res) => {
  const filePath = req.file.path;

  try {
    const form = new FormData();
    form.append('image', fs.createReadStream(filePath));

    const response = await axios.post(
      'https://api.developer.pixelcut.ai/v1/remove-background',
      form,
      {
        headers: {
          'Authorization': `Bearer ${process.env.PIXELCUT_API_KEY}`,
          'Content-Type': 'multipart/form-data',
        },
        responseType: 'arraybuffer',
      }
    );

    const imageDataUrl = `data:image/png;base64,${Buffer.from(response.data).toString('base64')}`;
    fs.unlinkSync(filePath); // Clean up temp file
    res.json({ image: imageDataUrl });
  } catch (error) {
    console.error('Background removal error:', error.response?.data || error.message);
    if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
    res.status(500).json({ error: 'Background removal failed.' });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
