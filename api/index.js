export default async function handler(req, res) {
    // Allow CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    
    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    // GET request for health check
    if (req.method === 'GET') {
        return res.status(200).json({ status: 'OK', message: 'RifConvert API is running' });
    }

    // Only POST allowed for actual functions
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const { url, format } = req.body;

    if (!url) {
        return res.status(400).json({ error: 'URL is required' });
    }

    // Extract YouTube video ID
    const videoIdMatch = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/shorts\/)([a-zA-Z0-9_-]{11})/);
    const videoId = videoIdMatch ? videoIdMatch[1] : null;

    if (!videoId) {
        return res.status(400).json({ error: 'Invalid YouTube URL' });
    }

    // If no format provided, return video info
    if (!format) {
        return res.status(200).json({
            success: true,
            data: {
                title: 'YouTube Video',
                thumbnail: `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`,
                videoId: videoId,
                duration: 0
            }
        });
    }

    // DOWNLOAD FUNCTION
    try {
        // Try multiple download APIs
        let downloadUrl = null;
        
        // API 1: Cobalt API (most reliable)
        try {
            const cobaltRes = await fetch('https://api.cobalt.tools/api/json', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
                body: JSON.stringify({
                    url: `https://youtu.be/${videoId}`,
                    downloadMode: format === 'mp4' ? 'auto' : 'audio',
                    audioFormat: 'mp3',
                    videoQuality: '720'
                })
            });
            const cobaltData = await cobaltRes.json();
            if (cobaltData.status === 'stream' && cobaltData.url) {
                downloadUrl = cobaltData.url;
            }
        } catch (e) {
            console.log('Cobalt failed:', e.message);
        }

        // API 2: Savetube (fallback)
        if (!downloadUrl) {
            try {
                const saveRes = await fetch('https://api.savetube.me/v1/download', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        url: `https://www.youtube.com/watch?v=${videoId}`,
                        quality: format === 'mp4' ? '720' : '128',
                        type: format === 'mp4' ? 'video' : 'audio'
                    })
                });
                const saveData = await saveRes.json();
                if (saveData.data && saveData.data.downloadUrl) {
                    downloadUrl = saveData.data.downloadUrl;
                }
            } catch (e) {
                console.log('Savetube failed:', e.message);
            }
        }

        // API 3: Oceansaver (last fallback)
        if (!downloadUrl) {
            try {
                const oceanRes = await fetch(`https://p.oceansaver.in/ajax/download.php?url=https://www.youtube.com/watch?v=${videoId}`);
                const oceanData = await oceanRes.json();
                if (oceanData.download_url) {
                    downloadUrl = oceanData.download_url;
                }
            } catch (e) {
                console.log('Oceansaver failed:', e.message);
            }
        }

        if (downloadUrl) {
            return res.status(200).json({
                success: true,
                downloadUrl: downloadUrl
            });
        } else {
            return res.status(500).json({
                success: false,
                error: 'All download servers are busy. Please try again in a few minutes.'
            });
        }

    } catch (error) {
        console.error('Download error:', error);
        return res.status(500).json({
            success: false,
            error: 'Server error: ' + error.message
        });
    }
}
