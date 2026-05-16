'use client'

import { RadioTower, Search, CirclePower, RotateCcw } from 'lucide-react'
import { useState } from "react";

type Breach = {
    name: string
    date: string
    exposed: string[]
    risk: string
    source: string
}

type ScanResult = {
    breaches: Breach[]
    totalMentions: number;
    signals: {
        isValid: boolean,
        hasGravatar: boolean,
        foundOnGitHub: boolean,
        foundInBreaches: boolean,
    };
    summary: string
}

const Scanner = () => {
    const [email, setEmail] = useState("")
    const [loading, setLoading] = useState(false)
    const [results, setResults] = useState<ScanResult | null>(null)

    const handleScan = async () => {
        if (!email) return;
        setLoading(true);
        setResults(null);

        try {
            // 1. Start scan
            const res = await fetch(`/api/scan`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ email }),
                credentials: "include",
            });

            // FIX: Guard against non-JSON content structures on initialization
            const initContentType = res.headers.get("content-type");
            if (!res.ok || !initContentType || !initContentType.includes("application/json")) {
                const errorText = await res.text();
                console.error("Scan init failed with non-JSON response:", res.status, errorText);
                setLoading(false);
                return;
            }

            const responseData = await res.json();
            console.log("--- DEBUG BACKEND DATA STRUCTURE ---");
            console.log("Raw Response Payload:", responseData);

            const targetId = responseData?.scanId || responseData?.id || responseData?._id || responseData?.data?.scanId || responseData?.data?.id || responseData?.scan?.id;

            if (!targetId) {
                console.error("Payload breakdown failed. Stringified response:", JSON.stringify(responseData));
                setLoading(false);
                return;
            }

            // 2. Poll for results safely
            let done = false;
            let retries = 0;
            const maxRetries = 20;

            while (!done && retries < maxRetries) {
                retries++;
                console.log(`Polling attempt ${retries}/${maxRetries} for ID: ${targetId}`);

                const poll = await fetch(`/api/scan/${targetId}`);

                // FIX: Check Content-Type header explicitly before calling poll.json()
                const pollContentType = poll.headers.get("content-type");
                if (!poll.ok || !pollContentType || !pollContentType.includes("application/json")) {
                    const brokenText = await poll.text();
                    console.error("Polling endpoint emitted structural html/text error page:", poll.status, brokenText);
                    break; // Exit the loop safely without crashing the parsing engine
                }

                const data = await poll.json();

                if (data.status === "completed" || data.status === "failed") {
                    setResults(data.result);
                    done = true;
                } else {
                    // If status is still 'queued', wait 3 seconds before next execution loop
                    await new Promise(r => setTimeout(r, 3000));
                }
            }

        } catch (err) {
            console.error("Scan exception thrown inside engine block:", err);
        } finally {
            setLoading(false);
        }
    };

    const handleReset = () => {
        setEmail("")
        setResults(null)
    }

    return (
        <div className='h-auto mb-16'>
            <div className='h-auto w-full'>
                <h2 className='text-5xl text-white font-bold'>Neural Scanner <span className='primary-text'>v2.4</span></h2>
                <p className='text-gray-500'>Deploying sentient heuristics for real-time identity validation. Cross-referencing 4.2B data points across decentralized networks.</p>

                <div className='mt-12 relative mb-12'>
                    <div className='bg-[#00f2ff]/20 blur-3xl absolute rounded-full h-auto w-[650px]'></div>
                    <div className='relative h-auto w-[650px] border border-[#00f2ff]/20 z-10 rounded-md bg-gray-800 px-6 py-6 mb-8'>

                        <div className='flex flex-col mt-6'>
                            <div className='items-center flex gap-2'>
                                <RadioTower className='w-10 h-10 primary-text'/>
                                <h1 className='text-2xl font-bold text-white p-4'>SCAN EMAIL ADDRESS</h1>
                            </div>
                            <p className='text-gray-500 px-6'>TARGET IDENTIFICATION EMAIL</p>
                        </div>

                        <div className='flex items-center justify-between gap-2'>
                            <div className='mt-12 border-b-2 border-[#00f2ff] flex items-center gap-4 p-1 bg-black'>
                                <Search className='primary-text w-8 h-8'/>
                                <input
                                    value={email}
                                    name='text'
                                    type='email'
                                    onChange={e => setEmail(e.target.value)}
                                    placeholder='example@email.com'
                                    className='text-gray-500 rounded-md p-2 text-2xl focus:outline-none active:bg-[#00f2ff]/20 bg-transparent'
                                />
                            </div>

                            <div className='bg-[#00f2ff] absolute rounded-full h-[38px] w-[38px] blur-3xl'></div>

                            <div className='relative mb-8 flex gap-4 items-center justify-center mt-12'>
                                <button
                                    className={`h-[52px] p-4 rounded-md font-bold flex items-center justify-center gap-2 ${
                                        loading ? "bg-gray-600 text-gray-300 cursor-not-allowed" : "bg-[#00f2ff] text-black hover:bg-[#fabd62]"
                                    }`}
                                    onClick={handleScan}
                                    disabled={loading || !email}
                                >
                                    <CirclePower className='text-black w-6 h-6'/>
                                    {loading ? "Scanning..." : "INITIALIZE SCAN"}
                                </button>

                                <button
                                    className={`flex items-center justify-center h-[52px] w-[52px] rounded-md font-bold ${
                                        loading ? "bg-black text-gray-500 cursor-not-allowed" : "bg-gray-700 text-white hover:bg-gray-600"
                                    }`}
                                    onClick={handleReset}
                                    disabled={loading}
                                >
                                    <RotateCcw className="w-5 h-5"/>
                                </button>
                            </div>
                        </div>

                        {results && (
                            <div className='w-full mt-8 mb-8 text-white'>
                                <h3 className='primary-text font-bold text-xl'>Scan Summary</h3>
                                <hr className='border-[#00f2ff] mb-2' />
                                <p className='text-gray-400 mb-6'>{results.summary || "No summary provided."}</p>

                                <h3 className='primary-text font-bold text-xl mt-3'>Signals</h3>
                                <hr className='border-[#00f2ff] mb-2' />
                                <ul className='flex flex-col gap-2 text-gray-400 mb-6'>
                                    <li>Email valid: <span className="text-white font-semibold">{results.signals?.isValid ? "Yes" : "No"}</span></li>
                                    <li>Has Gravatar: <span className="text-white font-semibold">{results.signals?.hasGravatar ? "Yes" : "No"}</span></li>
                                    <li>Found on Github: <span className="text-white font-semibold">{results.signals?.foundOnGitHub ? "Yes" : "No"}</span></li>
                                    <li>Found in Breaches: <span className="text-white font-semibold">{results.signals?.foundInBreaches ? "Yes" : "No"}</span></li>
                                </ul>

                                <h3 className='primary-text font-bold text-xl'>Breaches</h3>
                                <hr className='border-[#00f2ff] mb-2' />
                                {results.breaches && results.breaches.length > 0 ? (
                                    <div className="overflow-x-auto w-full">
                                        <table className="w-full text-left border-collapse mt-2">
                                            <thead>
                                            <tr className="bg-gray-900 text-gray-300">
                                                <th className="border border-gray-700 px-3 py-2">Name</th>
                                                <th className="border border-gray-700 px-3 py-2">Date</th>
                                                <th className="border border-gray-700 px-3 py-2">Exposed</th>
                                                <th className="border border-gray-700 px-3 py-2">Risk</th>
                                                <th className="border border-gray-700 px-3 py-2">Source</th>
                                            </tr>
                                            </thead>
                                            <tbody>
                                            {results.breaches.map((b, idx) => (
                                                <tr key={idx} className="hover:bg-gray-700/50 text-gray-300">
                                                    <td className="border border-gray-700 px-3 py-2 font-medium text-white">{b.name}</td>
                                                    <td className="border border-gray-700 px-3 py-2 text-sm">{new Date(b.date).toLocaleDateString()}</td>
                                                    <td className="border border-gray-700 px-3 py-2 text-sm">{b.exposed ? b.exposed.join(", ") : "email"}</td>
                                                    <td className={`border border-gray-700 px-3 py-2 font-bold text-sm ${b.risk === 'High' ? 'text-red-400' : 'text-yellow-400'}`}>{b.risk}</td>
                                                    <td className="border border-gray-700 px-3 py-2 text-sm">
                                                        <a href={b.source} target="_blank" rel="noreferrer" className="text-[#00f2ff] hover:underline snap-inline max-w-[150px] truncate block">
                                                            Link
                                                        </a>
                                                    </td>
                                                </tr>
                                            ))}
                                            </tbody>
                                        </table>
                                    </div>
                                ) : (
                                    <p className="text-gray-500 italic mt-2">No malicious breaches detected on decentralized networks.</p>
                                )}
                            </div>
                        )}

                    </div>
                </div>
            </div>
        </div>
    )
}

export default Scanner;
