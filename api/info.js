export default async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    
    const { url } = req.body;
    
    if (!url) {
        return res.status(400).json({ error: 'URL diperlukan' });
    }

    const videoId = url.match(/(?:youtu\.be\/|youtube\.com\/watch\?v=)([a-zA-Z0-9_-]{11})/)?.[1];
    
    if (!videoId) {
        return res.status(400).json({ error: 'URL YouTube tidak valid' });
    }

    return res.json({
        success: true,
        data: {
            title: 'YouTube Video',
            thumbnail: `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`,
            videoId: videoId,
            duration: 'Tidak diketahui'
        }
    });
}
