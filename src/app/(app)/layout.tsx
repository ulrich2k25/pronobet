import Sidebar from "@/components/Sidebar";
import MobileSidebar from "@/components/MobileSidebar";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen w-full">
      {/* ✅ Mobile: menu drawer + bouton ☰ */}
      <MobileSidebar />

      {/* ✅ Desktop: sidebar fixe */}
      <aside className="hidden md:block fixed left-0 top-0 z-40 h-screen w-[300px]">
        <Sidebar />
      </aside>

      {/* ✅ Desktop: on laisse la place de la sidebar (300px + gap) */}
      <main className="min-h-screen w-full px-4 py-6 md:pl-[324px] md:pr-8">
        {/* ✅ container premium */}
        <div className="mx-auto w-full max-w-[1200px]">{children}</div>
      </main>
    </div>
  );
}