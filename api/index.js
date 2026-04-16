const express = require('express');
const ytdl = require('@distube/ytdl-core');
const app = express();

app.use(express.json());

const REQUEST_OPTIONS = {
    headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36',
    }
};

app.post('/api/info', async (req, res) => {
    const { url } = req.body;
    if (!url) return res.status(400).json({ success: false, error: "URL Kosong" });

    try {
        // Opsi tambahan untuk mencoba menghindari blokir
        const info = await ytdl.getInfo(url, { 
            requestOptions: REQUEST_OPTIONS,
            // Mencoba menggunakan client yang berbeda untuk menghindari age-restriction
            playerClients: ['ANDROID', 'IOS', 'WEB_EMBEDDED']
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
        let errorMsg = "Gagal ambil info.";
        if (error.message.includes("age restricted")) {
            errorMsg = "Video ini dibatasi umur (Age Restricted). YouTube melarang akses otomatis.";
        }
        res.status(500).json({ success: false, error: errorMsg });
    }
});

app.post('/api/download', async (req, res) => {
    const { url, format } = req.body;
    try {
        const info = await ytdl.getInfo(url, { requestOptions: REQUEST_OPTIONS });
        const title = info.videoDetails.title.replace(/[^\w\s]/gi, '');
        
        res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(title)}.${format}"`);
        
        ytdl(url, { 
            quality: format === 'mp4' ? 'highest' : 'highestaudio',
            filter: format === 'mp4' ? 'audioandvideo' : 'audioonly',
            requestOptions: REQUEST_OPTIONS
        }).pipe(res);
    } catch (error) {
        if (!res.headersSent) res.status(500).send("Gagal download");
    }
});

module.exports = app;
