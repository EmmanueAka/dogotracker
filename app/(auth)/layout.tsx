
import { BackgroundLines } from '@/components/ui/background-lines'
import { DottedGlowBackground } from '@/components/ui/dotted-glow-background'
import { Raleway } from 'next/font/google'
import Image from 'next/image'
import Link from 'next/link'
import React from 'react'
import {headers} from "next/headers";
import {redirect} from "next/navigation";
import { getAuth } from "@/lib/better-auth/auth";


const raleway = Raleway({
    subsets: ['latin'],
    weight: ['100','400', '700']
})

const Layout = async ({children} : {children: React.ReactNode}) => {
const auth = await getAuth()

const session = await auth.api.getSession({headers: await headers()})
    if(session?.user) redirect('/')

  return (
    <main className='flex flex-col justify-between lg:flex-row h-screen bg-linear-to-b from-blue-950 to-black overflow-hidden'>
        <section className='auth-left-section scrollbar-hide-default'>
              <DottedGlowBackground
                className='pointer-events-none mask-radial-to-90% mask-radial-at-center opacity-20 dark:opacity-100'
                opacity={1}
                gap={10}
                radius={2.6}
                colorLightVar='--color-neutral-500'
                glowColorLightVar='--color-neutral-700'
                colorDarkVar='--color-sky-800'
                backgroundOpacity={2}
                speedMin={0.3}
                speedMax={1.6}
                speedScale={1}

                />
            <div className='flex items-center gap-4'>
            <Link href='/'>
            <Image src='/DogoTracker.svg' alt='logo' width={36} height={36} className='mt-4'/>
            </Link>
                <p className={`text-white text-[46px] mt-3 font-bold`}>DogoTracker</p>
            </div>
            <div className='pb-6 lg:pb-8 flex-1'>
                {children}
            </div>
        </section>
        <section className='hidden md:flex w-full max-lg:border-t max-lg:border-gray-600 lg:w-[55%] lg:h-screen bg-linear relative'>
                
            <div className={`text-white  p-4 font-bold z-50 md:text-[46px]  mb-4 hidden md:flex absolute`}>
                <div
                    className='flex leading-11 mt-8 text-blue-400 flex-col'>
                    <span>Proactive,</span>
                    <span>Intelligent,</span>
                    <span>Dynamic,</span>
                    <hr className='border-blue-600'/>
                    <div className={`text-white flex flex-col font-normal tracking-normal text-[14px] leading-8 drop-shadow-2xl shadow-black ${raleway.className}`}>
                        <span>Mitigate every risk and shut down threats across every attack</span>
                        <span>surface with Self-Learning AI that adapts to your business.</span>
            </div>
                </div>
            </div>
           <BackgroundLines className='flex items-center justify-center w-full flex-col px-4 z-20'>
                <div className='w-[400px] h-[200px] '> <Image src='/ai-mobile.png' alt='ai-mobile' width={250} height={150} className='object-fit absolute bottom-0 left-20'/></div>
           </BackgroundLines>
        </section>
    </main>
  )
}

export default Layout

