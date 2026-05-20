export type IdentityType = 'email' | 'phone' | 'social';

export interface FootprintItem {
    title: string;
    link: string;
    snippet: string;
}

export interface CrawlerResult {
    success: boolean;
    totalMentions: number;
    footprints: FootprintItem[];
    enrichedData: EnrichedIdentityData;
    error?: string;
}

export interface VerifyResultBody {
    type: IdentityType;
    value: string;
}

export interface EnrichedIdentityData{
    ownerName: string;
    associatedHandles: string[];
    locatedProfiles: string[];
    inferredLocation: string;
    professionalTitle: string;
}