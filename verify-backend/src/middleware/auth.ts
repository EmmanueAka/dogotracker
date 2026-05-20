import { Request, Response, NextFunction } from 'express';

export async function requireSession (req: Request, res: Response, next: NextFunction) {
    try {
        const apiKey = req.headers['x-api-key'];
        const userId = req.headers['x-user-id'];

        const INTERNAL_SECRET = process.env.INTERNAL_SHARED_SECRET || "local_dev_secret_key";

        if(!userId){
            return res.status(403).json({ error: 'Missing proxy session identification header context'});
        }

        (req as any).user = { id: userId };
        next()
    }catch (error){
        console.error("Express Local Security Interceptor Error:", error)
        return res.status(500).json({ error: "Authentication system signature validation error"})
    }
}