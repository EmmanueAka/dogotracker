import { NextResponse } from "next/server";
import { getAuth } from "@/lib/better-auth/auth";
import {cookies} from "next/headers";


export async function GET(req: Request, { params }: { params: { id: string}}) {
    const auth = await getAuth();


    const cookieStore = cookies();
    const cookieString = cookieStore.getAll()
        .map(c => `${c.name}=${c.value}`)
        .join("; ");

    const validationHeaders = new Headers();
    if (cookieString){
        validationHeaders.append("Cookie", cookieString)
    }

    const session = await auth.api.getSession({ headers: validationHeaders })

    if(!session || !session.user){
        return NextResponse.json({ error: "Unauthorized "}, { status: 401})
    }

    const id = params?.id;
    if(!id) return NextResponse.json({ error: "Invalid id" }, { status: 400});

    const BACKEND_URL = `https://dogo-backend-7idt.onrender.com/api/scan/${id}`

    try {
        const res = await fetch(BACKEND_URL, {
            headers: {
                "Content-Type": "application/json",
                "Cookie": cookieString,
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