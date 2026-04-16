const express = require('express');
const axios = require('axios');
const app = express();

app.use(express.json());

app.post('/api/info', async (req, res) => {
    const { url } = req.body;
    try {
        // Menggunakan API Co-cobalt (Salah satu yang terkuat saat ini)
        const response = await axios.post('https://api.cobalt.tools/api/json', {
            url: url,
            vQuality: '720', // Standar biar cepat
        }, {
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            }
        });

        const data = response.data;

        if (data.status === 'stream' || data.status === 'redirect') {
            res.json({
                success: true,
                data: {
                    title: "Video Ready to Download",
                    thumbnail: "https://placehold.co/600x400?text=Video+Found", // Cobalt kadang tidak kasih thumbnail
                    videoId: "cobalt-download"
                }
            });
        } else {
            throw new Error("Video tidak ditemukan atau diproteksi");
        }
    } catch (error) {
        console.error(error.message);
        res.status(500).json({ success: false, error: "Server YouTube sibuk, coba video lain." });
    }
});

app.post('/api/download', async (req, res) => {
    const { url } = req.body;
    try {
        const response = await axios.post('https://api.cobalt.tools/api/json', {
            url: url,
        });
        // Cobalt langsung kasih link stream
        res.redirect(response.data.url);
    } catch (error) {
        res.status(500).send("Gagal proses download.");
    }
});

module.exports = app;
