/* @ts-nocheck */
import { betterAuth, type Auth } from "better-auth";
import { mongodbAdapter } from "better-auth/adapters/mongodb";
import { connectToDatabase } from "@/database/mongoose";

let authInstance: Auth | undefined;

export const getAuth = async (): Promise<Auth> => {
    if (authInstance) return authInstance;

    const mongoose = await connectToDatabase();
    const db = mongoose.connection.db;
    if (!db) throw new Error("Database not connected");

    authInstance = betterAuth({
        database: mongodbAdapter(db),
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
        // 🔴 CRUCIAL FIX: Kept empty. Do NOT mount nextCookies() on an Express server instance!
        plugins: []
    });

    return authInstance;
};

export type AuthType = Awaited<ReturnType<typeof getAuth>>
