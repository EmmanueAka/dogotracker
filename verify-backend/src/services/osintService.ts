import axios from "axios";

function sanitizeInput(type: 'email' | 'phone' | 'social', value: string): string {
    let cleaned = value.trim();
    if(type === 'social') {
        cleaned = cleaned.replace(/^@/, '');
    }
    return cleaned;
}

function extractIdentityTraits(snippets: any[], targetEmail: string) {
    // FIXED: Changed s.content to s.content to ensure string concatenation works
    const textBlob = snippets.map(s => `${s.title}: ${s.content || ''}`).join("\n").toLowerCase();

    let ownerName = "Unknown Entity";
    let professionalTitle = "Not Discovered";
    let inferredLocation = "Global / Remote";
    const associatedHandles = new Set<string>();
    const locatedProfiles = new Set<string>();

    snippets.forEach(item => {
        // FIXED: Safely fallback to empty string if url doesn't exist
        const url = (item.url || '').toLowerCase();
        if(url.includes('linkedin.com')) locatedProfiles.add('LinkedIn');
        if(url.includes('github.com')) locatedProfiles.add('GitHub'); // FIXED: Removed space in 'github  .com'
        if(url.includes('twitter.com') || url.includes('x.com')) locatedProfiles.add('Twitter/X'); // FIXED: Logged proper name instead of LinkedIn duplicate
        if(url.includes('facebook.com')) locatedProfiles.add('Facebook'); // FIXED: Removed space in 'facebook  .com'

        // FIXED: Safely check item.content before doing match regex
        const contentStr = item.content || '';
        const handleMatches = contentStr.match(/@[a-zA-Z0-9_]{1,15}/g);

        if(handleMatches){
            handleMatches.forEach((h: string) => associatedHandles.add(h));
        }
    });

    const nameMatch = textBlob.match(/([a-z]{3,12}\s[a-z]{3,12})\s(on linkedin|profile|portfolio|github|resume)/i);
    if (nameMatch && nameMatch[1]) {
        ownerName = nameMatch[1].replace(/\b\w/g, c => c.toUpperCase()); // FIXED: Lowercase mapping was reversing standard capitalized names
    } else {
        const emailPrefix = targetEmail.split('@')[0];
        ownerName = emailPrefix.replace(/[._-]/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
    }

    return {
        ownerName,
        associatedHandles: Array.from(associatedHandles).slice(0, 3),
        locatedProfiles: Array.from(locatedProfiles),
        inferredLocation,
        professionalTitle,
    };
}

export async function crawlInternetMentions(type: 'email' | 'phone' | 'social', value: string) : Promise<any> {
    try {
        const queryTerm = sanitizeInput(type, value);
        const finalQuery = `"${queryTerm}"`;

        // BUG FIX 1: Pointing to the correct search API endpoint URL
        const response = await axios.post("https://api.tavily.com/search", {
            query: finalQuery,
            search_depth: 'basic',
            max_results: 5,
            exact_match: true
        }, {
            headers: {
                'Authorization': `Bearer ${process.env.TAVILY_API_KEY}`,
                'Content-Type': 'application/json'
            }
        });

        // BUG FIX 2: Mapping response.data.results instead of response.data.request
        const webResults = response.data.results || [];

        const structuredFootprints = webResults.map((item: any) => ({
            title: item.title || 'Indexed Web Source',
            link: item.url || '',
            snippet: item.content || '' // BUG FIX 3: Fixed typo from 'item.contect' to 'item.content'
        }));

        const enrichedData = extractIdentityTraits(webResults, value);

        return {
            success: true,
            totalMentions: structuredFootprints.length,
            footprints: structuredFootprints,
            enrichedData
        };
    } catch (error: any) {
        console.error('Osint Tavily Search Service Error:', error.response?.data || error.message);
        return {
            success: false,
            totalMentions: 0,
            footprints: [],
            enrichedData: { ownerName: 'Unknown Entity', associatedHandles: [], locatedProfiles: [], inferredLocation: 'Global', professionalTitle: 'Unknown' },
            error: error.response?.data || error.message
        };
    }
}
