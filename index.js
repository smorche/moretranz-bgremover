const express = require('express');
const cors = require('cors');
const multer = require('multer');
const axios = require('axios');
const fs = require('fs');
const FormData = require('form-data');
require('dotenv').config();

const app = express();
const upload = multer({ dest: 'uploads/' });

app.use(cors());
app.use(express.static('public'));

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
          ...form.getHeaders(),
          'Authorization': `Bearer ${process.env.PIXELCUT_API_KEY}`
        },
        responseType: 'arraybuffer'
      }
    );

    fs.unlinkSync(filePath); // Clean up temp file
    const resultBase64 = Buffer.from(response.data).toString('base64');
    res.json({ image: `data:image/png;base64,${resultBase64}` });
  } catch (err) {
    console.error('Background removal error:', err.response?.data || err.message);
    if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
    res.status(500).json({ error: 'Background removal failed' });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Background Remover running on port ${PORT}`);
});
