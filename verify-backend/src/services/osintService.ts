// Express Backend: services/osintService.ts
import { FootprintItem } from "../types";

export interface IOsintResult {
    success: boolean;
    totalMentions: number;
    footprints: FootprintItem[];
    enrichedData: {
        ownerName: string;
        email: string;
        associatedHandles: string[];
        locatedProfiles: string[];
        inferredLocation: string;
        professionalTitle: string;
    };
}

// Interface for internal WhatsApp helper mapping
interface IWhatsAppCheckResult {
    isValid: boolean;
    pushName: string | null;
}

/**
 * CORE ASYNCHRONOUS OSINT AGGREGATOR
 * Combines Surface Web search engine telemetry with deep identity network nodes.
 */
export async function crawlInternetMentions(type: 'email' | 'phone' | 'social', value: string): Promise<IOsintResult> {
    try {
        let footprints: FootprintItem[] = [];
        let totalMentions = 0;

        const enrichedData = {
            ownerName: "Unknown Entity",
            email: type === 'email' ? value : "",
            associatedHandles: [] as string[],
            locatedProfiles: [] as string[],
            inferredLocation: "Global",
            professionalTitle: "Not Discovered"
        };

        // --- LAYER 1: Surface Web API Ingestion (Tavily Core Scraper) ---
        const surfaceWeb = await fetchTavilySurfaceWeb(type, value);
        footprints = [...footprints, ...surfaceWeb.footprints];
        totalMentions += surfaceWeb.mentionsCount;

        // --- LAYER 2: Deep System Closed-Network Ingestions ---
        if (type === 'phone') {
            // A. Check Live Messaging App Presence (WhatsApp Gateway)
            const whatsappResult = await checkWhatsAppPresence(value);
            if (whatsappResult.isValid) {
                const cleanDigits = value.replace(/\D/g, '');

                // 🟢 FIXED: Fixed URL path structure adding missing forward slash
                footprints.push({
                    title: "Active Verified WhatsApp Node Detected",
                    link: `https://wa.me${cleanDigits}`,
                    snippet: whatsappResult.pushName
                        ? `Active WhatsApp profile discovered. Profile Display Name: "${whatsappResult.pushName}"`
                        : "Active metadata matching discovered within Meta telephone register blocks."
                });
                totalMentions++;
                enrichedData.locatedProfiles.push("WhatsApp Messenger");

                if (whatsappResult.pushName && enrichedData.ownerName === "Unknown Entity") {
                    enrichedData.ownerName = whatsappResult.pushName;
                }
            }

            // B. Check Telephony Infrastructure Repositories (Twilio Lookup Matrix)
            const telephony = await fetchTwilioCallerID(value);
            if (telephony.callerName) enrichedData.ownerName = telephony.callerName;
            if (telephony.country) enrichedData.inferredLocation = telephony.country;
            if (telephony.carrier) {
                enrichedData.professionalTitle = `Carrier: ${telephony.carrier} (${telephony.lineType})`;
                enrichedData.locatedProfiles.push(`Telco Network: ${telephony.carrier}`);
            }
        }

        if (type === 'email') {
            // A. Identity Exposure Verification Data Matrix (HaveIBeenPwned API)
            const breachAudit = await checkHaveIBeenPwned(value);
            if (breachAudit.exposed) {
                footprints.push({
                    title: `IDENTITY DATA LEAK ALERT: Expositions Found (${breachAudit.leakCount} Breaches)`,
                    link: "https://haveibeenpwned.com",
                    snippet: `Account explicitly pwned across verified leaks: ${breachAudit.breaches.join(', ')}`
                });
                totalMentions += breachAudit.leakCount;
                enrichedData.locatedProfiles = [...enrichedData.locatedProfiles, ...breachAudit.breaches];
            }
        }

        return {
            success: true,
            totalMentions,
            footprints,
            enrichedData
        };

    } catch (error) {
        console.error("Critical Aggregator Component Failure:", error);
        return {
            success: false,
            totalMentions: 0,
            footprints: [],
            enrichedData: {
                ownerName: "Unknown Entity",
                email: "",
                associatedHandles: [],
                locatedProfiles: [],
                inferredLocation: "Global",
                professionalTitle: "Not Discovered"
            }
        };
    }
}

// =========================================================================
// 🌐 LIVE PROD API COMMUNICATION ENDPOINT ENGINES
// =========================================================================

/**
 * API Wrapper: Tavily Search Engine Core
 */
async function fetchTavilySurfaceWeb(type: string, value: string) {
    const apiKey = process.env.TAVILY_API_KEY;
    if (!apiKey) return { footprints: [], mentionsCount: 0 };

    try {
        const response = await fetch("https://tavily.com", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                api_key: apiKey,
                query: `${type} profile target locator verification for "${value}"`,
                search_depth: "basic",
                include_answer: true
            })
        });

        if (!response.ok) return { footprints: [], mentionsCount: 0 };
        const data = await response.json();

        const footprints = (data.results || []).map((r: any) => ({
            title: r.title || "Indexed Data Page Link",
            link: r.url,
            snippet: r.content || ""
        }));

        return { footprints, mentionsCount: footprints.length };
    } catch {
        return { footprints: [], mentionsCount: 0 };
    }
}

/**
 * API Wrapper: Whapi.cloud WhatsApp Verification & Profile Engine
 */
