const express = require('express');
const axios = require('axios');
const cors = require('cors');
const app = express();

app.use(cors());
app.use(express.json());

function extractVideoId(url) {
    const patterns = [
        /(?:youtube\.com\/watch\?v=)([^&]+)/,
        /(?:youtu\.be\/)([^?]+)/,
        /(?:youtube\.com\/shorts\/)([^/?]+)/
    ];
    for (let pattern of patterns) {
        const match = url.match(pattern);
        if (match) return match[1];
    }
    return null;
}

// API INFO - PAKAI YOUTUBE OFFICIAL (TANPA API KEY)
app.post('/api/info', async (req, res) => {
    const { url } = req.body;
    
    if (!url) {
        return res.status(400).json({ success: false, error: 'URL diperlukan' });
    }

    const videoId = extractVideoId(url);
    if (!videoId) {
        return res.status(400).json({ success: false, error: 'URL tidak valid' });
    }

    try {
        // Pake oembed YouTube (gratis, no API key)
        const oembed = await axios.get(`https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${videoId}&format=json`);
        
        res.json({
            success: true,
            data: {
                title: oembed.data.title,
                thumbnail: `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`,
                duration: 0,
                videoId: videoId
            }
        });
    } catch (error) {
        res.json({
            success: true,
            data: {
                title: 'Video YouTube',
                thumbnail: `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`,
                duration: 0,
                videoId: videoId
            }
        });
    }
});

// API DOWNLOAD
app.post('/api/download', async (req, res) => {
    const { url, format } = req.body;

    try {
        // Pake API youtube-get (alternatif)
        const videoId = extractVideoId(url);
        const apiUrl = `https://youtube-get.p.rapidapi.com/dl?id=${videoId}`;
        
        const response = await axios.get(apiUrl, {
            headers: {
                'X-RapidAPI-Key': process.env.RAPIDAPI_KEY || 'test',
                'X-RapidAPI-Host': 'youtube-get.p.rapidapi.com'
            },
            timeout: 20000
        });

        let downloadUrl = format === 'mp4' 
            ? response.data?.formats?.find(f => f.resolution === '720p')?.url || response.data?.formats?.[0]?.url
            : response.data?.audio_formats?.[0]?.url;

        if (downloadUrl) {
            const fileResponse = await axios.get(downloadUrl, { responseType: 'stream' });
            res.setHeader('Content-Disposition', `attachment; filename="video.${format}"`);
            fileResponse.data.pipe(res);
        } else {
            throw new Error('URL tidak ditemukan');
        }
    } catch (error) {
        res.status(500).json({ success: false, error: 'Download gagal, coba lagi' });
    }
});

module.exports = app;
