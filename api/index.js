const express = require('express');
const ytdl = require('@distube/ytdl-core');
const app = express();

app.use(express.json());

// User Agent agar tidak dianggap bot oleh YouTube
const USER_AGENT = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36';

app.post('/api/info', async (req, res) => {
    try {
        const { url } = req.body;
        const info = await ytdl.getInfo(url, {
            requestOptions: { headers: { 'User-Agent': USER_AGENT } }
        });
        res.json({
            success: true,
            data: {
                title: info.videoDetails.title,
                thumbnail: info.videoDetails.thumbnails[0].url,
                videoId: info.videoDetails.videoId
            }
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, error: "Gagal ambil info" });
    }
});

app.post('/api/download', async (req, res) => {
    try {
        const { url, format } = req.body;
        const info = await ytdl.getInfo(url, {
            requestOptions: { headers: { 'User-Agent': USER_AGENT } }
        });
        const title = info.videoDetails.title.replace(/[^\w\s]/gi, '');
        
        res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(title)}.${format}"`);
        
        ytdl(url, { 
            quality: format === 'mp4' ? 'highest' : 'highestaudio',
            filter: format === 'mp4' ? 'audioandvideo' : 'audioonly',
            requestOptions: { headers: { 'User-Agent': USER_AGENT } }
        }).pipe(res);
    } catch (error) {
        if (!res.headersSent) res.status(500).send("Download error");
    }
});

module.exports = app;
