from flask import Flask, request, Response
import yt_dlp
import os

app = Flask(__name__)

@app.route('/api/download')
def download():
    url = request.args.get('url')
    ext = request.args.get('ext', 'mp4') # default mp4
    
    if not url:
        return "URL kosong", 400

    # Opsi yt-dlp: mp3 atau mp4
    ydl_opts = {
        'format': 'bestaudio/best' if ext == 'mp3' else 'best',
        'quiet': True,
        'no_warnings': True,
    }

    try:
        with yt_dlp.YoutubeDL(ydl_opts) as ydl:
            info = ydl.extract_info(url, download=False)
            video_url = info['url']
            title = info.get('title', 'video')

            # Kita redirect user langsung ke URL video asli milik server Google/YouTube
            # Ini cara paling anti-error dan gak bikin server keberatan
            return Response(video_url, headers={
                "Content-Disposition": f"attachment; filename={title}.{ext}"
            })
    except Exception as e:
        return str(e), 500

if __name__ == "__main__":
    app.run()
