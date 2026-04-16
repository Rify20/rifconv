const express = require('express');
const ytdl = require('@distube/ytdl-core');
const path = require('path');
const app = express();

app.use(express.json());
app.use(express.static(__dirname));

// Konfigurasi Header agar tidak diblokir YouTube
const requestOptions = {
    headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,apng,*/*;q=0.8',
        'Accept-Language': 'id-ID,id;q=0.9,en-US;q=0.8,en;q=0.7',
        'Cache-Control': 'no-cache',
        'Pragma': 'no-cache',
        'Sec-Fetch-Dest': 'document',
        'Sec-Fetch-Mode': 'navigate',
        'Sec-Fetch-Site': 'none',
        'Sec-Fetch-User': '?1',
        'Upgrade-Insecure-Requests': '1'
    }
};

// API Info Video
app.post('/api/info', async (req, res) => {
    const { url } = req.body;
    
    if (!url || !ytdl.validateURL(url)) {
        return res.status(400).json({ success: false, error: 'URL YouTube tidak valid!' });
    }
    
    try {
        // Mengambil informasi video dengan requestOptions
        const info = await ytdl.getInfo(url, { requestOptions });
        
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
        console.error('Info Error Detail:', error.message);
        
        let msg = 'Gagal mengambil info video.';
        if (error.message.includes('403')) msg = 'Akses ditolak YouTube (IP Blocked).';
        if (error.message.includes('429')) msg = 'Terlalu banyak permintaan (Rate Limited).';
        
        res.status(500).json({ success: false, error: msg });
    }
});

// API Download
app.post('/api/download', async (req, res) => {
    const { url, format } = req.body;
    
    if (!url || !format) return res.status(400).send('Data tidak lengkap');

    try {
        const info = await ytdl.getInfo(url, { requestOptions });
        const title = info.videoDetails.title.replace(/[^\w\s]/gi, '').substring(0, 50);
        
        let options = { requestOptions };

        if (format === 'mp4') {
            options.filter = 'audioandvideo';
            options.quality = 'highest';
            res.setHeader('Content-Type', 'video/mp4');
        } else {
            options.filter = 'audioonly';
            options.quality = 'highestaudio';
            res.setHeader('Content-Type', 'audio/mpeg');
        }

        const filename = `rifconvert_${Date.now()}.${format}`;
        res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);

        // Piping stream langsung ke client
        ytdl(url, options)
            .on('error', (err) => {
                console.error('Stream Error:', err.message);
                if (!res.headersSent) res.end();
            })
            .pipe(res);

    } catch (error) {
        console.error('Download Error:', error.message);
        if (!res.headersSent) {
            res.status(500).send('Gagal memproses download');
        }
    }
});

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`✅ Server ON | Port: ${PORT} | Node: ${process.version}`);
});
