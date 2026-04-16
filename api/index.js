const express = require('express');
const ytdl = require('@distube/ytdl-core');
const path = require('path');
const app = express();

app.use(express.json());

const USER_AGENT = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36';

app.post('/api/info', async (req, res) => {
    const { url } = req.body;
    try {
        const info = await ytdl.getInfo(url, { 
            requestOptions: { headers: { 'User-Agent': USER_AGENT } } 
        });
        res.json({
            success: true,
            data: {
                title: info.videoDetails.title,
                thumbnail: info.videoDetails.thumbnails[info.videoDetails.thumbnails.length - 1]?.url,
                duration: parseInt(info.videoDetails.lengthSeconds),
                videoId: info.videoDetails.videoId
            }
        });
    } catch (error) {
        res.status(500).json({ success: false, error: 'Gagal ambil info' });
    }
});

app.post('/api/download', async (req, res) => {
    const { url, format } = req.body;
    try {
        const info = await ytdl.getInfo(url, { 
            requestOptions: { headers: { 'User-Agent': USER_AGENT } } 
        });
        const title = info.videoDetails.title.replace(/[^\w\s]/gi, '').substring(0, 50);
        
        res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(title)}.${format}"`);
        
        ytdl(url, { 
            quality: format === 'mp4' ? 'highest' : 'highestaudio',
            filter: format === 'mp4' ? 'audioandvideo' : 'audioonly',
            requestOptions: { headers: { 'User-Agent': USER_AGENT } }
        }).pipe(res);
    } catch (error) {
        if (!res.headersSent) res.status(500).send('Error');
    }
});

module.exports = app; // Penting untuk Vercel