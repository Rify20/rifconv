const express = require('express');
const ytdl = require('ytdl-core');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());
app.use(express.static(__dirname));

// Logging middleware
app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
    next();
});

// API: Get video info
app.post('/api/info', async (req, res) => {
    const { url } = req.body;
    
    if (!url) {
        return res.status(400).json({ success: false, error: 'URL is required' });
    }
    
    if (!ytdl.validateURL(url)) {
        return res.status(400).json({ success: false, error: 'Invalid YouTube URL' });
    }
    
    try {
        console.log(`Fetching info for: ${url}`);
        const info = await ytdl.getInfo(url);
        const videoDetails = info.videoDetails;
        
        res.json({
            success: true,
            data: {
                title: videoDetails.title,
                thumbnail: videoDetails.thumbnails[videoDetails.thumbnails.length - 1]?.url || videoDetails.thumbnails[0]?.url,
                duration: parseInt(videoDetails.lengthSeconds),
                videoId: videoDetails.videoId,
                author: videoDetails.author.name
            }
        });
    } catch (error) {
        console.error('Info fetch error:', error);
        res.status(500).json({ 
            success: false, 
            error: 'Failed to fetch video info. Please check the URL.' 
        });
    }
});

// API: Download video/audio
app.post('/api/download', async (req, res) => {
    const { url, format } = req.body;
    
    if (!url || !format) {
        return res.status(400).json({ success: false, error: 'URL and format are required' });
    }
    
    if (!ytdl.validateURL(url)) {
        return res.status(400).json({ success: false, error: 'Invalid YouTube URL' });
    }
    
    try {
        console.log(`Download request: ${url} as ${format}`);
        
        // Get video info for filename
        const info = await ytdl.getInfo(url);
        const title = info.videoDetails.title.replace(/[^\w\s]/gi, '').substring(0, 50);
        
        let stream;
        let contentType;
        let filename;
        
        if (format === 'mp4') {
            // Download video with best quality
            stream = ytdl(url, {
                quality: 'highestvideo',
                filter: 'videoandaudio'
            });
            contentType = 'video/mp4';
            filename = `${title}.mp4`;
        } else {
            // Download audio only with best quality
            stream = ytdl(url, {
                quality: 'highestaudio',
                filter: 'audioonly'
            });
            contentType = 'audio/mpeg';
            filename = `${title}.mp3`;
        }
        
        // Set headers for download
        res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(filename)}"`);
        res.setHeader('Content-Type', contentType);
        
        // Pipe the stream to response
        stream.pipe(res);
        
        // Handle stream errors
        stream.on('error', (error) => {
            console.error('Stream error:', error);
            if (!res.headersSent) {
                res.status(500).json({ success: false, error: 'Download failed' });
            }
        });
        
    } catch (error) {
        console.error('Download error:', error);
        res.status(500).json({ success: false, error: 'Failed to process download' });
    }
});

// Health check endpoint
app.get('/health', (req, res) => {
    res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Start server
app.listen(PORT, () => {
    console.log(`✅ RifConvert server running on port ${PORT}`);
    console.log(`📱 Open http://localhost:${PORT}`);
});