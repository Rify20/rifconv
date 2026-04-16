const express = require('express');
const ytdl = require('ytdl-core');
const app = express();

app.use(express.json());
app.use(express.static(__dirname));

// Log semua request
app.use((req, res, next) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
    next();
});

// API Info Video
app.post('/api/info', async (req, res) => {
    const { url } = req.body;
    
    if (!url) {
        return res.status(400).json({ 
            success: false, 
            error: 'URL diperlukan' 
        });
    }
    
    if (!ytdl.validateURL(url)) {
        return res.status(400).json({ 
            success: false, 
            error: 'URL YouTube tidak valid' 
        });
    }
    
    try {
        const info = await ytdl.getInfo(url);
        const videoDetails = info.videoDetails;
        
        res.json({
            success: true,
            data: {
                title: videoDetails.title,
                thumbnail: videoDetails.thumbnails[videoDetails.thumbnails.length - 1]?.url || videoDetails.thumbnails[0]?.url,
                duration: parseInt(videoDetails.lengthSeconds),
                videoId: videoDetails.videoId,
                author: videoDetails.author?.name || 'Unknown'
            }
        });
        
    } catch (error) {
        console.error('Error:', error.message);
        res.status(500).json({ 
            success: false, 
            error: 'Gagal mengambil info video: ' + error.message 
        });
    }
});

// API Download
app.post('/api/download', async (req, res) => {
    const { url, format } = req.body;
    
    if (!url || !format) {
        return res.status(400).json({ 
            success: false, 
            error: 'URL dan format diperlukan' 
        });
    }
    
    if (!ytdl.validateURL(url)) {
        return res.status(400).json({ 
            success: false, 
            error: 'URL YouTube tidak valid' 
        });
    }
    
    try {
        const info = await ytdl.getInfo(url);
        const title = info.videoDetails.title.replace(/[^\w\s]/gi, '').substring(0, 50);
        
        if (format === 'mp4') {
            res.setHeader('Content-Type', 'video/mp4');
            res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(title)}.mp4"`);
            ytdl(url, { quality: 'highestvideo' }).pipe(res);
        } else {
            res.setHeader('Content-Type', 'audio/mpeg');
            res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(title)}.mp3"`);
            ytdl(url, { quality: 'highestaudio' }).pipe(res);
        }
        
    } catch (error) {
        console.error('Download error:', error.message);
        res.status(500).json({ 
            success: false, 
            error: 'Gagal download: ' + error.message 
        });
    }
});

// Health check
app.get('/health', (req, res) => {
    res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Root route
app.get('/', (req, res) => {
    res.sendFile(__dirname + '/index.html');
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`✅ RifConvert running on port ${PORT}`);
});