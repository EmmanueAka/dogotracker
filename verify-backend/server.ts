import dotenv from "dotenv";
dotenv.config();

import express, { Request, Response } from "express";
import cors from 'cors';
import { connectDB } from "./src/config/db";
import verifyRouter from "./src/routes/verify"; // 🟢 Fixed: Changed from .js to .ts
import { requireSession } from "./src/middleware/auth"; // 🟢 Fixed: Changed from .js to .ts

const app = express();

// Establish core database connection pool
connectDB();

app.use(cors({
    origin: process.env.FRONTEND_URI || 'http://localhost:3000',
    credentials: true
}));

app.use(express.json());

// Fixed: Parameter order corrected to standard (req, res)
app.get('/health', (req: Request, res: Response) => {
    res.json({ status: 'up', database: 'connected'});
});

// Mount modular security and routes
app.use('/api', requireSession, verifyRouter);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`🚀 DogoTracker Backend Cluster running securely on port ${PORT}`);
});
