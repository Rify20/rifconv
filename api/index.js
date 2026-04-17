export default async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    
    if (req.method === 'OPTIONS') return res.status(200).end();
    if (req.method === 'GET') return res.status(200).json({ status: 'OK' });

    const { url, format } = req.body;
    if (!url) return res.status(400).json({ error: 'URL required' });

    // Extract YouTube ID
    const videoId = url.match(/(?:youtu\.be\/|youtube\.com\/watch\?v=)([^&?#]+)/)?.[1];
    if (!videoId) return res.status(400).json({ error: 'Invalid YouTube URL' });

    // Return video info (tanpa download)
    if (!format) {
        return res.json({
            success: true,
            data: {
                title: 'YouTube Video',
                thumbnail: `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`,
                videoId
            }
        });
    }

    // DOWNLOAD - Pakai external service
    try {
        const proxyUrl = `https://p.oceansaver.in/ajax/download.php?url=https://www.youtube.com/watch?v=${videoId}&api_key=`;
        const proxyRes = await fetch(proxyUrl);
        const proxyData = await proxyRes.json();
        
        if (proxyData.download_url) {
            return res.json({ success: true, downloadUrl: proxyData.download_url });
        }
        
        // Fallback ke cobalt
        const cobalt = await fetch('https://co.wuk.sh/api/json', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                url: `https://youtu.be/${videoId}`,
                downloadMode: format === 'mp4' ? 'auto' : 'audio',
                audioFormat: 'mp3'
            })
        });
        const cobaltData = await cobalt.json();
        
        if (cobaltData.url) {
            return res.json({ success: true, downloadUrl: cobaltData.url });
        }
        
        return res.status(500).json({ error: 'Download failed' });
    } catch (err) {
        return res.status(500).json({ error: 'Server error: ' + err.message });
    }
}
