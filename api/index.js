const ytdl = require('@distube/ytdl-core');
const express = require('express');
const app = express();

app.get('/api/download', async (req, res) => {
    const { url, type } = req.query;

    if (!url) return res.status(400).send('URL YouTube mana?');

    try {
        const info = await ytdl.getInfo(url);
        const title = info.videoDetails.title.replace(/[^\w\s]/gi, '');
        
        const format = type === 'mp3' ? 'audioonly' : 'videoandaudio';
        const contentType = type === 'mp3' ? 'audio/mpeg' : 'video/mp4';

        res.setHeader('Content-Disposition', `attachment; filename="${title}.${type}"`);
        res.setHeader('Content-Type', contentType);

        // Proses streaming mandiri: YouTube -> Vercel -> User
        ytdl(url, {
            filter: format,
            quality: 'highestaudio'
        }).pipe(res);

    } catch (err) {
        console.error(err);
        res.status(500).send('YouTube memblokir koneksi. Coba ganti link atau ulangi.');
    }
});

module.exports = app;
