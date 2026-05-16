import { NextResponse } from "next/server";
import { getAuth } from "@/lib/better-auth/auth";
import { cookies } from "next/headers";
import type { NextRequest } from "next/server";

export async function GET(
    req: NextRequest,
    context: { params: Promise<{ id: string }> }
) {
    // 1. Await Next.js async params
    const { id } = await context.params;

    if (!id) {
        return NextResponse.json({ error: "Invalid id" }, { status: 400 });
    }

    // 2. Await async cookies
    const cookieStore = await cookies();
    const cookieString = cookieStore.getAll()
        .map(c => `${c.name}=${c.value}`)
        .join("; ");

    const validationHeaders = new Headers();
    if (cookieString) {
        validationHeaders.append("Cookie", cookieString);
    }

    const auth = await getAuth();
    const session = await auth.api.getSession({ headers: validationHeaders });

    if (!session || !session.user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const BACKEND_URL = `https://dogo-backend-7idt.onrender.com/api/scan/${id}`;

    try {
        const res = await fetch(BACKEND_URL, {
            headers: {
                "Content-Type": "application/json",
            },
            credentials: "include"
        });

        if (!res.ok) {
            return NextResponse.json({ error: "Backend service returned an error" }, { status: res.status });
        }

        const data = await res.json();
        return NextResponse.json(data);

    } catch (error) {
        console.error("Proxy fetch failed", error);
        return NextResponse.json({ error: "Internal server proxy error" }, { status: 500 });
    }
}
