const express = require('express');
const ytdl = require('@distube/ytdl-core');
const app = express();

app.use(express.json());
app.use(express.static(__dirname));

// Log semua request
app.use((req, res, next) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
    next();
});

// Konfigurasi User-Agent seperti browser normal
const USER_AGENT = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';

// API Info Video
app.post('/api/info', async (req, res) => {
    const { url } = req.body;
    
    if (!url) {
        return res.status(400).json({ success: false, error: 'URL diperlukan' });
    }
    
    if (!ytdl.validateURL(url)) {
        return res.status(400).json({ success: false, error: 'URL YouTube tidak valid' });
    }
    
    try {
        const info = await ytdl.getInfo(url, {
            requestOptions: {
                headers: { 'User-Agent': USER_AGENT }
            }
        });
        
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

// API Download - VERSI YANG DIPERBAIKI
app.post('/api/download', async (req, res) => {
    const { url, format } = req.body;
    
    if (!url || !format) {
        return res.status(400).json({ success: false, error: 'URL dan format diperlukan' });
    }
    
    if (!ytdl.validateURL(url)) {
        return res.status(400).json({ success: false, error: 'URL YouTube tidak valid' });
    }
    
    try {
        console.log(`Download request: ${url} as ${format}`);
        
        // Dapatkan info video untuk nama file
        const info = await ytdl.getInfo(url, {
            requestOptions: { headers: { 'User-Agent': USER_AGENT } }
        });
        
        const title = info.videoDetails.title.replace(/[^\w\s]/gi, '').substring(0, 50);
        
        // Pilih format yang tepat
        let quality;
        let filter;
        
        if (format === 'mp4') {
            quality = 'highestvideo';
            filter = 'videoandaudio';
            res.setHeader('Content-Type', 'video/mp4');
        } else {
            quality = 'highestaudio';
            filter = 'audioonly';
            res.setHeader('Content-Type', 'audio/mpeg');
        }
        
        // Coba cari format yang tersedia
        const availableFormat = ytdl.chooseFormat(info.formats, { quality, filter });
        
        if (!availableFormat) {
            throw new Error(`Format ${format} tidak tersedia untuk video ini`);
        }
        
        console.log(`Selected format: ${availableFormat.qualityLabel || availableFormat.audioQuality}`);
        
        // Stream dengan opsi yang lebih lengkap
        const stream = ytdl(url, {
            format: availableFormat,
            requestOptions: {
                headers: {
                    'User-Agent': USER_AGENT,
                    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
                    'Accept-Language': 'en-us,en;q=0.5',
                    'Sec-Fetch-Mode': 'navigate'
                }
            }
        });
        
        // Set header untuk download
        const filename = `${encodeURIComponent(title)}.${format}`;
        res.setHeader('Content-Disposition', `attachment; filename*=UTF-8''${filename}`);
        
        // Pipe stream ke response
        stream.pipe(res);
        
        // Error handling pada stream
        stream.on('error', (error) => {
            console.error('Stream error:', error.message);
            if (!res.headersSent) {
                res.status(500).json({ success: false, error: 'Stream error: ' + error.message });
            }
        });
        
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