async function checkWhatsAppPresence(phone: string): Promise<IWhatsAppCheckResult> {
    const token = process.env.WHAPI_API_TOKEN;
    const baseUrl = process.env.WHATSAPP_API_URL || "https://gate.whapi.cloud/";

    if (!token) {
        console.log(" [DEBUG CRITICAL] whatsapp check aborted: WHAPI_API_TOKEN is totally undefined in .env");
        return { isValid: false, pushName: null };
    }

    try {
        const cleanPhone = phone.replace(/\D/g, '');
        const formattedBaseUrl = baseUrl.endsWith('/') ? baseUrl : `${baseUrl}/`;
        const checkContactUrl = `${formattedBaseUrl}contacts`;

        console.log(`[DEBUG] Testing WhatsApp account status via: ${checkContactUrl}`);

        const contactResponse = await fetch(checkContactUrl, {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${token}`,
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                blocking: "no_wait",
                force_check: true,
                contacts: [cleanPhone]
            })
        });

        if (!contactResponse.ok) {
            const errText = await contactResponse.text();
            console.error(`[DEBUG] Whapi API returned error code ${contactResponse.status}:`, errText);
            return { isValid: false, pushName: null };
        }

        const contactData = await contactResponse.json();
        console.log("[DEBUG] Raw Whapi Server Response payload:", JSON.stringify(contactData));

        const isContactValid = contactData?.contacts?.[0]?.status === "valid";
        const waId = contactData?.contacts?.[0]?.wa_id;

        // Fetch display profile metadata sequentially if account status is valid
        if (isContactValid && waId) {
            const profileUrl = `${formattedBaseUrl}users/${waId}/profile`;
            console.log(`[DEBUG] Fetching WhatsApp profile info via: ${profileUrl}`);

            const profileResponse = await fetch(profileUrl, {
                method: "GET",
                headers: { "Authorization": `Bearer ${token}` }
            });

            if (profileResponse.ok) {
                const profileData = await profileResponse.json();
                console.log("[DEBUG] Raw Whapi Profile Data payload:", JSON.stringify(profileData));
                const discoveredName = profileData?.pushname || profileData?.name || null;
                return { isValid: true, pushName: discoveredName };
            }
        }

        return { isValid: isContactValid, pushName: null };

    } catch (err: any) {
        console.error("[DEBUG] Whapi Endpoint Network Failure:", err.message);
        return { isValid: false, pushName: null };
    }
}

/**
 * API Wrapper: Twilio Lookups v2 Directory Engine
 */
async function fetchTwilioCallerID(phone: string) {
    const sid = process.env.TWILIO_ACCOUNT_SID;
    const token = process.env.TWILIO_AUTH_TOKEN;

    if (!sid || !token) {
        console.log(" [DEBUG CRITICAL] Twilio check aborted: Credentials missing in .env");
        return { callerName: null, country: "Global", carrier: null, lineType: "unknown" };
    }

    try {
        const cleanPhone = phone.startsWith('+') ? phone : `+${phone.replace(/\D/g, '')}`;
        const auth = `Basic ${Buffer.from(`${sid}:${token}`).toString('base64')}`;

        // 🟢 FIXED: Swapped out broken domain string for official Twilio v2 lookup path
        const url = `https://twilio.com{cleanPhone}?Fields=caller_name,line_type_intelligence`;

        console.log(`[DEBUG] Querying Twilio Lookup v2 for: ${cleanPhone}`);

        const response = await fetch(url, {
            method: "GET",
            headers: {
                "Authorization": auth,
                "Accept": "application/json"
            }
        });

        if (!response.ok) {
            const errText = await response.text();
            console.error(`[DEBUG] Twilio API returned error code ${response.status}:`, errText);
            return { callerName: null, country: "Global", carrier: null, lineType: "unknown" };
        }

        const data = await response.json();
        console.log("[DEBUG] Raw Twilio Server Response payload:", JSON.stringify(data));

        return {
            callerName: data.caller_name?.caller_name || null,
            country: data.country_code || "Global",
            carrier: data.line_type_intelligence?.carrier_name || null,
            lineType: data.line_type_intelligence?.type || "unknown"
        };

    } catch (err: any) {
        console.error("[DEBUG] Twilio Lookup Endpoint Network Failure:", err.message);
        return { callerName: null, country: "Global", carrier: null, lineType: "unknown" };
    }
}

/**
 * API Wrapper: HaveIBeenPwned Commercial v3 Data Engine
 */
async function checkHaveIBeenPwned(email: string) {
    const apiKey = process.env.HIBP_API_KEY;
    if (!apiKey) return { exposed: false, leakCount: 0, breaches: [] };

    try {
        // 🟢 FIXED: Target the absolute production v3 commercial account endpoint string path
        const url = `https://haveibeenpwned.com{encodeURIComponent(email)}?truncateResponse=false`;
        const response = await fetch(url, {
            method: "GET",
            headers: {
                "hibp-api-key": apiKey,
                "user-agent": "DogoTracker-OSINT-Intelligence-Agent"
            }
        });

        if (response.status === 404) return { exposed: false, leakCount: 0, breaches: [] };
        if (!response.ok) return { exposed: false, leakCount: 0, breaches: [] };

        const data = await response.json();
        const breaches = Array.isArray(data) ? data.map((b: any) => b.Name) : [];
        return { exposed: breaches.length > 0, leakCount: breaches.length, breaches };
    } catch {
        return { exposed: false, leakCount: 0, breaches: [] };
    }
}
