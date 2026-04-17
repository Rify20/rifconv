const express = require('express');
const axios = require('axios');
const cors = require('cors');
const app = express();

app.use(cors());
app.use(express.json());

// Extract YouTube ID
function extractVideoId(url) {
    const patterns = [
        /(?:youtube\.com\/watch\?v=)([^&]+)/,
        /(?:youtu\.be\/)([^?]+)/,
        /(?:youtube\.com\/embed\/)([^/?]+)/,
        /(?:youtube\.com\/v\/)([^/?]+)/,
        /(?:youtube\.com\/shorts\/)([^/?]+)/
    ];
    for (let pattern of patterns) {
        const match = url.match(pattern);
        if (match) return match[1];
    }
    return null;
}

// API Info Video
app.post('/api/info', async (req, res) => {
    const { url } = req.body;
    
    if (!url) {
        return res.status(400).json({ success: false, error: 'URL diperlukan' });
    }

    const videoId = extractVideoId(url);
    if (!videoId) {
        return res.status(400).json({ success: false, error: 'URL YouTube tidak valid' });
    }

    try {
        // Gunakan YouTube API Key jika ada
        const apiKey = process.env.YOUTUBE_API_KEY;
        
        if (apiKey && apiKey !== 'your_youtube_api_key_here') {
            const response = await axios.get(`https://www.googleapis.com/youtube/v3/videos`, {
                params: {
                    part: 'snippet,contentDetails',
                    id: videoId,
                    key: apiKey
                },
                timeout: 10000
            });

            if (response.data.items && response.data.items[0]) {
                const video = response.data.items[0];
                const duration = parseDuration(video.contentDetails.duration);
                
                return res.json({
                    success: true,
                    data: {
                        title: video.snippet.title,
                        thumbnail: video.snippet.thumbnails.high.url,
                        duration: duration,
                        videoId: videoId
                    }
                });
            }
        }

        // Fallback: Gunakan oembed (tanpa API key)
        const oembedResponse = await axios.get(`https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${videoId}&format=json`);
        
        res.json({
            success: true,
            data: {
                title: oembedResponse.data.title,
                thumbnail: `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`,
                duration: 0,
                videoId: videoId
            }
        });

    } catch (error) {
        console.error('Info error:', error.message);
        
        // Fallback terakhir: info dasar
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

// API Download
app.post('/api/download', async (req, res) => {
    const { url, format } = req.body;
    
    if (!url) {
        return res.status(400).json({ success: false, error: 'URL diperlukan' });
    }

    // Daftar API download (multiple fallback)
    const apis = [
        async () => {
            const response = await axios.post('https://api.savetube.me/v1/download', {
                url: url,
                quality: format === 'mp4' ? '720' : '128',
                type: format === 'mp4' ? 'video' : 'audio'
            }, {
                headers: { 'Content-Type': 'application/json' },
                timeout: 15000
            });
            return response.data?.data?.downloadUrl;
        },
        
        async () => {
            const response = await axios.get(`https://p.oceansaver.in/ajax/download.php`, {
                params: { url: url },
                timeout: 15000
            });
            return response.data?.download_url || response.data?.downloadUrl;
        },
        
        async () => {
            const response = await axios.post('https://co.wuk.sh/api/json', {
                url: url,
                downloadMode: format === 'mp4' ? 'auto' : 'audio',
                audioFormat: 'mp3'
            }, {
                headers: { 'Content-Type': 'application/json' },
                timeout: 15000
            });
            return response.data?.url;
        }
    ];

    for (let i = 0; i < apis.length; i++) {
        try {
            const downloadUrl = await apis[i]();
            
            if (downloadUrl) {
                const downloadResponse = await axios.get(downloadUrl, {
                    responseType: 'stream',
                    timeout: 60000,
                    headers: {
                        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
                    }
                });
                
                const filename = `RifConvert_${format.toUpperCase()}_${Date.now()}.${format}`;
                res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
                res.setHeader('Content-Type', format === 'mp4' ? 'video/mp4' : 'audio/mpeg');
                
                downloadResponse.data.pipe(res);
                return;
            }
        } catch (error) {
            console.error(`API ${i + 1} gagal:`, error.message);
            continue;
        }
    }

    res.status(500).json({ 
        success: false, 
        error: 'Server download sibuk. Silakan coba lagi.' 
    });
});

// Helper parse duration
function parseDuration(duration) {
    const match = duration.match(/PT(\d+H)?(\d+M)?(\d+S)?/);
    const hours = (match[1] || '').replace('H', '') || 0;
    const minutes = (match[2] || '').replace('M', '') || 0;
    const seconds = (match[3] || '').replace('S', '') || 0;
    return parseInt(hours) * 3600 + parseInt(minutes) * 60 + parseInt(seconds);
}

// Health check
app.get('/api/health', (req, res) => {
    res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

module.exports = app;
