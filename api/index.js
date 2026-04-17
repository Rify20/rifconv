const ytdl = require('@distube/ytdl-core');
const express = require('express');
const app = express();

app.get('/api/download', async (req, res) => {
    const videoUrl = req.query.url;
    const type = req.query.type || 'mp4';

    if (!videoUrl || !ytdl.validateURL(videoUrl)) {
        return res.status(400).send('Link YouTube tidak valid!');
    }

    try {
        const info = await ytdl.getInfo(videoUrl);
        const title = info.videoDetails.title.replace(/[^\w\s]/gi, '');
        
        // Setting Header agar Browser langsung download
        res.setHeader('Content-Disposition', `attachment; filename="${title}.${type}"`);
        res.setHeader('Content-Type', type === 'mp3' ? 'audio/mpeg' : 'video/mp4');

        // Filter: audioonly untuk mp3, videoandaudio untuk mp4
        const options = {
            quality: type === 'mp3' ? 'highestaudio' : 'highest',
            filter: type === 'mp3' ? 'audioonly' : 'videoandaudio',
        };

        // Streaming langsung: YouTube -> Vercel -> User
        ytdl(videoUrl, options).pipe(res);

    } catch (err) {
        console.error(err);
        res.status(500).send('Terjadi kendala teknis. Coba lagi dalam 1 menit.');
    }
});

module.exports = app;
