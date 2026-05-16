/* @ts-nocheck */
import { betterAuth } from "better-auth";
import { mongodbAdapter } from "better-auth/adapters/mongodb";
import { nextCookies } from "better-auth/next-js";
import { connectToDatabase } from "@/database/mongoose";

// 1. DO NOT use the "Auth" type here.
// We use 'any' for the placeholder or 'ReturnType<typeof betterAuth>'
let authInstance: ReturnType<typeof betterAuth> | undefined;

export const getAuth = async () => {
    if (authInstance) return authInstance;

    const mongoose = await connectToDatabase();
    const db = mongoose.connection.db;
    if (!db) throw new Error("Database not connected");

    // 2. DO NOT use betterAuth<BetterAuthOptions>(...)
    // Just call the function directly so it can infer your specific setup.
    // @ts-expect-error - pre-existing better-auth type compatibility issue
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
        plugins: [nextCookies()],
    });

    return authInstance;
};

// 3. This export allows your middleware to stay typed correctly
export type Auth = ReturnType<typeof betterAuth>;
