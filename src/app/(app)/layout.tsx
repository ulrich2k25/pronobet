import Sidebar from "@/components/Sidebar";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen w-full">
      <Sidebar />

      {/* ✅ Desktop: on laisse la place de la sidebar (300px + gap) */}
      <main className="min-h-screen w-full px-4 py-6 md:pl-[324px] md:pr-8">
        {/* ✅ container premium */}
        <div className="mx-auto w-full max-w-[1200px]">
          {children}
        </div>
      </main>
    </div>
  );
}