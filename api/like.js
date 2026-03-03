import { Redis } from '@upstash/redis'
const redis = Redis.fromEnv()

export default async function handler(req, res) {
    const { userId, track, action } = req.body;
    const key = `likes:${userId}`;

    if (req.method === 'POST') {
        let likes = await redis.get(key) || [];
        
        if (action === 'like') {
            // Добавляем, если еще нет в списке
            if (!likes.find(t => t.id === track.id)) {
                likes.push(track);
            }
        } else {
            // Удаляем лайк
            likes = likes.filter(t => t.id !== track.id);
        }
        
        await redis.set(key, JSON.stringify(likes));
        return res.status(200).json(likes);
    }

    if (req.method === 'GET') {
        const { userId } = req.query;
        const likes = await redis.get(`likes:${userId}`) || [];
        return res.status(200).json(likes);
    }
}
