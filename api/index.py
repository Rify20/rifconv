from flask import Flask, request
import yt_dlp

app = Flask(__name__)

@app.route('/api/download')
def download():
    # Mengambil parameter 'url' dan 'ext' dari browser
    video_url = request.args.get('url')
    ext = request.args.get('ext', 'mp4')

    if not video_url:
        return {"error": "URL YouTube harus diisi!"}, 400

    # Settingan mesin yt-dlp
    # Kita hanya ambil link (URL) aslinya saja, tidak download ke server Vercel
    # agar tidak kena limit/timeout
    ydl_opts = {
        'format': 'bestaudio/best' if ext == 'mp3' else 'best[ext=mp4]/best',
        'quiet': True,
        'no_warnings': True,
        'skip_download': True,
    }

    try:
        with yt_dlp.YoutubeDL(ydl_opts) as ydl:
            # Proses ambil info video
            info = ydl.extract_info(video_url, download=False)
            
            # Ambil link file mentah dari server Google/YouTube
            direct_link = info['url']
            
            # Balikin link-nya ke browser agar user bisa langsung download
            return direct_link
            
    except Exception as e:
        return str(e), 500

# Standar Vercel Python
def handler(request):
    return app(request)
