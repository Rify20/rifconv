const express = require('express');
const ytdl = require('@distube/ytdl-core');
const axios = require('axios');
const app = express();

app.use(express.json());
app.use(express.static(__dirname));

// User Agent seperti browser
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
        console.error('Info error:', error.message);
        res.status(500).json({ 
            success: false, 
            error: 'Gagal mengambil info video. Coba URL lain.' 
        });
    }
});

// API Download
app.post('/api/download', async (req, res) => {
    const { url, format } = req.body;
    
    if (!url || !format) {
        return res.status(400).json({ success: false, error: 'URL dan format diperlukan' });
    }
    
    try {
        console.log(`Download: ${format.toUpperCase()} - ${url}`);
        
        // Dapatkan info video
        const info = await ytdl.getInfo(url, {
            requestOptions: {
                headers: { 'User-Agent': USER_AGENT }
            }
        });
        
        const title = info.videoDetails.title.replace(/[^\w\s]/gi, '').substring(0, 50);
        
        // Pilih format berdasarkan tipe
        let formatChoice;
        
        if (format === 'mp4') {
            // Cari format video dengan audio (mp4)
            formatChoice = info.formats.find(f => 
                f.hasVideo && f.hasAudio && f.container === 'mp4'
            ) || info.formats.find(f => 
                f.hasVideo && f.container === 'mp4'
            );
            
            if (!formatChoice) {
                formatChoice = ytdl.chooseFormat(info.formats, { quality: 'highestvideo' });
            }
            
            res.setHeader('Content-Type', 'video/mp4');
        } else {
            // Cari format audio terbaik
            formatChoice = ytdl.chooseFormat(info.formats, { quality: 'highestaudio' });
            res.setHeader('Content-Type', 'audio/mpeg');
        }
        
        if (!formatChoice) {
            throw new Error(`Format ${format} tidak tersedia`);
        }
        
        console.log(`Using format: ${formatChoice.qualityLabel || formatChoice.audioQuality || 'unknown'}`);
        
        // Set header download
        const filename = `${encodeURIComponent(title)}.${format}`;
        res.setHeader('Content-Disposition', `attachment; filename*=UTF-8''${filename}`);
        
        // Stream video
        const stream = ytdl(url, {
            format: formatChoice,
            requestOptions: {
                headers: { 'User-Agent': USER_AGENT }
            }
        });
        
        stream.pipe(res);
        
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
            error: 'Download gagal: ' + error.message 
        });
    }
});

// Health check
app.get('/health', (req, res) => {
    res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

app.get('/', (req, res) => {
    res.sendFile(__dirname + '/index.html');
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`✅ RifConvert running on port ${PORT}`);
    console.log(`🌐 Open http://localhost:${PORT}`);
});
