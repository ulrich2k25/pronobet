import type { Metadata } from "next";
import "./globals.css";
import ClarityTracker from "@/components/ClarityTracker";

const siteUrl = "https://pronobet.vercel.app";

const description = "Découvre PronoBet : matchs, statistiques et analyses de football pour mieux comprendre chaque rencontre.";

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
        url: "/pronobet-share.png",
        alt: "Logo officiel PronoBet",
      },
    ],
  },

  twitter: {
    card: "summary_large_image",
    title: "PronoBet | Analyses de football",
    description,
    images: ["/pronobet-share.png"],
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