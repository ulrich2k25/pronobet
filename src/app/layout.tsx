import "./globals.css";

export const metadata = {
  title: "Pronobet",
  description: "Analyse IA de matchs",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr">
      <body className="min-h-screen w-screen overflow-x-hidden text-white">
        {children}
      </body>
    </html>
  );
}