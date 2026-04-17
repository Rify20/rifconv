'use client';
import { useState } from 'react';
import { Play, Download, Loader2, CheckCircle, Youtube, Copy } from 'lucide-react';

export default function Home() {
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [format, setFormat] = useState('mp4');

  const convert = async () => {
    setLoading(true);
    setResult(null);
    
    // Demo mode - ganti dengan API real nanti
    setTimeout(() => {
      setResult({
        title: "Demo Video - " + url.split('/').pop(),
        download: "https://example.com/download.mp4"
      });
      setLoading(false);
    }, 2000);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 to-indigo-900 py-12 px-4">
      <div className="max-w-2xl mx-auto">
        {/* HEADER */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-3 bg-white/20 px-6 py-3 rounded-full mb-6 backdrop-blur-sm">
            <Youtube className="w-8 h-8" />
            <h1 className="text-3xl font-black bg-gradient-to-r from-white to-yellow-300 bg-clip-text text-transparent">
              RIFCONV
            </h1>
          </div>
          <p className="text-xl text-white/80 mb-8">YouTube → MP4/MP3 | Fast & Free | by rifdev</p>
        </div>

        {/* CONVERTER */}
        <div className="bg-white/10 backdrop-blur-xl rounded-3xl p-8 border border-white/20 shadow-2xl">
          <div className="mb-6">
            <input
              type="url"
              placeholder="📎 Paste YouTube URL here..."
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              className="w-full p-5 rounded-2xl bg-white/20 border border-white/30 focus:border-white focus:outline-none text-lg placeholder-white/70"
            />
          </div>

          <div className="flex gap-3 mb-6">
            <select 
              value={format} 
              onChange={(e) => setFormat(e.target.value)}
              className="flex-1 p-4 rounded-2xl bg-white/20 border border-white/30 text-lg"
            >
              <option value="mp4">🎬 MP4 Video</option>
              <option value="mp3">🎵 MP3 Audio</option>
            </select>
            <button
              onClick={() => navigator.clipboard.writeText(url)}
              className="p-4 bg-white/20 rounded-2xl hover:bg-white/30 transition-all"
            >
              <Copy className="w-6 h-6" />
            </button>
          </div>

          <button
            onClick={convert}
            disabled={loading || !url}
            className="w-full bg-gradient-to-r from-emerald-500 to-green-600 text-white font-bold py-5 px-8 rounded-2xl hover:from-emerald-600 hover:to-green-700 shadow-xl hover:shadow-2xl transform hover:scale-105 transition-all duration-300 flex items-center justify-center gap-3 text-lg disabled:opacity-50"
          >
            {loading ? (
              <>
                <Loader2 className="w-6 h-6 animate-spin" />
                Converting...
              </>
            ) : (
              <>
                <Play className="w-6 h-6" />
                Convert Now
              </>
            )}
          </button>

          {/* RESULT */}
          {result && (
            <div className="mt-8 p-6 bg-white/20 rounded-2xl backdrop-blur-sm border border-white/30">
              <h3 className="font-bold text-xl mb-4 text-center">✅ Ready to Download!</h3>
              <div className="space-y-3">
                <p className="text-center opacity-90">{result.title}</p>
                <a
                  href={result.download}
                  download
                  className="block w-full bg-gradient-to-r from-green-500 to-emerald-600 text-white font-bold py-4 px-8 rounded-2xl text-center hover:from-green-600 hover:to-emerald-700 shadow-xl hover:shadow-2xl transform hover:scale-105 transition-all"
                >
                  <Download className="w-6 h-6 inline mr-2" />
                  Download {format.toUpperCase()}
                </a>
              </div>
            </div>
          )}
        </div>

        {/* FEATURES */}
        <div className="mt-16 grid md:grid-cols-3 gap-6 text-center">
          <div className="p-6 rounded-2xl bg-white/5 border border-white/20">
            <div className="text-4xl mb-4">⚡</div>
            <h3 className="font-bold text-lg mb-2">Lightning Fast</h3>
            <p className="text-sm opacity-75">Convert in seconds</p>
          </div>
          <div className="p-6 rounded-2xl bg-white/5 border border-white/20">
            <div className="text-4xl mb-4">🆓</div>
            <h3 className="font-bold text-lg mb-2">100% Free</h3>
            <p className="text-sm opacity-75">No limits ever</p>
          </div>
          <div className="p-6 rounded-2xl bg-white/5 border border-white/20">
            <div className="text-4xl mb-4">🕐</div>
            <h3 className="font-bold text-lg mb-2">24/7 Online</h3>
            <p className="text-sm opacity-75">Always available</p>
          </div>
        </div>

        {/* FOOTER */}
        <div className="mt-16 text-center text-white/50 text-sm">
          <p>🚀 Made with ❤️ by <span className="font-bold text-yellow-400">@rifdev</span></p>
          <p className="mt-2 opacity-75">For personal use | Respect YouTube ToS</p>
        </div>
      </div>
    </div>
  );
}