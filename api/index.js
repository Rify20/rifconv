const express = require('express');
const ytdl = require('@distube/ytdl-core');
const app = express();

app.use(express.json());

// Header ini meniru Browser Chrome asli 100%
const REQUEST_OPTIONS = {
    headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,apng,*/*;q=0.8',
        'Accept-Language': 'id-ID,id;q=0.9,en-US;q=0.8,en;q=0.7',
        'Sec-Ch-Ua': '"Chromium";v="122", "Not(A:Brand";v="24", "Google Chrome";v="122"',
        'Sec-Ch-Ua-Mobile': '?0',
        'Sec-Ch-Ua-Platform': '"Windows"',
        'Sec-Fetch-Dest': 'document',
        'Sec-Fetch-Mode': 'navigate',
        'Sec-Fetch-Site': 'none',
        'Sec-Fetch-User': '?1',
        'Upgrade-Insecure-Requests': '1'
    }
};

app.post('/api/info', async (req, res) => {
    const { url } = req.body;
    if (!url) return res.status(400).json({ success: false, error: "URL Kosong" });

    try {
        // Kita paksa ytdl untuk tidak menggunakan cache yang mungkin sudah terblokir
        const info = await ytdl.getInfo(url, { 
            requestOptions: REQUEST_OPTIONS,
            lang: 'id'
        });

        res.json({
            success: true,
            data: {
                title: info.videoDetails.title,
                thumbnail: info.videoDetails.thumbnails[info.videoDetails.thumbnails.length - 1].url,
                videoId: info.videoDetails.videoId,
                duration: info.videoDetails.lengthSeconds
            }
        });
    } catch (error) {
        console.error("LOG ERROR INFO:", error.message);
        res.status(500).json({ 
            success: false, 
            error: "YouTube memblokir koneksi. Coba lagi dalam beberapa saat atau ganti link." 
        });
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
