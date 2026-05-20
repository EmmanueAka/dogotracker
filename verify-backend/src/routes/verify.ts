import { Router, Request, Response, NextFunction } from 'express';
import validator from 'validator';
import { SearchLog } from "../models/SearchLog";
import { crawlInternetMentions } from "../services/osintService";

const router = Router();
const SHARED_SECRET = process.env.INTERNAL_SHARED_SECRET || "local_dev_secret_key";

// Security Middleware checking keys passed from Next.js proxy
const validateInternalKey = (req: Request, res: Response, next: NextFunction): void => {
    const apiKey = req.header('X-API-Key');
    const userId = req.header('X-User-Id');

    if (!apiKey || apiKey !== SHARED_SECRET) {
        res.status(403).json({ error: 'Forbidden: Invalid Internal API Key Spec' });
        return;
    }

    if (userId) {
        (req as any).user = { id: userId };
    }
    next();
};

router.use(validateInternalKey);

async function executeCoreScan(userId: string, type: 'email' | 'phone' | 'social', value: string, res: Response) {
    const cachedEntry = await SearchLog.findOne({ type, value }).sort({ searchedAt: -1 });
    if (cachedEntry) {
        return res.status(200).json({ cached: true, results: cachedEntry });
    }

    const crawlResult = await crawlInternetMentions(type, value);
    if (!crawlResult.success) {
        return res.status(500).json({ error: `OSINT execution failure for target type: ${type}` });
    }

    const savedLog = await SearchLog.create({
        userId,
        type,
        value,
        totalMentions: crawlResult.totalMentions,
        footprints: crawlResult.footprints,
    });
    return res.status(200).json({ cached: false, results: savedLog });
}

// POST: /api/scan/social
router.post('/scan/social', async (req: Request, res: Response): Promise<any> => {
    try {
        const { handle, platforms, email } = req.body;
        const userId = (req as any).user?.id || 'dev_fallback_user';

        if (!handle) return res.status(400).json({ error: 'Target profile identifier handle is required' });
        if (!platforms || !Array.isArray(platforms)) return res.status(400).json({ error: 'Rejected platform identifier' });

        const rawInput = handle.trim();

        // Modular dictionary layout containing specific regex and stripping logic
        const platformRules: Record<string, { extractAndValidate: (input: string) => { valid: boolean; cleaned: string } }> = {
            twitter: {
                extractAndValidate: (input) => {
                    let cleaned = input.replace(/^(https?:\/\/)?(www\.)?(twitter\.com|x\.com)\//i, '');
                    cleaned = cleaned.replace(/^@/, '').split(/[?#]/)[0]; // Clean out URL parameters

                    const isValid = /^[a-zA-Z0-9_]{1,15}$/.test(cleaned);
                    return { valid: isValid, cleaned: `@${cleaned}` };
                }
            },
            instagram: {
                extractAndValidate: (input) => {
                    let cleaned = input.replace(/^(https?:\/\/)?(www\.)?(instagram\.com)\//i, '');
                    cleaned = cleaned.replace(/^@/, '').split(/[?#]/)[0];

                    const isValid = /^[a-zA-Z0-9._]{1,30}$/.test(cleaned);
                    return { valid: isValid, cleaned: cleaned };
                }
            },
            facebook: {
                extractAndValidate: (input) => {
                    let cleaned = input.replace(/^(https?:\/\/)?(www\.)?(facebook\.com|fb\.com)\/pages\/|^(https?:\/\/)?(www\.)?(facebook\.com|fb\.com)\//i, '');
                    cleaned = cleaned.replace(/^#/, '').split(/[?#]/)[0];

                    const isValid = /^[a-zA-Z0-9._-]{1,50}$/.test(cleaned);
                    return { valid: isValid, cleaned: cleaned };
                }
            }
        };

        let finalizedTargetHandle = rawInput;

        // Loop validation parameters block
        for (const platform of platforms) {
            const normalizedPlatform = platform.toLowerCase();
            const rules = platformRules[normalizedPlatform];

            if (!rules) {
                return res.status(400).json({ error: `Unsupported platform type: ${platform}` });
            }

            const check = rules.extractAndValidate(rawInput);

            if (!check.valid) {
                return res.status(400).json({ error: `Rejected: Invalid ${platform} format criteria matching rules` });
            }

            // Save the stripped handle string down into execution layer
            finalizedTargetHandle = check.cleaned;
        }

        if (email) {
            const cleanedEmail = email.trim().toLowerCase();
            if (!validator.isEmail(cleanedEmail)) {
                return res.status(400).json({ error: 'Rejected email structure' });
            }
            await crawlInternetMentions("email", cleanedEmail);
        }

        return await executeCoreScan(userId, 'social', finalizedTargetHandle, res);
    } catch (error) {
        console.error("Fatal routing error caught inside validation mapping:", error);
        return res.status(500).json({ error: 'Fatal exception inside social platform handler worker.' });
    }
});

// Rest of your routing engine setup paths...
export default router;
