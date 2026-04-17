export default async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    
    if (req.method === 'OPTIONS') return res.status(200).end();
    if (req.method === 'GET') return res.status(200).json({ status: 'OK' });

    const { url, format } = req.body;
    if (!url) return res.status(400).json({ error: 'URL diperlukan' });

    // Extract YouTube ID
    const videoId = url.match(/(?:youtu\.be\/|youtube\.com\/watch\?v=)([a-zA-Z0-9_-]{11})/)?.[1];
    if (!videoId) return res.status(400).json({ error: 'URL YouTube tidak valid' });

    // Return video info (tanpa download)
    if (!format) {
        return res.json({
            success: true,
            data: {
                title: 'YouTube Video',
                thumbnail: `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`,
                videoId: videoId
            }
        });
    }

    // ========== DOWNLOAD - PAKAI MULTIPLE WEBSITE (yg masih hidup) ==========
    // Daftar website converter yang MASIH AKTIF di 2026
    const services = {
        mp4: [
            `https://cnvmp3.com/en/youtube-to-mp4?url=https://youtu.be/${videoId}`,
            `https://yt5s.com/en/youtube-to-mp4?url=https://youtu.be/${videoId}`,
            `https://y2mate.nu/en/youtube-to-mp4?url=https://youtu.be/${videoId}`
        ],
        mp3: [
            `https://cnvmp3.com/en/youtube-to-mp3?url=https://youtu.be/${videoId}`,
            `https://ytmp3.cc/youtube-to-mp3/?url=https://youtu.be/${videoId}`,
            `https://onlymp3.net/youtube-to-mp3/?url=https://youtu.be/${videoId}`
        ]
    };

    const downloadUrl = services[format]?.[0] || services.mp4[0];
    
    return res.json({
        success: true,
        downloadUrl: downloadUrl,
        message: 'Klik link, cari tombol download di halaman yang terbuka'
    });
}
