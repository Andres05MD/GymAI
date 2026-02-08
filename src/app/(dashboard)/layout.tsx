import { auth } from "@/lib/auth";
import { Header } from "@/components/layout/header";
import { Sidebar } from "@/components/layout/sidebar";
import { MobileNav } from "@/components/layout/mobile-nav";
import dynamic from "next/dynamic";

// Lazy loading del Chatbot - solo se carga cuando el usuario interactúa
const Chatbot = dynamic(
    () => import("@/components/ai/chatbot").then(mod => mod.Chatbot),
    { loading: () => null }
);

export default async function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const session = await auth();
    const role = session?.user?.role;

    return (
        <div className="flex min-h-screen w-full bg-black">
            {/* New Sidebar */}
            <Sidebar role={role} />

            {/* Main Content Area */}
            <div className="flex flex-1 flex-col relative overflow-hidden">
                {/* Background effects */}
                <div className="absolute top-0 right-0 -z-10 h-[500px] w-[500px] bg-red-600/5 blur-[120px] rounded-full pointer-events-none" />

                <Header user={session?.user} />

                <main className="flex-1 overflow-y-auto px-6 py-6 lg:px-10 lg:py-8 lg:pt-4 relative z-10 w-full max-w-7xl mx-auto scrollbar-thin scrollbar-thumb-neutral-800 scrollbar-track-transparent mb-20 md:mb-0 pb-32 md:pb-10">
                    {children}
                    <Chatbot />
                </main>
            </div>
            <MobileNav role={role} />
        </div>
    );
}
