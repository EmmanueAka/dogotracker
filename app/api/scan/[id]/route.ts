import { NextResponse } from "next/server";
import { getAuth } from "@/lib/better-auth/auth";


export async function GET(req: Request, { params }: { params: Promise<{ id: string}>}) {
    const auth = await getAuth();
    const session = await auth.api.getSession({ headers: req.headers });
    if(!session ) return NextResponse.json({ error: "Unauthorized"}, {status: 401})

    const { id } = await params

    const res = await fetch(`https://onrender.com{id}`, {
        headers: { "Authorization": `Bearer ${session.user.id }`}
    })

    const data = await res.json();
    return NextResponse.json(data);
}