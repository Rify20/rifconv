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

// API Info - Menggunakan oembed + thumbnail dari YouTube (gratis, tanpa API key)
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
        // Method 1: Gunakan YouTube oembed (gratis, tanpa API key)
        const oembedResponse = await axios.get(`https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${videoId}&format=json`);
        
        // Method 2: Dapatkan durasi dari API alternatif
        let duration = 0;
        try {
            const infoResponse = await axios.get(`https://noembed.com/embed?url=https://www.youtube.com/watch?v=${videoId}`);
            if (infoResponse.data && infoResponse.data.duration) {
                duration = parseInt(infoResponse.data.duration);
            }
        } catch(e) {
            // Fallback: estimasi durasi dari thumbnail? atau biarkan 0
        }
        
        res.json({
            success: true,
            data: {
                title: oembedResponse.data.title,
                thumbnail: `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`,
                duration: duration,
                videoId: videoId
            }
        });

    } catch (error) {
        console.error('Info error:', error.message);
        
        // Fallback: Gunakan info dasar tanpa API
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

// API Download - Menggunakan multiple fallback APIs
app.post('/api/download', async (req, res) => {
    const { url, format } = req.body;
    
    if (!url) {
        return res.status(400).json({ success: false, error: 'URL diperlukan' });
    }

    const apis = [
        // API 1: Savetube (paling reliable)
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
        
        // API 2: Y2mate alternative
        async () => {
            const response = await axios.get(`https://p.oceansaver.in/ajax/download.php`, {
                params: { url: url, api_key: '' },
                timeout: 15000
            });
            return response.data?.download_url || response.data?.downloadUrl;
        },
        
        // API 3: Cobalt API
        async () => {
            const response = await axios.post('https://co.wuk.sh/api/json', {
                url: url,
                downloadMode: format === 'mp4' ? 'auto' : 'audio',
                audioFormat: 'mp3'
            }, {
                headers: { 
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                },
                timeout: 15000
            });
            return response.data?.url;
        }
    ];

    for (let i = 0; i < apis.length; i++) {
        try {
            console.log(`Mencoba API ${i + 1}...`);
            const downloadUrl = await apis[i]();
            
            if (downloadUrl) {
                console.log(`API ${i + 1} berhasil!`);
                
                // Proxy download
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
                res.setHeader('Cache-Control', 'no-cache');
                
                downloadResponse.data.pipe(res);
                return;
            }
        } catch (error) {
            console.error(`API ${i + 1} gagal:`, error.message);
            continue;
        }
    }

    // Jika semua API gagal
    res.status(500).json({ 
        success: false, 
        error: 'Semua server download sibuk. Silakan coba lagi dalam beberapa menit.' 
    });
});

// Health check
app.get('/api/health', (req, res) => {
    res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Handle OPTIONS untuk CORS
app.options('/api/*', (req, res) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Content-Type');
    res.send(200);
});

module.exports = app;
