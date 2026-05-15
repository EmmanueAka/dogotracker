"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.signOut = exports.useSession = exports.signUp = exports.signIn = exports.authClient = void 0;
const react_1 = require("better-auth/react");
exports.authClient = (0, react_1.createAuthClient)();
exports.signIn = exports.authClient.signIn, exports.signUp = exports.authClient.signUp, exports.useSession = exports.authClient.useSession, exports.signOut = exports.authClient.signOut;
