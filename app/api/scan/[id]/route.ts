import { NextResponse } from "next/server";
import { getAuth } from "@/lib/better-auth/auth";
import { scanEmailRisk } from "@/backend/src/api/scanEmailRisk";
import { getScan, updateScanResult, updateScanStatus } from "@/backend/src/db/scan.model";

export async function GET(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const auth = await getAuth();
    const session = await auth.api.getSession({ headers: req.headers });

    if (!session) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const scan = await getScan(id, session.user.id);
    if (!scan) {
        return NextResponse.json({ error: "Scan not found" }, { status: 404 });
    }

    if (scan.status === 'completed' || scan.status === 'failed') {
        return NextResponse.json({ status: scan.status, result: scan.result });
    }

    if (scan.status === 'processing') {
        return NextResponse.json({ status: 'processing' });
    }

    await updateScanStatus(id, 'processing');

    try {
        const riskResult = await scanEmailRisk(scan.email);

        const result = {
            breaches: riskResult.publicMentions.map((url: string) => ({
                name: new URL(url).hostname,
                date: new Date().toISOString(),
                exposed: ['email'],
                risk: riskResult.hasGravatar || riskResult.foundOnGitHub ? 'High' : 'Medium',
                source: url,
            })),
            totalMentions: riskResult.publicMentions.length,
            signals: {
                isValid: riskResult.isValid,
                hasGravatar: riskResult.hasGravatar,
                foundOnGitHub: riskResult.foundOnGitHub,
                foundInBreaches: riskResult.foundInBreaches,
            },
            summary: riskResult.summary,
        };

        await updateScanResult(id, result, 'completed');
        return NextResponse.json({ status: 'completed', result });
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        await updateScanResult(id, { error: errorMessage }, 'failed');
        return NextResponse.json({ status: 'failed', result: { error: errorMessage } });
    }
}

