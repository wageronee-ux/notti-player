"use client";
import React, { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { Search, Heart, Play, Pause, Music, X } from 'lucide-react';

// Загружаем плеер только на стороне клиента
const ReactPlayer = dynamic(() => import('react-player/youtube'), { 
  ssr: false,
  loading: () => <div className="w-0 h-0" /> 
});

export default function PlayerPage() {
  const [mounted, setMounted] = useState(false);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [charts, setCharts] = useState([]);
  const [currentVideo, setCurrentVideo] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [favorites, setFavorites] = useState([]);
  const [activeTab, setActiveTab] = useState('charts');

  useEffect(() => {
    setMounted(true);
    fetchCharts();
    
    if (typeof window !== 'undefined' && window.Telegram?.WebApp) {
      window.Telegram.WebApp.ready();
      window.Telegram.WebApp.expand();
    }

    const saved = localStorage.getItem('tg_favs');
    if (saved) {
      try { setFavorites(JSON.parse(saved)); } catch (e) { console.error(e); }
    }
  }, []);

  useEffect(() => {
    if (mounted) {
      localStorage.setItem('tg_favs', JSON.stringify(favorites));
    }
  }, [favorites, mounted]);

  const fetchCharts = async () => {
    try {
      const res = await fetch('/api/search?q=hits+2026');
      const data = await res.json();
      setCharts(data.items || []);
    } catch (err) {
      console.error(err);
    }
  };

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!query.trim()) return;
    setActiveTab('search');
    try {
      const res = await fetch(`/api/search?q=${encodeURIComponent(query)}`);
      const data = await res.json();
      setResults(data.items || []);
    } catch (err) {
      console.error(err);
    }
  };

  const toggleLike = (video) => {
    const isLiked = favorites.find(v => v.id.videoId === video.id.videoId);
    if (isLiked) {
      setFavorites(favorites.filter(v => v.id.videoId !== video.id.videoId));
    } else {
      setFavorites([...favorites, video]);
    }
  };

  if (!mounted) return null;

  return (
    <div className="min-h-screen bg-black text-white font-sans">
      {/* Search Header */}
      <header className="sticky top-0 z-50 p-4 bg-black/80 backdrop-blur-md border-b border-white/10">
        <form onSubmit={handleSearch} className="relative max-w-xl mx-auto">
          <input 
            className="w-full bg-[#1a1a1a] rounded-xl py-3 pl-12 pr-4 outline-none border border-transparent focus:border-blue-500"
            placeholder="Поиск..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          <Search className="absolute left-4 top-3.5 text-gray-500" size={18} />
        </form>
      </header>

      {/* Tabs */}
      <nav className="flex justify-around bg-black border-b border-white/5 py-3 text-xs font-bold uppercase tracking-wider">
        <button onClick={() => setActiveTab('charts')} className={activeTab === 'charts' ? 'text-blue-500' : 'text-gray-500'}>Чарты</button>
        <button onClick={() => setActiveTab('search')} className={activeTab === 'search' ? 'text-blue-500' : 'text-gray-500'}>Поиск</button>
        <button onClick={() => setActiveTab('library')} className={activeTab === 'library' ? 'text-blue-500' : 'text-gray-500'}>Лайки</button>
      </nav>

      <main className="p-4">
        {activeTab === 'charts' && (
          <div className="grid grid-cols-2 gap-4">
            {charts.map((v) => (
              <div key={v.id.videoId} className="bg-[#111] p-3 rounded-2xl">
                <img 
                  src={v.snippet.thumbnails.high.url} 
                  className="rounded-xl aspect-square object-cover cursor-pointer" 
                  onClick={() => {setCurrentVideo(v); setIsPlaying(true)}}
                  alt=""
                />
                <p className="mt-2 text-sm font-bold truncate">{v.snippet.title}</p>
                <button onClick={() => toggleLike(v)} className="mt-1">
                  <Heart size={16} fill={favorites.find(f => f.id.videoId === v.id.videoId) ? "#3b82f6" : "none"} className={favorites.find(f => f.id.videoId === v.id.videoId) ? "text-blue-500" : "text-gray-600"} />
                </button>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'search' && (
          <div className="space-y-3">
            {results.map(v => (
              <div key={v.id.videoId} className="flex items-center gap-4 bg-[#111] p-3 rounded-xl cursor-pointer" onClick={() => {setCurrentVideo(v); setIsPlaying(true)}}>
                <img src={v.snippet.thumbnails.default.url} className="w-14 h-14 rounded-lg object-cover" alt="" />
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-sm truncate">{v.snippet.title}</p>
                  <p className="text-xs text-gray-500">{v.snippet.channelTitle}</p>
                </div>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'library' && (
          <div className="space-y-3">
            {favorites.map(v => (
              <div key={v.id.videoId} className="flex items-center gap-4 bg-[#111] p-3 rounded-xl">
                <img src={v.snippet.thumbnails.default.url} className="w-12 h-12 rounded-lg object-cover" alt="" onClick={() => {setCurrentVideo(v); setIsPlaying(true)}} />
                <div className="flex-1" onClick={() => {setCurrentVideo(v); setIsPlaying(true)}}>
                  <p className="font-bold text-sm truncate">{v.snippet.title}</p>
                </div>
                <button onClick={() => toggleLike(v)} className="text-gray-500"><X size={18}/></button>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Mini Player */}
      {currentVideo && (
        <div className="fixed bottom-6 left-4 right-4 bg-[#1a1a1a] border border-white/10 p-4 rounded-3xl flex items-center gap-4 shadow-2xl z-50">
          <img src={currentVideo.snippet.thumbnails.default.url} className="w-12 h-12 rounded-full border border-blue-500" alt="" />
          <div className="flex-1 min-w-0" onClick={() => setIsPlaying(!isPlaying)}>
            <p className="text-sm font-bold truncate">{currentVideo.snippet.title}</p>
            <p className="text-[10px] text-blue-500 font-bold uppercase tracking-widest">Играет сейчас</p>
          </div>
          <button onClick={() => setIsPlaying(!isPlaying)} className="w-10 h-10 bg-white text-black rounded-full flex items-center justify-center">
            {isPlaying ? <Pause size={18} fill="black" /> : <Play size={18} fill="black" />}
          </button>
          <ReactPlayer 
            url={`https://www.youtube.com/watch?v=${currentVideo.id.videoId}`}
            playing={isPlaying}
            width="0" height="0"
            onEnded={() => setIsPlaying(false)}
          />
        </div>
      )}
    </div>
  );
}
