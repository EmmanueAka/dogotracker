import { headers } from 'next/headers';
import { redirect } from "next/navigation";
import { getAuth } from '@/lib/better-auth/auth'
import LayoutClient from "@/app/LayoutClient";


const Layout = async ({children }: {children: React.ReactNode}) => {
    const auth = await getAuth();
    const session = await auth.api.getSession({headers: await headers()})

    if(!session?.user ) redirect('/sign-up')
    return (
        <LayoutClient user={session.user}>{children}</LayoutClient>
    )
}
export default Layout
