import { Router, Request, Response } from 'express';
import validator from 'validator';
import { SearchLog } from "../models/SearchLog";
import { crawlInternetMentions } from "../services/osintService";
import { requireSession } from "../middleware/auth";

const router = Router();

// Apply Security Middleware checking keys and sessions passed from Next.js proxy
router.use(requireSession);

async function executeCoreScan(userId: string, type: 'email' | 'phone' | 'social', value: string, res: Response) {
    // const cachedEntry = await SearchLog.findOne({ type, value }).sort({ searchedAt: -1 });
    // if (cachedEntry) {
    //     cachedEntry.searchedAt = new Date();
    //     await cachedEntry.save();
    //     return res.status(200).json({ cached: true, results: cachedEntry });
    // }

    const crawlResult = await crawlInternetMentions(type, value);
    if (!crawlResult.success) {
        return res.status(500).json({ error: `OSINT execution failure for target type: ${type}` });
    }

    let summaryText = "Cleared - Secure Node";
    let summaryColor: 'green' | 'red' | 'orange' = 'green';

    if (type === 'phone') {
        if (crawlResult.totalMentions === 0) {
            summaryText = "Risk: VOIP Spoof / Suspicious";
            summaryColor = 'red';
        } else {
            summaryText = "Verified Telecom Carrier";
            summaryColor = 'green';
        }
    } else if (type === 'social') {
        if (crawlResult.totalMentions > 0) {
            summaryText = 'Active Public Signal';
            summaryColor = 'green';
        } else {
            summaryText = "Unindexed / High Fraud Risk";
            summaryColor = 'red';
        }
    } else if (type === 'email') {
        if (crawlResult.totalMentions > 5) {
            summaryText = 'Critical Breach Leaks Found';
            summaryColor = 'orange';
        }
    }

    const savedLog = await SearchLog.create({
        userId,
        type,
        value,
        totalMentions: crawlResult.totalMentions,
        footprints: crawlResult.footprints,
        heuristicSummary: {
            status: summaryText,
            color: summaryColor,
        },
        enrichedData: {
            ownerName: crawlResult.enrichedData?.ownerName || "Unknown Entity",
            email: crawlResult.enrichedData?.email || "",
            associatedHandles: crawlResult.enrichedData?.associatedHandles || [],
            locatedProfiles: crawlResult.enrichedData?.locatedProfiles || [],
            inferredLocation: crawlResult.enrichedData?.inferredLocation || "Global",
            professionalTitle: crawlResult.enrichedData?.professionalTitle || "Not Discovered"
        }
    });

    // Only return the HTTP response directly if this function wasn't side-called
    if (res.headersSent) return savedLog;
    return res.status(200).json({ cached: false, results: savedLog });
}

// ==========================================
// 🟢 Email Scan Processing Route
// ==========================================
router.post('/scan/email', async (req: Request, res: Response): Promise<any> => {
    try {
        const { email } = req.body;
        const userId = req.user?.id || 'dev_fallback_user';

        if (!email) return res.status(400).json({ error: 'Target email string payload is required' });

        const cleanedEmail = email.trim().toLowerCase();
        if (!validator.isEmail(cleanedEmail)) {
            return res.status(400).json({ error: 'Rejected: Malformed email structure' });
        }

        return await executeCoreScan(userId, 'email', cleanedEmail, res);
    } catch (error) {
        console.error("Error connecting:", error);
        return res.status(500).json({ error: 'Fatal exception inside target email routing engine.' });
    }
});

// ==========================================
// 🟢 Phone Scan Processing Route
// ==========================================
router.post('/scan/phone', async (req: Request, res: Response): Promise<any> => {
    try {
        const { phone } = req.body;
        const userId = req.user?.id || 'dev_fallback_user';

        if (!phone) return res.status(400).json({ error: 'Target phone line value is required' });

        const cleanedPhone = phone.replace(/\s+/g, '');
        if (!validator.isMobilePhone(cleanedPhone, 'any')) {
            return res.status(400).json({ error: 'Rejected: Line failed international mobile carrier syntax specs' });
        }

        return await executeCoreScan(userId, 'phone', cleanedPhone, res);
    } catch (error) {
        console.error("Error connecting:", error);
        return res.status(500).json({ error: 'Fatal exception inside target mobile connection engine routing.' });
    }
});

// ==========================================
// 🚀 Social Scan Processing Route
// ==========================================
router.post('/scan/social', async (req: Request, res: Response): Promise<any> => {
    try {
        const { handle, platforms, email } = req.body;
        const userId = req.user?.id || 'dev_fallback_user';

        if (!handle) return res.status(400).json({ error: 'Target profile identifier handle is required' });
        if (!platforms || !Array.isArray(platforms)) return res.status(400).json({ error: 'Rejected platform identifier' });

        const rawInput = handle.trim();

        const platformRules: Record<string, { extractAndValidate: (input: string) => { valid: boolean; cleaned: string } }> = {
            twitter: {
                extractAndValidate: (input) => {
                    let cleaned = input.replace(/^(https?:\/\/)?(www\.)?(twitter\.com|x\.com)\//i, '');
                    cleaned = cleaned.replace(/^@/, '').split(/[?#]/)[0];
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

            finalizedTargetHandle = check.cleaned;
        }

        // 🟢 FIXED: Process auxiliary email via full executeCoreScan pipeline to persist records to DB
        if (email) {
            const cleanedEmail = email.trim().toLowerCase();
            if (validator.isEmail(cleanedEmail)) {
                // Pass a dummy response container object so it processes silently into DB logs
                const dummyRes = { status: () => ({ json: () => {} }), headersSent: true } as any;
                await executeCoreScan(userId, 'email', cleanedEmail, dummyRes);
            }
        }

        // Execute core social query
        return await executeCoreScan(userId, 'social', finalizedTargetHandle, res);
    } catch (error) {
        console.error("Fatal routing error caught inside validation mapping:", error);
        return res.status(500).json({ error: 'Fatal exception inside social platform handler worker.' });
    }
});

// ==========================================
// 📊 Recent Scans Log Route (Sorted Newest First)
// ==========================================
router.get('/scan/recent', async (req: Request, res: Response): Promise<any> => {
    try {
        const userId = req.user?.id;
        if (!userId) return res.status(401).json({ error: 'Unauthorized' });

        const recentHistoryLog = await SearchLog.find({ userId })
            .sort({ searchedAt: -1 })
            .limit(3)
            .select('_id type value totalMentions heuristicSummary searchedAt');

        return res.status(200).json(recentHistoryLog);
    } catch (error) {
        console.error("Fatal transaction exception caught inside log historical metric compiler:", error);
        return res.status(500).json({ error: `Internal database engine execution failure` });
    }
});

export default router;
