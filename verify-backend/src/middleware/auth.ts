import { Request, Response, NextFunction } from 'express';

const rateLimitCache = new Map<string, { count: number; resetTime: number }>();

export async function requireSession (req: Request, res: Response, next: NextFunction) {
    try {
        const apiKey = req.headers['x-api-key'];
        const userId = req.headers['x-user-id'];
        const INTERNAL_SECRET = process.env.INTERNAL_SHARED_SECRET || "local_dev_secret_key";

        if(!apiKey || apiKey !== INTERNAL_SECRET ){
            console.warn(`[SECURITY WARNING] Invalid or missing API key signature from IP: ${req.ip}`);
            return res.status(403).json({ error: 'Access Forbidden: Invalid system signature'})
        }

        if(!userId || typeof userId !== 'string'){
            return res.status(401).json({ error: 'Missing proxy session identification header context'});
        }

        req.user = { id: userId }

        const isHistoryFetch = req.method === 'GET' && req.path === '/scan/recent'

        if (isHistoryFetch) {
            return next()
        }

        const now = new Date();
        const limitWindowsMs = 60 * 1000;
        const maxRequestsPerWindow = 30;

        const userLimit = rateLimitCache.get(userId)

        if(!userLimit || now > userLimit.resetTime){
            rateLimitCache.set(userId, { count: 1, resetTime: now + limitWindowsMs})
        }else {
            userLimit.count++;
            if(userLimit.count > maxRequestsPerWindow ){
                return res.status(429).json({
                    error: 'Rate limit exceeded. System scanning execution cooling down.',
                    retryAfterSeconds: Math.ceil((userLimit.resetTime - now) / 1000)
                })
            }
        }

       req.user = { id: userId };

        next()
    }catch (error){
        console.error("Express Local Security Interceptor Error:", error)
        return res.status(500).json({ error: "Authentication system signature validation error"})
    }
}