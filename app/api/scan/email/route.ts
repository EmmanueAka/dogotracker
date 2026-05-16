import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getAuth } from "@/lib/better-auth/auth";

export async function POST(req: Request) {
    try {
        const auth = await getAuth();
        const cookieStore = await cookies();

        // 1. Compile cookies cleanly for Next.js internal auth verification
        const cookieString = cookieStore.getAll()
            .map(c => `${c.name}=${c.value}`).join("; ");

        const validationHeaders = new Headers();
        if (cookieString) {
            validationHeaders.append("Cookie", cookieString);
        }

        const session = await auth.api.getSession({ headers: validationHeaders });

        if (!session || !session.user) {
            return NextResponse.json({ error: "Unauthorized - Better Auth session missing" }, { status: 401 });
        }

        // 2. Fetch the raw token string safely from the browser storage layer
        const sessionToken = cookieStore.get("better-auth.session_token")?.value || "";

        // 3. CRUCIAL: Read the incoming request body string sequence safely
        const bodyData = await req.json();

        // 4. Dispatch fetch forwarding call to your live Render application service
        const backendRes = await fetch(" https://dogo-backend-7idt.onrender.com", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                // Passing Bearer token explicitly ensures requireAuth captures it natively
                "Authorization": `Bearer ${sessionToken}`
            },
            body: JSON.stringify(bodyData) // Passes the { email } data payload along securely
        });

        if (!backendRes.ok) {
            const errorText = await backendRes.text();
            console.error("Express cluster rejected forwarding sweep:", errorText);
            return NextResponse.json(
                { error: `Express backend error: ${backendRes.status}` },
                { status: backendRes.status }
            );
        }

        const data = await backendRes.json();
        return NextResponse.json(data);

    } catch (error) {
        console.error("Critical failure inside Next.js API Proxy:", error);
        return NextResponse.json({ error: "Internal Server Proxy error" }, { status: 500 });
    }
}
