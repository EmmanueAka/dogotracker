import { NextResponse } from "next/server";
import { getAuth } from "@/lib/better-auth/auth";


export async function GET(req: Request, { params }: { params: Promise<{ id: string}>}) {
    const auth = await getAuth();
    const session = await auth.api.getSession({ headers: req.headers });

    if(!session ) return NextResponse.json({ error: "Unauthorized"}, {status: 401})

    const resolvedParams = await params
    const id = resolvedParams?.id;

    if(!id || id === 'undefined') return NextResponse.json({ error: "Invalid ID" }, {status: 400});

    const BACKEND_URL = ` https://dogo-backend-7idt.onrender.com/${id}`

    try {
        const res = await fetch(BACKEND_URL, {
            headers: {
                "Authorization": `Bearer ${session.user.id}`
            }
        });

        if(!res.ok) return NextResponse.json({ error: "Backend service returned an error "}, { status: res.status })

        const data = await res.json();
        return NextResponse.json(data);

    }catch(error) {
        console.log("Proxy fetch failed", error);
        return NextResponse.json({ error: "Internal server proxy error"}, {status: 500})
    }

}