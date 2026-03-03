import { Redis } from '@upstash/redis'

const redis = Redis.fromEnv()

export default async function handler(req, res) {
    // В Telegram Mini App ID пользователя передается во фронтенд, 
    // оттуда мы шлем его в теле запроса (body) или в параметрах (query)
    const userId = req.method === 'POST' ? req.body.userId : req.query.userId;

    if (!userId) return res.status(400).json({ error: 'User ID required' });

    const key = `playlist:${userId}`;

    if (req.method === 'POST') {
        const { track } = req.body;
        // Получаем текущий список, добавляем новый трек и сохраняем
        let playlist = await redis.get(key) || [];
        playlist.push(track);
        await redis.set(key, JSON.stringify(playlist));
        return res.status(200).json(playlist);
    } 
    
    if (req.method === 'GET') {
        const playlist = await redis.get(key) || [];
        return res.status(200).json(playlist);
    }
}
