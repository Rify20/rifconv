const express = require('express');
const ytdl = require('@distube/ytdl-core');
const path = require('path');
const app = express();

app.use(express.json());
// Pastikan ini mengarah ke folder yang benar di Render
app.use(express.static(path.join(__dirname)));

const requestOptions = {
    headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,apng,*/*;q=0.8',
        'Accept-Language': 'id-ID,id;q=0.9,en-US;q=0.8,en;q=0.7',
    }
};

app.post('/api/info', async (req, res) => {
    const { url } = req.body;
    if (!url || !ytdl.validateURL(url)) {
        return res.status(400).json({ success: false, error: 'URL tidak valid' });
    }
    try {
        const info = await ytdl.getInfo(url, { requestOptions });
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
        console.error('Info Error:', error.message);
        res.status(500).json({ success: false, error: 'Gagal mengambil info. YouTube mungkin memblokir IP server ini.' });
    }
});

app.post('/api/download', async (req, res) => {
    const { url, format } = req.body;
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

        res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(title)}.${format}"`);

        ytdl(url, options)
            .on('error', (err) => {
                console.error('Stream Error:', err.message);
                if (!res.headersSent) res.end();
            })
            .pipe(res);

    } catch (error) {
        console.error('Download Error:', error.message);
        if (!res.headersSent) res.status(500).send('Error');
    }
});

app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

const PORT = process.env.PORT || 10000; // Render biasanya menggunakan port 10000
app.listen(PORT, () => {
    console.log(`🚀 RifConvert Live on Port ${PORT}`);
});
