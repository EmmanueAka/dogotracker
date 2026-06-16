import mongoose, { Schema, Document, Model, models } from "mongoose";
import { FootprintItem, IdentityType } from "../../types";

export interface IEnrichedData {
    ownerName: string;
    email: string;
    associatedHandles: string[];
    locatedProfiles: string[];
    inferredLocation: string;
    professionalTitle: string;
}

export interface ISearchLog extends Document {
    userId: string;
    type: IdentityType;
    value: string;
    totalMentions: number;
    enrichedData: IEnrichedData;
    footprints: FootprintItem[];
    searchedAt: Date;
}


const SearchLogSchema = new Schema<ISearchLog>({
    userId: { type: String, required: true },
    type: { type: String, enum: ['email', 'phone', 'social'], required: true },
    value: { type: String, required: true, index: true },
    totalMentions: { type: Number, default: 0 },
    enrichedData: {
        ownerName: { type: String, default: "UNKNOWN ENTITY" },
        email: { type: String, default: "" },
        associatedHandles: [{ type: String }],
        locatedProfiles: [{ type: String }],
        inferredLocation: { type: String, default: "Global" },
        professionalTitle: { type: String, default: "Not Discovered" },
    },
    heuristicSummary: {
      status: { type: String, required: true },
      color: { type: String, enum: ['red', 'green', 'orange'] },
    },
    footprints: [{
        title: { type: String, required: true },
        link: { type: String, required: true },
        snippet: { type: String, required: true },
    }],
    searchedAt: { type: Date, default: Date.now },
});

export const SearchLog: Model<ISearchLog> =
    models.SearchLog || mongoose.model<ISearchLog>("SearchLog", SearchLogSchema);
