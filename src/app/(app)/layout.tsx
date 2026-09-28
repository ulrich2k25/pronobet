import Sidebar from "@/components/Sidebar";
import MobileSidebar from "@/components/MobileSidebar";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen w-full">
      {/* Navigation mobile */}
      <MobileSidebar />

      {/* Sidebar desktop */}
      <aside className="fixed left-0 top-0 z-40 hidden h-screen w-[300px] md:block">
        <Sidebar />
      </aside>

      {/* Contenu principal */}
      <main
        className="
          min-h-screen
          w-full
          px-3
          pb-24
          pt-4
          sm:px-4
          md:py-6
          md:pl-[324px]
          md:pr-8
        "
      >
        <div className="mx-auto w-full max-w-[1200px]">{children}</div>
      </main>
    </div>
  );
}
