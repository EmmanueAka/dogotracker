import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { getAuth } from "@/lib/better-auth/auth";

export async function GET() {
    try {
        // 1. Authenticate with Better Auth inside Next.js locally
        const auth = await getAuth();
        const currentHeaders = await headers();
        const session = await auth.api.getSession({ headers: currentHeaders });

        if (!session || !session.user) {
            return NextResponse.json(
                { error: "Unauthorized - Better Auth session missing" },
                { status: 401 }
            );
        }

        // 2. Point to local development server if running locally
        const BACKEND_BASE_URL = process.env.BACKEND_URL || "http://localhost:5000";
        const SHARED_SECRET = process.env.INTERNAL_SHARED_SECRET || "local_dev_secret_key";

        // 3. Make request to Express passing verified metadata signatures
        const backendRes = await fetch(`${BACKEND_BASE_URL}/api/history`, {
            method: "GET",
            headers: {
                "Content-Type": "application/json",
                "X-API-Key": SHARED_SECRET,
                "X-User-Id": session.user.id // Safely forwarding the verified user ID string
            }
        });

        const contentType = backendRes.headers.get("content-type");
        if (!backendRes.ok || !contentType || !contentType.includes("application/json")) {
            const errorText = await backendRes.text().catch(() => "");
            return NextResponse.json(
                {
                    error: "Express backend error fetching history",
                    status: backendRes.status,
                    details: errorText,
                },
                { status: backendRes.status || 502 }
            );
        }

        const data = await backendRes.json();
        return NextResponse.json(data);

    } catch (error) {
        console.error("Critical failure inside Next.js History Proxy:", error);
        return NextResponse.json(
            { error: "Internal Server Proxy error resolving history data." },
            { status: 500 }
        );
    }
}
