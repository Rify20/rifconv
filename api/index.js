export default async function handler(req, res) {
    // Setup CORS
    res.setHeader('Access-Control-Allow-Credentials', true);
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
    
    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    if (req.method === 'GET') {
        return res.status(200).json({ status: 'OK', message: 'API running' });
    }

    if (req.method === 'POST') {
        try {
            const { url, format } = req.body;
            
            if (!url) {
                return res.status(400).json({ success: false, error: 'URL diperlukan' });
            }

            // Extract YouTube ID
            const videoIdMatch = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/shorts\/)([^&?#]+)/);
            const videoId = videoIdMatch ? videoIdMatch[1] : null;

            if (!videoId) {
                return res.status(400).json({ success: false, error: 'URL YouTube tidak valid' });
            }

            // Jika hanya minta info video (tanpa format)
            if (!format) {
                return res.status(200).json({
                    success: true,
                    data: {
                        title: `Video YouTube`,
                        thumbnail: `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`,
                        duration: 0,
                        videoId: videoId
                    }
                });
            }

            // ========== DOWNLOAD ==========
            // Gunakan API alternatif (savetube)
            const apiUrl = 'https://api.savetube.me/v1/download';
            const requestBody = {
                url: `https://www.youtube.com/watch?v=${videoId}`,
                quality: format === 'mp4' ? '720p' : '128kbps',
                type: format === 'mp4' ? 'video' : 'audio'
            };

            const response = await fetch(apiUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(requestBody)
            });

            const data = await response.json();

            if (data && data.data && data.data.downloadUrl) {
                return res.status(200).json({
                    success: true,
                    downloadUrl: data.data.downloadUrl
                });
            } else {
                return res.status(500).json({ 
                    success: false, 
                    error: 'Gagal mendapatkan link download' 
                });
            }

        } catch (error) {
            console.error('Error:', error);
            return res.status(500).json({ 
                success: false, 
                error: 'Terjadi kesalahan: ' + error.message 
            });
        }
    }

    return res.status(405).json({ error: 'Method not allowed' });
}
