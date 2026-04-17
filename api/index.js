export default async function handler(req, res) {
    // Setup CORS
    res.setHeader('Access-Control-Allow-Credentials', true);
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
    
    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    // Handle GET request (buat test)
    if (req.method === 'GET') {
        return res.status(200).json({ 
            status: 'OK', 
            message: 'API is running! Use POST method to get video info.' 
        });
    }

    // Handle POST request
    if (req.method === 'POST') {
        try {
            const { url } = req.body;
            
            if (!url) {
                return res.status(400).json({ 
                    success: false, 
                    error: 'URL diperlukan' 
                });
            }

            // Extract YouTube ID
            const videoIdMatch = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/shorts\/)([^&?#]+)/);
            const videoId = videoIdMatch ? videoIdMatch[1] : null;

            if (!videoId) {
                return res.status(400).json({ 
                    success: false, 
                    error: 'URL YouTube tidak valid' 
                });
            }

            // Kirim response dengan thumbnail dari YouTube
            return res.status(200).json({
                success: true,
                data: {
                    title: `Video YouTube`,
                    thumbnail: `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`,
                    duration: 0,
                    videoId: videoId
                }
            });

        } catch (error) {
            console.error('Error:', error);
            return res.status(500).json({ 
                success: false, 
                error: 'Terjadi kesalahan pada server' 
            });
        }
    }

    // Method lain tidak diizinkan
    return res.status(405).json({ error: 'Method not allowed' });
}
