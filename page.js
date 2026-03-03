"use client";
import React, { useState, useEffect } from 'react';
import ReactPlayer from 'react-player/youtube';
import { Search, Heart, Play, Pause, ListMusic, TrendingUp, Music2, Plus, X } from 'lucide-react';

export default function PlayerPage() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [charts, setCharts] = useState([]);
  const [currentVideo, setCurrentVideo] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [favorites, setFavorites] = useState([]);
  const [activeTab, setActiveTab] = useState('charts'); // 'charts', 'search', 'library'

  useEffect(() => {
    // Инициализация Telegram WebApp
    if (window.Telegram?.WebApp) {
      window.Telegram.WebApp.ready();
      window.Telegram.WebApp.expand();
    }
    
    // Загрузка лайков из локальной памяти
    const saved = localStorage.getItem('tg_favs');
    if (saved) setFavorites(JSON.parse(saved));
    
    // Загрузка начальных чартов
    fetchCharts();
  }, []);

  useEffect(() => {
    localStorage.setItem('tg_favs', JSON.stringify(favorites));
  }, [favorites]);

  const fetchCharts = async () => {
    const res = await fetch('/api/search?q=top+hits+2026');
    const data = await res.json();
    setCharts(data.items || []);
  };

  const handleSearch = async (e) => {
    e.preventDefault();
    setActiveTab('search');
    const res = await fetch(`/api/search?q=${encodeURIComponent(query)}`);
    const data = await res.json();
    setResults(data.items || []);
  };

  const toggleLike = (video) => {
    const isLiked = favorites.find(v => v.id.videoId === video.id.videoId);
    if (isLiked) {
      setFavorites(favorites.filter(v => v.id.videoId !== video.id.videoId));
    } else {
      setFavorites([...favorites, video]);
    }
  };

  return (
    <div className="min-h-screen pb-32">
      {/* Search Bar */}
      <header className="p-4 sticky top-0 z-40 glass">
        <form onSubmit={handleSearch} className="relative">
          <input 
            className="w-full bg-white/5 rounded-xl py-3 pl-12 pr-4 outline-none border border-white/10 focus:border-blue-500 transition-all"
            placeholder="Треки, артисты..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          <Search className="absolute left-4 top-3.5 text-slate-400" size={20} />
        </form>
      </header>

      {/* Tabs */}
      <div className="flex justify-around p-4 text-xs font-bold uppercase tracking-tighter text-slate-500 border-b border-white/5">
        <button onClick={() => setActiveTab('charts')} className={activeTab === 'charts' ? 'text-blue-500' : ''}>Чарты</button>
        <button onClick={() => setActiveTab('search')} className={activeTab === 'search' ? 'text-blue-500' : ''}>Поиск</button>
        <button onClick={() => setActiveTab('library')} className={activeTab === 'library' ? 'text-blue-500' : ''}>Медиатека</button>
      </div>

      <main className="p-4">
        {activeTab === 'charts' && (
          <div className="grid grid-cols-2 gap-4 animate-in fade-in duration-500">
            {charts.map((v) => (
              <div key={v.id.videoId} className="bg-white/5 rounded-2xl p-2 border border-white/5">
                <div className="relative group" onClick={() => {setCurrentVideo(v); setIsPlaying(true)}}>
                  <img src={v.snippet.thumbnails.high.url} className="rounded-xl aspect-square object-cover" />
                  <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Play fill="white" />
                  </div>
                </div>
                <p className="mt-2 font-bold text-sm truncate">{v.snippet.title}</p>
                <button onClick={() => toggleLike(v)} className="mt-1">
                  <Heart size={16} fill={favorites.find(f => f.id.videoId === v.id.videoId) ? "#ef4444" : "none"} className={favorites.find(f => f.id.videoId === v.id.videoId) ? "text-red-500" : "text-slate-500"} />
                </button>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'library' && (
          <div className="space-y-4">
            <h2 className="text-xl font-black flex items-center gap-2 px-2"><Heart fill="#ef4444" className="text-red-500"/> Понравилось</h2>
            {favorites.map(v => (
              <div key={v.id.videoId} className="flex items-center gap-4 bg-white/5 p-3 rounded-2xl">
                <img src={v.snippet.thumbnails.default.url} className="w-12 h-12 rounded-lg object-cover" />
                <div className="flex-1" onClick={() => {setCurrentVideo(v); setIsPlaying(true)}}>
                  <p className="font-bold text-sm truncate">{v.snippet.title}</p>
                  <p className="text-[10px] text-slate-500">{v.snippet.channelTitle}</p>
                </div>
                <button onClick={() => toggleLike(v)}><X size={18} className="text-slate-600"/></button>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'search' && (
           <div className="space-y-2">
            {results.map(v => (
              <div key={v.id.videoId} className="flex items-center gap-4 p-2 hover:bg-white/5 rounded-xl transition cursor-pointer" onClick={() => {setCurrentVideo(v); setIsPlaying(true)}}>
                 <img src={v.snippet.thumbnails.default.url} className="w-14 h-14 rounded-lg object-cover" />
                 <div className="flex-1 min-w-0">
                    <p className="font-bold text-sm truncate">{v.snippet.title}</p>
                    <p className="text-[10px] text-slate-500 uppercase">{v.snippet.channelTitle}</p>
                 </div>
              </div>
            ))}
           </div>
        )}
      </main>

      {/* Floating Player */}
      {currentVideo && (
        <div className="fixed bottom-4 left-4 right-4 z-50">
          <div className="glass p-3 rounded-[2rem] flex items-center gap-4 shadow-2xl border-white/20">
            <div className="w-12 h-12 relative">
               <img 
                 src={currentVideo.snippet.thumbnails.default.url} 
                 className={`w-full h-full rounded-full object-cover border-2 border-blue-500/50 ${isPlaying ? 'animate-spin-slow' : ''}`} 
               />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-bold text-xs truncate">{currentVideo.snippet.title}</p>
              <p className="text-[9px] text-blue-400 font-bold uppercase tracking-widest">Playing Now</p>
            </div>
            <button onClick={() => setIsPlaying(!isPlaying)} className="w-10 h-10 bg-white text-black rounded-full flex items-center justify-center">
               {isPlaying ? <Pause size={18} fill="black" /> : <Play size={18} fill="black" className="ml-0.5" />}
            </button>
          </div>
          <div className="hidden">
            <ReactPlayer 
              url={`https://www.youtube.com/watch?v=${currentVideo.id.videoId}`}
              playing={isPlaying}
              onEnded={() => setIsPlaying(false)}
            />
          </div>
        </div>
      )}
    </div>
  );
}
