'use client'

import React, { useEffect, useState } from 'react'
import { Space_Grotesk } from "next/font/google";
import { ShieldCheck, Radar, Lock, Check, Info, TriangleAlert } from "lucide-react"
import Scanner from "@/app/email-check/scanner";
import ThreatMatrix from "@/app/email-check/threat-matrix"
import Vault from "./vault"

const spaceGrotesk = Space_Grotesk({
    subsets: ['latin'],
    weight: ["500", "400", "700"],
})

// 🟢 Updated: Added dynamic heuristic types to the history item template contract
interface HistoryItem {
    _id: string;
    type: 'email' | 'phone' | 'social';
    value: string;
    totalMentions: number;
    searchedAt: string;
    heuristicSummary?: {
        status: string;
        color: 'green' | 'orange' | 'red';
    };
}

const Page = () => {
    const [activePage, setActivePage] = useState("scanner")
    const [loadingHistory, setLoadingHistory] = useState(true)
    const [recentScans, setRecentScans] = useState<HistoryItem[]>([])

    const getRelativeTIme = (dateString: string) => {
        const now = new Date();
        const past = new Date(dateString);
        const msPerMinute = 60 * 1000;
        const msPerHour = msPerMinute * 60;
        const elapsed = now.getTime() - past.getTime();

        if (elapsed < msPerMinute) return 'Just now';
        if (elapsed < msPerHour) return Math.round(elapsed / msPerMinute) + 'm ago';
        return Math.round(elapsed / msPerHour) + 'h ago';
    }

    const fetchRecentScans = async () => {
        try {
            setLoadingHistory(true);
            const res = await fetch('/api/scan/recent');

            if (res.ok) {
                const data = await res.json();
                setRecentScans(Array.isArray(data) ? data : data.results || [])
            }
        } catch (err) {
            console.error("Error retrieving background history", err)
        } finally {
            setLoadingHistory(false);
        }
    }

    useEffect(() => {
        fetchRecentScans();
        const interval = setInterval(fetchRecentScans, 3000);
        return () => clearInterval(interval);
    }, []);

    useEffect(() => {
        let timeout: ReturnType<typeof setTimeout>
        const root = document.querySelector(".wired-bg") as HTMLElement;

        const handleMove = (e: MouseEvent) => {
            if (root) {
                root.style.setProperty("--x", `${e.clientX}px`);
                root.style.setProperty("--y", `${e.clientY}px`);
                root.classList.add("glow-active")

                clearTimeout(timeout);
                timeout = setTimeout(() => {
                    root.classList.remove("glow-active")
                }, 500)
            }
        };

        window.addEventListener('mousemove', handleMove);
        return () => window.removeEventListener('mousemove', handleMove);
    }, []);

    return (
        <div className='relative overflow-hidden wired-bg'>
            <div className='absolute inset-0 bg-gradient-to-b from-transparent to-black'></div>
            <div className='email-check z-30'>
                <div className='col-span-1 w-full h-full '>
                    <div className='flex flex-row items-center gap-2 px-6'>
                        <div className='rounded-full w-3 h-3 primary-col animate-pulse' />
                        <h2 className={`${spaceGrotesk.className} text-2xl primary-text`}>DogoTracker AI</h2>
                    </div>
                    <p className='text-gray-500 text-sm px-6'>Sentient Mode Active</p>

                    <nav className='flex flex-col gap-6 mt-6 z-20'>
                        <button onClick={() => setActivePage("scanner")} className={`flex items-center ${activePage === "scanner" ? "bg-gray-600 border-r-2 border-[#00f2ff] text-[#00f2ff]" : "text-gray-300 hover:bg-gray-700"} cursor-pointer`}>
                            <div className='px-6 p-4 flex items-center justify-center gap-4'>
                                <Radar className='w-6 h-6 primary-text' />
                                <p>SCANNER</p>
                            </div>
                        </button>

                        <button onClick={() => setActivePage("threat-matrix")} className={`flex items-center ${activePage === "threat-matrix" ? "bg-gray-600 border-r-2 border-[#00f2ff] text-[#00f2ff]" : "text-gray-300 hover:bg-gray-700"} cursor-pointer`}>
                            <div className='px-6 p-4 flex items-center justify-center gap-4'>
                                <ShieldCheck className='w-6 h-6 primary-text ' />
                                <p>THREAT MATRIX</p>
                            </div>
                        </button>
                        <button onClick={() => setActivePage("vault")} className={`flex items-center ${activePage === "vault" ? "bg-gray-600 border-r-2 border-[#00f2ff] text-[#00f2ff]" : "text-gray-300 hover:bg-gray-700"} cursor-pointer`}>
                            <div className='px-6 p-4 flex items-center justify-center gap-4'>
                                <Lock className='w-6 h-6 primary-text' />
                                <p>VAULT</p>
                            </div>
                        </button>
                    </nav>
                </div>

                <div className='col-span-2 w-full h-full z-50'>
                    <div className='flex-1 p-6'>
                        {/* 🟢 Connected parent context callback wrapper parameter into dynamic views */}
                        {activePage === "scanner" && <Scanner onScanComplete={fetchRecentScans} />}
                        {activePage === "threat-matrix" && <ThreatMatrix />}
                        {activePage === "vault" && <Vault />}
                    </div>
                </div>

                <div className='col-span-1 w-full h-full px-4'>
                    <div className='scan-result-right'>
                        <h3 className='text-gray-500 font-bold'>RECENT SCANS</h3>
                        <div className='mt-6 space-y-4'>
                            {loadingHistory && recentScans.length === 0 ? (
                                <p className='text-gray-600 font-mono text-xs text-center py-4'>Loading scans...</p>
                            ) : recentScans.length === 0 ? (
                                <p className='text-gray-600 font-mono text-xs text-center py-4'>No recent scans found</p>
                            ) : (
                                recentScans.map((scan) => {
                                    const isSocial = scan.type === 'social';
                                    const isPhone = scan.type === 'phone';

                                    let cardClass = "scan-result-card";
                                    let titleText = "EMAIL CHECK";
                                    let titleColorClass = "primary-text text-lg font-bold"

                                    if (isSocial) {
                                        cardClass = "scan-result-card-one mt-4";
                                        titleText = "SOCIAL CHECK";
                                        titleColorClass = "text-orange-300 text-lg font-bold"
                                    } else if (isPhone) {
                                        cardClass = "scan-result-card-two mt-4";
                                        titleText = "PHONE CHECK";
                                        titleColorClass = "text-blue-300 text-lg font-bold"
                                    }

                                    return (
                                        <div key={scan._id} className={cardClass}>
                                            <div className='flex justify-between'>
                                                <h2 className={titleColorClass}>{titleText}</h2>
                                                <p className='text-gray-400 text-xs'>{getRelativeTIme(scan.searchedAt)}</p>
                                            </div>
                                            <div className='mt-6'>
                                                <p className='text-gray-300'>{scan.value}</p>
                                            </div>

                                            {/* 🟢 100% Dynamic Database-Fed Status Row Block Replacement */}
                                            <div className='mt-4 flex items-center justify-start gap-2'>
                                                {(() => {
                                                    const summaryText = scan.heuristicSummary?.status || "Cleared - Breaches";
                                                    const summaryColor = scan.heuristicSummary?.color || "green";

                                                    if (summaryColor === 'red') {
                                                        return (
                                                            <>
                                                                <div className='bg-red-700 items-center justify-center flex rounded-full w-4 h-4 flex-shrink-0'>
                                                                    <TriangleAlert className='w-3 h-3 font-bold text-white' />
                                                                </div>
                                                                <p className='text-gray-300 font-sm p-1 font-bold'>{summaryText}</p>
                                                            </>
                                                        );
                                                    }

                                                    if (summaryColor === 'orange') {
                                                        return (
                                                            <>
                                                                <div className='bg-orange-600 items-center justify-center flex rounded-full w-4 h-4 flex-shrink-0'>
                                                                    <TriangleAlert className='w-3 h-3 font-bold text-white' />
                                                                </div>
                                                                <p className='text-gray-300 font-sm p-1 font-bold'>{summaryText}</p>
                                                            </>
                                                        );
                                                    }

                                                    return (
                                                        <>
                                                            <div className='primary-col items-center justify-center flex rounded-full w-4 h-4 flex-shrink-0'>
                                                                <Check className='w-3 h-3 font-bold text-black' />
                                                            </div>
                                                            <p className='text-gray-300 font-sm font-bold'>{summaryText}</p>
                                                        </>
                                                    );
                                                })()}
                                            </div>
                                        </div>
                                    );
                                })
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default Page;
