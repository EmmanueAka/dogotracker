import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { getAuth } from "@/lib/better-auth/auth";

export async function POST(req: Request) {
    try {
        const auth = await getAuth();
        const currentHeaders = await headers();
        const session = await auth.api.getSession({ headers: currentHeaders });

        if (!session || !session.user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const bodyData = await req.json(); // Expected payload: { phone }
        const BACKEND_BASE_URL = process.env.BACKEND_URL || "http://localhost:5000";
        const SHARED_SECRET = process.env.INTERNAL_SHARED_SECRET || "local_dev_secret_key";

        const backendRes = await fetch(`${BACKEND_BASE_URL}/api/scan/phone`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "X-API-Key": SHARED_SECRET,
                "X-User-Id": session.user.id
            },
            body: JSON.stringify(bodyData)
        });

        const data = await backendRes.json();
        return NextResponse.json(data, { status: backendRes.status });
    } catch (error) {
        return NextResponse.json({ error: "Internal Proxy Phone Route failure." }, { status: 500 });
    }
}
