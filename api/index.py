from flask import Flask, request, redirect
import yt_dlp

app = Flask(__name__)

@app.route('/api/download')
def download():
    video_url = request.args.get('url')
    ext = request.args.get('ext', 'mp4')

    if not video_url:
        return "URL YouTube kosong!", 400

    # Opsi paling stabil agar tidak kena block YouTube
    ydl_opts = {
        'format': 'bestaudio/best' if ext == 'mp3' else 'best[ext=mp4]/best',
        'quiet': True,
        'no_warnings': True,
        'nocheckcertificate': True,
        'noplaylist': True,
    }

    try:
        with yt_dlp.YoutubeDL(ydl_opts) as ydl:
            info = ydl.extract_info(video_url, download=False)
            # Ambil URL langsung dari server Google Video
            direct_link = info['url']
            
            # Alihkan browser user langsung ke link file
            return redirect(direct_link)
    except Exception as e:
        return f"Waduh Error: {str(e)}", 500

# Untuk Vercel Runtime
def handler(request):
    return app(request)
