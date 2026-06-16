'use client'

import { RadioTower, Search, CirclePower, RotateCcw, Mail, Globe } from 'lucide-react'
import {useEffect, useRef, useState} from "react";
import {useSearchParams} from "next/navigation";

type FootprintItem = {
    title: string;
    link: string;
    snippet: string;
}

type ScanResult = {
    _id: string;
    userId: string;
    type: 'social';
    value: string;
    totalMentions: number;
    footprints: FootprintItem[];
    searchedAt: string;
}

const SocioScanner = () => {
    const searchParams = useSearchParams();

    const queryScanValue = searchParams.get('scan') || "";
    const shouldTrigger = searchParams.get('trigger') === 'true';


    const [social, setSocial] = useState(queryScanValue)
    const [loading, setLoading] = useState(false)
    const [results, setResults] = useState<ScanResult | null>(null)
    const [errorMsg, setErrorMsg] = useState<string | null>(null)
    const [platform, setPlatform] = useState("twitter")
    const [email, setEmail] = useState('')

    const scanTriggeredRef = useRef(false)

    const socialHandleRegex = /^([@#]?[a-zA-Z0-9_.-]{1,30})$/;


    const handleScan = async (targetSocial?:string) => {
        const handleToScan = targetSocial || social
        if (!handleToScan) return;

        if(!socialHandleRegex.test(handleToScan)){
            setErrorMsg("Invalid social address formatting footprint.")
            return;
        }

        setLoading(true);
        setResults(null);
        setErrorMsg(null)

        try {
            // 1. Start scan
            const res = await fetch(`/api/scan/social`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ handle: handleToScan, platforms: [platform], email }),
            });

            let responseData;
            try {
                responseData = await res.json();
            } catch (jsonErr) {
                const errorText = await res.text().catch(() => "Unknown crash");
                console.error("Express backend emitted HTML instead of JSON", res.status, errorText)
                throw new Error("Server emitted a structural HTML error page. Verify backend status")
            }

            if (!res.ok || responseData.error) {
                throw new Error(responseData.error || `Scan execution failed with status: ${res.status}`);
            }

            console.log("Successfully loaded scan parameters:", responseData);

            if (responseData.results) {
                setResults(responseData.results);
            } else {
                setResults(responseData)
            }
        } catch (err: any) {
            console.error("Scan exception thrown inside engine block:", err);
            setErrorMsg(err.message || "Identify execution failure.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if(shouldTrigger && queryScanValue && !scanTriggeredRef.current){
            scanTriggeredRef.current = true;
            handleScan(queryScanValue)
        }
    }, [shouldTrigger, searchParams]);

    const handleReset = () => {
        setSocial("")
        setEmail("")
        setPlatform("twitter")
        setResults(null)
        setErrorMsg(null)
        scanTriggeredRef.current = false
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
                                <h1 className='text-2xl font-bold text-white p-4'>SCAN SOCIAL HANDLE</h1>
                            </div>
                            <p className='text-gray-500 px-6 mb-4'>TARGET CONFIGURATION PARAMETERS</p>
                        </div>

                        {/* 🟢 NEW: Active Platform Selection Engine Layout Toggle Controls */}
                        <div className='flex gap-3 mb-6 px-6'>
                            {['twitter', 'instagram', 'facebook'].map((p) => (
                                <button
                                    key={p}
                                    type="button"
                                    onClick={() => setPlatform(p)}
                                    className={`px-4 py-2 rounded text-xs font-mono font-bold tracking-wider uppercase transition border ${
                                        platform === p
                                            ? 'bg-[#00f2ff] text-black border-[#00f2ff] shadow-[0_0_15px_rgba(0,242,255,0.4)]'
                                            : 'bg-black/50 text-gray-400 border-gray-700 hover:text-white hover:border-gray-500'
                                    }`}
                                >
                                    {p}
                                </button>
                            ))}
                        </div>

                        {/* Input Controls Container */}
                        <div className='space-y-4 px-6 mb-6'>
                            {/* Handle Input Vector */}
                            <div className='border-b-2 border-[#00f2ff] flex items-center gap-4 p-1 bg-black w-full rounded-sm'>
                                <Search className='primary-text w-6 h-6 flex-shrink-0 ml-2'/>
                                <input
                                    value={social}
                                    type='text'
                                    onChange={e => setSocial(e.target.value)}
                                    placeholder={platform === 'twitter' ? '@username' : platform === 'facebook' ? '#hashtag' : 'username'}
                                    className='text-white w-full rounded-md p-2 text-xl focus:outline-none bg-transparent placeholder-gray-600'
                                />
                            </div>

                        </div>

                        {/* Action Control Buttons Container Row */}
                        <div className='flex items-center justify-end gap-4 px-6 mt-4'>
                            <button
                                type="button"
                                className={`w-[200px] h-[82px] rounded-md font-bold flex items-center justify-center gap-2 transition ${ loading ? "bg-gray-600 text-gray-300 cursor-not-allowed" : "bg-[#00f2ff] text-black hover:bg-[#fabd62]"}`}
                                onClick={handleScan}
                                disabled={loading || !social}
                            >
                                <CirclePower className='text-black w-5 h-5'/>
                                {loading ? "Scanning..." : "INITIALIZE SCAN"}
                            </button>

                            <button
                                type="button"
                                className={`flex items-center justify-center h-[82px] w-[52px] p-4 cursor-pointer hover:bg-gray-400 rounded-md font-bold transition ${ loading ? "bg-black text-gray-500 cursor-not-allowed" : "bg-gray-700 text-white hover:bg-gray-600"}`}
                                onClick={handleReset}
                                disabled={loading}
                            >
                                <RotateCcw className="w-5 h-5"/>
                            </button>
                        </div>

                        {/* Global Error Banner Messaging Interface Output */}
                        {errorMsg && (
                            <div className="mx-6 mt-6 p-4 border border-red-500/30 bg-red-950/20 text-red-400 rounded text-sm font-mono">
                                ⚠️ {errorMsg}
                            </div>
                        )}

                        {/* Data Visualization Output Layer Processing Block */}
                        {results && (
                            <div className='w-full mt-8 mb-8 text-white border-t border-gray-700/50 pt-6 animate-fade-in px-6'>

                                <h3 className='primary-text font-bold text-xl mb-3 text-[#00f2ff] flex items-center gap-2'>
                                    <span>👤</span> IDENTIFIED PROFILE NODE
                                </h3>

                                <h4 className='text-gray-400 mt-4 text-xs tracking-wider uppercase font-mono mb-2'>Platforms Results</h4>
                                {Object.entries((results as any).platforms || {}).map(([platformKey, data]: [string, any]) => (
                                    <div key={platformKey} className="text-sm font-mono my-1 flex items-center justify-between bg-black/30 p-2 border border-gray-800 rounded">
                                        <strong className="text-gray-300">{platformKey.toUpperCase()}:</strong>
                                        <span className="text-[#00f2ff] ml-2">{data.totalMentions || 0} mentions</span>
                                    </div>
                                ))}

                                <div className='bg-gradient-to-r from-gray-900 to-black border border-[#00f2ff]/30 p-6 rounded-lg my-6 font-mono text-sm space-y-3 shadow-lg'>
                                    <p className="text-lg">
                                        <span className="text-gray-500">RESOLVED NAME:</span>{' '}
                                        <span className="text-white font-extrabold tracking-wide uppercase text-base">
                                            {(results as any).enrichedData?.ownerName || "UNKNOWN ENTITY"}
                                        </span>
                                    </p>
                                    <p>
                                        <span className="text-gray-500">TARGET VALUE:</span>{' '}
                                        <span className="text-gray-300 font-bold">{results.value}</span>
                                    </p>
                                    <p>
                                        <span className="text-gray-500">DETECTED ACTIVE ACCOUNTS:</span>{' '}
                                        <span className="text-gray-400">
                                            {(results as any).enrichedData?.locatedProfiles?.length > 0
                                                ? (results as any).enrichedData.locatedProfiles.join(" | ")
                                                : "No Major Network Indexes Found"}
                                        </span>
                                    </p>
                                    <p>
                                        <span className="text-gray-500">CROSS-LINKED HANDLES:</span>{' '}
                                        <span className="text-[#00f2ff]">
                                            {(results as any).enrichedData?.associatedHandles?.length > 0
                                                ? (results as any).enrichedData.associatedHandles.join(", ")
                                                : "None Extracted"}
                                        </span>
                                    </p>
                                    <p>
                                        <span className="text-gray-500">REGISTERED EMAIL:</span>{' '}
                                        <span className='text-[#fabd62] font-bold'>{(results as any).enrichedData?.email || "No Email found"}</span>
                                    </p>
                                    <p>
                                        <span className="text-gray-500">HEURISTIC EVALUATION:</span>{' '}
                                        {results.totalMentions > 0 ? (
                                            <span className="text-green-400 font-bold">🟢 PUBLIC SIGNAL footprint ACTIVE</span>
                                        ) : (
                                            <span className="text-red-400 font-bold">🔴 UNINDEXED / HIGH FRAUD RISK NODE</span>
                                        )}
                                    </p>
                                </div>

                                <h3 className='primary-text font-bold text-xl'>Scan Summary</h3>
                                <hr className='border-[#00f2ff] mb-2' />
                                <div className='bg-black/40 border border-gray-700 p-4 rounded-md mt-3 mb-6 font-mono text-sm space-y-2'>
                                    <p><span className="text-gray-500">Target Vector:</span> <span className="text-white font-bold">{results.value}</span></p>
                                    <p><span className="text-gray-500">Total System Footprints:</span> <span className="text-[#00f2ff] font-bold">{results.totalMentions}</span></p>
                                    <p><span className="text-gray-500">Timestamp:</span> <span className="text-gray-400 text-xs">{new Date(results.searchedAt).toLocaleString()}</span></p>
                                </div>

                                <h3 className='primary-text font-bold text-xl mt-6'>Discovered Public Registries</h3>
                                <hr className='border-[#00f2ff] mb-2' />
                                <div className='mt-3 space-y-3'>
                                    {!results.footprints || results.footprints.length === 0 ? (
                                        <p className="text-gray-500 border border-dashed border-gray-700/60 p-4 text-center text-sm rounded-md">
                                            No active identity footprint patterns discovered across target networks.
                                        </p>
                                    ) : (
                                        results.footprints.map((site, idx) => (
                                            <div key={idx} className="p-4 border border-gray-700 bg-black/20 rounded-md hover:border-[#00f2ff]/40 transition shadow-sm">
                                                <a href={site.link} target="_blank" rel="noreferrer" className="text-[#00f2ff] font-semibold block text-sm hover:underline">
                                                    {site.title}
                                                </a>
                                                <p className="text-xs text-gray-400 mt-1 leading-relaxed">{site.snippet}</p>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    )
}

export default SocioScanner;
