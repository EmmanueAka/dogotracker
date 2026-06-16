import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { getAuth } from "@/lib/better-auth/auth";

export async function GET() {
	try {
		const auth = await getAuth();
		const currentHeaders = await headers();
		const session = await auth.api.getSession({ headers: currentHeaders });

		if (!session || !session.user) {
			return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
		}

		const BACKEND_BASE_URL = process.env.BACKEND_URL || "http://localhost:5000";
		const SHARED_SECRET = process.env.INTERNAL_SHARED_SECRET || "local_dev_secret_key";

		// 1. Dispatch request inside a safely configured fetch wrapper
		const backendRes = await fetch(`${BACKEND_BASE_URL}/api/scan/recent`, {
			method: "GET",
			headers: {
				"X-API-Key": SHARED_SECRET,
				"X-User-Id": session.user.id
			}
		}).catch((fetchErr) => {
			// Intercepts socket connectivity timeouts before they crash the app context
			console.error("Express downstream instance unreachable:", fetchErr.message);
			return null;
		});

		// 2. Structural guard check: prevent undefined reading exceptions
		if (!backendRes) {
			return NextResponse.json({ error: "Backend server connection down." }, { status: 503 });
		}

		if (!backendRes.ok) {
			const errText = await backendRes.text().catch(() => "Unknown error");
			console.error(`Backend returned failure status code ${backendRes.status}:`, errText);
			return NextResponse.json({ error: `Backend error status: ${backendRes.status}` }, { status: backendRes.status });
		}

		const data = await backendRes.json();
		return NextResponse.json(data);

	} catch (error: any) {
		console.error("Failed fetching dynamic transaction metrics:", error?.message || error);
		return NextResponse.json({ error: "Internal Recent Scan Proxy engine crashed" }, { status: 500 });
	}
}
