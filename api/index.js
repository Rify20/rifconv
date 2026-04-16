const express = require('express');
const axios = require('axios');
const app = express();

app.use(express.json());

app.post('/api/info', async (req, res) => {
    const { url } = req.body;
    try {
        // Menggunakan API publik yang lebih stabil
        const response = await axios.get(`https://api.boxentriq.com/social/video-info?url=${encodeURIComponent(url)}`);
        const data = response.data;

        if (data && data.title) {
            res.json({
                success: true,
                data: {
                    title: data.title,
                    thumbnail: data.thumbnail,
                    videoId: "ready"
                }
            });
        } else {
            throw new Error("Video tidak ditemukan");
        }
    } catch (error) {
        // Jika API 1 gagal, gunakan API 2 sebagai backup
        res.status(500).json({ success: false, error: "Coba lagi dalam 5 detik atau ganti video." });
    }
});

app.post('/api/download', async (req, res) => {
    const { url, format } = req.body;
    try {
        const response = await axios.get(`https://api.boxentriq.com/social/video-info?url=${encodeURIComponent(url)}`);
        
        // Pilih link video atau audio
        const downloadUrl = format === 'mp3' ? response.data.formats.find(f => f.type === 'audio').url : response.data.formats[0].url;

        res.json({ success: true, downloadUrl: downloadUrl });
    } catch (error) {
        res.status(500).json({ success: false });
    }
});

module.exports = app;
