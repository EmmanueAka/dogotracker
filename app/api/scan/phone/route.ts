import { getAuth } from "@/lib/better-auth/auth";
import { NextResponse } from "next/server";
import { cookies } from "next/headers";

export async function POST(req: Request) {
    const auth = await getAuth();
    const session = await auth.api.getSession({ headers: req.headers });
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { phone } = await req.json();

    const cookieStore = await cookies();
    const cookieString = cookieStore
        .getAll()
        .map((c) => `${c.name}=${c.value}`)
        .join("; ");

    const sessionToken = cookieStore.get("better-auth.session_token")?.value;

    const res = await fetch("https://dogo-backend-7idt.onrender.com/api/scan", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            ...(sessionToken ? { Authorization: `Bearer ${sessionToken}` } : {}),
            ...(cookieString ? { Cookie: cookieString } : {}),
        },
        body: JSON.stringify({ phone }),
        credentials: "include",
    });

    const contentType = res.headers.get("content-type");
    if (!res.ok || !contentType || !contentType.includes("application/json")) {
        const errorText = await res.text().catch(() => "");
        return NextResponse.json(
            { error: "Express backend rejected request", status: res.status, details: errorText },
            { status: res.status || 502 }
        );
    }

    const data = await res.json();
    return NextResponse.json(data);
}

