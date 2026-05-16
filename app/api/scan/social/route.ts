import { getAuth } from "@/lib/better-auth/auth";
import { NextResponse } from "next/server";
import { cookies } from "next/headers";

export async function POST(req: Request) {
    const auth = await getAuth();
    const session = await auth.api.getSession({ headers: req.headers });
    if (!session) return NextResponse.json({ error: "Unauthorized" });

    const { platform, handle } = await req.json();

    const cookieStore = await cookies();
    const cookieString = cookieStore.getAll()
        .map((c) => `${c.name}=${c.value}`)
        .join("; ");

    // Call your backend service on Render
    const res = await fetch("https://dogo-backend-7idt.onrender.com/api/scan", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            ...(cookieString ? { Cookie: cookieString } : {}),
        },
        body: JSON.stringify({ platform, handle }),
        credentials: "include",
    });

    const data = await res.json();
    return NextResponse.json(data);
}
