import { kv } from '@vercel/kv';

export default async function handler(req, res) {
    const { userId, track } = req.body;
    if (!userId) return res.status(400).json({ error: 'User ID required' });

    if (req.method === 'POST') {
        // Добавляем трек в облако
        const key = `playlist:${userId}`;
        let playlist = await kv.get(key) || [];
        playlist.push(track);
        await kv.set(key, playlist);
        return res.status(200).json(playlist);
    } 
    
    if (req.method === 'GET') {
        // Получаем плейлист
        const { userId } = req.query;
        const playlist = await kv.get(`playlist:${userId}`) || [];
        return res.status(200).json(playlist);
    }
}
