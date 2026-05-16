import { NextResponse } from "next/server";
import { cookies, headers } from "next/headers";
import { getAuth } from "@/lib/better-auth/auth";

export async function POST(req: Request) {
    try {
        const auth = await getAuth();
        const currentHeaders = await headers();
        const session = await auth.api.getSession({ headers: currentHeaders });

        if (!session || !session.user) {
            return NextResponse.json(
                { error: "Unauthorized - Better Auth session missing" },
                { status: 401 }
            );
        }

        const cookieStore = await cookies();
        const bodyData = await req.json();

        const backendRes = await fetch(`https://dogo-backend-7idt.onrender.com/api/scan`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify(bodyData),
            credentials: "include"
        });

        // Safety Guard: Intercept HTML response exceptions from Express/Render
        const contentType = backendRes.headers.get("content-type");
        if (!backendRes.ok || !contentType || !contentType.includes("application/json")) {
            const errorText = await backendRes.text();
            console.error("Express cluster rejected forwarding sweep:", errorText);
            return NextResponse.json(
                { error: `Express backend error: ${backendRes.status}` },
                { status: backendRes.status || 502 }
            );
        }

        const data = await backendRes.json();
        return NextResponse.json(data);

    } catch (error) {
        console.error("Critical failure inside Next.js API Proxy:", error);
        return NextResponse.json(
            { error: "Internal Server Proxy error" },
            { status: 500 }
        );
    }
}
