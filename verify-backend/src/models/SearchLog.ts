import mongoose, { Schema, Document, Model, models } from "mongoose";
import {FootprintItem, IdentityType} from "../../types";


export interface ISearchLog extends Document { // 🟢 Fixed: Mongoose Document inheritance maps correctly now
    userId: string;
    type: IdentityType;
    value: string;
    totalMentions: number;
    footprints: FootprintItem[];
    searchedAt: Date;
}

const SearchLogSchema = new Schema<ISearchLog>({
    userId: { type: String, required: true },
    type: { type: String, enum: ['email', 'phone', 'social'], required: true },
    value: { type: String, required: true, index: true }, // 🟢 Added db index optimizations for faster lookups
    totalMentions: { type: Number, default: 0 },

    enrichedData :{
        ownerName: { type: String, default: "Unknown Entity" },
        associatedHandles: [{ type: String }],
        inferredLocation: { type: String, default: "Global"},
        professionalTitle: { type: String, default: "Not Discovered" },
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
