'user server';
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getAllUserForNewsEmail = void 0;
const mongoose_1 = require("@/database/mongoose");
const getAllUserForNewsEmail = async () => {
    try {
        const mongoose = await (0, mongoose_1.connectToDatabase)();
        const db = mongoose.connection.db;
        if (!db)
            throw new Error('Database not connected');
        const users = await db.collection('users').find({ email: { $exists: true, $ne: null } }, { projection: { _id: 1, email: 1, name: 1, country: 1 } }).toArray();
        return users.filter((user) => user.email && user.name).map((user) => ({
            id: user.id || user._id?.toString() || '',
            email: user.email,
            name: user.name,
        }));
    }
    catch (e) {
        console.error('Error fetching users for newsletter:');
        return [];
    }
};
exports.getAllUserForNewsEmail = getAllUserForNewsEmail;
