import React from 'react'
import {MOBILE_CARD_ITEMS} from "@/lib/constants";
import {ChevronRight} from "lucide-react";
import Link from "next/link";

const MobileCard = () => {
    return (
        <div>
            {MOBILE_CARD_ITEMS.map((item, index) => {
                const Icon = item.icon
                return (
                <div key={index}
                     className='mobile-card'
                >
                    <Icon className='w-8 h-8 text-[#00f2ff] border border-[#00f2ff]/20 p-2 mb-4 bg-gray-600 rounded-md' />
                    <div>
                        <h2 className='text-white font-bold'>{item.title}</h2>
                        <p className='text-gray-500 text-xs'>{item.desc}</p>
                    </div>
                    <Link href={item.href} className='text-[#00f2ff] cursor-pointer text-xs flex items-row gap-2'>
                        <ChevronRight className='h-5 w-5 transition-transform duration-300 ease-linear hover:translate-x-1'/>
                    </Link>

                </div>
                )})}
        </div>
    )
}
export default MobileCard
