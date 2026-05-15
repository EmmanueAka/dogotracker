/* @ts-nocheck */
import { betterAuth, type Auth } from "better-auth";
import { mongodbAdapter } from "better-auth/adapters/mongodb";
import { nextCookies } from "better-auth/next-js";
import { connectToDatabase } from "@/database/mongoose";

let authInstance: Auth | undefined;

export const getAuth = async (): Promise<Auth> => {
    if (authInstance) return authInstance;

    const mongoose = await connectToDatabase();
    const db = mongoose.connection.db;
    if (!db) throw new Error("Database not connected");

    // @ts-ignore - pre-existing better-auth type compatibility issue
    authInstance = betterAuth({
        database: mongodbAdapter(db),
        secret: process.env.BETTER_AUTH_SECRET!,   // must be at least 32 chars
        baseURL: process.env.BETTER_AUTH_URL!,     // e.g. https://dogotracker.vercel.app
        emailAndPassword: {
            enabled: true,
            disableSignUp: false,
            requireEmailVerification: false,
            minPasswordLength: 8,
            maxPasswordLength: 128,
            autoSignIn: true,
        },
        plugins: [nextCookies()]   // handles cookies automatically
    });

    return authInstance;
};

// Export type so client/server can infer features
export type AuthType = Awaited<ReturnType<typeof getAuth>>;
