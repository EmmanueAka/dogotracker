'use server';
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.signInWithEmail = exports.signOUt = exports.signUpWithEmail = void 0;
const headers_1 = require("next/headers");
const auth_1 = require("@/lib/better-auth/auth");
const signUpWithEmail = async ({ email, password, fullName }) => {
    try {
        const auth = await (0, auth_1.getAuth)();
        const response = await auth.api.signUpEmail({
            body: { email, password, name: fullName }
        });
        if (response) {
            return { success: true, data: response };
        }
        const loginResponse = await auth.api.signInEmail({
            body: { email, password },
        });
        if (loginResponse) {
            return { success: true, data: loginResponse };
        }
        return { success: false, error: "No token returned after signUp " };
    }
    catch (e) {
        console.log('Sign up failed', e);
        return { success: false, error: 'Sign up failed' };
    }
};
exports.signUpWithEmail = signUpWithEmail;
const signOUt = async () => {
    try {
        const auth = await (0, auth_1.getAuth)();
        await auth.api.signOut({
            headers: await (0, headers_1.headers)()
        });
    }
    catch (e) {
        console.log('Sign out failed', e);
        return { success: false, error: 'Sign out failed' };
    }
};
exports.signOUt = signOUt;
const signInWithEmail = async ({ email, password }) => {
    try {
        const auth = await (0, auth_1.getAuth)();
        const response = await auth.api.signInEmail({
            body: { email, password }
        });
        if (response) {
            return { success: true, data: response };
        }
        return { success: false, error: "No token returned from signIn " };
    }
    catch (e) {
        console.log('Sign in failed', e);
        return { success: false, error: 'Sign in failed' };
    }
};
exports.signInWithEmail = signInWithEmail;
