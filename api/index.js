const express = require('express');
const axios = require('axios');
const cors = require('cors');
const app = express();

app.use(cors());
app.use(express.json());

// Fungsi extract YouTube ID
function extractVideoId(url) {
    const patterns = [
        /(?:youtube\.com\/watch\?v=)([^&]+)/,
        /(?:youtu\.be\/)([^?]+)/,
        /(?:youtube\.com\/embed\/)([^/?]+)/,
        /(?:youtube\.com\/v\/)([^/?]+)/
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
        // Gunakan API YouTube Data v3 (gratis) untuk info video
        const apiKey = process.env.YOUTUBE_API_KEY;
        
        if (apiKey && apiKey !== 'your_youtube_api_key_here') {
            const response = await axios.get(`https://www.googleapis.com/youtube/v3/videos`, {
                params: {
                    part: 'snippet,contentDetails',
                    id: videoId,
                    key: apiKey
                }
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
        res.status(500).json({ 
            success: false, 
            error: 'Gagal mengambil info video. Coba lagi nanti.' 
        });
    }
});

// API Download - Menggunakan savetube (free, reliable)
app.post('/api/download', async (req, res) => {
    const { url, format } = req.body;
    
    if (!url) {
        return res.status(400).json({ success: false, error: 'URL diperlukan' });
    }

    try {
        // Gunakan API savetube (free, tanpa API key)
        const response = await axios.post('https://api.savetube.me/v1/download', {
            url: url,
            quality: format === 'mp4' ? '720' : '128',
            type: format === 'mp4' ? 'video' : 'audio'
        }, {
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            timeout: 30000
        });

        if (response.data && response.data.data && response.data.data.downloadUrl) {
            const downloadUrl = response.data.data.downloadUrl;
            
            // Proxy download melalui server untuk menghindari CORS
            const downloadResponse = await axios.get(downloadUrl, {
                responseType: 'stream',
                timeout: 60000
            });
            
            const filename = `rifconvert_${Date.now()}.${format}`;
            res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
            res.setHeader('Content-Type', format === 'mp4' ? 'video/mp4' : 'audio/mpeg');
            
            downloadResponse.data.pipe(res);
        } else {
            throw new Error('Download URL tidak ditemukan');
        }

    } catch (error) {
        console.error('Download error:', error.message);
        
        // Fallback ke API alternatif
        try {
            const fallbackResponse = await axios.get(`https://p.oceansaver.in/ajax/download.php`, {
                params: {
                    url: url,
                    api_key: process.env.RAPIDAPI_KEY || ''
                },
                timeout: 30000
            });
            
            if (fallbackResponse.data && fallbackResponse.data.download_url) {
                const downloadResponse = await axios.get(fallbackResponse.data.download_url, {
                    responseType: 'stream',
                    timeout: 60000
                });
                
                const filename = `rifconvert_${Date.now()}.${format}`;
                res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
                res.setHeader('Content-Type', format === 'mp4' ? 'video/mp4' : 'audio/mpeg');
                downloadResponse.data.pipe(res);
            } else {
                throw new Error('Fallback juga gagal');
            }
        } catch (fallbackError) {
            res.status(500).json({ 
                success: false, 
                error: 'Download gagal. Server mungkin sibuk, coba beberapa saat lagi.' 
            });
        }
    }
});

// Helper function: Parse ISO 8601 duration
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
