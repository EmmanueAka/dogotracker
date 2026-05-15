import { getAuth } from "@/lib/better-auth/auth";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
    const auth = await getAuth();
    const session = await auth.api.getSession({ headers: req.headers });
    if (!session) return NextResponse.json({ error: "Unauthorized" }, {status: 401});

    const { email } = await req.json();

    // Call your backend service on Render
    const res = await fetch("https://dogo-backend-7idt.onrender.com/api/scan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, userId: session.user.id }),
    });

    const data = await res.json();
    return NextResponse.json(data);
}
