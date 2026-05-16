/* @ts-nocheck */
import { betterAuth, type BetterAuthOptions } from "better-auth";
import { mongodbAdapter } from "better-auth/adapters/mongodb";
import { nextCookies } from "better-auth/next-js";
import { connectToDatabase } from "@/database/mongoose";

// 1. Isolate config layout using 'satisfies BetterAuthOptions' to auto-infer properties
const config = {
    database: mongodbAdapter,
    secret: process.env.BETTER_AUTH_SECRET!,
    baseURL: process.env.BETTER_AUTH_URL!,
    emailAndPassword: {
        enabled: true,
        disableSignUp: false,
        requireEmailVerification: false,
        minPasswordLength: 8,
        maxPasswordLength: 128,
        autoSignIn: true,
    },
    // Keep nextCookies() active for Vercel; our Render Direct DB lookup middleware will bypass it natively
    plugins: [nextCookies()]
} satisfies BetterAuthOptions;

// 2. Use the inferred configuration mapping type to prevent type assignment errors
let authInstance: ReturnType<typeof betterAuth<typeof config>> | undefined;

export const getAuth = async () => {
    if (authInstance) return authInstance;

    const mongoose = await connectToDatabase();
    const db = mongoose.connection?.db;
    if (!db) throw new Error("Database mapping channel not connected");

    // Pass the active DB client session safely into the adapter instance closure
    authInstance = betterAuth({
        ...config,
        database: mongodbAdapter(db)
    });

    return authInstance;
};

// 3. Clear ambiguous generic types
export type AuthType = Awaited<ReturnType<typeof getAuth>>;
