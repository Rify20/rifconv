export default async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    
    const { url, format } = req.body;
    
    if (!url) {
        return res.status(400).json({ error: 'URL diperlukan' });
    }

    // Extract YouTube ID
    const videoId = url.match(/(?:youtu\.be\/|youtube\.com\/watch\?v=)([a-zA-Z0-9_-]{11})/)?.[1];
    
    if (!videoId) {
        return res.status(400).json({ error: 'URL YouTube tidak valid' });
    }

    // Redirect ke website download yang sudah jadi
    let downloadUrl;
    if (format === 'mp4') {
        downloadUrl = `https://yt1s.su/en/youtube-to-mp4?url=https://youtu.be/${videoId}`;
    } else {
        downloadUrl = `https://yt1s.su/en/youtube-to-mp3?url=https://youtu.be/${videoId}`;
    }

    return res.json({
        success: true,
        downloadUrl: downloadUrl,
        videoId: videoId
    });
}
