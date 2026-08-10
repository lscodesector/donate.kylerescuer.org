import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  weight: ["400", "600", "800"],
});

const TITLE = "Doe Ração e Ajude Mais de 400 Animais | SOS Animal Help";
const DESCRIPTION =
  "Ajude a SOS Animal Help a manter cinco abrigos e mais de 400 animais alimentados. Escolha quanto doar e acompanhe com transparência o impacto da sua contribuição.";

export const metadata: Metadata = {
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000",
  ),
  title: TITLE,
  description: DESCRIPTION,
  openGraph: {
    type: "website",
    locale: "pt_BR",
    siteName: "SOS Animal Help",
    title: TITLE,
    description: DESCRIPTION,
    images: [
      {
        url: "/sos-animal/abrigo-patio-caes.webp",
        width: 1536,
        height: 1024,
        alt: "Cuidadora cercada por dezenas de cães resgatados no pátio do abrigo",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: TITLE,
    description: DESCRIPTION,
    images: ["/sos-animal/abrigo-patio-caes.webp"],
  },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="pt-BR" className={`${inter.variable} h-full antialiased`}>
      <head>
        {/*
          Sem JavaScript o IntersectionObserver do `Reveal` nunca roda, e todo
          bloco animado ficaria em `opacity: 0` — a página inteira em branco.
          Esta regra devolve o conteúdo; a animação é enfeite, o texto não.
        */}
        <noscript>
          <style>{".reveal{opacity:1!important;transform:none!important}"}</style>
        </noscript>
      </head>
      <body
        className="min-h-full flex flex-col bg-surface text-ink-900"
        suppressHydrationWarning
      >
        {children}
      </body>
    </html>
  );
}
