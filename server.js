const express = require('express');
const ytdl = require('@distube/ytdl-core');
const axios = require('axios');
const app = express();

app.use(express.json());
app.use(express.static(__dirname));

// User Agent browser-like
const USER_AGENT = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';

// API Info Video
app.post('/api/info', async (req, res) => {
    const { url } = req.body;
    
    if (!url || !ytdl.validateURL(url)) {
        return res.status(400).json({ success: false, error: 'URL YouTube tidak valid' });
    }
    
    try {
        const info = await ytdl.getInfo(url, {
            requestOptions: { headers: { 'User-Agent': USER_AGENT } }
        });
        
        const videoDetails = info.videoDetails;
        res.json({
            success: true,
            data: {
                title: videoDetails.title,
                thumbnail: videoDetails.thumbnails[videoDetails.thumbnails.length - 1]?.url,
                duration: parseInt(videoDetails.lengthSeconds),
                videoId: videoDetails.videoId,
                author: videoDetails.author?.name || 'Unknown'
            }
        });
    } catch (error) {
        console.error('Info error:', error.message);
        res.status(500).json({ success: false, error: 'Gagal mengambil info video.' });
    }
});

// API Download
app.post('/api/download', async (req, res) => {
    const { url, format } = req.body;
    
    if (!url || !format) {
        return res.status(400).json({ success: false, error: 'URL dan format diperlukan' });
    }
    
    try {
        const info = await ytdl.getInfo(url, {
            requestOptions: { headers: { 'User-Agent': USER_AGENT } }
        });
        
        const title = info.videoDetails.title.replace(/[^\w\s]/gi, '').substring(0, 50);
        let options = {};

        if (format === 'mp4') {
            // Memilih format yang punya video + audio (biasanya max 720p untuk single stream)
            options = { 
                filter: 'audioandvideo', 
                quality: 'highestvideo' 
            };
            res.setHeader('Content-Type', 'video/mp4');
        } else {
            options = { 
                filter: 'audioonly', 
                quality: 'highestaudio' 
            };
            res.setHeader('Content-Type', 'audio/mpeg');
        }

        const filename = `${encodeURIComponent(title)}.${format}`;
        res.setHeader('Content-Disposition', `attachment; filename*=UTF-8''${filename}`);

        const stream = ytdl(url, {
            ...options,
            requestOptions: { headers: { 'User-Agent': USER_AGENT } }
        });

        stream.pipe(res);

        stream.on('error', (err) => {
            console.error('Stream error:', err.message);
            if (!res.headersSent) res.end();
        });

    } catch (error) {
        console.error('Download error:', error.message);
        if (!res.headersSent) {
            res.status(500).json({ success: false, error: 'Download gagal.' });
        }
    }
});

app.get('/', (req, res) => {
    res.sendFile(__dirname + '/index.html');
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`✅ RifConvert running on port ${PORT} (Node ${process.version})`);
});
