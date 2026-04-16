const express = require('express');
const axios = require('axios');
const app = express();

app.use(express.json());

// Gunakan API publik pihak ketiga agar tidak terkena blokir IP YouTube di Vercel
app.post('/api/info', async (req, res) => {
    const { url } = req.body;
    try {
        const response = await axios.get(`https://api.boxentriq.com/social/video-info?url=${encodeURIComponent(url)}`);
        const data = response.data;

        if (data && data.title) {
            res.json({
                success: true,
                data: {
                    title: data.title,
                    thumbnail: data.thumbnail,
                    duration: 0, // API ini mungkin tidak kirim durasi, set default
                    videoId: "ready"
                }
            });
        } else {
            res.status(404).json({ success: false, error: "Video tidak ditemukan" });
        }
    } catch (error) {
        res.status(500).json({ success: false, error: "Server sibuk, coba lagi." });
    }
});

app.post('/api/download', async (req, res) => {
    const { url, format } = req.body;
    try {
        const response = await axios.get(`https://api.boxentriq.com/social/video-info?url=${encodeURIComponent(url)}`);
        
        // Cari URL download dari API
        const formats = response.data.formats;
        let finalUrl = format === 'mp3' 
            ? formats.find(f => f.type === 'audio')?.url 
            : formats.find(f => f.extension === 'mp4')?.url;

        if (!finalUrl) finalUrl = formats[0].url;

        // PENTING: Alihkan ke URL download asli
        res.json({ success: true, downloadUrl: finalUrl });
    } catch (error) {
        res.status(500).json({ success: false, error: "Gagal membuat link download" });
    }
});

module.exports = app;
