const express = require('express');
const ytdl = require('@distube/ytdl-core');
const app = express();

app.use(express.json());

app.post('/api/info', async (req, res) => {
    const { url } = req.body;
    try {
        // Menggunakan client ANDROID karena lebih stabil menembus blokir
        const info = await ytdl.getInfo(url, {
            playerClients: ['ANDROID', 'TVHTML5']
        });

        res.json({
            success: true,
            data: {
                title: info.videoDetails.title,
                thumbnail: info.videoDetails.thumbnails[info.videoDetails.thumbnails.length - 1].url,
                videoId: info.videoDetails.videoId
            }
        });
    } catch (error) {
        console.error("LOG:", error.message);
        let msg = "Gagal ambil info.";
        if (error.message.includes("403")) msg = "IP Server diblokir YouTube (403). Coba lagi nanti.";
        if (error.message.includes("age restricted")) msg = "Video ini dibatasi umur (Login Required).";
        
        res.status(500).json({ success: false, error: msg });
    }
});

app.post('/api/download', async (req, res) => {
    const { url, format } = req.body;
    try {
        const info = await ytdl.getInfo(url, { playerClients: ['ANDROID'] });
        const title = info.videoDetails.title.replace(/[^\w\s]/gi, '');
        res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(title)}.${format}"`);
        
        ytdl(url, { 
            quality: format === 'mp4' ? 'highest' : 'highestaudio',
            filter: format === 'mp4' ? 'audioandvideo' : 'audioonly'
        }).pipe(res);
    } catch (error) {
        if (!res.headersSent) res.status(500).send("Error");
    }
});

module.exports = app;
