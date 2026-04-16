const express = require('express');
const axios = require('axios');
const app = express();

app.use(express.json());

app.post('/api/info', async (req, res) => {
    const { url } = req.body;
    try {
        // Kita gunakan API bypass untuk ambil info video
        const response = await axios.get(`https://api.vkrfork.com/api/y2mate?url=${encodeURIComponent(url)}`);
        const data = response.data;

        if (data && data.title) {
            res.json({
                success: true,
                data: {
                    title: data.title,
                    thumbnail: data.thumbnail,
                    videoId: data.id
                }
            });
        } else {
            throw new Error("Data tidak lengkap");
        }
    } catch (error) {
        res.status(500).json({ success: false, error: "API sedang sibuk atau link tidak didukung." });
    }
});

app.post('/api/download', async (req, res) => {
    const { url, format } = req.body;
    try {
        // Logika download via API Pihak Ketiga
        const response = await axios.get(`https://api.vkrfork.com/api/y2mate?url=${encodeURIComponent(url)}`);
        const downloadUrl = format === 'mp4' ? response.data.video : response.data.audio;

        // Redirect user langsung ke link download asli dari API
        res.redirect(downloadUrl);
    } catch (error) {
        res.status(500).send("Gagal mendapatkan link download.");
    }
});

module.exports = app;
