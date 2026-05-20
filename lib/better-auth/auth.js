"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getAuth = void 0;
/* @ts-nocheck */
const better_auth_1 = require("better-auth");
const mongodb_1 = require("better-auth/adapters/mongodb");
const next_js_1 = require("better-auth/next-js");
const mongoose_1 = require("@/database/mongoose");
// 1. Use 'any' to bypass Vercel's strict generic evaluation loops
let authInstance;
const getAuth = async () => {
    if (authInstance)
        return authInstance;
    const mongoose = await (0, mongoose_1.connectToDatabase)();
    const db = mongoose.connection.db;
    if (!db)
        throw new Error("Database not connected");
    authInstance = (0, better_auth_1.betterAuth)({
        database: (0, mongodb_1.mongodbAdapter)(db),
        secret: process.env.BETTER_AUTH_SECRET,
        baseURL: process.env.BETTER_AUTH_URL,
        emailAndPassword: {
            enabled: true,
            disableSignUp: false,
            requireEmailVerification: false,
            minPasswordLength: 8,
            maxPasswordLength: 128,
            autoSignIn: true,
        },
        plugins: [(0, next_js_1.nextCookies)()],
    });
    return authInstance;
};
exports.getAuth = getAuth;
