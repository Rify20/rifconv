const express = require('express');
const axios = require('axios');
const app = express();

app.use(express.json());

// API untuk mendapatkan informasi video
app.post('/api/info', async (req, res) => {
    const { url } = req.body;
    
    try {
        // Validasi URL
        if (!url) {
            return res.status(400).json({ success: false, error: "URL tidak boleh kosong" });
        }

        // Gunakan RapidAPI untuk info video (lebih stabil)
        const options = {
            method: 'POST',
            url: 'https://api.rapidapi.com/youtube-info',
            headers: {
                'content-type': 'application/json',
                'x-rapidapi-key': process.env.RAPIDAPI_KEY || 'demo',
                'x-rapidapi-host': 'api.rapidapi.com'
            },
            data: { url: url }
        };

        const response = await axios(options);
        
        if (response.data && response.data.title) {
            res.json({
                success: true,
                data: {
                    title: response.data.title,
                    thumbnail: response.data.thumbnail || response.data.thumb,
                    duration: response.data.duration || "0",
                    formats: response.data.formats || []
                }
            });
        } else {
            // Fallback jika format response berbeda
            res.json({
                success: true,
                data: {
                    title: response.data.title || "Video",
                    thumbnail: response.data.thumbnail || "https://via.placeholder.com/320x180",
                    duration: "0",
                    formats: response.data.formats || []
                }
            });
        }
    } catch (error) {
        console.error('API Error:', error.message);
        res.status(500).json({ 
            success: false, 
            error: "Gagal mengambil informasi video. Pastikan URL benar." 
        });
    }
});

// API untuk download video/audio dengan streaming
app.post('/api/download', async (req, res) => {
    const { url, format } = req.body;
    
    try {
        if (!url || !format) {
            return res.status(400).json({ success: false, error: "URL dan format harus ada" });
        }

        // Dapatkan download link dari API
        const options = {
            method: 'POST',
            url: 'https://api.rapidapi.com/youtube-download',
            headers: {
                'content-type': 'application/json',
                'x-rapidapi-key': process.env.RAPIDAPI_KEY || 'demo',
                'x-rapidapi-host': 'api.rapidapi.com'
            },
            data: {
                url: url,
                format: format // 'mp4', 'mp3', 'wav', dll
            }
        };

        const response = await axios(options);

        if (response.data && response.data.downloadUrl) {
            // Stream file langsung ke client
            const fileResponse = await axios.get(response.data.downloadUrl, {
                responseType: 'stream',
                timeout: 30000
            });

            const contentType = format === 'mp3' ? 'audio/mpeg' : 'video/mp4';
            const filename = `download.${format === 'mp3' ? 'mp3' : 'mp4'}`;

            res.setHeader('Content-Type', contentType);
            res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
            res.setHeader('Content-Length', fileResponse.headers['content-length']);

            fileResponse.data.pipe(res);

            fileResponse.data.on('error', (error) => {
                console.error('Stream error:', error);
                res.status(500).json({ success: false, error: "Gagal streaming file" });
            });
        } else {
            res.status(500).json({ success: false, error: "Download link tidak ditemukan" });
        }
    } catch (error) {
        console.error('Download Error:', error.message);
        res.status(500).json({ 
            success: false, 
            error: "Gagal mengunduh file. Coba lagi dalam beberapa saat." 
        });
    }
});

// Health check
app.get('/api/health', (req, res) => {
    res.json({ success: true, message: "API is running" });
});

module.exports = app;
