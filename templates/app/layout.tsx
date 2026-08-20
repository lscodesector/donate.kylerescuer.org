/**
 * ╔══════════════════════════════════════════════════════════════════════╗
 * ║  TEMPLATE · app/layout.tsx - a casca de toda rota                     ║
 * ╚══════════════════════════════════════════════════════════════════════╝
 *
 * O que este arquivo resolve, e por quê:
 *
 *  • a fonte (Inter, três pesos, via `next/font/google`);
 *  • a metadata compartilhada - título, descrição, Open Graph, Twitter;
 *  • o `<noscript>` que devolve o conteúdo quando o JS está desligado;
 *  • o pixel de conversão, para valer em qualquer rota.
 *
 * ⚠️ PREENCHER: `TITLE`, `DESCRIPTION`, o domínio de `metadataBase` e o
 * caminho da imagem de compartilhamento.
 */

import type { Metadata } from "next";
import { Inter } from "next/font/google";
import Pixel from "@/components/tracking/20-pixel";
import { withBasePath } from "@/lib/base-path";
import "./globals.css";

/**
 * Três pesos, e só três: 400 para o corpo, 600 para o que precisa de um degrau
 * a mais, 800 para título e botão. Cada peso extra é um arquivo a mais para
 * baixar antes do primeiro texto aparecer.
 */
const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  weight: ["400", "600", "800"],
});

/* ⚠️ PREENCHER - os dois textos que o Google e o WhatsApp mostram. */
const TITLE = "";
const DESCRIPTION = "";

export const metadata: Metadata = {
  /*
   * A base das URLs absolutas de metadata (canonical, og:image, twitter:image).
   *
   * O padrão é o endereço de **produção**, e não `localhost`, porque o site é
   * estático: o HTML é congelado no build. Se o build sair com `localhost`, é
   * isso que o WhatsApp e o Google leem - e ninguém percebe até o link já
   * estar no ar.
   *
   * ⚠️ Fica só a origem (`https://dominio`, sem caminho): uma URL relativa que
   * começa com `/` **substitui** o caminho da base inteiro quando resolvida -
   * `new URL("/x", "https://a.com/v2")` dá `https://a.com/x`, não
   * `https://a.com/v2/x`. Por isso o subcaminho não entra aqui: ele entra em
   * cada caminho relativo via `withBasePath`, que é o único jeito de as duas
   * partes somarem certo.
   */
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_SITE_URL ?? "https://exemplo.org",
  ),
  title: TITLE,
  description: DESCRIPTION,
  openGraph: {
    type: "website",
    locale: "pt_BR",
    siteName: "",
    title: TITLE,
    description: DESCRIPTION,
    images: [
      {
        url: withBasePath("/campanha/og.webp"),
        width: 1200,
        height: 630,
        alt: "",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: TITLE,
    description: DESCRIPTION,
    images: [withBasePath("/campanha/og.webp")],
  },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="pt-BR" className={`${inter.variable} h-full antialiased`}>
      <head>
        {/*
          Sem JavaScript o IntersectionObserver do `Reveal` nunca roda, e todo
          bloco animado ficaria em `opacity: 0` - a página inteira em branco.
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

        {/* Componente de cliente que não renderiza nada. Fica no layout raiz
            para valer em qualquer rota, inclusive `/obrigado`. */}
        <Pixel />
      </body>
    </html>
  );
}
