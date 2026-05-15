'use client'
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {Button} from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {LogOut} from "lucide-react";
import NavItems from "@/components/NavItems";
import { useRouter } from "next/navigation"
import {signOUt} from "@/lib/actions/auth.actions";

const UserDropdown = ({user} :{user: User}) => {
    const router = useRouter()

    const handleSignOut = async () => {
        await signOUt()
        router.push('/')
    }
  return (
    <DropdownMenu>
        <DropdownMenuTrigger asChild>
            <Button variant='ghost' className='flex items-center gap-3 text-[#00F2FF] hover:bg-gray-600 hover:text-yellow-500'>
                <Avatar className="h-8 w-8 primary-col flex items-center justify-center">
                    <AvatarImage src=""/>
                    <AvatarFallback className=" text-white flex items-center justify-center text-sm font-bold">
                        {user.name[0]}
                    </AvatarFallback>
                </Avatar>
                <div className="hidden md:flex flex-col items-start">
                    <span className="text-base font-medium">{user.name}</span>
                </div>
            </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="text-gray-400 bg-[#00F2FF]/20">
            <DropdownMenuLabel>
                <div className="flex relative items-center gap-3 py-2 ">
                    <Avatar className="h-10 w-10 bg-[#00f2ff]/20">
                        <AvatarImage src='https://github.com/shadcn.png'/>
                        <AvatarFallback className=" text-black text-sm font-bold">
                            {user.name[0]}
                        </AvatarFallback>
                    </Avatar>
                    <div className="flex flex-col">
                        <span className="text-base font-medium">{user.name}</span>
                        <span className="text-base font-medium">{user.email}</span>
                    </div>
                </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator className="bg-gray-600"/>
            <DropdownMenuItem onClick={handleSignOut} className="text-gray-100 text-md font-medium focus:text-black transition-colors cursor-pointer">
                <LogOut className="h-4 w-4 mr-2 sm:block"/> Log Out
            </DropdownMenuItem>
            <DropdownMenuSeparator className="sm:block-gray-600 hidden"/>
            <nav className="sm:hidden bg-gray-800">
                <NavItems />
            </nav>
        </DropdownMenuContent>
    </DropdownMenu>
  )
}

export default UserDropdown