/* @ts-nocheck */
import { betterAuth, type BetterAuthOptions } from "better-auth";
import { mongodbAdapter } from "better-auth/adapters/mongodb";
import { nextCookies } from "better-auth/next-js";
import { connectToDatabase } from "@/database/mongoose";

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
    plugins: [nextCookies()]
} satisfies BetterAuthOptions;

type StrictAuthType = NonNullable<ReturnType<typeof betterAuth<typeof config>>>;
let authInstance: StrictAuthType | undefined;

// 🔴 Explicitly tell TypeScript this returns Promise<StrictAuthType>
export const getAuth = async (): Promise<StrictAuthType> => {
    if (authInstance) return authInstance;

    const mongoose = await connectToDatabase();
    const db = mongoose.connection?.db;
    if (!db) throw new Error("Database mapping channel not connected");

    authInstance = betterAuth({
        ...config,
        database: mongodbAdapter(db)
    });

    return authInstance;
};

export type AuthType = Awaited<ReturnType<typeof getAuth>>;
