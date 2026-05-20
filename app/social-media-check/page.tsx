'use client'

import React, {useEffect, useState} from 'react'
import {Space_Grotesk} from "next/font/google";
import { ShieldCheck, Radar, Lock, Check, Info, TriangleAlert } from "lucide-react"

import ThreatMatrix from "@/app/email-check/threat-matrix"
import Vault from "@/app/email-check/vault"
import SocioScanner from './socio-scanner';


const spaceGrotesk = Space_Grotesk({
    subsets: ['latin'],
    weight: ["500", "400", "700"],
})


const Page = () => {
    const [activePage, setActivePage] = useState("scanner")

    useEffect(() => {
        let timeout: ReturnType<typeof setTimeout>

        const root = document.querySelector(".wired-bg") as HTMLElement;

        const handleMove = (e: MouseEvent) => {
            if(root){
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
                        <div className='rounded-full w-3 h-3 primary-col animate-pulse'/>
                        <h2 className={`${spaceGrotesk.className} text-2xl primary-text`}>DogoTracker AI</h2>
                    </div>
                    <p className='text-gray-500 text-sm px-6'>Sentient Mode Active</p>

                    <nav className='flex flex-col gap-6 mt-6 z-20'>
                        <button onClick={() => setActivePage("scanner")} className={`flex items-center ${activePage === "scanner" ? "bg-gray-600 border-r-2 border-[#00f2ff] text-[#00f2ff]" : "text-gray-300 hover:bg-gray-700" } cursor-pointer`}>
                            <div className='px-6 p-4 flex items-center justify-center gap-4'>
                                <Radar className='w-6 h-6 primary-text'/>
                                <p>SCANNER</p>
                            </div>
                        </button>

                        <button onClick={() => setActivePage("threat-matrix")} className={`flex items-center ${activePage === "threat-matrix" ? "bg-gray-600 border-r-2 border-[#00f2ff] text-[#00f2ff]" : "text-gray-300 hover:bg-gray-700" } cursor-pointer`}>
                            <div className='px-6 p-4 flex items-center justify-center gap-4'>
                                <ShieldCheck className='w-6 h-6 primary-text '/>
                                <p>THREAT MATRIX</p>
                            </div>
                        </button>
                        <button onClick={() => setActivePage("vault")} className={`flex items-center ${activePage === "vault" ? "bg-gray-600 border-r-2 border-[#00f2ff] text-[#00f2ff]" : "text-gray-300 hover:bg-gray-700" } cursor-pointer`}>
                            <div className='px-6 p-4 flex items-center justify-center gap-4'>
                                <Lock className='w-6 h-6 primary-text'/>
                                <p>VAULT</p>
                            </div>
                        </button>
                    </nav>
                </div>

                <div className='col-span-2  w-full h-full z-50'>
                    <div className='flex-1 p-6'>
                        {activePage === "scanner" && <SocioScanner />}
                        {activePage === "threat-matrix" && <ThreatMatrix />}
                        {activePage === "vault" && <Vault />}
                    </div>
                </div>
                <div className='col-span-1  w-full h-full px-4'>
                    <div className='scan-result-right'>
                        <h3 className='text-gray-500 font-bold'>RECENT SCANS</h3>
                        <div className='mt-6'>

                            {/*Email Check*/}
                            <div className='scan-result-card'>
                                <div className='flex justify-between '>
                                    <h2 className='primary-text text-lg font-bold '>EMAIL CHECK</h2>
                                    <p className='text-gray-400 text-xs'>2m ago</p>
                                </div>
                                <div className='mt-6'>
                                    <p className='text-gray-300'>example@mail.com</p>
                                </div>
                                <div className='mt-4 flex items-center justify-start gap-2'>
                                    <div className='primary-col items-center justify-center flex rounded-full w-4 h-4'><Check className='w-3 h-3 font-bold' /></div>
                                    <p className='text-gray-300 font-sm font-bold'>Cleared -Breaches</p>
                                </div>
                            </div>

                            {/*    Social Check*/}
                            <div className='scan-result-card-one mt-4'>
                                <div className='flex justify-between '>
                                    <h2 className='text-orange-300 text-lg font-bold '>SOCIAL CHECK</h2>
                                    <p className='text-gray-400 text-xs'>2m ago</p>
                                </div>
                                <div className='mt-6'>
                                    <p className='text-gray-300'>@olajide_olalekan</p>
                                </div>
                                <div className='mt-4 flex items-center justify-start gap-2'>
                                    <div className='bg-gray-300 p-1 items-center justify-center flex rounded-full w-4 h-4'><Info className='w-3 h-3 font-bold' /></div>
                                    <p className='text-gray-300 font-sm font-bold'>Cleared -Breaches</p>
                                </div>
                            </div>

                            {/*    Phone Number Check*/}

                            <div className='scan-result-card-two mt-4'>
                                <div className='flex justify-between '>
                                    <h2 className='text-blue-300 text-lg font-bold '>PHONE CHECK</h2>
                                    <p className='text-gray-400 text-xs'>6m ago</p>
                                </div>
                                <div className='mt-6'>
                                    <p className='text-gray-300'>+234-60600-3233</p>
                                </div>
                                <div className='mt-4 flex items-center justify-start gap-2'>
                                    <div className='bg-red-700 items-center justify-center flex rounded-full w-4 h-4'><TriangleAlert className='w-3 h-3 font-bold' /></div>
                                    <p className='text-gray-300 font-sm p-1 font-bold'>High Risk: VOIP spoof</p>
                                </div>
                            </div>
                        </div>


                    </div>
                </div>
            </div>
        </div>
    )
}
export default Page
