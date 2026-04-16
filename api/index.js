const express = require('express');
const axios = require('axios'); // Tambahkan axios di package.json
const app = express();

app.use(express.json());

app.post('/api/info', async (req, res) => {
    const { url } = req.body;
    try {
        // Kita gunakan API pihak ketiga yang lebih kuat tembus blokir
        const response = await axios.post('https://api.vkrfork.com/api/y2mate', { url });
        const data = response.data;

        res.json({
            success: true,
            data: {
                title: data.title,
                thumbnail: data.thumbnail,
                videoId: data.id
            }
        });
    } catch (error) {
        res.status(500).json({ success: false, error: "Gagal ambil info via API Cadangan" });
    }
});

// Dan seterusnya...
module.exports = app;
