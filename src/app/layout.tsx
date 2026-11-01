import type { Metadata } from "next";
import "./globals.css";
import ClarityTracker from "@/components/ClarityTracker";

const siteUrl =
  process.env.NEXT_PUBLIC_SITE_URL ||
  (process.env.VERCEL_URL
    ? `https://${process.env.VERCEL_URL}`
    : "http://localhost:3000");

const description =
  "Découvrez PronoBet : matchs de football, statistiques, compétitions et analyses de matchs.";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),

  title: "PronoBet | Analyses de football",

  description,

  applicationName: "PronoBet",

  openGraph: {
    type: "website",
    siteName: "PronoBet",
    title: "PronoBet | Analyses de football",
    description,
    images: [
      {
        url: "/pronobet-logo.png",
        alt: "Logo officiel PronoBet",
      },
    ],
  },

  twitter: {
    card: "summary",
    title: "PronoBet | Analyses de football",
    description,
    images: ["/pronobet-logo.png"],
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="fr">
      <body className="min-h-screen w-screen overflow-x-hidden bg-[#050816] text-white">
        <ClarityTracker />
        {children}
      </body>
    </html>
  );
}