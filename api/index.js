const ytdl = require('@distube/ytdl-core');
const express = require('express');
const app = express();

app.get('/api/download', async (req, res) => {
    const { url, type } = req.query;

    if (!url || !ytdl.validateURL(url)) {
        return res.status(400).json({ error: 'Link tidak valid' });
    }

    try {
        // Ambil info video
        const info = await ytdl.getInfo(url);
        
        // Cari format yang paling pas (mp3 atau mp4)
        const format = ytdl.chooseFormat(info.formats, { 
            quality: type === 'mp3' ? 'highestaudio' : 'highestvideo',
            filter: type === 'mp3' ? 'audioonly' : 'videoandaudio'
        });

        if (!format || !format.url) throw new Error('Format tidak ditemukan');

        // Kirim LINK ASLI ke frontend (bukan file-nya)
        // Agar browser user yang mendownload langsung, bukan server Vercel
        res.json({ 
            title: info.videoDetails.title,
            downloadUrl: format.url 
        });

    } catch (err) {
        res.status(500).json({ error: 'YouTube memblokir server. Coba lagi.' });
    }
});

module.exports = app;
