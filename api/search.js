const yts = require('yt-search');

export default async function handler(req, res) {
    const { q } = req.query;
    if (!q) return res.status(400).json({ error: 'Query is required' });

    try {
        const r = await yts(q);
        const videos = r.videos.slice(0, 10).map(v => ({
            id: v.videoId,
            title: v.title,
            artist: v.author.name,
            img: v.thumbnail,
            duration: v.timestamp
        }));
        
        res.status(200).json(videos);
    } catch (err) {
        res.status(500).json({ error: 'Search failed' });
    }
}
